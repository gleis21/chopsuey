# Chop Suey — Frontend Modernization Plan

Generated: 2026-08-30
Companion to `UPDATE_PLAN.md` (backend deps). This document covers the `src/views/*.html` and `src/public/javascripts/*` frontend.

> **Status: booking forms on Vite/Vue 3; checkout on plain static JS.** The two booking forms are static Vite-built HTML pages (EJS dropped for them); the checkout page is server-rendered EJS with a plain static `javascripts/checkout.js` (option 2, removed from Vite); error remains EJS. See §5 "Implementation log".

---

## 1. Current state

### 1.1 Third-party libs loaded from CDN (global scripts, no modules)
| Library | Source | Where used |
|---|---|---|
| Vue 2 (full UMD build) | `https://cdn.jsdelivr.net/npm/vue/dist/vue.js` | `booking_update.html`, `booking_create.html`, `index.html` |
| moment 2.24 | `cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0` | `booking_update.html`, `booking_create.html`, `index.html` |
| Bootstrap 4.3.1 CSS | `stackpath.bootstrapcdn.com` | all 4 main views |
| FontAwesome | `use.fontawesome.com/1171925253.js` | all views |

### 1.2 Frontend JS files (currently plain globals, no build)
| File | Style | Notes |
|---|---|---|
| `booking.js` ~273 lines | **Vue 2 component** | `Vue.component('booking-form', { template: '#booking-form', ... })` + `new Vue({ el: '#app' })`. Heavy form logic, validation, fetches to `/buchungssystem/api/*`. Uses global `moment`. |
| `booking_create.js` ~41 lines | **Vue 2 component** | Same pattern, simpler create form. |
| `checkout.js` ~40 lines | **vanilla** | DOM manipulation + `fetch` to checkout endpoint, `window.print()`. |

### 1.3 Server-rendered EJS views (no JS framework)
`checkout.html` and `contract.html` are pure server-rendered EJS (invoice tables, time slots) referenced from `src/routes/router.js` via `res.render('checkout'|'contract', data)`.
`error.html` is a minimal EJS error page.
`index.html` is a mostly-empty shell (no longer clearly wired to a route).

### 1.4 Key wiring details the build must preserve
- Views live in `src/views/` and are copied to `dist/views/` at build (Dockerfile: `cp -R src/views dist/`).
- Static assets live in `src/public/` → `dist/public/`, served by `express.static(__dirname + '/public')` (`src/app.ts:25`).
- App is reverse-proxied under a **`/buchungssystem` prefix** (stripped by Caddy). So all URLs in HTML/JS are either root-relative (`/stylesheets/...`, `/buchungssystem/...`) — the latter already accounts for the prefix via the Caddy config.
- `booking.js` uses `Vue.component` with a `template: '#booking-form'` keyed to an inline `<script type="text/x-template" id="booking-form">` block inside the .html.
- EJS views are rendered server-side, so **no bundler may touch the server-side template delimiters** (`<%= %>`, `<% %>`).

---

## 2. Recommended target stack

| Concern | Today | Target | Rationale |
|---|---|---|---|
| Build tool | none | **Vite** | Fast, standard, TS/JS out of the box, dev server + HMR, handles static asset hashing. |
| Framework | Vue 2 (CDN) | **Vue 3** (Composition API) | Vue 2 is EOL (Dec 2023). Vite is Vue-idiomatic. |
| Date lib | moment (CDN) | **date-fns** or **Day.js** | moment is deprecated/large; replace the small surface used in `booking.js`. |
| CSS | Bootstrap 4.3.1 CDN | **Bootstrap 5** via npm (imported in source) | Drop CDNs; bundle CSS locally. |
| Icons | FontAwesome CDN | FontAwesome via npm or inline SVGs | Remove async CDN script (privacy/perf). |
| Modules | globals (UMD) | **ES modules** via Vite bundling | Enables tree-shaking, type-checked scripts. |

**Scope decision (recommended):** build **only the client-side JS/CSS assets** with Vite. Keep the server-rendered EJS views (`checkout`, `contract`, `error`) as-is, or migrate them later (see §8). This keeps the change bounded and low-risk.

---

## 3. Proposed Vite project structure

```
frontend/
├── index.html                  # Vite entry (not the EJS views)
├── package.json                # frontend-only deps (vue, bootstrap, vite, ...)
├── vite.config.mjs
├── src/
│   ├── main-booking-update.ts  # entry for booking_update page
│   ├── main-booking-create.ts  # entry for booking_create page
│   ├── components/
│   │   ├── BookingForm.vue     # SFC replacing #booking-form template + booking.js
│   │   └── (booking-create variant)
│   ├── api.ts                  # typed fetch wrapper for /api/*
│   └── styles/
│       └── app.scss            # bootstrap import + custom overrides
└── (public/ assets moved from src/public or referenced relative)
```

Build output (one bundle per page entry) is emitted to `src/public/` (or `dist/public/`), so `express.static` serves the hashed bundles:
```
dist/public/
├── assets/
│   ├── booking-update.abc123.js
│   ├── booking-update.abc123.css
│   ├── booking-create.def456.js
│   └── booking-create.def456.css
└── images/, files/            # unchanged static assets
```

