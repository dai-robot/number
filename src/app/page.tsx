"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Background } from "@/components/Background";
import { CollectionPanel } from "@/components/CollectionPanel";
import { DailyResult } from "@/components/DailyResult";
import { DiscoveryToast } from "@/components/DiscoveryToast";
import { ScreenFlash } from "@/components/ScreenFlash";
import {
  CategoryIcon,
  Confetti,
  NearMissBanner,
  RarityFrame,
  Shockwave,
  SourceIcon,
} from "@/components/Graphics";
import { TimerRing } from "@/components/TimerRing";
import { SoundControls } from "@/components/SoundControls";
import { useCollection } from "@/hooks/useCollection";
import { useDaily } from "@/hooks/useDaily";
import { useSound } from "@/hooks/useSound";
import { getDailyTarget, scoreFromDiff } from "@/lib/daily";
import { clampSeconds, findTrivia, formatSeconds, MAX_SECONDS, NEAR_TOLERANCE } from "@/lib/findTrivia";
import { useLang } from "@/lib/i18n";
import { loadTrivia } from "@/lib/triviaData";
import { playResultSound } from "@/lib/sound";
import type { Trivia, TriviaRarity, TriviaResult } from "@/types/trivia";
import { CATEGORY_LABELS, getShortTitle, SOURCE_TYPE_LABELS } from "@/types/trivia";

const TRIVIA_LIST = loadTrivia();

type Mode = "free" | "daily";

const RARITY_STYLES: Record<
  TriviaRarity,
  { badge: string; card: string; glow?: string; accent: string }
> = {
  SSR: {
    badge: "bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 text-black",
    card: "border-yellow-400/50",
    glow: "shadow-[0_0_48px_rgba(255,215,0,0.35)]",
    accent: "from-yellow-500/20 to-amber-600/5",
  },
  SR: {
    badge: "bg-gradient-to-r from-purple-500 to-violet-400 text-white",
    card: "border-purple-400/40",
    glow: "shadow-[0_0_32px_rgba(168,85,247,0.25)]",
    accent: "from-purple-500/15 to-violet-600/5",
  },
  R: {
    badge: "bg-blue-500/90 text-white",
    card: "border-blue-400/30",
    accent: "from-blue-500/10 to-blue-600/5",
  },
  N: {
    badge: "bg-zinc-600/90 text-zinc-200",
    card: "border-zinc-600/30",
    accent: "from-zinc-600/10 to-zinc-700/5",
  },
};

