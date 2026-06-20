"use client";

import {
  getDateKey,
  getDayNumber,
  MAX_ATTEMPTS,
  scoreFromDiff,
} from "@/lib/daily";
import { useCallback, useEffect, useState } from "react";

const STATE_KEY = "byou-trivia-daily";
const STREAK_KEY = "byou-trivia-streak";

interface DayState {
  dateKey: string;
  attempts: number[]; // 記録した誤差（小さいほど良い）
  bestDiff: number | null;
  bestScore: number;
  completed: boolean;
}

interface StreakState {
  current: number;
  lastDateKey: string | null;
  best: number;
}

function emptyDay(dateKey: string): DayState {
  return { dateKey, attempts: [], bestDiff: null, bestScore: 0, completed: false };
}

function loadDay(dateKey: string): DayState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DayState;
      if (parsed.dateKey === dateKey) return parsed;
    }
  } catch {
    /* ignore */
  }
  return emptyDay(dateKey);
}

function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw) as StreakState;
  } catch {
    /* ignore */
  }
  return { current: 0, lastDateKey: null, best: 0 };
}

function yesterdayKey(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useDaily() {
  const [dateKey, setDateKey] = useState("");
  const [dayNumber, setDayNumber] = useState(0);
  const [day, setDay] = useState<DayState | null>(null);
  const [streak, setStreak] = useState<StreakState>({ current: 0, lastDateKey: null, best: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const key = getDateKey();
    setDateKey(key);
    setDayNumber(getDayNumber());
    setDay(loadDay(key));
    setStreak(loadStreak());
    setLoaded(true);
  }, []);

  const recordAttempt = useCallback(
    (diff: number) => {
      if (!day || day.completed) return;
      const { score } = scoreFromDiff(diff);
      const attempts = [...day.attempts, diff];
      const bestDiff = day.bestDiff === null ? diff : Math.min(day.bestDiff, diff);
      const bestScore = Math.max(day.bestScore, score);
      const completed = attempts.length >= MAX_ATTEMPTS;

      const nextDay: DayState = {
        dateKey,
        attempts,
        bestDiff,
        bestScore,
        completed,
      };
      setDay(nextDay);
      localStorage.setItem(STATE_KEY, JSON.stringify(nextDay));

      if (completed) {
        setStreak((prev) => {
          if (prev.lastDateKey === dateKey) return prev;
          const continuing = prev.lastDateKey === yesterdayKey(dateKey);
          const current = continuing ? prev.current + 1 : 1;
          const next: StreakState = {
            current,
            lastDateKey: dateKey,
            best: Math.max(prev.best, current),
          };
          localStorage.setItem(STREAK_KEY, JSON.stringify(next));
          return next;
        });
      }
    },
    [day, dateKey]
  );

  return {
    loaded,
    dateKey,
    dayNumber,
    attempts: day?.attempts ?? [],
    attemptsLeft: MAX_ATTEMPTS - (day?.attempts.length ?? 0),
    bestDiff: day?.bestDiff ?? null,
    bestScore: day?.bestScore ?? 0,
    completed: day?.completed ?? false,
    streak: streak.current,
    bestStreak: streak.best,
    recordAttempt,
  };
}
