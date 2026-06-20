const fs = require("fs");
const path = require("path");

const yearEvents = require("./data/year-events");
const curated = require("./data/facts-curated");
const pool = require("./data/facts-pool");
const elements = require("./data/elements");
const range1931 = require("./data/range-19-31");
const slotFill = require("./data/slot-fill");

const TARGET = 1000;
const RARITY_ORDER = { SSR: 4, SR: 3, R: 2, N: 1 };

function slotValue(i) {
  return Math.round(i) / 10;
}

function normalizeValue(v) {
  return Math.round(v * 10) / 10;
}

function yearToValue(year) {
  // 年号はストップウォッチ秒数と被らないよう 80台・90台に配置
  // 1900→90.0 … 1999→99.9 / 2000→80.0 … 2025→82.5
  if (year >= 1900 && year <= 1999) return normalizeValue(90 + (year - 1900) / 10);
  if (year >= 2000 && year <= 2025) return normalizeValue(80 + (year - 2000) / 10);
  return null;
}

function buildYearFacts() {
  const facts = [];
  for (const [yearStr, data] of Object.entries(yearEvents)) {
    const year = parseInt(yearStr, 10);
    const value = yearToValue(year);
    if (value === null) continue;
    facts.push({
      value,
      title: data.title,
      description: data.description,
      category: "history",
      rarity: data.rarity,
      sourceType: "history",
      shortTitle: `${year}年`,
      _priority: 0,
    });
  }
  return facts;
}

function buildElementFacts() {
  return elements.map((el) => ({
    value: el.z,
    title: `${el.ja}（${el.sym}）`,
    description: `${el.ja}の原子番号は${el.z}。元素記号${el.sym}。`,
    category: "science",
    rarity: el.rarity,
    sourceType: "science",
    shortTitle: el.ja,
    _priority: 3,
  }));
}

function assignFacts(allFacts) {
  const byValue = new Map();

  const sorted = [...allFacts].sort((a, b) => {
    const pa = a._priority ?? 1;
    const pb = b._priority ?? 1;
    if (pa !== pb) return pa - pb;
    return (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0);
  });

  for (const fact of sorted) {
    const v = normalizeValue(fact.value);
    if (v < 0 || v > 99.9) continue;
    const existing = byValue.get(v);
    if (!existing) {
      byValue.set(v, fact);
    }
  }
  return byValue;
}

function main() {
  const rangeFacts = range1931.map((f) => ({ ...f, _priority: 1 }));
  const curatedFacts = curated.map((f) => ({ ...f, _priority: 1 }));
  const poolFacts = pool.map((f) => ({ ...f, _priority: 2 }));
  const yearFacts = buildYearFacts();
  const elementFacts = buildElementFacts();
  const fillFacts = slotFill.map((f) => ({ ...f, _priority: 4 }));

  const byValue = assignFacts([
    ...yearFacts,
    ...rangeFacts,
    ...curatedFacts,
    ...poolFacts,
    ...elementFacts,
    ...fillFacts,
  ]);

  const missing = [];
  for (let i = 0; i < TARGET; i++) {
    const v = slotValue(i);
    if (!byValue.has(v)) missing.push(v);
  }

  if (missing.length > 0) {
    console.error(`ERROR: ${missing.length} slots unfilled (no auto-fill allowed):`);
    console.error(missing.slice(0, 50).join(", ") + (missing.length > 50 ? "..." : ""));
    process.exit(1);
  }

  const output = [];
  for (let i = 0; i < TARGET; i++) {
    const v = slotValue(i);
    const fact = byValue.get(v);
    const { _priority, ...rest } = fact;
    output.push({ ...rest, value: v });
  }

  const outPath = path.join(__dirname, "../src/data/trivia.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`Written ${output.length} trivia entries (0.0–99.9, 0.1 step)`);
  console.log(`  range19-31: ${rangeFacts.length}, curated: ${curated.length}, pool: ${pool.length}, years: ${yearFacts.length}, elements: ${elementFacts.length}, slot-fill: ${slotFill.length}`);
}

main();
