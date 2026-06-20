"use client";

import { STORIES } from "@/data/stories";

export function StoryCollectionPanel({
  readSet,
  count,
  total,
  percent,
  onBack,
}: {
  readSet: Set<number>;
  count: number;
  total: number;
  percent: number;
  onBack: () => void;
}) {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col px-3 py-3">
      <section className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-orange-500/30">
        <header className="shrink-0 border-b border-orange-500/20 bg-gradient-to-r from-orange-950/70 via-zinc-950/80 to-violet-950/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gradient-title">物語図鑑</h1>
              <p className="mt-1 font-mono text-sm text-orange-200/80">
                {count} / {total} ・ {percent}%
              </p>
            </div>
            <button
              onClick={onBack}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 active:scale-95"
            >
              戻る
            </button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-teal-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-2">
            {STORIES.map((story) => {
              const read = readSet.has(story.second);
              return (
                <div
                  key={story.second}
                  className={`aspect-square rounded-2xl border p-2 text-center transition ${
                    read
                      ? "border-orange-400/40 bg-orange-500/10 shadow-[0_0_16px_rgba(251,146,60,0.15)]"
                      : "border-zinc-800 bg-zinc-950/50"
                  }`}
                  title={read ? `${story.second}秒の物語` : "未読"}
                >
                  <p className={`font-mono text-lg font-black ${read ? "text-orange-200" : "text-zinc-700"}`}>
                    {story.second}
                  </p>
                  <p className={`mt-1 text-[9px] font-bold ${read ? "text-zinc-300" : "text-zinc-700"}`}>
                    {read ? story.category : "?"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
