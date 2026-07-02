"use client";

import type { JapanHistoryEntry } from "@/data/history/japanHistoryFull";
import { buildHistoryShareText } from "@/data/history/generateJapanHistoryFull";
import { track } from "@/lib/analytics";

export function HistoryShareActions({
  stoppedSeconds,
  entry,
  overrideText,
}: {
  stoppedSeconds: number;
  entry: JapanHistoryEntry;
  overrideText?: string;
}) {
  const text = overrideText ?? buildHistoryShareText(stoppedSeconds, entry);
  const url = typeof window === "undefined" ? "" : window.location.origin;

  const share = async () => {
    track("share_click", { year: entry.year, coverageType: entry.coverageType });
    if (navigator.share) {
      await navigator.share({ title: "秒で日本史タイムスリップ", text, url });
      return;
    }

    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", `${text}\n#秒で日本史`);
    if (url) intent.searchParams.set("url", url);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(`${text}${url ? `\n${url}` : ""}`);
  };

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        onClick={share}
        className="rounded-2xl border border-amber-400/35 bg-amber-400/10 px-3 py-3 text-sm font-black text-amber-100 active:scale-95"
      >
        シェア
      </button>
      <button
        onClick={copy}
        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-black text-zinc-100 active:scale-95"
      >
        コピー
      </button>
    </div>
  );
}
