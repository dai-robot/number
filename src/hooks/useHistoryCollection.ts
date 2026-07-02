import { useCallback, useEffect, useMemo, useState } from "react";
import { japanHistoryByYear } from "@/data/history/japanHistoryFull";
import { safeGetStorage, safeSetStorage } from "@/lib/storage";

const DISCOVERED_KEY = "history-timeslip.v1.discoveredYears";
const PLAY_COUNT_KEY = "history-timeslip.v1.playCount";
const LAST_RESULT_KEY = "history-timeslip.v1.lastResult";
const TOTAL_YEARS = 2026;

const importantYearSet = new Set(
  japanHistoryByYear.filter((entry) => entry.importance >= 4).map((entry) => entry.year)
);

function normalizeYears(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is number => Number.isInteger(v) && v >= 1 && v <= TOTAL_YEARS))].sort(
    (a, b) => a - b
  );
}

export function useHistoryCollection() {
  const [discoveredYears, setDiscoveredYears] = useState<number[]>([]);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setDiscoveredYears(normalizeYears(safeGetStorage<unknown>(DISCOVERED_KEY, [])));
    setPlayCount(safeGetStorage<number>(PLAY_COUNT_KEY, 0));
  }, []);

  const discoveredSet = useMemo(() => new Set(discoveredYears), [discoveredYears]);
  const importantDiscoveredCount = useMemo(
    () => discoveredYears.filter((year) => importantYearSet.has(year)).length,
    [discoveredYears]
  );

  const markDiscovered = useCallback((year: number) => {
    setDiscoveredYears((prev) => {
      if (prev.includes(year)) return prev;
      const next = normalizeYears([...prev, year]);
      safeSetStorage(DISCOVERED_KEY, next);
      return next;
    });
  }, []);

  const recordResult = useCallback(
    (result: { stoppedSeconds: number; year: number; coverageType: string; isNew: boolean }) => {
      setPlayCount((prev) => {
        const next = prev + 1;
        safeSetStorage(PLAY_COUNT_KEY, next);
        return next;
      });
      safeSetStorage(LAST_RESULT_KEY, result);
    },
    []
  );

  return {
    discoveredYears,
    discoveredSet,
    markDiscovered,
    recordResult,
    totalYears: TOTAL_YEARS,
    discoveredCount: discoveredYears.length,
    discoveredPercent: Math.round((discoveredYears.length / TOTAL_YEARS) * 100),
    importantDiscoveredCount,
    importantTotal: importantYearSet.size,
    playCount
  };
}
