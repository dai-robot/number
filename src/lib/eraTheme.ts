export interface EraTheme {
  emoji: string;
  border: string;
  bg: string;
  accent: string;
}

const themes: Record<string, EraTheme> = {
  "弥生時代": { emoji: "🌾", border: "border-lime-400/30", bg: "from-lime-950/30 via-zinc-950/85 to-emerald-950/25", accent: "text-lime-300" },
  "古墳時代": { emoji: "⛰️", border: "border-stone-400/30", bg: "from-stone-800/30 via-zinc-950/85 to-amber-950/25", accent: "text-stone-300" },
  "飛鳥時代": { emoji: "🏯", border: "border-rose-400/30", bg: "from-rose-950/30 via-zinc-950/85 to-purple-950/25", accent: "text-rose-300" },
  "奈良時代": { emoji: "🦌", border: "border-amber-400/30", bg: "from-amber-950/30 via-zinc-950/85 to-orange-950/25", accent: "text-amber-300" },
  "平安時代": { emoji: "🎎", border: "border-purple-400/30", bg: "from-purple-950/30 via-zinc-950/85 to-pink-950/25", accent: "text-purple-300" },
  "鎌倉時代": { emoji: "⚔️", border: "border-slate-400/30", bg: "from-slate-800/30 via-zinc-950/85 to-blue-950/25", accent: "text-slate-300" },
  "南北朝時代": { emoji: "☯️", border: "border-indigo-400/30", bg: "from-indigo-950/30 via-zinc-950/85 to-violet-950/25", accent: "text-indigo-300" },
  "室町時代": { emoji: "🍵", border: "border-emerald-400/30", bg: "from-emerald-950/30 via-zinc-950/85 to-teal-950/25", accent: "text-emerald-300" },
  "安土桃山時代": { emoji: "🏰", border: "border-yellow-400/30", bg: "from-yellow-950/30 via-zinc-950/85 to-red-950/25", accent: "text-yellow-300" },
  "江戸時代": { emoji: "🗾", border: "border-cyan-400/30", bg: "from-cyan-950/30 via-zinc-950/85 to-blue-950/25", accent: "text-cyan-300" },
  "明治時代": { emoji: "🚂", border: "border-red-400/30", bg: "from-red-950/30 via-zinc-950/85 to-orange-950/25", accent: "text-red-300" },
  "大正時代": { emoji: "🎩", border: "border-fuchsia-400/30", bg: "from-fuchsia-950/30 via-zinc-950/85 to-purple-950/25", accent: "text-fuchsia-300" },
  "昭和時代": { emoji: "📺", border: "border-orange-400/30", bg: "from-orange-950/30 via-zinc-950/85 to-amber-950/25", accent: "text-orange-300" },
  "平成時代": { emoji: "📱", border: "border-sky-400/30", bg: "from-sky-950/30 via-zinc-950/85 to-indigo-950/25", accent: "text-sky-300" },
  "令和時代": { emoji: "🌸", border: "border-pink-400/30", bg: "from-pink-950/30 via-zinc-950/85 to-rose-950/25", accent: "text-pink-300" },
};

const fallback: EraTheme = {
  emoji: "📜",
  border: "border-amber-400/30",
  bg: "from-amber-950/25 via-zinc-950/85 to-orange-950/25",
  accent: "text-amber-300",
};

export function getEraTheme(era: string): EraTheme {
  return themes[era] ?? fallback;
}
