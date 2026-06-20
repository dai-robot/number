/**
 * v2 品質基準で trivia.json を検証（npm run validate-facts）
 */
const raw = require("../src/data/trivia.json");

const MAX_SECONDS = 30;
const TARGET = 301;
const CATEGORIES = new Set(["math", "anniversary", "history", "science", "lucky", "culture"]);
const SOURCE_TYPES = new Set([
  "anniversary",
  "math",
  "history",
  "science",
  "lucky",
  "culture",
  "local",
  "sports",
]);
const RARITIES = new Set(["SSR", "SR", "R", "N"]);

const BANNED_PATTERNS = [
  { id: "F01", re: /数学的に意味のある秒数/ },
  { id: "F03", re: /^\d+(\.\d+)?秒のレコード$/ },
  { id: "F06", re: /ボルトペース|のペースで\d/ },
  { id: "F06b", re: /秒で走る距離/ },
  { id: "F07", re: /近辺/ },
  { id: "F07b", re: /の10分の一|の千分の一|の百分の一スケール/ },
  { id: "F09", re: /ISO3166|ISOコード\d+/ },
];

function slotValue(i) {
  return Math.round(i) / 10;
}

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`WARN: ${msg}`);
  warnings++;
}

if (raw.length !== TARGET) {
  fail(`expected ${TARGET} entries, got ${raw.length}`);
}

const seen = new Set();
for (const t of raw) {
  const v = Math.round(t.value * 10) / 10;

  if (seen.has(v)) fail(`duplicate slot ${v}`);
  seen.add(v);

  if (v < 0 || v > MAX_SECONDS) fail(`value ${v} out of range 0–${MAX_SECONDS}`);
  if (!t.title?.trim()) fail(`slot ${v}: empty title`);
  if (!t.description?.trim()) fail(`slot ${v}: empty description`);
  if (!CATEGORIES.has(t.category)) fail(`slot ${v}: invalid category ${t.category}`);
  if (!SOURCE_TYPES.has(t.sourceType)) fail(`slot ${v}: invalid sourceType ${t.sourceType}`);
  if (!RARITIES.has(t.rarity)) fail(`slot ${v}: invalid rarity ${t.rarity}`);

  const text = `${t.title} ${t.description}`;
  for (const { id, re } of BANNED_PATTERNS) {
    if (re.test(text)) fail(`slot ${v}: banned pattern ${id} — ${t.title}`);
  }
}

for (let i = 0; i < TARGET; i++) {
  const v = slotValue(i);
  if (!seen.has(v)) fail(`missing slot ${v}`);
}

const rarityCount = { SSR: 0, SR: 0, R: 0, N: 0 };
for (const t of raw) rarityCount[t.rarity]++;

console.log(`Validated ${raw.length} facts (0.0–${MAX_SECONDS}.0)`);
console.log(`  Rarity: SSR ${rarityCount.SSR}, SR ${rarityCount.SR}, R ${rarityCount.R}, N ${rarityCount.N}`);
console.log(`  Errors: ${errors}, Warnings: ${warnings}`);

if (errors > 0) process.exit(1);
console.log("OK: all fact checks passed");
