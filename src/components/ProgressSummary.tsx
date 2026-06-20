"use client";

export function ProgressSummary({
  count,
  total,
  percent,
  ssrCount,
  onOpenCollection,
}: {
  count: number;
  total: number;
  percent: number;
  ssrCount: number;
  onOpenCollection: () => void;
}) {
  const remaining = Math.max(total - count, 0);

  return (
    <section className="w-full rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/70 via-indigo-950/50 to-zinc-950/70 p-3 shadow-[0_0_24px_rgba(139,92,246,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] text-violet-300">
            図鑑達成率
          </p>
          <p className="mt-0.5 font-mono text-lg font-black text-white">
            {count} <span className="text-violet-400/60">/ {total}</span>
          </p>
          <p className="text-[10px] font-bold text-amber-300">SSR {ssrCount}</p>
        </div>

        <div className="text-right">
          <p className="font-mono text-4xl font-black leading-none text-transparent bg-gradient-to-b from-white via-violet-200 to-fuchsia-300 bg-clip-text">
            {percent}%
          </p>
          <p className="mt-1 text-[11px] font-bold text-zinc-400">あと{remaining}個！</p>
        </div>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <button
        onClick={onOpenCollection}
        className="mt-2 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 py-2 text-xs font-black text-violet-100 transition active:scale-[0.98]"
      >
        図鑑を見る
      </button>
    </section>
  );
}
