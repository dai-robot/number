"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Background } from "@/components/Background";
import { StoryCollectionPanel } from "@/components/StoryCollectionPanel";
import { StoryShareActions } from "@/components/StoryShareActions";
import { TimerRing } from "@/components/TimerRing";
import { useStoryCollection } from "@/hooks/useStoryCollection";
import { useSound } from "@/hooks/useSound";
import type { SecondStory } from "@/data/stories";
import { track } from "@/lib/analytics";
import { clampSeconds, formatSeconds, MAX_SECONDS } from "@/lib/findTrivia";
import { mapSecondsToStory } from "@/lib/storyMapping";

type GameState = "idle" | "running" | "result";
interface StoryResult {
  stoppedSeconds: number;
  storySecond: number;
  story: SecondStory;
  isNew: boolean;
}

export default function Home() {
  const [display, setDisplay] = useState("0.00");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [result, setResult] = useState<StoryResult | null>(null);
  const [screen, setScreen] = useState<"play" | "collection">("play");

  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { init, playStart, playStop, playTick } = useSound();
  const storyCollection = useStoryCollection();
  const { markRead, readSet, recordResult } = storyCollection;
  const running = gameState === "running";
  const hasResult = gameState === "result";

  useEffect(() => {
    track("home_view");
  }, []);

  const finishWithValue = useCallback(
    (raw: number) => {
      const stoppedSeconds = clampSeconds(raw);
      const { storySecond, story } = mapSecondsToStory(stoppedSeconds);
      const isNew = !readSet.has(storySecond);

      elapsedRef.current = 0;
      setGameState("result");
      setDisplay(formatSeconds(stoppedSeconds));
      setResult({ stoppedSeconds, storySecond, story, isNew });
      markRead(storySecond);
      recordResult({ stoppedSeconds, storySecond, isNew });
      track("result_view", { storySecond, category: story.category, tone: story.tone, isNew });
      playStop();
    },
    [playStop, markRead, readSet, recordResult]
  );

  const tick = useCallback(() => {
    const now = performance.now();
    const current = elapsedRef.current + (now - startTimeRef.current) / 1000;

    if (current >= MAX_SECONDS) {
      cancelAnimationFrame(rafRef.current);
      finishWithValue(MAX_SECONDS);
      return;
    }

    setDisplay(formatSeconds(current));
    if (Math.floor(current * 10) !== Math.floor((current - 0.016) * 10)) {
      playTick();
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [playTick, finishWithValue]);

  const handleStart = () => {
    if (running) return;
    track("start_tap");
    init();
    playStart();
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setGameState("running");
    setResult(null);
    setDisplay("0.00");
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleStop = () => {
    if (!running) return;
    cancelAnimationFrame(rafRef.current);
    const now = performance.now();
    const raw = elapsedRef.current + (now - startTimeRef.current) / 1000;
    track("stop_tap", { stoppedSeconds: clampSeconds(raw) });
    finishWithValue(raw);
  };

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setGameState("idle");
    setDisplay("0.00");
    setResult(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (running) handleStop();
        else handleStart();
      }
      if (e.code === "KeyR") handleReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (screen === "collection") {
    return (
      <>
        <Background />
        <StoryCollectionPanel
          readSet={storyCollection.readSet}
          count={storyCollection.count}
          total={storyCollection.total}
          percent={storyCollection.percent}
          onBack={() => setScreen("play")}
        />
      </>
    );
  }

  return (
    <>
      <Background />
      <main className="relative z-10 mx-auto flex min-h-[100svh] max-w-lg flex-col gap-3 overflow-x-hidden px-3 py-2">
        <section className="flex min-h-[calc(100svh-1rem)] flex-col justify-between gap-2 overflow-hidden">
          <header className="text-center">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-orange-300/70">
              1-30 second micro stories
            </p>
            <h1 className="text-gradient-title text-3xl font-black tracking-tight">
              秒の物語
            </h1>
            <p className="text-xs font-bold text-zinc-400">
              止めた秒に、短い人生が出る。
            </p>
          </header>

          {!hasResult ? (
            <>
              <button
                onClick={() => {
                  track("catalog_open");
                  setScreen("collection");
                }}
                className="w-full rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-950/35 via-zinc-950/65 to-violet-950/35 px-3 py-1.5 text-left active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black tracking-[0.22em] text-orange-300">
                      物語図鑑
                    </p>
                    <p className="font-mono text-sm font-black text-white">
                      {storyCollection.count} / {storyCollection.total}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-2xl font-black leading-none text-transparent bg-gradient-to-b from-white to-orange-300 bg-clip-text">
                      {storyCollection.percent}%
                    </p>
                    <p className="text-[9px] font-bold text-zinc-500">
                      あと{storyCollection.total - storyCollection.count}話
                    </p>
                  </div>
                </div>
              </button>

              <TimerRing running={running} display={display} />

              <button
                onClick={running ? handleStop : handleStart}
                className={`min-h-20 w-full rounded-3xl text-2xl font-black text-white transition active:scale-95 ${
                  running
                    ? "animate-pulse bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 shadow-[0_0_52px_rgba(251,146,60,0.58)]"
                    : "bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 shadow-[0_0_40px_rgba(251,146,60,0.42)]"
                }`}
              >
                {running ? "STOP" : "START"}
              </button>

              <p className="text-center text-[11px] font-medium text-zinc-500">
                STARTして、好きな瞬間でSTOP。1〜30秒の物語が出ます。
              </p>
            </>
          ) : (
            result && (
              <>
                <StoryResultCard
                  result={result}
                  count={storyCollection.count}
                  total={storyCollection.total}
                />
                <button
                  onClick={handleReset}
                  className="min-h-14 w-full rounded-3xl bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 text-lg font-black text-white shadow-[0_0_36px_rgba(251,146,60,0.34)] transition active:scale-95"
                >
                  もう一度
                </button>
              </>
            )
          )}
        </section>
      </main>
    </>
  );
}

function StoryResultCard({
  result,
  count,
  total,
}: {
  result: StoryResult;
  count: number;
  total: number;
}) {
  return (
    <article className="animate-fade-up glass w-full overflow-hidden rounded-3xl border border-orange-400/30 bg-gradient-to-br from-orange-950/25 via-zinc-950/80 to-violet-950/25 p-4 shadow-[0_0_40px_rgba(251,146,60,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-zinc-400">
            {formatSeconds(result.stoppedSeconds)}秒で止まった
          </p>
          <h2 className="mt-0.5 text-xl font-black text-transparent bg-gradient-to-r from-white via-orange-200 to-amber-400 bg-clip-text">
            {result.storySecond}秒の物語
          </h2>
          <p className="mt-0.5 text-[10px] font-black text-emerald-300">
            {result.isNew ? "NEW" : "既に発見済み"}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-right">
          <p className="text-[10px] font-bold text-amber-200">{result.story.category}</p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{result.story.tone}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-2xl border border-white/8 bg-black/25 p-3">
        {result.story.story.map((line, index) => (
          <p
            key={index}
            className={`text-center text-base font-bold leading-relaxed ${
              index === result.story.story.length - 1
                ? "text-lg text-amber-200"
                : "text-zinc-100"
            }`}
          >
            {line}
          </p>
        ))}
      </div>

      <p className="mt-3 text-sm font-bold text-amber-300">{result.story.shareText}</p>

      <p className="mt-2 text-center font-mono text-xs text-zinc-500">
        物語図鑑 {count} / {total} 発見
      </p>

      <StoryShareActions
        stoppedSeconds={result.stoppedSeconds}
        story={result.story}
        count={count}
        total={total}
      />
    </article>
  );
}
