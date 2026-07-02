import { getEraRange } from "./eraRanges";
import { importantEvents } from "./importantEvents";
import type { ImportantHistoryEvent, JapanHistoryEntry } from "./types";

const FIRST_YEAR = 1;
const LAST_YEAR = 2026;
const NEAR_YEAR_LIMIT = 30;
const selectableEvents = importantEvents.filter((event) => event.category !== "時代背景");
const nearAnchorEvents = selectableEvents.filter((event) => event.importance >= 5);

function formatYear(year: number): string {
  return `${year}年`;
}

function secondsForYear(year: number): string {
  return (year / 100).toFixed(2);
}

function fillYear(template: string, year: number): string {
  return template.replaceAll("{year}", String(year));
}

function normalizeHook(year: number, hook: string): string {
  const normalized = hook.trim().replace(/\?$/, "。");
  if (normalized.includes(`${year}年`)) return normalized;
  return `${year}年、${normalized}`;
}

function titleForNear(event: ImportantHistoryEvent, year: number): string {
  if (event.year > year) return `${event.title}の少し前`;
  return `${event.title}から少し後`;
}

function summaryForNear(event: ImportantHistoryEvent, year: number): string {
  const direction = event.year > year ? "近づいていた" : "余韻が残る時期だった";
  return `${event.year}年の「${event.title}」に近い時期で、${event.era}の日本は大きな変化に${direction}。`;
}

function shareTextForEntry(year: number, hook: string): string {
  const cleanedHook = hook.replace(`${year}年、`, "").replace(`${year}年`, "").trim();
  return `${year}年に飛んだ。${cleanedHook || "日本史の時間に触れた。"}`;
}

function findNearestImportantEvent(year: number): ImportantHistoryEvent | null {
  let nearest: ImportantHistoryEvent | null = null;
  let nearestDiff = Number.POSITIVE_INFINITY;

  for (const event of nearAnchorEvents) {
    const diff = Math.abs(event.year - year);
    if (
      diff < nearestDiff ||
      (diff === nearestDiff && nearest && event.importance > nearest.importance) ||
      (diff === nearestDiff && nearest && event.importance === nearest.importance && event.year < nearest.year)
    ) {
      nearest = event;
      nearestDiff = diff;
    }
  }

  return nearest;
}

function createExactEntry(year: number, event: ImportantHistoryEvent): JapanHistoryEntry {
  const hook = normalizeHook(year, event.hook);
  return {
    year,
    displayYear: formatYear(year),
    title: event.title,
    summary: event.summary,
    hook,
    era: event.era,
    category: event.category,
    coverageType: "exact",
    eventYear: year,
    yearDiff: 0,
    importance: event.importance,
    note: event.note,
    sourceLabel: event.sourceLabel,
    shareText: shareTextForEntry(year, hook)
  };
}

function createNearEntry(year: number, event: ImportantHistoryEvent): JapanHistoryEntry {
  const yearDiff = Math.abs(event.year - year);
  return {
    year,
    displayYear: formatYear(year),
    title: titleForNear(event, year),
    summary: summaryForNear(event, year),
    hook:
      event.year > year
        ? `${year}年、${event.title}へ向かう時代に立っている。`
        : `${year}年、${event.title}の後の空気が残っている。`,
    era: getEraRange(year).era,
    category: event.category,
    coverageType: "near",
    eventYear: event.year,
    yearDiff,
    importance: event.importance >= 5 && yearDiff <= 1 ? 4 : 3,
    note: `${year}年そのものの出来事ではなく、${event.year}年の重要出来事に近い年として表示。${event.note ?? ""}`.trim(),
    sourceLabel: event.sourceLabel,
    shareText: `${year}年に飛んだ。${event.title}に近い時代だった。`
  };
}

function createEraEntry(year: number): JapanHistoryEntry {
  const era = getEraRange(year);
  const summary = era.templates[year % era.templates.length];
  const hook = fillYear(era.hooks[year % era.hooks.length], year);

  return {
    year,
    displayYear: formatYear(year),
    title: era.title,
    summary,
    hook,
    era: era.era,
    category: "時代背景",
    coverageType: "era",
    eventYear: null,
    yearDiff: null,
    importance: year >= 1900 ? 2 : 1,
    note: "年単位で確実な出来事を断定せず、時代背景として表示。",
    sourceLabel: era.sourceLabel,
    shareText: `${year}年に飛んだ。${era.era}の日本に触れた。`
  };
}

export function generateJapanHistoryFull(): JapanHistoryEntry[] {
  const eventByYear = new Map<number, ImportantHistoryEvent>();

  for (const event of selectableEvents) {
    if (event.year < FIRST_YEAR || event.year > LAST_YEAR) continue;
    const current = eventByYear.get(event.year);
    if (!current || event.importance > current.importance) {
      eventByYear.set(event.year, event);
    }
  }

  return Array.from({ length: LAST_YEAR }, (_, index) => {
    const year = index + 1;
    const exactEvent = eventByYear.get(year);
    if (exactEvent) return createExactEntry(year, exactEvent);

    const nearest = findNearestImportantEvent(year);
    if (nearest && Math.abs(nearest.year - year) <= NEAR_YEAR_LIMIT) {
      return createNearEntry(year, nearest);
    }

    return createEraEntry(year);
  });
}

export function buildHistoryShareText(stoppedSeconds: number, entry: JapanHistoryEntry): string {
  return `${stoppedSeconds.toFixed(2)}秒で止めたら${entry.year}年。${entry.shareText}`;
}

export function buildHistoryImageTitle(stoppedSeconds: number, entry: JapanHistoryEntry): string {
  return `${secondsForYear(entry.year)}秒の年: ${stoppedSeconds.toFixed(2)}秒で${entry.displayYear}`;
}
