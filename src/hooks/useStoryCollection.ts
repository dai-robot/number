"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "second-story-read-seconds";
const TOTAL_STORIES = 30;

function normalizeSeconds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is number => Number.isInteger(v) && v >= 1 && v <= 30))].sort(
    (a, b) => a - b
  );
}

export function useStoryCollection() {
  const [readSeconds, setReadSeconds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setReadSeconds(normalizeSeconds(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  const readSet = useMemo(() => new Set(readSeconds), [readSeconds]);

  const markRead = useCallback((second: number) => {
    setReadSeconds((prev) => {
      if (prev.includes(second)) return prev;
      const next = normalizeSeconds([...prev, second]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const count = readSeconds.length;
  const percent = Math.round((count / TOTAL_STORIES) * 100);

  return {
    readSeconds,
    readSet,
    markRead,
    count,
    total: TOTAL_STORIES,
    percent,
  };
}
