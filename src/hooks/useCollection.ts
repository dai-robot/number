"use client";

import type { Trivia, TriviaCategory, TriviaRarity } from "@/types/trivia";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "byou-trivia-collection";

export interface CollectionEntry {
  value: number;
  title: string;
  rarity: TriviaRarity;
  category: TriviaCategory;
  discoveredAt: number;
}

export function useCollection(totalSlots: number) {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CollectionEntry[];
        setEntries(
          parsed.map((e) => ({
            ...e,
            category: e.category ?? "culture",
          }))
        );
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const discover = useCallback((trivia: Trivia) => {
    setEntries((prev) => {
      if (prev.some((e) => e.value === trivia.value)) return prev;
      const next = [
        ...prev,
        {
          value: trivia.value,
          title: trivia.title,
          rarity: trivia.rarity,
          category: trivia.category,
          discoveredAt: Date.now(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const discoveredSet = new Set(entries.map((e) => e.value));
  const ssrCount = entries.filter((e) => e.rarity === "SSR").length;
  const percent = totalSlots > 0 ? Math.round((entries.length / totalSlots) * 100) : 0;

  return {
    entries,
    loaded,
    discover,
    discoveredSet,
    ssrCount,
    percent,
    count: entries.length,
  };
}
