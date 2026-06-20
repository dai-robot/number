import type { TriviaCategory, TriviaRarity, TriviaSourceType } from "@/types/trivia";

const CATEGORY_ICONS: Record<TriviaCategory, string> = {
  math: "∑",
  anniversary: "📅",
  history: "🏛",
  science: "⚛",
  lucky: "🍀",
  culture: "🎭",
};

const SOURCE_ICONS: Record<TriviaSourceType, string> = {
  anniversary: "🗓",
  math: "π",
  history: "📜",
  science: "🔬",
  lucky: "✨",
  culture: "🎬",
  local: "📍",
  sports: "🏆",
};

const CATEGORY_COLORS: Record<TriviaCategory, string> = {
  math: "from-violet-500/20 to-purple-600/10 border-violet-400/30",
  anniversary: "from-pink-500/20 to-rose-600/10 border-pink-400/30",
  history: "from-amber-500/20 to-yellow-600/10 border-amber-400/30",
  science: "from-cyan-500/20 to-teal-600/10 border-cyan-400/30",
  lucky: "from-emerald-500/20 to-green-600/10 border-emerald-400/30",
  culture: "from-orange-500/20 to-red-600/10 border-orange-400/30",
};

export function CategoryIcon({ category }: { category: TriviaCategory }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-lg ${CATEGORY_COLORS[category]}`}
      aria-hidden
    >
      {CATEGORY_ICONS[category]}
    </span>
  );
}

export function SourceIcon({ sourceType }: { sourceType: TriviaSourceType }) {
  return (
    <span className="text-sm" aria-hidden>
      {SOURCE_ICONS[sourceType]}
    </span>
  );
}

export function RarityFrame({ rarity }: { rarity: TriviaRarity }) {
  if (rarity === "SSR") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="animate-sparkle absolute text-yellow-300"
            style={{
              left: `${5 + i * 7}%`,
              top: `${3 + (i % 4) * 24}%`,
              animationDelay: `${i * 0.15}s`,
              fontSize: i % 2 === 0 ? "0.85rem" : "0.55rem",
            }}
          >
            {i % 3 === 0 ? "★" : "✦"}
          </span>
        ))}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/15 via-transparent to-amber-500/15" />
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-yellow-400/30 via-orange-400/10 to-yellow-400/30 opacity-60" />
      </div>
    );
  }
  if (rarity === "SR") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="animate-sparkle absolute text-purple-300"
            style={{
              left: `${12 + i * 14}%`,
              top: `${8 + (i % 2) * 40}%`,
              animationDelay: `${i * 0.25}s`,
              fontSize: "0.65rem",
            }}
          >
            ✦
          </span>
        ))}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/12 via-transparent to-violet-500/12" />
      </div>
    );
  }
  return null;
}

export function Confetti({
  active,
  intensity = "ssr",
}: {
  active: boolean;
  intensity?: "ssr" | "sr";
}) {
  if (!active) return null;
  const colors = ["#fbbf24", "#fb923c", "#a78bfa", "#2dd4bf", "#f472b6", "#fde047", "#e879f9"];
  const count = intensity === "ssr" ? 28 : 14;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-sm"
          style={{
            width: intensity === "ssr" ? "10px" : "7px",
            height: intensity === "ssr" ? "10px" : "7px",
            left: `${3 + (i * 4) % 94}%`,
            top: "0",
            backgroundColor: colors[i % colors.length],
            animation: `confetti-fall ${0.7 + (i % 4) * 0.15}s ease-out forwards`,
            animationDelay: `${i * 0.04}s`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function Shockwave({ active, variant = "ssr" }: { active: boolean; variant?: "ssr" | "sr" }) {
  if (!active) return null;
  const ring =
    variant === "ssr"
      ? "border-yellow-400/70 shadow-[0_0_40px_rgba(251,191,36,0.5)]"
      : "border-purple-400/60 shadow-[0_0_30px_rgba(168,85,247,0.4)]";
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className={`animate-shockwave absolute h-32 w-32 rounded-full border-4 ${ring}`} />
      <div
        className={`animate-shockwave absolute h-32 w-32 rounded-full border-2 ${ring} [animation-delay:0.12s]`}
      />
    </div>
  );
}

export function NearMissBanner({
  short,
  diff,
  stoppedAt,
  targetValue,
  t,
}: {
  short: string;
  diff: number;
  stoppedAt: string;
  targetValue: string;
  t?: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const tr = t ?? ((k: string) => k);
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-amber-950/80 px-5 py-5 text-center">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(251,191,36,0.03)_10px,rgba(251,191,36,0.03)_20px)]" />
      <div className="relative">
        <span className="mb-2 inline-block rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold tracking-widest text-amber-300">
          {tr("nearMiss")}
        </span>
        <p className="text-2xl font-black text-amber-100">{tr("almost", { name: short })}</p>
        <p className="mt-2 font-mono text-sm text-amber-400/70">
          {stoppedAt}s → {targetValue}s（{diff.toFixed(2)}s）
        </p>
      </div>
    </div>
  );
}
