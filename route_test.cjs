// Extracts the getInitialView() resolver out of src/App.tsx and runs it against a
// battery of URLs so the routing table can be verified without a browser.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'src', 'App.tsx'), 'utf8');
const start = src.indexOf('const getInitialView = ()');
if (start < 0) { console.error('getInitialView not found'); process.exit(1); }
// find the terminating "\n  };" of the arrow function
const endMarker = '\n  };';
const end = src.indexOf(endMarker, start);
const tsBody = src.slice(start, end + endMarker.length).replace(/\bAppView\b/g, 'string');

// Strip TypeScript types with the local tsc (esbuild's helper service is unavailable here)
const ts = require(path.join(__dirname, 'node_modules', 'typescript', 'lib', 'typescript.js'));
const jsBody = ts.transpileModule(
  `export ${tsBody}`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }
).outputText;

const factory = new Function('window', 'localStorage', 'navigator', 'import_meta', 'mod', `
  const importMeta = import_meta;
  const exports = mod;
  ${jsBody.replace(/import\.meta/g, 'importMeta')}
  return exports.getInitialView();
`);

function makeEnv({ pathname = '/', search = '', hash = '', hostname = 'www.wadaage.com',
                   protocol = 'https:', origin, capacitor = false, ua = 'Mozilla/5.0',
                   stored = {}, currentRide = null, width = 1280 }) {
  const store = { ...stored };
  if (currentRide) store['wadaage_current_ride'] = JSON.stringify(currentRide);
  const win = {
    location: { pathname, search, hash, hostname, protocol, origin: origin || `${protocol}//${hostname}`, href: `${protocol}//${hostname}${pathname}${search}${hash}` },
    innerWidth: width,
    matchMedia: () => ({ matches: false }),
    navigator: { userAgent: ua, standalone: false },
  };
  if (capacitor) win.Capacitor = { getPlatform: () => 'android' };
  return {
    win,
    storage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    nav: { userAgent: ua, standalone: false },
  };
}

const cases = [
  // [description, env options, expected]
  ['root /  (fresh visitor)',            { pathname: '/' }, 'website'],
  ['root / (mobile width)',              { pathname: '/', width: 390 }, 'website'],
  ['root / but user previously used rider', { pathname: '/', stored: { wadaage_app_view: 'rider' } }, 'website'],
  ['root / but user previously used driver', { pathname: '/', stored: { wadaage_app_view: 'driver' } }, 'website'],
  ['root / with active ride saved',      { pathname: '/', currentRide: { status: 'in_progress' } }, 'website'],
  ['/rider',                             { pathname: '/rider' }, 'rider'],
  ['/rider/',                            { pathname: '/rider/' }, 'rider'],
  ['/driver',                            { pathname: '/driver' }, 'driver'],
  ['/driver/',                           { pathname: '/driver/' }, 'driver'],
  ['/admin',                             { pathname: '/admin' }, 'admin'],
  ['/admin/',                            { pathname: '/admin/' }, 'admin'],
  ['/passenger (legacy alias)',          { pathname: '/passenger' }, 'rider'],
  ['?app=rider (legacy query)',          { pathname: '/', search: '?app=rider' }, 'rider'],
  ['?app=driver (legacy query)',         { pathname: '/', search: '?app=driver' }, 'driver'],
  ['?app=admin (legacy query)',          { pathname: '/', search: '?app=admin' }, 'admin'],
  ['?app=website',                       { pathname: '/', search: '?app=website' }, 'website'],
  ['subdomain admin.wadaage.com',        { pathname: '/', hostname: 'admin.wadaage.com' }, 'admin'],
  ['subdomain driver.wadaage.com',       { pathname: '/', hostname: 'driver.wadaage.com' }, 'driver'],
  ['unknown path /about',                { pathname: '/about' }, 'website'],
  ['unknown path /privacy',              { pathname: '/privacy' }, 'website'],
  // Native APK builds must never be routed by path
  ['APK rider build (envMode rider)',    { pathname: '/', capacitor: true, ua: 'Mozilla/5.0 WadaageRider' }, 'rider'],
  ['APK driver build (envMode driver)',  { pathname: '/', capacitor: true, ua: 'Mozilla/5.0 WadaageDriver' }, 'driver'],
];

let pass = 0, fail = 0;
console.log('URL ROUTING TABLE');
console.log('='.repeat(74));
for (const [desc, opts, expected] of cases) {
  let got;
  try {
    const env = makeEnv(opts);
    const envMode = opts.capacitor ? (opts.ua.includes('Driver') ? 'driver' : 'rider') : undefined;
    got = factory(env.win, env.storage, env.nav, { env: envMode ? { VITE_APP_MODE: envMode } : {} }, {});
  } catch (e) {
    got = 'ERROR: ' + e.message;
  }
  const ok = got === expected;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${desc.padEnd(44)} -> ${got}${ok ? '' : '   (expected ' + expected + ')'}`);
}
console.log('='.repeat(74));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