export default function Home() {
  const [display, setDisplay] = useState("0.00");
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<Mode>("free");
  const [result, setResult] = useState<TriviaResult | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [flashVariant, setFlashVariant] = useState<"ssr" | "sr" | "near">("ssr");
  const [newDiscovery, setNewDiscovery] = useState<Trivia | null>(null);
  const [showNewToast, setShowNewToast] = useState(false);
  const [target, setTarget] = useState(0);
  const [praise, setPraise] = useState<string>("");

  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { lang, toggleLang, t } = useLang();
  const { muted, bgmOn, init, toggleMute, toggleBgm, playStart, playStop, playTick } = useSound();
  const { entries, discover, ssrCount, percent, count, discoveredSet } = useCollection(TRIVIA_LIST.length);
  const daily = useDaily();

  useEffect(() => {
    setTarget(getDailyTarget());
  }, []);

  const applyResult = useCallback(
    (triviaResult: TriviaResult) => {
      setResult(triviaResult);
      setAnimKey((k) => k + 1);

      const rarity = triviaResult.trivia?.rarity ?? triviaResult.nearest.rarity;
      playResultSound(triviaResult.matchType, rarity);

      if (
        (triviaResult.matchType === "exact" || triviaResult.matchType === "near") &&
        triviaResult.trivia
      ) {
        const wasNew = !discoveredSet.has(triviaResult.trivia.value);
        discover(triviaResult.trivia);
        if (wasNew) {
          setNewDiscovery(triviaResult.trivia);
          setShowNewToast(true);
        }
      }

      if (triviaResult.matchType === "exact" && rarity === "SSR") {
        setFlashVariant("ssr");
        setFlashKey((k) => k + 1);
      } else if (triviaResult.matchType === "exact" && rarity === "SR") {
        setFlashVariant("sr");
        setFlashKey((k) => k + 1);
      } else if (triviaResult.matchType === "near") {
        setFlashVariant("near");
        setFlashKey((k) => k + 1);
      }
    },
    [discover, discoveredSet]
  );

  const finishDaily = useCallback(
    (stopped: number) => {
      const diff = Math.abs(stopped - target);
      const s = scoreFromDiff(diff);
      daily.recordAttempt(diff);
      setPraise(t(s.praiseKey));
      if (s.rank === "S") {
        setFlashVariant("ssr");
        setFlashKey((k) => k + 1);
      } else if (s.rank === "A") {
        setFlashVariant("sr");
        setFlashKey((k) => k + 1);
      } else if (s.rank === "B") {
        setFlashVariant("near");
        setFlashKey((k) => k + 1);
      }
      playResultSound("exact", s.rank === "S" ? "SSR" : s.rank === "A" ? "SR" : "R");
    },
    [target, daily, t, playResultSound]
  );

  const finishWithValue = useCallback(
    (raw: number) => {
      const stopped = clampSeconds(raw);
      elapsedRef.current = 0;
      setRunning(false);
      setDisplay(formatSeconds(stopped));
      playStop();
      if (mode === "daily") {
        finishDaily(stopped);
      } else {
        applyResult(findTrivia(stopped, TRIVIA_LIST));
      }
    },
    [playStop, applyResult, finishDaily, mode]
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

  const dailyLocked = mode === "daily" && daily.completed;

  const handleStart = () => {
    if (running || dailyLocked) return;
    init();
    playStart();
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setRunning(true);
    setResult(null);
    setPraise("");
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
    setPraise("");
  };

  const switchMode = (m: Mode) => {
    if (running) return;
    setMode(m);
    setResult(null);
    setPraise("");
    setDisplay("0.00");
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

  const kbdHint = t("kbdHint", { space: "Space", r: "R" })
    .split(/(\bSpace\b|\bR\b)/)
    .map((part, i) =>
      part === "Space" || part === "R" ? (
        <kbd
          key={i}
          className="rounded border border-zinc-700 bg-zinc-800/50 px-1.5 py-0.5 font-mono text-zinc-500"
        >
          {part}
        </kbd>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <>
      <Background />
      <ScreenFlash key={flashKey} active={flashKey > 0} variant={flashVariant} />
      <DiscoveryToast
        trivia={newDiscovery}
        isNew={showNewToast}
        onDone={() => setShowNewToast(false)}
        label={t("newDiscovery")}
      />

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-4 py-10">
        <header className="w-full text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                {t("brand")}
              </span>
            </div>
            <button
              onClick={toggleLang}
              className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-[10px] font-bold text-zinc-300 backdrop-blur-sm transition hover:bg-white/10"
            >
              {lang === "ja" ? "EN" : "日本語"}
            </button>
            <SoundControls
              muted={muted}
              bgmOn={bgmOn}
              onToggleMute={toggleMute}
              onToggleBgm={toggleBgm}
            />
          </div>
          <h1 className="animate-title-shine text-gradient-title text-4xl font-black tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{t("subtitle", { max: MAX_SECONDS })}</p>
        </header>

        <div className="flex w-full gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1">
          {(["free", "daily"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              disabled={running}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                mode === m
                  ? m === "daily"
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20"
                    : "bg-gradient-to-r from-teal-400 to-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m === "daily" ? `🔥 ${t("modeDaily")}` : `🎲 ${t("modeFree")}`}
            </button>
          ))}
        </div>

        {mode === "free" ? (
          <div className="w-full">
            <CollectionPanel
              count={count}
              total={TRIVIA_LIST.length}
              ssrCount={ssrCount}
              percent={percent}
              entries={entries}
              triviaList={TRIVIA_LIST}
              discoveredSet={discoveredSet}
              t={t}
            />
          </div>
        ) : (
          <DailyTargetHud
            t={t}
            dayNumber={daily.dayNumber}
            target={target}
            attemptsLeft={daily.attemptsLeft}
            streak={daily.streak}
          />
        )}

        <TimerRing running={running} display={display} target={mode === "daily" ? target : undefined} />

        {mode === "daily" && praise && !running && (
          <p className="animate-fade-up -my-2 text-center text-2xl font-black text-amber-300">
            {praise}
          </p>
        )}

        <div className="flex gap-3">
          <ActionButton onClick={handleStart} disabled={running || dailyLocked} variant="start" icon="▶">
            {t("start")}
          </ActionButton>
          <ActionButton onClick={handleStop} disabled={!running} variant="stop" icon="■">
            {t("stop")}
          </ActionButton>
          <ActionButton onClick={handleReset} variant="reset" icon="↺">
            {t("reset")}
          </ActionButton>
        </div>

        {mode === "free" && result && <ResultCard key={animKey} result={result} t={t} />}

        {mode === "daily" && daily.attempts.length > 0 && (
          <DailyResult
            t={t}
            lang={lang}
            dayNumber={daily.dayNumber}
            target={target}
            attempts={daily.attempts}
            bestDiff={daily.bestDiff}
            bestScore={daily.bestScore}
            completed={daily.completed}
            streak={daily.streak}
          />
        )}

        <footer className="text-center text-xs text-zinc-600">{kbdHint}</footer>
      </main>
    </>
  );
}

function DailyTargetHud({
  t,
  dayNumber,
  target,
  attemptsLeft,
  streak,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  dayNumber: number;
  target: number;
  attemptsLeft: number;
  streak: number;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-orange-950/30 to-amber-950/50 px-4 py-3">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,rgba(251,191,36,0.03)_12px,rgba(251,191,36,0.03)_24px)]" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
            {t("dailyTarget")} #{dayNumber}
          </p>
          <p className="mt-0.5 font-mono text-3xl font-black text-transparent bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text">
            {target.toFixed(2)}
            <span className="text-base text-amber-500/60">s</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-amber-200/90">{t("attemptsLeft", { n: attemptsLeft })}</p>
          {streak > 0 && (
            <p className="mt-1 font-mono text-xs text-orange-300">🔥 {t("streak", { n: streak })}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: "start" | "stop" | "reset";
  icon: string;
}) {
  const styles = {
    start:
      "bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:from-orange-300 hover:to-orange-500 hover:shadow-orange-400/50",
    stop: "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 hover:from-red-400 hover:to-red-600 hover:shadow-red-400/50",
    reset:
      "border border-zinc-600/50 bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700/80 hover:text-zinc-200",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-25 disabled:active:scale-100 ${styles[variant]}`}
    >
      <span className="text-xs opacity-80">{icon}</span>
      {children}
    </button>
  );
}

function ResultCard({
  result,
  t,
}: {
  result: TriviaResult;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const { matchType, trivia, nearest, stoppedAt, diff } = result;

  if (matchType === "exact" && trivia) {
    return (
      <TriviaCard trivia={trivia} stoppedAt={stoppedAt} badge={t("exactMatch")} showEffects exact t={t} />
    );
  }

  if (matchType === "near" && trivia) {
    return (
      <div className="w-full space-y-3">
        <NearMissBanner
          short={getShortTitle(trivia)}
          diff={diff}
          stoppedAt={formatSeconds(stoppedAt)}
          targetValue={formatSeconds(trivia.value)}
          t={t}
        />
        <TriviaCard trivia={trivia} stoppedAt={stoppedAt} badge={t("nearMatch")} near showEffects t={t} />
      </div>
    );
  }

  const short = getShortTitle(nearest);
  return (
    <article className="animate-fade-up glass w-full overflow-hidden rounded-2xl border border-zinc-700/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-sm text-zinc-400">{formatSeconds(stoppedAt)} {t("sec")}</span>
        <span className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-500">
          {t("undiscovered")}
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-5 text-center">
        <span className="text-3xl opacity-30">?</span>
        <p className="mt-2 text-lg font-bold text-zinc-300">{t("andMore", { diff: diff.toFixed(2), name: short })}</p>
        <p className="mt-1 text-xs text-zinc-600">{t("noNearby", { tol: NEAR_TOLERANCE })}</p>
      </div>

      <div className="mt-4 flex gap-3 rounded-xl border border-zinc-700/40 bg-zinc-800/30 p-4">
        <CategoryIcon category={nearest.category} />
        <div className="min-w-0 flex-1">
          <TriviaMeta trivia={nearest} />
          <h3 className="mt-1 truncate font-bold text-zinc-300">{nearest.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{nearest.description}</p>
          <p className="mt-2 font-mono text-xs text-teal-500/70">{t("target", { value: formatSeconds(nearest.value) })}</p>
        </div>
      </div>
    </article>
  );
}

function TriviaCard({
  trivia,
  stoppedAt,
  badge,
  near,
  showEffects,
  exact,
  t,
}: {
  trivia: Trivia;
  stoppedAt: number;
  badge: string;
  near?: boolean;
  showEffects?: boolean;
  exact?: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const style = RARITY_STYLES[trivia.rarity];
  const isSSR = trivia.rarity === "SSR";
  const isSR = trivia.rarity === "SR";

  return (
    <article
      className={`animate-fade-up relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br p-6 ${style.card} ${style.accent} ${style.glow ?? ""} ${near ? "opacity-95" : ""} ${isSSR ? "animate-pulse-glow" : ""} ${exact && isSSR ? "animate-shake" : ""}`}
    >
      <RarityFrame rarity={trivia.rarity} />
      {showEffects && (
        <>
          <Shockwave active={isSSR || isSR} variant={isSSR ? "ssr" : "sr"} />
          <Confetti active={isSSR} intensity="ssr" />
          <Confetti active={isSR && !!exact} intensity="sr" />
        </>
      )}

      <div className="relative flex gap-4">
        <CategoryIcon category={trivia.category} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-sm text-emerald-400">
              {formatSeconds(stoppedAt)} {t("sec")}
            </span>
            <RarityBadge rarity={trivia.rarity} />
          </div>
          <TriviaMeta trivia={trivia} />
          <h2 className="mt-2 text-xl font-bold leading-snug">{trivia.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{trivia.description}</p>
          <p className="mt-4 flex items-center gap-2 font-mono text-xs text-emerald-500/80">
            <span className="rounded bg-emerald-500/10 px-2 py-0.5">{badge}</span>
            <span>{formatSeconds(trivia.value)} {t("sec")}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function TriviaMeta({ trivia }: { trivia: Trivia }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-xs text-zinc-400">
        {CATEGORY_LABELS[trivia.category]}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/80 px-2.5 py-0.5 text-xs text-zinc-500">
        <SourceIcon sourceType={trivia.sourceType} />
        {SOURCE_TYPE_LABELS[trivia.sourceType]}
      </span>
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: TriviaRarity }) {
  const style = RARITY_STYLES[rarity];
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black tracking-wide ${style.badge} ${
        rarity === "SSR" ? "animate-shimmer" : ""
      }`}
    >
      {rarity}
    </span>
  );
}
