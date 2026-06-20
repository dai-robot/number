export type TriviaCategory =
  | "math"
  | "anniversary"
  | "history"
  | "science"
  | "lucky"
  | "culture";

export type TriviaSourceType =
  | "anniversary"
  | "math"
  | "history"
  | "science"
  | "lucky"
  | "culture"
  | "local"
  | "sports";

export type TriviaRarity = "SSR" | "SR" | "R" | "N";

export interface Trivia {
  value: number;
  title: string;
  description: string;
  category: TriviaCategory;
  rarity: TriviaRarity;
  sourceType: TriviaSourceType;
  /** 近似一致時に「ほぼ〇〇！」と表示する短い名前 */
  shortTitle?: string;
}

export type TriviaMatchType = "exact" | "near" | "miss";

export interface TriviaResult {
  stoppedAt: number;
  matchType: TriviaMatchType;
  trivia: Trivia | null;
  nearest: Trivia;
  diff: number;
  nearTarget: Trivia | null;
}

export const CATEGORY_LABELS: Record<TriviaCategory, string> = {
  math: "数学",
  anniversary: "記念日",
  history: "歴史",
  science: "科学",
  lucky: "ラッキー",
  culture: "文化",
};

export const SOURCE_TYPE_LABELS: Record<TriviaSourceType, string> = {
  anniversary: "記念日",
  math: "数学",
  history: "歴史",
  science: "科学",
  lucky: "ラッキー",
  culture: "文化",
  local: "地域",
  sports: "スポーツ",
};

export const RARITY_ORDER: Record<TriviaRarity, number> = {
  SSR: 4,
  SR: 3,
  R: 2,
  N: 1,
};

/** 近似表示用の短い名前を取得 */
export function getShortTitle(trivia: Trivia): string {
  return trivia.shortTitle ?? trivia.title;
}