---

## 4. Step-by-step migration

### 4.1 Scaffold Vite
- Create `frontend/` with its own `package.json` (isolates frontend deps from the backend `package.json`; avoid bloating the server install).
- Deps: `vue@^3`, `vite`, `bootstrap@^5` (`bootstrap` + `@popperjs/core` if JS needed), `dayjs` or `date-fns`, `@vitejs/plugin-vue`, `sass` (optional, if using `@import "bootstrap"`).
- `vite.config.js`: `build.outDir = '../src/public'` or `'../dist/public'`, `emptyOutDir`, and `base: 'auto'` so asset URLs stay prefix-agnostic under `/buchungssystem`.

### 4.2 Convert the two Vue 2 forms to Vue 3
- Replace `Vue.component('booking-form', { template: '#booking-form' })` with a `.vue` **Single-File Component** `BookingForm.vue` containing the template + script as one unit (drop the inline `text/x-template` block).
- Replace `data()`, `methods`, `async mounted()` with `<script setup>` / Composition API.
- `booking.js` currently references the global `Vue` — becomes a module entry that `createApp(BookingForm).mount('#app')`.

### 4.3 Replace moment usage in `booking.js`
The only client-side moment uses (lines ~104, 214–240) are:
- `moment().add(2,'d').format('YYYY-MM-DD')` → `dayjs().add(2,'d').format('YYYY-MM-DD')`
- constructing begin/end, `.isBefore()`, `.isAfter()` for validation → dayjs/date-fns equivalents.
Import the lib in the module instead of relying on the global.
(Server-side moment in `services.ts`/`router.js` is out of scope here — covered by backend plan.)

### 4.4 Migrate `checkout.js` to a module
- Convert to an ES module that imports any needed helpers; bundle with Vite; keep behavior identical.
- Load it from a script tag pointing at the built bundle instead of the raw file.

### 4.5 Update the HTML views to reference bundles
- In `booking_update.html` and `booking_create.html`:
  - Remove CDN `<script>` tags for vue/moment/bootstrap (script) — they come from the bundle now.
  - Replace `<script src="/buchungssystem/javascripts/booking.js">` with the built bundle `<script type="module" src="/buchungssystem/assets/booking-update.<hash>.js">`.
  - Bootstrap CSS: link to the built `booking-update.<hash>.css` instead of the CDN.
- Keep the `<div id="app">` and any server-side EJS that renders inside it.

### 4.6 Wire the build into the existing pipeline
- Add npm scripts (root or frontend/) e.g. `npm run build:frontend` that runs `vite build`.
- Dockerfile: run the frontend build **before** `tsc`/the `cp src/views|public` step so the bundles are in `src/public` (or emit directly to `dist/public`).
- `start-dev.sh`: add `vite build` (or run Vite `watch`) so dev matches.
- Since `express.static` serves `/assets/*` from `public`, no server route changes are needed.

---

## 5. CDN removal checklist
- [ ] Vue 2 CDN gone (bundled as Vue 3)
- [ ] moment CDN gone (bundled as dayjs/date-fns)
- [ ] Bootstrap 4.3.1 CDN gone (Bootstrap 5 bundled CSS)
- [ ] FontAwesome async CDN gone (npm icons / inline SVG)
- Left as-is: image/PDF assets in `public/files`, `public/images`.

---

## 6. Risks / migration hazards (read before starting)
1. **Vue 2 → 3 breaking changes.** `v-model`, `v-bind`, `v-on` mostly carry over, but global `Vue.component` + `new Vue({el})` API is gone; component options keys (filters, `$on`, etc.) differ. The two forms are small and self-contained, so the port is mechanical.
2. **Template delimiters.** Be careful not to run the EJS `.html` (with `<%= %>`) through Vue's template compiler. Convert each form to an SFC so the Vue template is a separate `.vue` file; only the `<div id="app">` shell stays in the EJS.
3. **`/buchungssystem` prefix.** Set Vite `base` so emitted asset URLs don't hardcode a root that breaks behind the Caddy strip. Use relative/`auto` base and verify in a proxied environment.
4. **Moment locale/format edge cases.** If any view depended on moment's German locale or specific formatting, dayjs needs the matching locale plugin (`dayjs/locale/de`) and plugins (`customParseFormat`). Review `booking.js` formatting before removing moment.
5. **FontAwesome `fa-*` classes.** Several templates use `<i class="fa fa-...">`. If migrating to FA npm package, the icon set/class names differ; or replace with inline SVG/unicode. Budget for this pass.
6. **No automated tests currently** (`npm test` = placeholder). Add a minimal smoke check (page loads, bundle 200s) before/after.

---

