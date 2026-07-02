"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Background } from "@/components/Background";
import { HistoryCollectionPanel } from "@/components/HistoryCollectionPanel";
import { HistoryShareActions } from "@/components/HistoryShareActions";
import { TimerRing } from "@/components/TimerRing";
import type { JapanHistoryEntry } from "@/data/history/japanHistoryFull";
import { getJapanHistoryEntry } from "@/data/history/japanHistoryFull";
import { useChallengeStats } from "@/hooks/useChallengeStats";
import { useHistoryCollection } from "@/hooks/useHistoryCollection";
import { useSound } from "@/hooks/useSound";
import { track } from "@/lib/analytics";
import {
  buildChallengeShareText,
  getDailyChallenge,
  rankForDiff,
  type RankInfo,
} from "@/lib/challenge";
import { getEraTheme } from "@/lib/eraTheme";
import { clampSeconds, formatSeconds } from "@/lib/findTrivia";
import { mapSecondsToYear } from "@/lib/historyMapping";

const MAX_HISTORY_SECONDS = 20.26;

type GameState = "idle" | "running" | "result";
type PlayMode = "free" | "challenge";

interface HistoryResult {
  stoppedSeconds: number;
  year: number;
  entry: JapanHistoryEntry;
  isNew: boolean;
  challengeDiff: number | null;
}

