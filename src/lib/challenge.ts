import { japanHistoryByYear } from "@/data/history/japanHistoryFull";
import type { JapanHistoryEntry } from "@/data/history/japanHistoryFull";

export type ChallengeRank = "PERFECT" | "SS" | "S" | "A" | "B" | "C";

export interface DailyChallenge {
  date: string;
  targetYear: number;
  targetSeconds: number;
  entry: JapanHistoryEntry;
}

export interface RankInfo {
  rank: ChallengeRank;
  label: string;
  emoji: string;
}

const legendEntries = japanHistoryByYear.filter(
  (entry) => entry.coverageType === "exact" && entry.importance === 5
);

/** ローカル日付 (YYYY-MM-DD) */
export function localDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getDailyChallenge(now = new Date()): DailyChallenge {
  const date = localDateKey(now);
  const entry = legendEntries[hashString(date) % legendEntries.length];
  return {
    date,
    targetYear: entry.year,
    targetSeconds: entry.year / 100,
    entry,
  };
}

export function rankForDiff(diff: number): RankInfo {
  if (diff === 0) return { rank: "PERFECT", label: "ピタリ賞！歴史の神", emoji: "👑" };
  if (diff <= 2) return { rank: "SS", label: "神業ストップ", emoji: "🏆" };
  if (diff <= 5) return { rank: "S", label: "見事な時間旅行", emoji: "🥇" };
  if (diff <= 15) return { rank: "A", label: "なかなかの腕前", emoji: "🥈" };
  if (diff <= 40) return { rank: "B", label: "惜しい着地", emoji: "🥉" };
  return { rank: "C", label: "時空の迷子", emoji: "🌀" };
}

export function buildChallengeShareText(
  challenge: DailyChallenge,
  landedYear: number,
  diff: number
): string {
  const rank = rankForDiff(diff);
  const diffText = diff === 0 ? "ピタリ着地" : `${diff}年ズレ`;
  return `【秒で日本史・狙い撃ち】お題「${challenge.targetYear}年 ${challenge.entry.title}」→ ${landedYear}年に着地（${diffText}・${rank.rank}）${rank.emoji}`;
}
