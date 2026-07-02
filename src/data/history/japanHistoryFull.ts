import { generateJapanHistoryFull } from "./generateJapanHistoryFull";

export const japanHistoryByYear = generateJapanHistoryFull();

export function getJapanHistoryEntry(year: number) {
  return japanHistoryByYear[year - 1] ?? japanHistoryByYear[0];
}

export type { JapanHistoryEntry } from "./types";