export default function Home() {
  const [display, setDisplay] = useState("0.00");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [screen, setScreen] = useState<"play" | "collection">("play");
  const [mode, setMode] = useState<PlayMode>("free");

  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const modeRef = useRef<PlayMode>("free");
  modeRef.current = mode;

  const challenge = useMemo(() => getDailyChallenge(), []);
  const { init, playStart, playStop, playTick } = useSound();
  const historyCollection = useHistoryCollection();
  const { discoveredSet, markDiscovered, recordResult } = historyCollection;
  const challengeStats = useChallengeStats(challenge.date);
  const { recordChallenge, addTraveledYears } = challengeStats;

  const running = gameState === "running";
  const hasResult = gameState === "result";

  useEffect(() => {
    track("home_view");
  }, []);

  const finishWithValue = useCallback(
    (raw: number) => {
      const stoppedSeconds = Math.max(0, Math.min(MAX_HISTORY_SECONDS, raw));
      const year = mapSecondsToYear(stoppedSeconds);
      const entry = getJapanHistoryEntry(year);
      const isNew = !discoveredSet.has(year);
      const isChallenge = modeRef.current === "challenge";
      const challengeDiff = isChallenge ? Math.abs(year - challenge.targetYear) : null;

      elapsedRef.current = 0;
      setGameState("result");
      setDisplay(formatSeconds(stoppedSeconds));
      setResult({ stoppedSeconds, year, entry, isNew, challengeDiff });
      markDiscovered(year);
      recordResult({ stoppedSeconds, year, coverageType: entry.coverageType, isNew });
      addTraveledYears(year);
      if (challengeDiff !== null) {
        recordChallenge(challengeDiff, year);
      }
      track("result_view", {
        year,
        coverageType: entry.coverageType,
        importance: entry.importance,
        isNew,
        mode: modeRef.current,
        challengeDiff,
      });
      playStop();
    },
    [addTraveledYears, challenge.targetYear, discoveredSet, markDiscovered, playStop, recordChallenge, recordResult]
  );

  const tick = useCallback(() => {
    const now = performance.now();
    const current = elapsedRef.current + (now - startTimeRef.current) / 1000;

    if (current >= MAX_HISTORY_SECONDS) {
      cancelAnimationFrame(rafRef.current);
      finishWithValue(MAX_HISTORY_SECONDS);
      return;
    }

    setDisplay(formatSeconds(clampSeconds(current)));
    if (Math.floor(current * 10) !== Math.floor((current - 0.016) * 10)) {
      playTick();
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [finishWithValue, playTick]);

  const handleStart = () => {
    if (running) return;
    track("start_tap", { mode });
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
    track("stop_tap", { stoppedSeconds: Math.max(0, Math.min(MAX_HISTORY_SECONDS, raw)) });
    finishWithValue(raw);
  };

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setGameState("idle");
    setDisplay("0.00");
    setResult(null);
  };

  const switchMode = (next: PlayMode) => {
    if (running || mode === next) return;
    setMode(next);
    setGameState("idle");
    setResult(null);
    setDisplay("0.00");
    track("mode_switch", { mode: next });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (running) handleStop();
        else if (hasResult) handleReset();
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
        <HistoryCollectionPanel
          discoveredSet={historyCollection.discoveredSet}
          discoveredCount={historyCollection.discoveredCount}
          totalYears={historyCollection.totalYears}
          importantDiscoveredCount={historyCollection.importantDiscoveredCount}
          importantTotal={historyCollection.importantTotal}
          onBack={() => setScreen("play")}
        />
      </>
    );
  }

  const isChallenge = mode === "challenge";

  return (
    <>
      <Background />
      <main className="relative z-10 mx-auto flex min-h-[100svh] max-w-lg flex-col gap-2 overflow-x-hidden px-3 py-2">
        <section className="flex min-h-[calc(100svh-1rem)] flex-col justify-between gap-2 overflow-hidden">
          <header className="text-center">
            <h1 className="text-gradient-title text-3xl font-black tracking-tight">
              秒で日本史
            </h1>
            <p className="text-xs font-bold text-zinc-400">
              止めた秒が、そのまま西暦になる。
            </p>
          </header>

          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/8 bg-black/25 p-1.5">
            <button
              onClick={() => switchMode("free")}
              className={`rounded-xl py-2 text-sm font-black transition ${
                !isChallenge
                  ? "bg-gradient-to-b from-amber-400/90 to-orange-600/90 text-white shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  : "text-zinc-400 active:scale-95"
              }`}
            >
              🎲 気ままに旅
            </button>
            <button
              onClick={() => switchMode("challenge")}
              className={`rounded-xl py-2 text-sm font-black transition ${
                isChallenge
                  ? "bg-gradient-to-b from-violet-400/90 to-purple-700/90 text-white shadow-[0_0_20px_rgba(167,139,250,0.35)]"
                  : "text-zinc-400 active:scale-95"
              }`}
            >
              🎯 狙い撃ち
            </button>
          </div>

          {!hasResult ? (
            <>
              {isChallenge ? (
                <div className="w-full rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-950/40 via-zinc-950/65 to-purple-950/40 px-3 py-2 text-center">
                  <p className="text-[9px] font-black tracking-[0.22em] text-violet-300">
                    今日のお題 {challenge.date}
                  </p>
                  <p className="mt-0.5 text-base font-black text-white">
                    {challenge.targetYear}年「{challenge.entry.title}」を狙え
                  </p>
                  <p className="font-mono text-[11px] font-bold text-violet-200">
                    目標 {challenge.targetSeconds.toFixed(2)}秒
                    {challengeStats.best && (
                      <span className="ml-2 text-emerald-300">
                        今日のベスト {challengeStats.best.diff === 0 ? "ピタリ！" : `${challengeStats.best.diff}年差`}
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    track("catalog_open");
                    setScreen("collection");
                  }}
                  className="w-full rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/35 via-zinc-950/65 to-orange-950/35 px-3 py-1.5 text-left active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.22em] text-amber-300">
                        日本史図鑑
                      </p>
                      <p className="text-xs font-bold text-zinc-300">
                        重要年 {historyCollection.importantDiscoveredCount} / {historyCollection.importantTotal}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-black text-white">
                        全年度 {historyCollection.discoveredCount} / {historyCollection.totalYears}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500">
                        累計 {challengeStats.totalYearsTraveled.toLocaleString()}年 旅した
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <TimerRing
                running={running}
                display={display}
                target={isChallenge ? challenge.targetSeconds : undefined}
              />

              <button
                onClick={running ? handleStop : handleStart}
                className={`min-h-20 w-full rounded-3xl text-2xl font-black text-white transition active:scale-95 ${
                  running
                    ? isChallenge
                      ? "animate-pulse bg-gradient-to-b from-violet-300 via-violet-500 to-purple-800 shadow-[0_0_52px_rgba(167,139,250,0.5)]"
                      : "animate-pulse bg-gradient-to-b from-amber-300 via-orange-500 to-orange-800 shadow-[0_0_52px_rgba(251,191,36,0.48)]"
                    : isChallenge
                      ? "bg-gradient-to-b from-violet-300 via-violet-500 to-purple-800 shadow-[0_0_40px_rgba(167,139,250,0.36)]"
                      : "bg-gradient-to-b from-amber-300 via-orange-500 to-orange-800 shadow-[0_0_40px_rgba(251,191,36,0.34)]"
                }`}
              >
                {running ? "STOP" : "START"}
              </button>

              <p className="text-center text-[11px] font-medium text-zinc-500">
                {isChallenge
                  ? `${challenge.targetSeconds.toFixed(2)}秒ピタリで止めて${challenge.targetYear}年へ着地せよ。`
                  : "6.45秒なら645年。20.26秒で2026年へ。"}
              </p>
            </>
          ) : (
            result && (
              <>
                <HistoryResultCard
                  result={result}
                  challengeTargetYear={isChallenge ? challenge.targetYear : null}
                  challengeShareText={
                    result.challengeDiff !== null
                      ? buildChallengeShareText(challenge, result.year, result.challengeDiff)
                      : undefined
                  }
                  importantDiscoveredCount={historyCollection.importantDiscoveredCount}
                  importantTotal={historyCollection.importantTotal}
                  discoveredCount={historyCollection.discoveredCount}
                  totalYears={historyCollection.totalYears}
                />
                <button
                  onClick={handleReset}
                  className="min-h-14 w-full rounded-3xl bg-gradient-to-b from-amber-300 via-orange-500 to-orange-800 text-lg font-black text-white shadow-[0_0_36px_rgba(251,191,36,0.3)] transition active:scale-95"
                >
                  {isChallenge ? "もう一度狙う" : "もう一度"}
                </button>
              </>
            )
          )}
        </section>
      </main>
    </>
  );
}

function HistoryResultCard({
  result,
  challengeTargetYear,
  challengeShareText,
  importantDiscoveredCount,
  importantTotal,
  discoveredCount,
  totalYears,
}: {
  result: HistoryResult;
  challengeTargetYear: number | null;
  challengeShareText?: string;
  importantDiscoveredCount: number;
  importantTotal: number;
  discoveredCount: number;
  totalYears: number;
}) {
  const { entry } = result;
  const rarity = rarityLabel(entry.importance);
  const heading = headingForCoverage(entry);
  const theme = getEraTheme(entry.era);
  const rank: RankInfo | null =
    result.challengeDiff !== null ? rankForDiff(result.challengeDiff) : null;
  const isLegend = entry.importance === 5;

  return (
    <article
      className={`animate-fade-up glass w-full overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-br ${theme.bg} p-4 ${
        isLegend ? "shadow-[0_0_56px_rgba(251,191,36,0.28)]" : "shadow-[0_0_40px_rgba(0,0,0,0.3)]"
      }`}
    >
      {rank && challengeTargetYear !== null && (
        <div
          className={`mb-3 rounded-2xl border p-2.5 text-center ${
            rank.rank === "PERFECT" || rank.rank === "SS"
              ? "border-amber-300/50 bg-amber-400/15"
              : "border-violet-400/30 bg-violet-500/10"
          }`}
        >
          <p className="text-2xl font-black">
            {rank.emoji} {rank.rank}
          </p>
          <p className="text-xs font-bold text-zinc-200">
            {rank.label}
            {result.challengeDiff === 0
              ? `　${challengeTargetYear}年ピタリ着地！`
              : `　目標${challengeTargetYear}年から ${result.challengeDiff}年ズレ`}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-zinc-400">
            {formatSeconds(result.stoppedSeconds)}秒で止まった
          </p>
          <h2 className="mt-0.5 text-xl font-black text-transparent bg-gradient-to-r from-white via-amber-200 to-orange-300 bg-clip-text">
            西暦{entry.year}年へタイムスリップ
          </h2>
          <p className="mt-0.5 text-[10px] font-black text-emerald-300">
            {result.isNew ? "NEW YEAR" : "発見済み"}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/15 bg-black/30 px-2.5 py-1.5 text-right">
          <p className={`text-[10px] font-black ${isLegend ? "animate-pulse text-amber-200" : theme.accent}`}>
            {rarity}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {theme.emoji} {entry.era}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/8 bg-black/25 p-3">
        <p className={`text-[11px] font-black ${theme.accent}`}>{heading}</p>
        <h3 className="mt-1 text-center text-xl font-black text-zinc-50">
          {entry.coverageType === "near" && entry.eventYear ? `${entry.eventYear}年 ` : ""}
          {entry.title}
        </h3>
        <p className="mt-3 text-sm font-bold leading-relaxed text-zinc-100">
          {entry.summary}
        </p>
      </div>

      <p className={`mt-3 text-sm font-black ${theme.accent}`}>{entry.hook}</p>
      <p className="mt-2 text-[10px] text-zinc-600">出典メモ: {entry.sourceLabel}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center font-mono text-xs text-zinc-400">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2">
          重要年 {importantDiscoveredCount} / {importantTotal}
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-2">
          全年度 {discoveredCount} / {totalYears}
        </div>
      </div>

      <HistoryShareActions
        stoppedSeconds={result.stoppedSeconds}
        entry={entry}
        overrideText={challengeShareText}
      />
    </article>
  );
}

function headingForCoverage(entry: JapanHistoryEntry): string {
  if (entry.coverageType === "exact") return "この年の日本史:";
  if (entry.coverageType === "near") return "この年に近い日本史:";
  return "この頃の日本:";
}

function rarityLabel(importance: JapanHistoryEntry["importance"]): string {
  if (importance === 5) return "LEGEND";
  if (importance === 4) return "RARE";
  if (importance === 3) return "HISTORY";
  return "ERA";
}
