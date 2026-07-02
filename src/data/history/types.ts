export type HistoryCategory =
  | "政治"
  | "戦争"
  | "外交"
  | "文化"
  | "宗教"
  | "経済"
  | "社会"
  | "災害"
  | "技術"
  | "人物"
  | "時代背景";

export type CoverageType = "exact" | "near" | "era";

export type JapanHistoryEntry = {
  year: number;
  displayYear: string;
  title: string;
  summary: string;
  hook: string;
  era: string;
  category: HistoryCategory;
  coverageType: CoverageType;
  eventYear: number | null;
  yearDiff: number | null;
  importance: 1 | 2 | 3 | 4 | 5;
  note?: string;
  sourceLabel: string;
  shareText: string;
};

export type ImportantHistoryEvent = {
  year: number;
  title: string;
  summary: string;
  hook: string;
  era: string;
  category: Exclude<HistoryCategory, "時代背景"> | "時代背景";
  importance: 1 | 2 | 3 | 4 | 5;
  note?: string;
  sourceLabel: string;
};
