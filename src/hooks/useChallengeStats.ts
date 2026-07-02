import { useCallback, useEffect, useState } from "react";
import { safeGetStorage, safeSetStorage } from "@/lib/storage";

const BEST_KEY = "history-timeslip.v1.challengeBest";
const TOTAL_YEARS_KEY = "history-timeslip.v1.totalYearsTraveled";

interface ChallengeBest {
  date: string;
  diff: number;
  landedYear: number;
  attempts: number;
}

export function useChallengeStats(todayKey: string) {
  const [best, setBest] = useState<ChallengeBest | null>(null);
  const [totalYearsTraveled, setTotalYearsTraveled] = useState(0);

  useEffect(() => {
    const stored = safeGetStorage<ChallengeBest | null>(BEST_KEY, null);
    setBest(stored && stored.date === todayKey ? stored : null);
    setTotalYearsTraveled(safeGetStorage<number>(TOTAL_YEARS_KEY, 0));
  }, [todayKey]);

  const recordChallenge = useCallback(
    (diff: number, landedYear: number) => {
      setBest((prev) => {
        const attempts = prev && prev.date === todayKey ? prev.attempts + 1 : 1;
        const isBetter = !prev || prev.date !== todayKey || diff < prev.diff;
        const next: ChallengeBest = isBetter
          ? { date: todayKey, diff, landedYear, attempts }
          : { ...prev, attempts };
        safeSetStorage(BEST_KEY, next);
        return next;
      });
    },
    [todayKey]
  );

  const addTraveledYears = useCallback((years: number) => {
    setTotalYearsTraveled((prev) => {
      const next = prev + years;
      safeSetStorage(TOTAL_YEARS_KEY, next);
      return next;
    });
  }, []);

  return { best, totalYearsTraveled, recordChallenge, addTraveledYears };
}
