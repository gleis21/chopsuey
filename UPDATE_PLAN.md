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
- Massive multi-major jump. `executablePath`, `--no-sandbox`, and `page.pdf` API all still exist, but launch defaults and the bundled Chromium changed.
- `puppeteer@25` downloads its own Chromium on install — confirm the Docker image has the required OS libs, or set `CHROMIUM_PATH` explicitly (the code already reads `process.env.CHROMIUM_PATH`).
- Pay special attention: newer Chrome versions may refuse `--no-sandbox` without explicit flag handling. Test the `/bookings/:id/contract/print` endpoint end-to-end.

### 3.6 `crypto` (none) / `airtable` 0.11 -> 0.12
```
npm install airtable@^0.12.2
```
Axonistic warn: major-version-zero, "anything may change". Project imports `* as airtable` and `Base` in `src/services.ts`/`src/app.ts` and uses the low-level `base('Table').select().firstPage()` API. The `airtable` package is unmaintained/deprecated — 0.12 is the last published release. If it breaks, pin at `^0.11.6`. (Consider ejecting to `@airtable/airtable` or REST as a future project.)

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
