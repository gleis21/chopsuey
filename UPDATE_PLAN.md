# Chop Suey — Dependency Update Plan

Generated: 2026-08-30
Environment: Node v26.3.1 / npm 11.16.0. `Dockerfile` uses `node:26-alpine`.

## 0. Security baseline (`npm audit`)

`npm audit` reports **2 high-severity** vulns:
- `extract-zip` unvalidated symlink path traversal (GHSA-jmr9-qjv8-65gv), introduced solely by `puppeteer` (any `0.9.0 – 18.1.0`).
- `npm audit fix --force` jumps straight to `puppeteer@25.9.0` (a breaking change — no lower 18/19/20/24.x version bundles a fixed `extract-zip`).

This is **exactly** the breaking upgrade planned in §3.5. So upgrading puppeteer to `^25.9.0` is not optional for a clean audit — it is the required fix. There is no conflicting workaround: the vulnerable chain cannot be avoided while staying below 25.

No other advisories, so completing §3.5 (plus the §1 cleanup, which drops `debug`/`http-errors`/etc.) clears the audit report entirely.

---

## 1. Prerequisite: remove unused dependencies

Verified by grepping `src/` — these packages are declared but **never imported/used** anywhere. They are leftovers from the Express scaffhild generator. Removing them first shrinks the surface for the big upgrades below.

| Package | Notes |
|---|---|
| `express-validator` | never imported |
| `http-errors` | never imported (`createError` not used) |
| `debug` | never imported |
| `crypto-random-string` | never imported |

Action:
```
npm uninstall express-validator http-errors debug crypto-random-string
npm uninstall -D @types/http-errors @types/express
```
Also remove the now-unused `http-errors` type (keep `@types/express` until the express 4->5 step, see below).

---

## 2. Safe upgrades (do first — no code changes needed)

These are patch/minor bumps within the same major line, backwards-compatible:

```
npm install moment@^2.30.1 winston@^3.19.0 morgan@^1.12.0 express-winston@^4.2.0 cookie-parser@^1.4.7
npm install -D ts-node@^10.9.2 @types/basic-auth @types/cookie-parser @types/morgan @types/tsscmp
```
Run `tsc` and the start script afterwards — should pass unchanged. `moment` stays on 2.x (the CDN copy pinned in `views/*.html` is client-side and unrelated).

---

## 3. Breaking upgrades (do one at a time, verify each)

Do these in dependency order, running `tsc` + `npm start` after each so failures are easy to attribute.

### 3.1 TypeScript 4.x -> 7.x
```
npm install -D typescript@^7.0.2
```
- Big jump across several majors. Check `tsconfig.json` for removed/renamed options (it currently has many commented-out defaults, mostly fine).
- Runtime binary in `Dockerfile` is `npm install -g typescript`, so that path updates automatically — but pin it to the same major there.
- Must be done **before** `@types/express` 5 and `@types/node` 26 so the d.ts can be type-checked with the new compiler.
- `@types/node` 18 -> 26 pairs with the actual runtime Node 26 — safe here, do together.

### 3.2 `basic-auth` 2.x -> 3.x
```
npm install basic-auth@^3.0.0
```
Used in `src/pkg/middleware.ts:25` (`auth(req)`) and `src/routes/api-router.js`. v3 is ESM-only — `require()/import` behavior and the return shape changed. **Must be tested**; may need to keep `^2.0.1` if the ESM-only package breaks the CommonJS build. If blocked, pin at 2.x — it is still functional.

### 3.3 Express 4.x -> 5.x + @types/express 5
```
npm install express@^5.2.1
npm install -D @types/express@^5.0.6
```
Used in `src/app.ts`, `src/chopsuey.ts`, `src/pkg/middleware.ts`.
Express 5 breaking-change surface relevant here:
- Path-to-regexp changes (wildcard `*` and named-param syntax changed).
- `res.statusCode = 401` in `middleware.ts:29` — still works, but prefer `res.status(401)`; verify `WWW-Authenticate` header flow.
- Route handlers / async error propagation differ.
- **Verify every route in `src/routes/api-router.js` and `src/routes/router.js`** (path patterns, middleware signatures). This is the highest-risk change.
- Install `@types/express@5` only after TypeScript is upgraded and the other middleware types compile.

### 3.4 `ejs` 3.x -> 6.x
```
npm install ejs@^6.0.1
```
Used in `src/app.ts:18` via `ejs.renderFile` as the html view engine. API largely stable but major-bumped; run the UI views to confirm rendering.

