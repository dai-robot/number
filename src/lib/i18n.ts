"use client";

import { useCallback, useEffect, useState } from "react";

export type Lang = "ja" | "en";

const STORAGE_KEY = "byou-trivia-lang";

type Dict = Record<string, string>;

const JA: Dict = {
  brand: "Second Trivia",
  title: "秒トリビア",
  subtitle: "0〜{max}秒の間で止めて、トリビアを探そう",
  facts: "{n} 件",
  modeFree: "フリー",
  modeDaily: "デイリー",
  start: "START",
  stop: "STOP",
  reset: "RESET",
  measuring: "計測中",
  seconds: "秒数",
  sec: "sec",
  kbdHint: "{space} で START/STOP ・ {r} で RESET",
  collection: "図鑑",
  discovered: "{count}/{total} 発見 ・ SSR {ssr} ・ {percent}% コンプリート",
  collectionTitle: "発見図鑑",
  close: "閉じる",
  grid: "グリッド",
  list: "リスト",
  all: "すべて",
  notFoundYet: "まだ発見していません。秒数を止めて探そう！",
  categoryEmpty: "このカテゴリはまだ未発見です",
  exactMatch: "ぴったり一致！",
  nearMatch: "近似一致",
  undiscovered: "未発見",
  nearMiss: "NEAR MISS",
  almost: "ほぼ{name}！",
  andMore: "あと {diff} 秒で{name}だった！",
  noNearby: "±{tol} 秒以内のトリビアは見つかりませんでした",
  target: "目標 {value} 秒",
  newDiscovery: "NEW 発見！",
  // daily
  dailyTitle: "デイリーチャレンジ",
  dailyTarget: "今日のお題",
  dailyDesc: "{target} 秒ぴったりで止めよう",
  attemptsLeft: "残り {n} 回",
  attemptN: "{n} 回目",
  diffFromTarget: "誤差 {diff} 秒",
  perfect: "PERFECT!!",
  great: "すばらしい！",
  good: "ナイス！",
  miss: "おしい！",
  dailyDone: "本日のチャレンジ達成！",
  bestToday: "本日ベスト",
  streak: "連続 {n} 日",
  share: "結果をシェア",
  copied: "コピーしました！",
  comeTomorrow: "また明日チャレンジしてね",
  rank: "ランク",
  score: "スコア",
};

const EN: Dict = {
  brand: "Second Trivia",
  title: "Second Trivia",
  subtitle: "Stop between 0–{max}s and discover trivia",
  facts: "{n} facts",
  modeFree: "Free",
  modeDaily: "Daily",
  start: "START",
  stop: "STOP",
  reset: "RESET",
  measuring: "RUNNING",
  seconds: "TIME",
  sec: "sec",
  kbdHint: "{space} START/STOP ・ {r} RESET",
  collection: "Dex",
  discovered: "{count}/{total} found ・ SSR {ssr} ・ {percent}% complete",
  collectionTitle: "Discovery Dex",
  close: "Close",
  grid: "Grid",
  list: "List",
  all: "All",
  notFoundYet: "Nothing found yet. Stop the timer to discover!",
  categoryEmpty: "Nothing found in this category yet",
  exactMatch: "Perfect match!",
  nearMatch: "Near match",
  undiscovered: "Undiscovered",
  nearMiss: "NEAR MISS",
  almost: "Almost {name}!",
  andMore: "{diff}s away from {name}!",
  noNearby: "No trivia within ±{tol}s",
  target: "Target {value}s",
  newDiscovery: "NEW Discovery!",
  // daily
  dailyTitle: "Daily Challenge",
  dailyTarget: "Today's Target",
  dailyDesc: "Stop exactly at {target}s",
  attemptsLeft: "{n} left",
  attemptN: "Try {n}",
  diffFromTarget: "off by {diff}s",
  perfect: "PERFECT!!",
  great: "Great!",
  good: "Nice!",
  miss: "So close!",
  dailyDone: "Today's challenge done!",
  bestToday: "Best today",
  streak: "{n} day streak",
  share: "Share result",
  copied: "Copied!",
  comeTomorrow: "Come back tomorrow",
  rank: "Rank",
  score: "Score",
};

const DICTS: Record<Lang, Dict> = { ja: JA, en: EN };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let str = DICTS[lang][key] ?? DICTS.ja[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "ja";
  return navigator.language?.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("ja");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    setLangState(stored ?? detectLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "ja" ? "en" : "ja";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  return { lang, setLang, toggleLang, t };
}
