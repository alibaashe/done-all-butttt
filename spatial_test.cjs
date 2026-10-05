// Proves the new spatial-grid nearest-landmark lookup returns the SAME answer as
// the old full-registry scan, and measures the speedup on the order path.
//   node spatial_test.cjs
const fs = require('fs');
const path = require('path');
const ts = require(path.join(__dirname, 'node_modules', 'typescript', 'lib', 'typescript.js'));

const places = JSON.parse(
  fs.readFileSync('src/data/hargeisaPlaces.ts', 'utf8').match(/export const HARGEISA_PLACES: HargeisaPlace\[\] = (\[[\s\S]*?\]);/)[1]
);

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- OLD behaviour: full scan (what the code did before) ----
function oldFindNearest(lat, lng, maxDistKm) {
  let best = null;
  let bestDist = Infinity;
  for (const p of places) {
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d < bestDist && d <= maxDistKm) {
      bestDist = d;
      best = p;
    }
  }
  return best ? { id: best.id, distanceKm: bestDist } : null;
}

// ---- NEW behaviour: load the real spatial index module ----
let src = fs.readFileSync('src/utils/placeSpatialIndex.ts', 'utf8');
// Replace the real data import + the .ts extension of the relative import with inline data.
src = src.replace(/^import[^;]*from '\.\.\/data\/hargeisaPlaces';$/m, '');
src = src.replace(/HARGEISA_PLACES/g, '__PLACES');
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', '__PLACES', js)(mod, mod.exports, places);
const { findNearestPlace } = mod.exports;

const fails = [];
function check(label, ok, detail) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
  if (!ok) fails.push(label);
}

console.log('=== 1. EQUIVALENCE: grid must match the old full scan exactly ===');
const RADII = [0.4, 0.65, 1.0, 2.0];
// Deterministic pseudo-random sample covering the whole city.
let seed = 12345;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
let mismatches = 0;
let compared = 0;
let nullBoth = 0;
for (const radius of RADII) {
  for (let i = 0; i < 4000; i++) {
    const lat = 9.50 + rand() * 0.12; // covers greater Hargeisa
    const lng = 44.02 + rand() * 0.12;
    const oldRes = oldFindNearest(lat, lng, radius);
    const newRes = findNearestPlace(lat, lng, radius);
    compared++;
    if (!oldRes && !newRes) {
      nullBoth++;
      continue;
    }
    if (!oldRes || !newRes) {
      mismatches++;
      continue;
    }
    // Same landmark id. Distance should agree to within floating-point noise.
    // NOTE: findNearestPlace returns { place, distanceKm }.
    if (oldRes.id !== newRes.place.id || Math.abs(oldRes.distanceKm - newRes.distanceKm) > 1e-9) {
      mismatches++;
    }
  }
}
check(
  'grid result identical to full scan over 16,000 lookups',
  mismatches === 0,
  `${compared} compared, ${mismatches} mismatches (${nullBoth} where both found nothing)`
);

console.log('\n=== 2. ALSO CHECK exact landmark coordinates (the common real case) ===');
let exactMismatch = 0;
for (let i = 0; i < places.length; i += 37) {
  const p = places[i];
  const oldRes = oldFindNearest(p.lat, p.lng, 0.65);
  const newRes = findNearestPlace(p.lat, p.lng, 0.65);
  if (!oldRes || !newRes || oldRes.id !== newRes.place.id) exactMismatch++;
}
check('every sampled landmark resolves to itself', exactMismatch === 0, `${exactMismatch} mismatches`);

console.log('\n=== 3. SPEED: the order path (2 lookups per distance estimate) ===');
const SAMPLE = [];
for (let i = 0; i < 200; i++) SAMPLE.push([9.53 + rand() * 0.06, 44.04 + rand() * 0.07]);

// Cold: first call also builds the grid (one-time, done on idle in the app).
const coldStart = process.hrtime.bigint();
findNearestPlace(SAMPLE[0][0], SAMPLE[0][1], 0.65);
const coldEnd = process.hrtime.bigint();
const coldMs = Number(coldEnd - coldStart) / 1e6;

let t0 = process.hrtime.bigint();
for (const [lat, lng] of SAMPLE) {
  oldFindNearest(lat, lng, 0.65);
  oldFindNearest(lat, lng + 0.02, 0.65);
}
let t1 = process.hrtime.bigint();
const oldPerCall = Number(t1 - t0) / 1e6 / (SAMPLE.length * 2);

t0 = process.hrtime.bigint();
for (const [lat, lng] of SAMPLE) {
  findNearestPlace(lat, lng, 0.65);
  findNearestPlace(lat, lng + 0.02, 0.65);
}
t1 = process.hrtime.bigint();
const newPerCall = Number(t1 - t0) / 1e6 / (SAMPLE.length * 2);

console.log(`  old full scan      : ${oldPerCall.toFixed(3)} ms per lookup`);
console.log(`  new grid (warm)    : ${newPerCall.toFixed(4)} ms per lookup`);
console.log(`  new grid (1st call): ${coldMs.toFixed(1)} ms  <- one-time build, done on idle`);
check('grid is at least 3x faster when warm', newPerCall * 3 < oldPerCall, `${(oldPerCall / newPerCall).toFixed(1)}x faster`);
check('single warm lookup under 0.5 ms', newPerCall < 0.5, `${newPerCall.toFixed(4)} ms`);
check('one-time grid build under 60 ms', coldMs < 60, `${coldMs.toFixed(1)} ms`);

console.log('\n' + '='.repeat(62));
if (fails.length) {
  console.log(`${fails.length} CHECK(S) FAILED:`);
  fails.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