### 3.5 `puppeteer` 2.x -> 25.x  (★ resolves the audit)
```
npm install puppeteer@^25.9.0
```
Used only in `src/routes/router.js:44` for PDF generation (`puppeteer.launch`, `page.pdf`).
- **Security**: `puppeteer@25.9.0` is the version that fixes the `extract-zip` high advisory (see §0). No version below 25 fixes it, so this upgrade is required.
- Massive multi-major jump. `executablePath`, `--no-sandbox`, and `page.pdf` API all still exist, but launch defaults changed: since puppeteer ≥~19 the Chromium binary is **no longer bundled in `node_modules`** — it's downloaded to a cache dir at install time.
- **Blocker to fix**: `npm ci` in the `Dockerfile` does not download Chromium, and `node:26-alpine` has no browser, so the print route (`src/routes/router.js:44`, which relies on `process.env.CHROMIUM_PATH`) is broken in the container. Fix by installing Chromium in the image:
  - Alpine: `RUN apk add --no-cache chromium` + `ENV CHROMIUM_PATH=/usr/bin/chromium-browser` (matches the code's env-var lookup). May need `--no-sandbox` (already present).
  - Or `RUN npm ci && npx puppeteer browsers install chrome` with `PUPPETEER_CACHE_DIR`.
  - Fallback: switch base to `node:26-slim` (glibc) + `apt-get install chromium` — least fragile for puppeteer.
- `puppeteer@25` downloads its own Chromium on install — confirm the Docker image has the required OS libs, or set `CHROMIUM_PATH` explicitly (the code already reads `process.env.CHROMIUM_PATH`).
- Pay special attention: newer Chrome versions may refuse `--no-sandbox` without explicit flag handling. Test the `/bookings/:id/contract/print` endpoint end-to-end.

### 3.6 `airtable` 0.11 -> 0.12
```
npm install airtable@^0.12.2
```
Major-version-zero warning: "anything may change". Project imports `* as airtable` and `Base` in `src/services.ts`/`src/app.ts` and uses the low-level `base('Table').select().firstPage()` API. If it breaks, pin at `^0.11.6`.

> **Note on "ejecting to `@airtable/airtable`":** that package does **not** exist — `npm view @airtable/airtable` returns 404. The official scoped package is **`airtable`** (unscoped), on GitHub at `git://github.com/airtable/airtable.js`. It is effectively abandoned: last publish `0.12.2`, last modified **2025-06-02**, no major releases beyond 0.x, still bundles a built-in `node-fetch@2`, `lodash`, and the `abort-controller` polyfill (pre-Node-15 cruft). Since this codebase runs Node 26 with a global `fetch`, the SDK is largely obsolete.

### 3.7 (optional) Eject the Airtable dependency entirely
If you want to stop depending on the abandoned SDK, replace it with direct calls to the Airtable **REST API** (which the SDK wraps anyway). No extra package needed:

- REST base: `https://api.airtable.com/v0/{baseId}/{tableOrViewName}`
- Auth: `Authorization: Bearer <AIRTABLE_API_KEY>`
- Endpoints used here map 1:1:
  - `base('Table').create(fields)` → `POST` with `{ records: [{ fields }] }` (max 10/request — the code already chunks at 10)
  - `table.update(id, fields)` → `PATCH /v0/{base}/{Table}` with `{ records: [{ id, fields }] }`
  - `table.select({ filterByFormula, view, pageSize, maxRecords }).firstPage()` → `GET` with `filterByFormula`, `view`, `pageSize`, `maxRecords` query params
  - `table.find(id)` → `GET /v0/{base}/{Table}/{id}`
- Use Node 26's native `fetch` + a small typed wrapper in `src/pkg/airtable.ts`; no runtime dependency, no abandoned SDK, no bundled polyfills.
- Rewrite surface is bounded to `src/pkg/services.ts` and one use in `src/app.ts:28,31-38`.

Recommendation: attempt §3.6 first (low effort). If the API surface or typing causes friction, §3.7 is essentially a mechanical REST port for ~6 methods and removes the project's only abandoned dependency.

---

## 4. Final full verification
```
npm ci
npx tsc --noEmit
npm audit   # expect: 0 vulnerabilities
npm start   # boot smoke test
```
Manually exercise:
- [ ] HTML views render (ejs)
- [ ] A booking flow (create/update) hits Airtable (airtable, moment)
- [ ] Basic-auth-protected route (`/bookings/:id/contract/print`) (basic-auth 3)
- [ ] PDF download (puppeteer)
- [ ] Dev path via `start-dev.sh` (ts-node, ts live compile)

## 5. Docker build
```
docker build .   # npm ci, tsc, node:26-alpine
```
Confirm the global TS in the Dockerfile matches the project's TypeScript major to avoid runtime mismatches. Add `node_modules`/`dist` exclusions if the image (+ Chromium) grows too large.

---

## Quick reference: target versions
```
# prod
moment ^2.30.1        winston ^3.19.0       morgan ~1.12.0
express-winston ^4.2.0 cookie-parser ^1.4.7  ejs ^6.0.1
basic-auth ^3.0.0     express ^5.2.1        puppeteer ^25.9.0
airtable ^0.12.2      tsscmp ^1.0.6

# dev
typescript ^7.0.2     ts-node ^10.9.2       @types/node ^26.4.0
@types/express ^5.0.6 @types/basic-auth     @types/cookie-parser
@types/morgan         @types/tsscmp

# removed
express-validator http-errors debug crypto-random-string
@types/http-errors
```
