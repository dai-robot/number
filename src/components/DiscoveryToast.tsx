"use client";

import type { Trivia, TriviaRarity } from "@/types/trivia";
import { useEffect, useState } from "react";

const RARITY_BG: Record<TriviaRarity, string> = {
  SSR: "border-yellow-400/60 bg-gradient-to-r from-yellow-950/90 via-amber-950/80 to-orange-950/90 shadow-[0_0_40px_rgba(251,191,36,0.3)]",
  SR: "border-purple-400/50 bg-gradient-to-r from-purple-950/90 via-violet-950/80 to-indigo-950/90 shadow-[0_0_30px_rgba(168,85,247,0.25)]",
  R: "border-blue-400/40 bg-gradient-to-r from-blue-950/80 to-indigo-950/80",
  N: "border-zinc-600/40 bg-zinc-900/90",
};

export function DiscoveryToast({
  trivia,
  isNew,
  onDone,
  label = "NEW 発見！",
}: {
  trivia: Trivia | null;
  isNew: boolean;
  onDone: () => void;
  label?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trivia || !isNew) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      onDone();
    }, 2800);
    return () => clearTimeout(t);
  }, [trivia, isNew, onDone]);

  if (!show || !trivia) return null;

  const bg = RARITY_BG[trivia.rarity];

  return (
    <div className="fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-fade-up">
      <div className={`overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-md ${bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{trivia.rarity === "SSR" ? "✨" : trivia.rarity === "SR" ? "💫" : "📖"}</span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-line text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              {label}
            </p>
            <p className="truncate font-bold text-white">{trivia.title}</p>
            <p className="font-mono text-xs text-zinc-400">
              {trivia.value.toFixed(1)}s ・ {trivia.rarity}
            </p>
          </div>
        </div>
        {trivia.rarity === "SSR" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-shimmer" />
        )}
      </div>
    </div>
  );
}
