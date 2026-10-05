// Verifies the real place-search implementation by compiling the actual source
// modules with the local tsc, then exercising them in Node.
//   node search_test.cjs
const fs = require('fs');
const path = require('path');
const ts = require(path.join(__dirname, 'node_modules', 'typescript', 'lib', 'typescript.js'));

// Recursively inline local relative imports so the module under test uses the
// real implementation rather than a copy.
const moduleCache = new Map();
function loadTsModule(relPathFromRoot) {
  if (moduleCache.has(relPathFromRoot)) return moduleCache.get(relPathFromRoot);

  const full = path.join(__dirname, relPathFromRoot);
  let src = fs.readFileSync(full, 'utf8');
  const dir = path.dirname(full);

  src = src.replace(/^import\s+([^;]*?)\s+from\s+'(\.[^']*)';?$/gm, (match, clause, spec) => {
    let target = path.resolve(dir, spec);
    if (!target.endsWith('.ts')) target += '.ts';
    const rel = path.relative(__dirname, target).replace(/\\/g, '/');
    const dep = loadTsModule(rel);
    // Rewrite `import { a, b } from '...'` into a const destructure.
    if (clause.trim().startsWith('{')) {
      return `const ${clause.trim()} = __dep_${rel.replace(/[^a-zA-Z0-9]/g, '_')};`;
    }
    return '';
  });

  const js = ts.transpileModule(src, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;

  // Provide the inlined dependencies as function parameters.
  const depNames = [];
  const depValues = [];
  for (const [key, value] of moduleCache) {
    const safe = '__dep_' + key.replace(/[^a-zA-Z0-9]/g, '_');
    if (js.includes(safe)) {
      depNames.push(safe);
      depValues.push(value);
    }
  }

  const mod = { exports: {} };
  new Function('module', 'exports', ...depNames, js)(mod, mod.exports, ...depValues);
  moduleCache.set(relPathFromRoot, mod.exports);
  return mod.exports;
}

// --- Load the real data module (with the real placeSearch dependency) ---
const placesMod = loadTsModule('src/data/hargeisaPlaces.ts');
const searchHargeisaPlaces = placesMod.searchHargeisaPlaces;
const HARGEISA_PLACES = placesMod.HARGEISA_PLACES;

console.log('Loaded real hargeisaPlaces.ts');
console.log('  places:', HARGEISA_PLACES.length);

const fails = [];
function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}${detail ? '  -> ' + detail : ''}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? '  -> ' + detail : ''}`);
    fails.push(label);
  }
}

console.log('\n=== 1. CATEGORY TABS RETURN SANE, DISTINCT COUNTS ===');
const tabs = [
  ['Hospitals & Healthcare', 100, 2000],
  ['Schools & Universities', 100, 2000],
  ['Mosques (Masaajidda)', 100, 2000],
  ['Markets & Malls', 100, 2000],
  ['Fuel Stations (Kaalmaha)', 100, 2000],
  ['Transport & Terminals', 100, 2000],
  ['Hotels & Hospitality', 100, 2000],
  ['Banks & Financial', 100, 2000],
  ['Government & Civic', 100, 2000],
  ['Xaafadaha (Districts)', 100, 2000],
];
const counts = {};
for (const [label, min, max] of tabs) {
  const r = searchHargeisaPlaces('', label);
  counts[label] = r.length;
  check(`"${label}" is non-empty and bounded`, r.length >= min && r.length <= max, `${r.length} results`);
}
check(
  'Hospitals and Hotels are NOT the same set (the old substring bug)',
  counts['Hospitals & Healthcare'] !== counts['Hotels & Hospitality'] &&
    counts['Hospitals & Healthcare'] > 0 &&
    counts['Hotels & Hospitality'] > 0,
  `hospitals=${counts['Hospitals & Healthcare']}, hotels=${counts['Hotels & Hospitality']}`
);
check(
  'every health result is really a hospital',
  searchHargeisaPlaces('', 'Hospitals & Healthcare').every((p) => (p.subCategory || '') === 'hospital')
);

console.log('\n=== 2. SHORT-FORM / ID CATEGORY ALIASES (used by WadaageSearchOverlay) ===');
for (const id of ['Hospital', 'Education', 'Mosque', 'Market', 'Fuel', 'Transit', 'Hotel', 'Bank', 'Government', 'District']) {
  const r = searchHargeisaPlaces('', id);
  check(`id "${id}" returns results`, r.length > 0, `${r.length} results`);
}

console.log('\n=== 3. QUERY SEARCH ===');
for (const q of ['airport', 'waheen', 'hotel', 'bank', 'school']) {
  const r = searchHargeisaPlaces(q, 'All');
  check(`query "${q}" finds something`, r.length > 0, `${r.length} results`);
}
check('empty query + All returns places', searchHargeisaPlaces('', 'All').length > 0);
check(
  'query "hospital" does not return hotels',
  searchHargeisaPlaces('hospital', 'All').every((p) => !(p.subCategory || '').includes('hotel'))
);

console.log('\n=== 4. PERFORMANCE (must be well under a keystroke budget) ===');

// Cold cost: the one-time index build. Must happen during idle time, not on the
// first keystroke, so we measure and report it separately.
const coldStart = process.hrtime.bigint();
placesMod.warmHargeisaSearchIndex();
const coldEnd = process.hrtime.bigint();
const coldMs = Number(coldEnd - coldStart) / 1e6;
check('one-time full index warm-up under 200 ms', coldMs < 200, `${coldMs.toFixed(1)} ms (sliced across idle callbacks, never on a keystroke)`);

// Steady state: every prefix a user produces while typing a place.
const typingSequences = ['mansoor', 'airport', 'waheen', 'dahabshiil', 'hargeisa', 'hotel', 'school', 'bank'].map(
  (word) => Array.from({ length: word.length }, (_, i) => word.slice(0, i + 1))
);

let worst = 0;
let worstQuery = '';
let total = 0;
let count = 0;
for (let round = 0; round < 3; round++) {
  for (const seq of typingSequences) {
    for (const q of seq) {
      const a = process.hrtime.bigint();
      searchHargeisaPlaces(q, 'All');
      const b = process.hrtime.bigint();
      const ms = Number(b - a) / 1e6;
      total += ms;
      count++;
      if (ms > worst) {
        worst = ms;
        worstQuery = q;
      }
    }
  }
}
const avg = total / count;
check('average keystroke under 6 ms', avg < 6, `${avg.toFixed(2)} ms average`);
check('worst keystroke under 20 ms', worst < 20, `${worst.toFixed(2)} ms for "${worstQuery}"`);

const t2 = process.hrtime.bigint();
for (const [label] of tabs) searchHargeisaPlaces('', label);
const t3 = process.hrtime.bigint();
const perTab = Number(t3 - t2) / 1e6 / tabs.length;
check('average category tab under 25 ms', perTab < 25, `${perTab.toFixed(2)} ms/tab`);

console.log('\n=== 5. RESULT CAP (never flood the UI) ===');
const flood = searchHargeisaPlaces('a', 'All');
check('broad query is capped at 60', flood.length <= 60, `${flood.length} returned`);

console.log('\n' + '='.repeat(60));
if (fails.length) {
  console.log(`${fails.length} CHECK(S) FAILED:`);
  fails.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
