import type { Trivia, TriviaResult } from "@/types/trivia";
import { RARITY_ORDER } from "@/types/trivia";

/** 利用上限（秒） */
export const MAX_SECONDS = 30;

/** 近似一致の許容誤差（秒） */
export const NEAR_TOLERANCE = 0.03;

/** STOP時の秒数を小数点2桁に丸め、上限でクランプ */
export function clampSeconds(seconds: number): number {
  const rounded = Math.round(seconds * 100) / 100;
  return Math.min(Math.max(rounded, 0), MAX_SECONDS);
}

/** 表示用フォーマット（小数点2桁固定） */
export function formatSeconds(seconds: number): string {
  return seconds.toFixed(2);
}

/**
 * trivia 配列から一致を判定する。
 * - exact: value 完全一致
 * - near: ±NEAR_TOLERANCE 以内 → 「ほぼ〇〇！」
 * - miss: それ以外 → 最接近トリビアを「あとX秒で〇〇だった！」
 */
export function findTrivia(stoppedSeconds: number, triviaList: Trivia[]): TriviaResult {
  const stoppedAt = clampSeconds(stoppedSeconds);
  const scope = triviaList.filter((t) => t.value >= 0 && t.value <= MAX_SECONDS);
  const nearest = findNearest(stoppedAt, scope);

  const exact = scope.find((t) => t.value === stoppedAt);
  if (exact) {
    return {
      stoppedAt,
      matchType: "exact",
      trivia: exact,
      nearest,
      diff: 0,
      nearTarget: null,
    };
  }

  const nearCandidates = scope
    .map((t) => ({ trivia: t, diff: Math.abs(stoppedAt - t.value) }))
    .filter((c) => c.diff <= NEAR_TOLERANCE && c.diff > 0)
    .sort((a, b) => {
      if (a.diff !== b.diff) return a.diff - b.diff;
      return RARITY_ORDER[b.trivia.rarity] - RARITY_ORDER[a.trivia.rarity];
    });

  if (nearCandidates.length > 0) {
    const best = nearCandidates[0];
    return {
      stoppedAt,
      matchType: "near",
      trivia: best.trivia,
      nearest,
      diff: best.diff,
      nearTarget: best.trivia,
    };
  }

  return {
    stoppedAt,
    matchType: "miss",
    trivia: null,
    nearest,
    diff: Math.abs(stoppedAt - nearest.value),
    nearTarget: null,
  };
}

function findNearest(stoppedAt: number, triviaList: Trivia[]): Trivia {
  if (triviaList.length === 0) {
    throw new Error("findNearest: triviaList is empty");
  }
  let nearest = triviaList[0];
  let minDiff = Math.abs(stoppedAt - nearest.value);

  for (const t of triviaList) {
    const diff = Math.abs(stoppedAt - t.value);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = t;
    } else if (diff === minDiff && RARITY_ORDER[t.rarity] > RARITY_ORDER[nearest.rarity]) {
      nearest = t;
    }
  }

  return nearest;
}

/** データ拡張時に value 昇順ソートを保証する */
export function sortTriviaByValue(triviaList: Trivia[]): Trivia[] {
  return [...triviaList].sort((a, b) => a.value - b.value);
}
