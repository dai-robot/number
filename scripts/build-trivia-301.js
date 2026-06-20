const fs = require("fs");
const path = require("path");

const curated = require("./data/facts-curated");
const range1931 = require("./data/range-19-31");
const slotsExtra = require("./data/slots-extra");
const curatedFixes = require("./data/slots-curated-fixes");

const TARGET = 301;
const MAX_SECONDS = 30;
const RARITY_ORDER = { SSR: 4, SR: 3, R: 2, N: 1 };

function slotValue(i) {
  return Math.round(i) / 10;
}

function normalizeValue(v) {
  return Math.round(v * 10) / 10;
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
    if (v < 0 || v > MAX_SECONDS) continue;
    if (!byValue.has(v)) byValue.set(v, fact);
  }
  return byValue;
}

function normalizeFact(fact) {
  let category = fact.category;
  if (category === "sports") category = "science";
  if (category === "local") category = "culture";
  const { _priority, ...rest } = fact;
  return { ...rest, category };
}

function main() {
  const extraFacts = [...slotsExtra, ...curatedFixes].map((f) => ({ ...f, _priority: 0 }));
  const curatedFacts = curated
    .filter((f) => f.value >= 0 && f.value <= MAX_SECONDS)
    .map((f) => ({ ...f, _priority: 1 }));
  const rangeFacts = range1931
    .filter((f) => f.value >= 0 && f.value <= MAX_SECONDS)
    .map((f) => ({ ...f, _priority: 2 }));

  const byValue = assignFacts([...extraFacts, ...curatedFacts, ...rangeFacts]);

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
    output.push(normalizeFact(fact));
  }

  const outPath = path.join(__dirname, "../src/data/trivia.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`Written ${output.length} trivia entries (0.0–${MAX_SECONDS}.0, 0.1 step)`);
  console.log(`  slots-extra: ${slotsExtra.length}, curated: ${curatedFacts.length}, range19-31: ${rangeFacts.length}`);
}

main();
