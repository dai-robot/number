"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Background } from "@/components/Background";
import { StoryCollectionPanel } from "@/components/StoryCollectionPanel";
import { StoryShareActions } from "@/components/StoryShareActions";
import { TimerRing } from "@/components/TimerRing";
import { useStoryCollection } from "@/hooks/useStoryCollection";
import { useSound } from "@/hooks/useSound";
import { getStoryBySecond, getStorySecond, type SecondStory } from "@/data/stories";
import { clampSeconds, formatSeconds, MAX_SECONDS } from "@/lib/findTrivia";

interface StoryResult {
  stoppedSeconds: number;
  storySecond: number;
  story: SecondStory;
}

export default function Home() {
  const [display, setDisplay] = useState("0.00");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<StoryResult | null>(null);
  const [screen, setScreen] = useState<"play" | "collection">("play");

  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { init, playStart, playStop, playTick } = useSound();
  const storyCollection = useStoryCollection();
  const { markRead } = storyCollection;

  const finishWithValue = useCallback(
    (raw: number) => {
      const stoppedSeconds = clampSeconds(raw);
      const storySecond = getStorySecond(stoppedSeconds);
      const story = getStoryBySecond(storySecond);

      elapsedRef.current = 0;
      setRunning(false);
      setDisplay(formatSeconds(stoppedSeconds));
      setResult({ stoppedSeconds, storySecond, story });
      markRead(storySecond);
      playStop();
    },
    [playStop, markRead]
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
    init();
    playStart();
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setRunning(true);
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
    finishWithValue(raw);
  };

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setRunning(false);
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
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col gap-3 overflow-x-hidden px-3 py-3">
        <section className="flex min-h-[calc(100dvh-1.5rem)] flex-col justify-between gap-3">
          <header className="text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-orange-300/70">
              1-30 second micro stories
            </p>
            <h1 className="mt-1 text-gradient-title text-4xl font-black tracking-tight">
              秒の物語
            </h1>
            <p className="mt-1 text-sm font-bold text-zinc-400">
              止めた秒に、短い人生が出る。
            </p>
          </header>

          <button
            onClick={() => setScreen("collection")}
            className="w-full rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-950/40 via-zinc-950/70 to-violet-950/40 px-3 py-2 text-left active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black tracking-[0.24em] text-orange-300">
                  物語図鑑
                </p>
                <p className="font-mono text-base font-black text-white">
                  {storyCollection.count} / {storyCollection.total}
                </p>
              </div>
              <p className="font-mono text-3xl font-black text-transparent bg-gradient-to-b from-white to-orange-300 bg-clip-text">
                {storyCollection.percent}%
              </p>
            </div>
          </button>

          <TimerRing running={running} display={display} />

          <div className="grid w-full grid-cols-2 gap-2">
            <button
              onClick={handleStart}
              disabled={running}
              className="min-h-20 rounded-3xl bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700 text-xl font-black text-white shadow-[0_0_36px_rgba(251,146,60,0.38)] transition active:scale-95 disabled:opacity-35"
            >
              START
            </button>
            <button
              onClick={handleStop}
              disabled={!running}
              className={`min-h-20 rounded-3xl text-xl font-black text-white transition active:scale-95 disabled:opacity-35 ${
                running
                  ? "animate-pulse bg-gradient-to-b from-red-400 via-rose-600 to-red-800 shadow-[0_0_48px_rgba(244,63,94,0.55)]"
                  : "bg-gradient-to-b from-zinc-700 to-zinc-900"
              }`}
            >
              STOP
            </button>
          </div>

          <p className="text-center text-xs font-medium text-zinc-500">
            STARTして、好きな瞬間でSTOP。1〜30秒の物語が出ます。
          </p>

          <details className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500">
            <summary className="cursor-pointer font-bold text-zinc-400">このゲームについて</summary>
            <p className="mt-2 leading-relaxed">
              実際に止めた秒数を四捨五入して、1秒〜30秒の超短編小説を表示します。
            </p>
            <button onClick={handleReset} className="mt-2 text-zinc-400 underline">
              RESET
            </button>
          </details>
        </section>

        {result && <StoryResultCard result={result} />}
      </main>
    </>
  );
}

function StoryResultCard({ result }: { result: StoryResult }) {
  return (
    <article className="animate-fade-up glass mb-6 w-full overflow-hidden rounded-3xl border border-orange-400/30 bg-gradient-to-br from-orange-950/25 via-zinc-950/80 to-violet-950/25 p-5 shadow-[0_0_40px_rgba(251,146,60,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-zinc-400">
            {formatSeconds(result.stoppedSeconds)}秒で止まった
          </p>
          <h2 className="mt-1 text-2xl font-black text-transparent bg-gradient-to-r from-white via-orange-200 to-amber-400 bg-clip-text">
            {result.storySecond}秒の物語
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-right">
          <p className="text-[10px] font-bold text-amber-200">{result.story.category}</p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{result.story.tone}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl border border-white/8 bg-black/25 p-4">
        {result.story.story.map((line, index) => (
          <p
            key={index}
            className={`text-center text-lg font-bold leading-relaxed ${
              index === result.story.story.length - 1
                ? "text-xl text-amber-200"
                : "text-zinc-100"
            }`}
          >
            {line}
          </p>
        ))}
      </div>

      <p className="mt-4 text-sm font-bold text-amber-300">{result.story.shareText}</p>

      <StoryShareActions stoppedSeconds={result.stoppedSeconds} story={result.story} />
    </article>
  );
}
