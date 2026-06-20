import { MAX_SECONDS } from "@/lib/findTrivia";

export const MAX_ATTEMPTS = 3;
const EPOCH = Date.UTC(2026, 0, 1); // Daily #1 = 2026-01-01 (UTC)
const DAY_MS = 24 * 60 * 60 * 1000;

/** 文字列 → 32bit ハッシュ（FNV-1a 風） */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 シード付き乱数 */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UTC 日付文字列（YYYY-MM-DD） */
export function getDateKey(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Daily 番号（連番） */
export function getDayNumber(d: Date = new Date()): number {
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - EPOCH) / DAY_MS) + 1;
}

/** その日の目標秒数（全員共通・小数点2桁） */
export function getDailyTarget(d: Date = new Date()): number {
  const rng = mulberry32(hashSeed(getDateKey(d)));
  // 0.50 〜 (MAX-0.50) の範囲で 0.01 刻み
  const min = 0.5;
  const max = MAX_SECONDS - 0.5;
  const raw = min + rng() * (max - min);
  return Math.round(raw * 100) / 100;
}

export type DailyRank = "S" | "A" | "B" | "C" | "D";

export interface DailyScore {
  rank: DailyRank;
  score: number;
  praiseKey: "perfect" | "great" | "good" | "miss";
}

/** 誤差からスコア・ランクを算出 */
export function scoreFromDiff(diff: number): DailyScore {
  const score = Math.max(0, Math.round(1000 * Math.max(0, 1 - diff / 1.5)));
  if (diff <= 0.001) return { rank: "S", score: 1000, praiseKey: "perfect" };
  if (diff <= 0.03) return { rank: "A", score, praiseKey: "great" };
  if (diff <= 0.1) return { rank: "B", score, praiseKey: "good" };
  if (diff <= 0.3) return { rank: "C", score, praiseKey: "good" };
  return { rank: "D", score, praiseKey: "miss" };
}

/** 誤差をネタバレなしの絵文字バーに変換 */
export function diffToEmoji(diff: number): string {
  // 5マス。誤差が小さいほど緑が多い
  const tiers = [0.0, 0.03, 0.1, 0.3, 1.0];
  let greens = 0;
  for (const tier of tiers) {
    if (diff <= tier) greens++;
  }
  const green = "\uD83D\uDFE9"; // 🟩
  const yellow = "\uD83D\uDFE8"; // 🟨
  const white = "\u2B1C"; // ⬜
  let bar = "";
  for (let i = 0; i < 5; i++) {
    if (i < greens) bar += green;
    else if (i === greens) bar += yellow;
    else bar += white;
  }
  return bar;
}
