const fs = require("fs");
const path = require("path");

const file = fs.readFileSync(path.join(__dirname, "../src/data/stories.ts"), "utf8");
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function getStorySecond(stoppedSeconds) {
  return Math.min(30, Math.max(1, Math.round(stoppedSeconds)));
}

const roundingCases = [
  [0.32, 1],
  [1.49, 1],
  [1.5, 2],
  [7.42, 7],
  [7.51, 8],
  [30, 30],
  [31, 30],
];

for (const [input, expected] of roundingCases) {
  assert(getStorySecond(input) === expected, `storySecond ${input} should be ${expected}`);
}

const seconds = [...file.matchAll(/second:\s*(\d+)/g)].map((m) => Number(m[1]));
assert(seconds.length === 30, `expected 30 stories, got ${seconds.length}`);
assert(new Set(seconds).size === 30, "seconds must be unique");
for (let i = 1; i <= 30; i++) {
  assert(seconds.includes(i), `missing ${i} second story`);
}

const blocks = file.split(/\n\s*\},\n\s*\{/);
for (let i = 1; i <= 30; i++) {
  const block = blocks.find((b) => new RegExp(`second:\\s*${i}\\b`).test(b));
  assert(block, `missing block for ${i}`);
  if (!block) continue;
  assert(/category:\s*"[^"]+"/.test(block), `${i}: category is required`);
  assert(/tone:\s*"[^"]+"/.test(block), `${i}: tone is required`);
  assert(/shareText:\s*"[^"]+"/.test(block), `${i}: shareText is required`);
  const storyMatch = block.match(/story:\s*\[([\s\S]*?)\]/);
  assert(storyMatch, `${i}: story array is required`);
  if (storyMatch) {
    const lines = [...storyMatch[1].matchAll(/"([^"]*)"/g)];
    assert(lines.length >= 1 && lines.length <= 4, `${i}: story must be 1-4 lines`);
  }
}

function safeGetStorage(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
safeSetStorage(storage, "x", [1, 2, 3]);
assert(JSON.stringify(safeGetStorage(storage, "x", [])) === JSON.stringify([1, 2, 3]), "storage read/write failed");
const brokenStorage = {
  getItem: () => {
    throw new Error("unavailable");
  },
  setItem: () => {
    throw new Error("unavailable");
  },
};
assert(safeGetStorage(brokenStorage, "x", 42) === 42, "broken storage fallback failed");
safeSetStorage(brokenStorage, "x", 1);

if (errors.length > 0) {
  console.error(`NG: ${errors.length} story validation errors`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log("OK: story mapping, story data, and storage checks passed");
