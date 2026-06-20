"use client";

import { MAX_SECONDS } from "@/lib/findTrivia";

interface TimerRingProps {
  running: boolean;
  display: string;
  target?: number;
}

const R = 92;
const CIRC = 2 * Math.PI * R;

export function TimerRing({ running, display, target }: TimerRingProps) {
  const [whole, frac] = display.includes(":")
    ? [display, ""]
    : display.split(".");

  const seconds = parseFloat(display) || 0;
  const progress = Math.min(seconds / MAX_SECONDS, 1);
  const dashOffset = CIRC * (1 - progress);
  const nearLimit = seconds >= MAX_SECONDS * 0.85;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className={`absolute h-48 w-48 sm:h-56 sm:w-56 ${running ? "animate-ring-pulse" : ""}`}
        viewBox="0 0 200 200"
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={nearLimit && running ? "url(#dangerGrad)" : "url(#progressGrad)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          className="transition-[stroke-dashoffset] duration-75"
          style={{ opacity: progress > 0 ? 1 : 0.3 }}
        />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={running ? "url(#timerGrad)" : "rgba(255,255,255,0.08)"}
          strokeWidth="2"
          strokeDasharray={running ? "12 6" : "4 8"}
          className={running ? "origin-center animate-orbit" : ""}
          style={running ? { transformOrigin: "center", animationDuration: "3s" } : undefined}
        />
        <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const isMajor = i % 5 === 0;
          const r1 = isMajor ? 74 : 78;
          const r2 = 82;
          return (
            <line
              key={i}
              x1={100 + r1 * Math.cos(rad)}
              y1={100 + r1 * Math.sin(rad)}
              x2={100 + r2 * Math.cos(rad)}
              y2={100 + r2 * Math.sin(rad)}
              stroke={isMajor ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.12)"}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}
        {target !== undefined && target > 0 && (() => {
          const angle = (Math.min(target / MAX_SECONDS, 1)) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              x1={100 + 84 * Math.cos(rad)}
              y1={100 + 84 * Math.sin(rad)}
              x2={100 + 100 * Math.cos(rad)}
              y2={100 + 100 * Math.sin(rad)}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })()}
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className={`glass relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-full border sm:h-48 sm:w-48 ${
          running
            ? nearLimit
              ? "border-red-400/40 shadow-[0_0_80px_rgba(239,68,68,0.25)] animate-neon-flicker"
              : "border-orange-400/30 shadow-[0_0_60px_rgba(251,146,60,0.15)]"
            : "border-white/8 shadow-[0_0_40px_rgba(0,0,0,0.4)] animate-stop-lock"
        }`}
      >
        {running && <span className="absolute inset-0 rounded-full bg-orange-500/5 animate-pulse" />}

        <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          {running ? "計測中" : "秒数"}
        </span>

        <div
          key={display}
          className={`animate-digit-pop font-mono font-bold tracking-wider ${
            running ? "timer-glow-running text-5xl text-orange-200 sm:text-6xl" : "timer-glow-idle text-4xl text-zinc-100 sm:text-5xl"
          }`}
        >
          {frac !== "" ? (
            <>
              {whole}
              <span className="text-orange-400/80">.</span>
              <span className="text-orange-300">{frac}</span>
            </>
          ) : (
            whole
          )}
        </div>

        <span className="mt-1 font-mono text-xs text-zinc-600">sec</span>
      </div>
    </div>
  );
}
