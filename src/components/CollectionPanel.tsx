"use client";

import type { CollectionEntry } from "@/hooks/useCollection";
import type { Trivia, TriviaCategory } from "@/types/trivia";
import { CATEGORY_LABELS } from "@/types/trivia";
import { useMemo, useState } from "react";

const RARITY_STYLES: Record<string, { dot: string; cell: string; glow: string }> = {
  SSR: {
    dot: "bg-gradient-to-r from-yellow-400 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    cell: "border-yellow-400/40 bg-yellow-500/10",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.35)]",
  },
  SR: {
    dot: "bg-gradient-to-r from-purple-400 to-violet-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]",
    cell: "border-purple-400/35 bg-purple-500/10",
    glow: "shadow-[0_0_10px_rgba(168,85,247,0.25)]",
  },
  R: {
    dot: "bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.5)]",
    cell: "border-blue-400/25 bg-blue-500/8",
    glow: "",
  },
  N: {
    dot: "bg-zinc-500",
    cell: "border-zinc-700/50 bg-zinc-800/40",
    glow: "",
  },
};

type FilterId = "all" | TriviaCategory | "sports";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "すべて" },
  { id: "science", label: CATEGORY_LABELS.science },
  { id: "sports", label: "スポーツ" },
  { id: "anniversary", label: CATEGORY_LABELS.anniversary },
  { id: "history", label: CATEGORY_LABELS.history },
  { id: "culture", label: CATEGORY_LABELS.culture },
  { id: "math", label: CATEGORY_LABELS.math },
  { id: "lucky", label: CATEGORY_LABELS.lucky },
];

function isSports(t: Trivia) {
  return t.sourceType === "sports";
}

export function CollectionPanel({
  count,
  total,
  ssrCount,
  percent,
  entries,
  triviaList,
  discoveredSet,
  t,
}: {
  count: number;
  total: number;
  ssrCount: number;
  percent: number;
  entries: CollectionEntry[];
  triviaList: Trivia[];
  discoveredSet: Set<number>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<FilterId>("all");

  const entryMap = useMemo(() => new Map(entries.map((e) => [e.value, e])), [entries]);

  const filtered = useMemo(() => {
    return triviaList.filter((t) => {
      if (filter === "all") return true;
      if (filter === "sports") return isSports(t);
      return t.category === filter;
    });
  }, [triviaList, filter]);

  const filteredDiscovered = filtered.filter((t) => discoveredSet.has(t.value)).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/60 via-indigo-950/40 to-violet-950/60 px-4 py-3 text-left transition hover:border-violet-400/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.2)]"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(139,92,246,0.03)_20px,rgba(139,92,246,0.03)_40px)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300/80">
              {t("collection")}
            </p>
            <p className="mt-0.5 font-mono text-lg font-bold text-white">
              {count}
              <span className="text-violet-400/60"> / {total}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-black text-transparent bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text">
              {percent}%
            </p>
            <p className="text-[10px] text-amber-400/80">SSR {ssrCount}</p>
          </div>
        </div>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-slide-up glass flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-violet-500/30 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/80 to-indigo-950/80 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gradient-title">{t("collectionTitle")}</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  {t("close")}
                </button>
              </div>
              <p className="mt-1 font-mono text-sm text-violet-300/70">
                {t("discovered", { count, total, ssr: ssrCount, percent })}
              </p>

              <div className="mt-3 flex gap-2">
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      view === v
                        ? "bg-violet-500/30 text-violet-200"
                        : "border border-zinc-700 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {v === "grid" ? t("grid") : t("list")}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                      filter === f.id
                        ? "bg-fuchsia-500/25 text-fuchsia-200 ring-1 ring-fuchsia-400/40"
                        : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {filter !== "all" && (
                <p className="mt-2 text-[10px] text-zinc-500">
                  {filter === "sports" ? "スポーツ" : CATEGORY_LABELS[filter as TriviaCategory]}:{" "}
                  {filteredDiscovered}/{filtered.length} 発見
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {view === "grid" ? (
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                  {filtered.map((item) => {
                    const found = entryMap.get(item.value);
                    const style = found
                      ? RARITY_STYLES[found.rarity] ?? RARITY_STYLES.N
                      : null;
                    return (
                      <div
                        key={item.value}
                        title={
                          found
                            ? `${item.value.toFixed(1)}s — ${found.title}`
                            : `${item.value.toFixed(1)}s — ?`
                        }
                        className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-center transition ${
                          found
                            ? `${style?.cell} ${style?.glow}`
                            : "border-zinc-800/80 bg-zinc-900/30"
                        }`}
                      >
                        {found ? (
                          <>
                            <span className={`mb-0.5 h-1.5 w-1.5 rounded-full ${style?.dot}`} />
                            <span className="font-mono text-[9px] font-bold text-zinc-200">
                              {item.value.toFixed(1)}
                            </span>
                            <span className="line-clamp-2 px-0.5 text-[7px] leading-tight text-zinc-400">
                              {found.title}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-zinc-700">?</span>
                            <span className="font-mono text-[8px] text-zinc-600">
                              {item.value.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">{t("notFoundYet")}</p>
              ) : (
                <ul className="space-y-2">
                  {filtered
                    .filter((item) => discoveredSet.has(item.value))
                    .map((item) => {
                      const e = entryMap.get(item.value)!;
                      const style = RARITY_STYLES[e.rarity] ?? RARITY_STYLES.N;
                      return (
                        <li
                          key={item.value}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${style.cell}`}
                        >
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                          <span className="w-10 font-mono text-xs text-teal-400/80">
                            {item.value.toFixed(1)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                            {e.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold text-zinc-500">
                            {e.rarity}
                          </span>
                        </li>
                      );
                    })}
                  {filteredDiscovered === 0 && (
                    <p className="py-6 text-center text-sm text-zinc-500">{t("categoryEmpty")}</p>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