## 7. Acceptance criteria
- [ ] No `<script>`/`<link>` CDN requests on the booking pages (checked via network tab).
- [ ] All bundles served from local `/buchungssystem/assets/*` (hashed).
- [ ] Booking create + update forms function identically (validation, room/equipment fetch, submit).
- [ ] Checkout page works (AGB/GDPR checkboxes, print).
- [ ] Contract + checkout server-rendered EJS unaffected.
- [ ] Works behind `/buchungssystem` reverse proxy (Caddy dev + prod).
- [ ] `Dockerfile` + `start-dev.sh` both produce/serve the bundles.

---

## 8. Optional follow-ups (out of scope for first pass)
- Migrate `checkout.html`/`contract.html` from server-side EJS to Vue 3 client components (bigger refactor of `generateContract` data passing; keep for later).
- Replace the duplicated `<nav>`/bootstrap layout with a shared layout/component.
- Add real `npm test` coverage (unit tests for the form validation logic extracted into pure functions).
- Replace the remaining FontAwesome CDN (`use.fontawesome.com` async script) with npm icons / inline SVG, and drop the outdated Slack-hosted navbar logo.
- Move the raw `src/public/javascripts/*` legacy files to git history (deleted live files).

---

## 9. Effort estimate
- Vite scaffold + wiring into Docker/dev: small.
- Vue 2 → 3 port of 2 forms + moment swap: medium (mechanical, ~2 files + 2 SFCs).
- Bootstrap 5 + FontAwesome migration: medium (template class churn).
- Acceptance verification behind proxy: small–medium.

Suggested sequencing: **Vite scaffold → port booking_create (simplest) → port booking_update → checkout.js module → CDN cleanup → Docker/dev wiring → verification.**

---

## 5. Implementation log (2026-08-30)

### Phase 1 — Vite + Vue 3 + dayjs migration (booking forms + checkout script)
- Created `frontend/` subproject: Vite 6 + `@vitejs/plugin-vue`, `vue@3`, `bootstrap@5`, `dayjs`.
- SFCs: `BookingForm.vue` (update form, ported from `booking.js` Vue 2 component, moment→dayjs, Composition API) and `BookingCreateForm.vue`.
- `src/api.ts`: typed fetch wrapper + `apiPrefix()`/`assetUrl()` helpers that derive the `/buchungssystem` mount prefix from `window.location.pathname`.
- Entry modules `main-booking-update.ts` / `main-booking-create.ts` mount Vue apps + import Bootstrap 5 CSS; `main-checkout.ts` ports the vanilla `checkout.js` fetch/print logic.
- `src/helpers/viteAssets.ts`: server helper reading `.vite/manifest.json` to inject hashed bundle refs into the EJS `checkout.html` via `res.locals.frontendAssets`.

### Phase 2 — drop EJS for the booking forms (option 3)
- Added static HTML entries `frontend/booking-update.html` and `frontend/booking-create.html` (Vite multi-page).
- `vite.config.mjs`: `base: '/buchungssystem/'` (so emitted asset URLs carry the proxy prefix), entries = the two HTML files, `outDir` → `../src/public`, `manifest: true`.
- Vite emits standalone `src/public/booking-update.html` / `booking-create.html` that reference `/buchungssystem/assets/*` bundles.
- `src/routes/router.js`: `GET /bookings/new` and `GET /bookings/:id` now authenticate + `res.sendFile(.../public/booking-{create,update}.html)` instead of `res.render(...)`. Auth (basic-auth / PIN + `cs-creds` cookie) is preserved; only the markup rendering moved client-side.
- Deleted `src/views/booking_create.html` and `src/views/booking_update.html` (EJS versions).

### Phase 3 — checkout back to plain static JS (option 2)
- Reworked checkout to a plain static file `src/public/javascripts/checkout.js` (no Vite), served by `express.static`.
- `checkout.html` references it directly: `<script src="/buchungssystem/javascripts/checkout.js">`, and restores the Bootstrap 4 CDN stylesheet link.
- Removed the now-unused `src/helpers/viteAssets.ts` (manifest-based `frontendAssets` injection) and its calls in `router.js`; removed the `main-checkout.ts` Vite entry and rebuilt to purge the stale bundle.
- Since checkout was the only `manifest`/`frontendAssets` consumer, the manifest is now only used to signal the build, not read server-side. `contract.html` + its stylesheets were removed earlier (dead code).

Build wiring: `Dockerfile` + `start-dev.sh` run the Vite build before copying `src/public` into `dist/`; `.dockerignore` excludes nested `node_modules` and build artifacts.

### Verified (final state)
- `vite build` emits standalone booking HTML pages + hashed assets under `src/public/`; no checkout bundle remains.
- `tsc` compiles; app boots; no `viteAssets`/`frontendAssets`/`main-checkout` references remain anywhere.
- `/bookings/new` (real auth route) returns the static `booking-create.html` with correct `/buchungssystem/assets/*` refs; `/javascripts/checkout.js` and booking bundles serve 200.

Remaining from plan: Bootstrap 5 template class churn (`form-row`→`row`, removed `jumbotron`, `float-right`→`float-end`) applies to the Vue SFC, FontAwesome CDN replacement, nav/logo cleanup, and the optional Vue 3 port of the `checkout` EJS view (see §8).



