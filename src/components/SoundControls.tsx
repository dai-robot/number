"use client";

export function SoundControls({
  muted,
  bgmOn,
  onToggleMute,
  onToggleBgm,
}: {
  muted: boolean;
  bgmOn: boolean;
  onToggleMute: () => void;
  onToggleBgm: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleBgm}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
          bgmOn && !muted
            ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
            : "border-zinc-700 bg-zinc-800/60 text-zinc-500"
        }`}
        title={bgmOn ? "BGM OFF" : "BGM ON"}
        aria-label={bgmOn ? "BGMをオフ" : "BGMをオン"}
      >
        {bgmOn && !muted ? "♪" : "♪̸"}
      </button>
      <button
        onClick={onToggleMute}
        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
          muted
            ? "border-zinc-700 bg-zinc-800/60 text-zinc-500"
            : "border-orange-500/40 bg-orange-500/10 text-orange-400"
        }`}
        title={muted ? "ミュート解除" : "ミュート"}
        aria-label={muted ? "ミュート解除" : "ミュート"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
