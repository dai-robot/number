"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { safeGetStorage, safeSetStorage } from "@/lib/storage";

const DISCOVERED_KEY = "seconds-story.v1.discovered";
const PLAY_COUNT_KEY = "seconds-story.v1.playCount";
const LAST_RESULT_KEY = "seconds-story.v1.lastResult";
const TOTAL_STORIES = 30;

function normalizeSeconds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is number => Number.isInteger(v) && v >= 1 && v <= 30))].sort(
    (a, b) => a - b
  );
}

export function useStoryCollection() {
  const [readSeconds, setReadSeconds] = useState<number[]>([]);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setReadSeconds(normalizeSeconds(safeGetStorage<unknown>(DISCOVERED_KEY, [])));
    setPlayCount(safeGetStorage<number>(PLAY_COUNT_KEY, 0));
  }, []);

  const readSet = useMemo(() => new Set(readSeconds), [readSeconds]);

  const markRead = useCallback((second: number) => {
    setReadSeconds((prev) => {
      if (prev.includes(second)) return prev;
      const next = normalizeSeconds([...prev, second]);
      safeSetStorage(DISCOVERED_KEY, next);
      return next;
    });
  }, []);

  const recordResult = useCallback(
    (result: { stoppedSeconds: number; storySecond: number; isNew: boolean }) => {
      setPlayCount((prev) => {
        const next = prev + 1;
        safeSetStorage(PLAY_COUNT_KEY, next);
        return next;
      });
      safeSetStorage(LAST_RESULT_KEY, result);
    },
    []
  );

  const count = readSeconds.length;
  const percent = Math.round((count / TOTAL_STORIES) * 100);

  return {
    readSeconds,
    readSet,
    markRead,
    recordResult,
    count,
    total: TOTAL_STORIES,
    percent,
    playCount,
  };
}
