"use client";

import { japanHistoryByYear } from "@/data/history/japanHistoryFull";

export function HistoryCollectionPanel({
  discoveredSet,
  discoveredCount,
  totalYears,
  importantDiscoveredCount,
  importantTotal,
  onBack,
}: {
  discoveredSet: Set<number>;
  discoveredCount: number;
  totalYears: number;
  importantDiscoveredCount: number;
  importantTotal: number;
  onBack: () => void;
}) {
  const discoveredEntries = japanHistoryByYear.filter((entry) => discoveredSet.has(entry.year)).slice().reverse();
  const importantEntries = japanHistoryByYear.filter((entry) => entry.importance >= 4);

  return (
    <main className="relative z-10 mx-auto min-h-[100svh] max-w-lg px-4 py-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-amber-300">HISTORY CODEX</p>
          <h1 className="text-2xl font-black">日本史図鑑</h1>
        </div>
        <button
          onClick={onBack}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold active:scale-95"
        >
          戻る
        </button>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4">
          <p className="text-xs font-bold text-amber-200">重要年</p>
          <p className="mt-1 font-mono text-2xl font-black">
            {importantDiscoveredCount} / {importantTotal}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-zinc-300">全年度</p>
          <p className="mt-1 font-mono text-2xl font-black">
            {discoveredCount} / {totalYears}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-4">
        <h2 className="text-sm font-black text-amber-100">発見済み</h2>
        <div className="mt-3 space-y-2">
          {discoveredEntries.length === 0 ? (
            <p className="text-sm text-zinc-400">まだ発見した年はありません。</p>
          ) : (
            discoveredEntries.map((entry) => (
              <div key={entry.year} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-black text-amber-200">{entry.displayYear}</p>
                  <p className="text-[10px] font-bold text-zinc-400">{entry.coverageType.toUpperCase()}</p>
                </div>
                <p className="mt-1 text-sm font-bold">{entry.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{entry.hook}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
        <h2 className="text-sm font-black text-amber-100">重要年リスト</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {importantEntries.map((entry) => (
            <div
              key={entry.year}
              className={`rounded-2xl border px-2 py-2 text-center ${
                discoveredSet.has(entry.year)
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                  : "border-white/8 bg-white/[0.03] text-zinc-500"
              }`}
            >
              <p className="font-mono text-xs font-black">{entry.year}</p>
              <p className="truncate text-[10px]">{discoveredSet.has(entry.year) ? entry.title : "未発見"}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
