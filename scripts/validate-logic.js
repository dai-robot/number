/**
 * 30秒利用範囲のロジック検証（npm run validate-logic）
 */
const raw = require("../src/data/trivia.json");

const MAX_SECONDS = 30;
const NEAR_TOLERANCE = 0.03;
const RARITY_ORDER = { SSR: 4, SR: 3, R: 2, N: 1 };

function clampSeconds(seconds) {
  const rounded = Math.round(seconds * 100) / 100;
  return Math.min(Math.max(rounded, 0), MAX_SECONDS);
}

function loadTrivia() {
  return raw
    .filter((t) => t.value >= 0 && t.value <= MAX_SECONDS)
    .sort((a, b) => a.value - b.value);
}

function findNearest(stoppedAt, list) {
  let nearest = list[0];
  let minDiff = Math.abs(stoppedAt - nearest.value);
  for (const t of list) {
    const diff = Math.abs(stoppedAt - t.value);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = t;
    } else if (diff === minDiff && RARITY_ORDER[t.rarity] > RARITY_ORDER[nearest.rarity]) {
      nearest = t;
    }
  }
  return nearest;
}

function findTrivia(stoppedSeconds, triviaList) {
  const stoppedAt = clampSeconds(stoppedSeconds);
  const scope = triviaList.filter((t) => t.value >= 0 && t.value <= MAX_SECONDS);
  const nearest = findNearest(stoppedAt, scope);

  const exact = scope.find((t) => t.value === stoppedAt);
  if (exact) {
    return { stoppedAt, matchType: "exact", trivia: exact, nearest, diff: 0 };
  }

  const nearCandidates = scope
    .map((t) => ({ trivia: t, diff: Math.abs(stoppedAt - t.value) }))
    .filter((c) => c.diff <= NEAR_TOLERANCE && c.diff > 0)
    .sort((a, b) => {
      if (a.diff !== b.diff) return a.diff - b.diff;
      return RARITY_ORDER[b.trivia.rarity] - RARITY_ORDER[a.trivia.rarity];
    });

  if (nearCandidates.length > 0) {
    const best = nearCandidates[0];
    return { stoppedAt, matchType: "near", trivia: best.trivia, nearest, diff: best.diff };
  }

  return {
    stoppedAt,
    matchType: "miss",
    trivia: null,
    nearest,
    diff: Math.abs(stoppedAt - nearest.value),
  };
}

const list = loadTrivia();
const errors = [];

// 1. 301スロット完備
if (list.length !== 301) {
  errors.push(`件数: ${list.length}（期待 301）`);
}
const vals = new Set(list.map((t) => t.value));
for (let i = 0; i <= 300; i++) {
  const v = i / 10;
  if (!vals.has(v)) errors.push(`欠損スロット: ${v}`);
}

// 2. 全スロットで exact 一致
for (const t of list) {
  const r = findTrivia(t.value, list);
  if (r.matchType !== "exact" || r.trivia?.value !== t.value) {
    errors.push(`exact失敗: value=${t.value} → ${r.matchType} ${r.trivia?.title}`);
  }
}

// 3. 範囲外クランプ
const over = findTrivia(45.5, list);
if (over.stoppedAt !== 30 || over.matchType !== "exact" || over.trivia?.value !== 30) {
  errors.push(`30秒超クランプ失敗: 45.5 → stoppedAt=${over.stoppedAt} match=${over.matchType} trivia=${over.trivia?.value}`);
}

// 4. nearest は常に 0〜30 内
for (let i = 0; i <= 3000; i++) {
  const sec = i / 100;
  const r = findTrivia(sec, list);
  if (r.nearest.value > MAX_SECONDS || r.nearest.value < 0) {
    errors.push(`nearest範囲外: input=${sec} → nearest=${r.nearest.value}`);
    break;
  }
  if (r.trivia && (r.trivia.value > MAX_SECONDS || r.trivia.value < 0)) {
    errors.push(`trivia範囲外: input=${sec} → trivia=${r.trivia.value}`);
    break;
  }
}

// 5. 22.5 はアシモフではない
const r225 = findTrivia(22.5, list);
if (r225.trivia?.title?.includes("アシモフ") || r225.trivia?.title?.includes("1935")) {
  errors.push(`22.5秒が年号トリビア: ${r225.trivia?.title}`);
}

// 6. 0〜30 に年号エンコーディング（1900年代が19〜28台に紛れ込み）がないか
const yearLeak = list.filter(
  (t) => t.title.match(/^(19|20)\d{2}年/) && t.value <= MAX_SECONDS
);
if (yearLeak.length > 0) {
  errors.push(
    `0〜30秒帯に年号トリビア ${yearLeak.length} 件: ${yearLeak.slice(0, 3).map((t) => `${t.value}=${t.title}`).join(", ")}`
  );
}

// 7. 近似境界（9.58 → 9.6）
const bolt = findTrivia(9.58, list);
if (bolt.matchType !== "near" || Math.abs(bolt.trivia?.value - 9.6) > 0.001) {
  errors.push(`9.58秒近似失敗: ${bolt.matchType} → ${bolt.trivia?.value} ${bolt.trivia?.title}`);
}

// 8. 二重計測シミュレーション（elapsed リセット相当）
const first = findTrivia(12.34, list);
const second = findTrivia(5.67, list);
if (first.stoppedAt !== 12.34 || second.stoppedAt !== 5.67) {
  errors.push(`独立計測の丸め失敗: ${first.stoppedAt}, ${second.stoppedAt}`);
}

if (errors.length === 0) {
  console.log("OK: 30秒範囲のロジック検証すべてパス");
  console.log(`  トリビア: ${list.length} 件（0.0〜${MAX_SECONDS}.0）`);
  console.log(`  22.5秒 → ${r225.trivia?.title}`);
  console.log(`  9.58秒 → ${bolt.matchType} ${bolt.trivia?.title}`);
  console.log(`  45.5秒 → clamp ${over.stoppedAt} ${over.trivia?.title}`);
} else {
  console.error(`NG: ${errors.length} 件`);
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}
