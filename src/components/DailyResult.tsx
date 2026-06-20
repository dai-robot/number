"use client";

import { scoreFromDiff, type DailyRank } from "@/lib/daily";
import type { Lang } from "@/lib/i18n";
import { buildShareText, shareResult } from "@/lib/share";
import { useState } from "react";

const RANK_STYLE: Record<DailyRank, string> = {
  S: "from-yellow-300 via-amber-400 to-orange-500 text-transparent bg-clip-text",
  A: "from-fuchsia-300 to-purple-400 text-transparent bg-clip-text",
  B: "from-teal-300 to-emerald-400 text-transparent bg-clip-text",
  C: "from-sky-300 to-blue-400 text-transparent bg-clip-text",
  D: "from-zinc-400 to-zinc-500 text-transparent bg-clip-text",
};

export function DailyResult({
  t,
  lang,
  dayNumber,
  target,
  attempts,
  bestDiff,
  bestScore,
  completed,
  streak,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
  dayNumber: number;
  target: number;
  attempts: number[];
  bestDiff: number | null;
  bestScore: number;
  completed: boolean;
  streak: number;
}) {
  const [shareMsg, setShareMsg] = useState("");

  const rank = bestDiff !== null ? scoreFromDiff(bestDiff).rank : null;

  const onShare = async () => {
    const text = buildShareText({ lang, dayNumber, target, attempts, streak });
    const res = await shareResult(text);
    if (res === "copied") {
      setShareMsg(t("copied"));
      setTimeout(() => setShareMsg(""), 2000);
    }
  };

  return (
    <article className="animate-fade-up glass w-full overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-950/40 to-orange-950/20 p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-amber-300/70">
          {t("dailyTitle")} #{dayNumber}
        </span>
        {streak > 0 && (
          <span className="rounded-full bg-orange-500/15 px-3 py-1 font-mono text-xs text-orange-300">
            🔥 {t("streak", { n: streak })}
          </span>
        )}
      </div>

      {rank && (
        <div className="mt-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
            {t("rank")}
          </p>
          <p className={`bg-gradient-to-b ${RANK_STYLE[rank]} text-7xl font-black leading-none`}>
            {rank}
          </p>
          <p className="mt-1 font-mono text-sm text-amber-200/80">
            {t("score")} {bestScore}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        {attempts.map((d, i) => {
          const s = scoreFromDiff(d);
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-zinc-700/40 bg-zinc-900/40 px-3 py-2"
            >
              <span className="font-mono text-xs text-zinc-500">{t("attemptN", { n: i + 1 })}</span>
              <span className="font-mono text-xs text-zinc-300">
                {t("diffFromTarget", { diff: d.toFixed(2) })}
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">{s.rank}</span>
            </div>
          );
        })}
      </div>

      {completed && (
        <>
          <p className="mt-4 text-center text-sm font-bold text-emerald-300">{t("dailyDone")}</p>
          <button
            onClick={onShare}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-black text-black transition active:scale-95 hover:from-amber-300 hover:to-orange-400"
          >
            {shareMsg || `📤 ${t("share")}`}
          </button>
          <p className="mt-2 text-center text-[11px] text-zinc-500">{t("comeTomorrow")}</p>
        </>
      )}
    </article>
  );
}
