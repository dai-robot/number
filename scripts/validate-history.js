const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const moduleCache = new Map();

function resolveModule(request, parentFile) {
  if (request.startsWith("@/")) {
    return path.join(root, "src", request.slice(2));
  }
  if (request.startsWith(".")) {
    return path.resolve(path.dirname(parentFile), request);
  }
  return request;
}

function loadTsModule(request, parentFile = path.join(root, "scripts", "validate-history.js")) {
  const resolved = resolveModule(request, parentFile);
  if (!resolved.startsWith(root)) return require(resolved);

  const filePath = fs.existsSync(resolved) ? resolved : `${resolved}.ts`;
  if (moduleCache.has(filePath)) return moduleCache.get(filePath).exports;

  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filePath,
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(filePath, module);
  const localRequire = (childRequest) => loadTsModule(childRequest, filePath);
  vm.runInNewContext(output, {
    require: localRequire,
    module,
    exports: module.exports,
    console,
    process,
    __dirname: path.dirname(filePath),
    __filename: filePath,
  });
  return module.exports;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const { japanHistoryByYear } = loadTsModule("../src/data/history/japanHistoryFull");
const { mapSecondsToYear } = loadTsModule("../src/lib/historyMapping");

const coverageTypes = new Set(["exact", "near", "era"]);
const categories = new Set([
  "政治",
  "戦争",
  "外交",
  "文化",
  "宗教",
  "経済",
  "社会",
  "災害",
  "技術",
  "人物",
  "時代背景",
]);
const requiredKeys = [
  "year",
  "displayYear",
  "title",
  "summary",
  "hook",
  "era",
  "category",
  "coverageType",
  "importance",
  "sourceLabel",
  "shareText",
];

assert(japanHistoryByYear.length === 2026, "japanHistoryByYear must have 2026 entries");
assert(japanHistoryByYear[0].year === 1, "first entry must be year 1");
assert(japanHistoryByYear[2025].year === 2026, "last entry must be year 2026");

for (let i = 0; i < 2026; i += 1) {
  const entry = japanHistoryByYear[i];
  assert(entry.year === i + 1, `year continuity failed at index ${i}`);
  for (const key of requiredKeys) {
    assert(entry[key] !== undefined && entry[key] !== "", `missing ${key} on year ${entry.year}`);
  }
  assert(categories.has(entry.category), `invalid category on year ${entry.year}`);
  assert(coverageTypes.has(entry.coverageType), `invalid coverageType on year ${entry.year}`);
  assert([1, 2, 3, 4, 5].includes(entry.importance), `invalid importance on year ${entry.year}`);
  assert(entry.hook.includes(`${entry.year}年`), `hook should include display year on year ${entry.year}`);

  if (entry.coverageType === "exact") {
    assert(entry.eventYear === entry.year, `exact eventYear mismatch on year ${entry.year}`);
    assert(entry.yearDiff === 0, `exact yearDiff mismatch on year ${entry.year}`);
  }
  if (entry.coverageType === "near") {
    assert(entry.eventYear !== null, `near eventYear missing on year ${entry.year}`);
    assert(entry.yearDiff !== null && entry.yearDiff > 0, `near yearDiff invalid on year ${entry.year}`);
    assert(entry.yearDiff <= 30, `near yearDiff too large on year ${entry.year}`);
  }
  if (entry.coverageType === "era") {
    assert(entry.eventYear === null, `era eventYear must be null on year ${entry.year}`);
    assert(entry.yearDiff === null, `era yearDiff must be null on year ${entry.year}`);
    assert(entry.category === "時代背景", `era category must be 時代背景 on year ${entry.year}`);
  }
}

const mappingCases = [
  [0, 1],
  [0.01, 1],
  [0.5, 50],
  [2.34, 234],
  [6.45, 645],
  [11.85, 1185],
  [16.03, 1603],
  [18.68, 1868],
  [20.26, 2026],
  [21, 2026],
  [-1, 1],
];

for (const [seconds, expectedYear] of mappingCases) {
  assert(mapSecondsToYear(seconds) === expectedYear, `${seconds}s should map to ${expectedYear}`);
}

const byCoverage = countBy(japanHistoryByYear, "coverageType");
const byImportance = countBy(japanHistoryByYear, "importance");
const byEra = countBy(japanHistoryByYear, "era");
const byCategory = countBy(japanHistoryByYear, "category");

console.table([
  {
    "総件数": japanHistoryByYear.length,
    "exact件数": byCoverage.exact ?? 0,
    "near件数": byCoverage.near ?? 0,
    "era件数": byCoverage.era ?? 0,
    "importance 5件数": byImportance[5] ?? 0,
    "importance 4件数": byImportance[4] ?? 0,
  },
]);
console.log("時代別件数");
console.table(byEra);
console.log("カテゴリ別件数");
console.table(byCategory);
console.log("history validation passed");

function countBy(entries, key) {
  return entries.reduce((acc, entry) => {
    const value = entry[key];
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
