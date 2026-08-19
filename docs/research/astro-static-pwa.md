# Research: Astro static + PWA to the last pre-implementation detail

- **Ticket:** iksaku/rosario-web#29 (parent: #27)
- **Date:** 2026-08-15
- **Scope of claims:** verified against the worktree at `origin/main` (commit `65b7a98`, "Modernize stack and serve as static Worker") and primary sources listed at the bottom.

## Site facts verified in the repo (worktree)

| Fact | Evidence in repo |
|---|---|
| Astro `^7.2.1`, pure static (no adapter in `astro.config.mjs`) | `package.json`, `astro.config.mjs` |
| Exactly one client island: `src/components/Misterios.tsx` with `client:load` in `src/pages/index.astro` | `src/pages/index.astro` |
| Island is self-contained: no `fetch()`, no `localStorage`, state is a Solid signal only (mystery-of-the-day selector) | `src/components/Misterios.tsx` |
| Single page site: `src/pages/` contains only `index.astro` | `git ls-files src/pages` |
| Tailwind 4 via `@tailwindcss/vite` | `astro.config.mjs` |
| Workers static assets, custom domain `rosario.jorgeglz.io`, no Worker script (`main` absent) | `wrangler.toml` |
| No `public/` extras today beyond `favicon.svg` | `git ls-files public` |
| No PWA-related dependencies today | `package.json` |

The single-page + stateless-island shape matters repeatedly below: it makes the update-flow and caching decisions easy.

---

## 1. Service worker & precaching approach

### 1.1 Verdict on `@vite-pwa/astro`: do **not** adopt it on Astro 7 today

- `@vite-pwa/astro@1.2.0` (latest as of 2026-08-15, published 2025-11-27) declares `peerDependencies.astro: "^1.6.0 || ^2.0.0 || ^3.0.0 || ^4.0.0 || ^5.0.0"` — **Astro 6 and 7 are not in the peer range** (npm registry, `@vite-pwa/astro`).
- Astro 6 support PR (vite-pwa/astro#73) was **closed without merge** on 2026-08-04; issue #72 ("Astro 6 peer dependency range blocks installation") is open. Issue #74 ("Astro 7 support", opened 2026-07-11) is open with zero comments ("Any major updates needed to support Astro 7?").
- This repo uses `pnpm@11.21.0`, which errors on unsatisfied peer ranges by default, so installing the integration would require `--strict-peer-dependencies=false`-style hacks on day one.
- The underlying engine is fine: `vite-plugin-pwa@1.3.0` peers `vite: "^3.1.0 || … || ^8.0.0"` (npm registry), and `astro@7.2.2` depends on `vite ^8.0.13` (npm registry). It is specifically the **Astro wrapper** that is stalled, not the PWA toolchain.

### 1.2 What `@vite-pwa/astro` actually does (read from its source, v1.2.0)

To decide whether we lose anything by not using it, I read `src/index.ts` of vite-pwa/astro@1.2.0. It does exactly four Astro-specific things:

1. Runs SW generation in `astro:build:done` — i.e. **after** Astro has written `dist/` (workbox-build globs the final output).
2. Applies a `manifestTransforms` rewrite mapping `index.html` → `/` (the scope URL) and `foo/index.html` → `foo/` so precache entries match Astro's `build.format: 'directory'` URLs, and sets `directoryIndex: 'index.html'`.
3. Sets `dontCacheBustURLsMatching` to Astro's `build.assets` dir (`_astro/`) so hashed files skip revision hashing.
4. Guards against a duplicate `vite-plugin-pwa` in `vite.plugins` and handles the SSR `output: 'server'` case (irrelevant here).

All four are trivially reproducible for a **single-page** site: there is only `index.html`, so the URL rewrite is the identity map (`index.html` → `/`), and `dontCacheBustURLsMatching: /_astro/` is one regex.

### 1.3 Recommended approach: handwritten registration + `workbox-build generateSW` post-build script

For this site the pragmatic split is:

- **Registration + update UX:** ~15 lines of inline `<script>` in `src/pages/index.astro`'s `<head>` (Astro does not inject scripts for you the way SPA entry points do — the vite-pwa Astro docs explicitly warn "Since Astro will not inject any script in your application when using Astro components, you will need to use/import a PWA virtual module"; with a post-build approach we just write the registration ourselves).
- **SW generation:** a small `scripts/build-sw.mjs` run after `astro build` (e.g. `"build": "astro build && node scripts/build-sw.mjs"`), calling `workbox-build`'s `generateSW()` against `./dist`. `generateSW` is the right mode per Workbox docs when "you want to precache files" and have "simple runtime caching needs" — exactly our case (no push, no custom routing logic). A fully handwritten `fetch`-handler SW would re-implement revisioned precaching, dedupe, and outdated-cache cleanup for zero benefit; Workbox exists for this.

Exact precache config for this site (rationale inline):

```js
// scripts/build-sw.mjs
import { generateSW } from 'workbox-build';

await generateSW({
  globDirectory: 'dist',
  swDest: 'dist/sw.js',
  // dist after `astro build` contains: index.html, _astro/*.{js,css} (incl. the
  // Misterios.tsx island chunks), favicon.svg, manifest.webmanifest, icons.
  globPatterns: ['**/*.{html,js,css,svg,png,ico,webmanifest}'],
  // Astro emits content-hashed filenames under _astro/: the hash IS the revision,
  // so skip Workbox's extra cache-busting for them (saves bandwidth on precache updates).
  dontCacheBustURLsMatching: /^_astro\//,
  // index.html cannot carry a hash in its URL, so Workbox computes a content
  // revision for it automatically (workbox-precaching docs).
  // Serve the precached shell for any navigation that misses the precache:
  navigateFallback: 'index.html',
  // Single-page site: any in-scope navigation is our app.
  navigateFallbackAllowlist: [/^\/$/],
  // Update behavior (see 1.4): take over immediately on new deploy.
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
});
```

Why the Solid island is covered: with `client:load`, the island's JS is part of the page's initial module graph, emitted as hashed files under `dist/_astro/`. `globPatterns: ['**/*.{js,css,…}']` globs the whole `dist` tree, so the island chunks, the Astro runtime chunks, and the Tailwind CSS are all precached. Nothing needs per-island configuration; the only way to break this is adding runtime-fetched assets that aren't in `dist` (this site has none — verified: no `fetch()` in `src/`).

Workbox precache mechanics being relied on (from the `workbox-precaching` docs): precache entries are **cache-first**; URLs already containing versioning info (our `_astro/*.hash.js`) are used as cache keys as-is; unversioned URLs (`index.html`) get a build-time revision hash; on a new deploy the diff between old and new manifests is downloaded during `install`, entries no longer present are purged in `activate`. `precacheAndRoute`'s default `directoryIndex` handling means a request for `/` is satisfied by the precached `/index.html` entry.

### 1.4 Update flow: new deploy → user gets new content how?

Default browser flow (web.dev, "The service worker lifecycle"):

1. On every navigation to an in-scope page (and on functional events), the browser re-requests the SW script. **Since Chrome 68 the HTTP cache is bypassed for this request by default** (`updateViaCache` defaults to `'imports'`; the Service Worker spec sets the script request's cache mode to `"no-cache"` per the SW spec / MDN `register()`), so a stale `Cache-Control` on `sw.js` cannot delay updates in modern Chrome/Safari/Firefox.
2. If the SW script is byte-different (it will be: the generated precache manifest hashes change on every content deploy), the new SW installs (downloads only changed precache entries), then **waits** until the old SW controls zero clients.
3. Because clients overlap during a page refresh, a waiting SW typically activates only when all tabs are closed and the site is reopened.

**`skipWaiting` / `clientsClaim` tradeoffs** (web.dev lifecycle; Workbox `generateSW` reference):

- `skipWaiting()`: new SW activates immediately, kicking out the old one. Risk: the already-loaded page may then request subresources and get **new-version** assets while its HTML/JS is **old-version** — the classic mixed-version breakage. It also discards in-progress state in the old page.
- `clientsClaim()`: the SW takes control of pages that loaded *before* it activated (normally a page keeps "no SW" for its whole lifetime). Mostly matters on first install; it is a race for the very first load.
- For **this site both are safe**: one page, no forms, no persisted state (the island's only state is a day-of-week selector recomputed on mount), and the only fetch traffic is precached, versioned assets. So the recommendation is `skipWaiting: true, clientsClaim: true` — i.e. `autoUpdate` semantics — plus an automatic `window.location.reload()`-on-controllerchange so the open tab moves to the new shell deterministically:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // Installed/home-screened sessions may live for days: poll for updates hourly.
      setInterval(() => reg.update(), 60 * 60 * 1000);
    });
    // skipWaiting makes the new SW control this page mid-session; reload once.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }
</script>
```

(The hourly `reg.update()` pattern is the documented remedy for long-lived sessions that never navigate — web.dev lifecycle "Manual updates" and vite-pwa's "Periodic Service Worker Updates" guide. This matters most for iOS home-screen web apps, which are typically left running.)

### 1.5 HTML shell strategy

- The shell (`index.html`) is **precached with a content revision** and served cache-first from the precache — the correct strategy because the revision changes on every deploy and the precache updates atomically with the SW that references it. Do **not** runtime-cache `/` with stale-while-revalidate on top of precaching; it creates a second, less-coherent copy of the shell.
- Hashed `_astro/*` assets: precached (cache-first is inherent) and, orthogonally, served by Cloudflare with immutable-friendly headers if we add the `_headers` rule in §6.
- `navigateFallback: 'index.html'` covers offline navigations to any in-scope URL; with `navigateFallbackAllowlist: [/^\/$/]` it cannot shadow real future pages.

---

## 2. Web app manifest, field by field

The manifest is a JSON file linked from every page: `<link rel="manifest" href="/manifest.webmanifest">` (MDN, "Web application manifests"). The spec's registered media type is `application/manifest+json` for the `.webmanifest` extension; browsers also accept `.json` served as `application/json` (MDN).

Recommended `public/manifest.webmanifest` for this site, with per-field justification:

```json
{
  "name": "Guía del Santo Rosario",
  "short_name": "Rosario",
  "description": "Guía web para rezar del Santo Rosario en cualquier lugar.",
  "lang": "es",
  "dir": "ltr",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/pwa-192x192.png",  "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/pwa-512x512.png",  "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

| Field | Value & why |
|---|---|
| `name` | Full title shown in install prompts; matches `<title>`. |
| `short_name` | Home-screen label (character-limited surfaces). Chromium requires `name` **or** `short_name` (MDN "Making PWAs installable"); provide both. |
| `icons` 192px + 512px | Hard requirement for Chrome's installability (web.dev "What does it take to be installable?"). Declare `type` so browsers can skip unsupported formats cheaply (MDN `icons` reference). |
| `purpose: "maskable"` entry | Android applies a launcher mask (circle etc.). The **safe zone is a circle with radius 2/5 (40%) of the icon's minimum dimension** (W3C Web Application Manifest spec, "Icon masks and safe zone"); keep all essential art inside it and give the icon an **opaque background** (MDN "Define your app icons"). Non-maskable icons on Android get shrunk onto a white disc and look broken (MDN, same page). |
| Do **not** use `purpose: "any maskable"` on one file | A maskable icon shown unmasked (desktop) gets its safe-zone padding baked in and looks tiny; split into two entries with separate purposes (explicit recommendation in vite-pwa's PWA minimal requirements / assets-generator docs). |
| `apple-touch-icon` | **Not a manifest field** — a `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` (180×180 PNG, opaque) in the HTML head. On iOS this **takes precedence over manifest icons** (WebKit, "Web Push for Web Apps on iOS and iPadOS", New Fallback Icon section). Without any icon iOS now falls back to a monogram tile (same WebKit post). |
| `start_url: "/"` | Required by Chrome (web.dev install criteria). Must be same-origin and inside `scope`; relative to the manifest URL (MDN). |
| `scope: "/"` | The W3C spec recommends always declaring `scope`, preferably `"/"` — it defines which documents the manifest (and standalone display) applies to; fallbacks otherwise derive it from `start_url` (W3C spec, "Understanding scope"). Also matches the SW's registration scope (`/sw.js` at root defaults to `/`). |
| `id: "/"` | Stable identity for the installed app across `start_url` changes; iOS 16.4+ uses it to sync per-app settings (WebKit 16.4 post). Optional but free. |
| `display: "standalone"` | See discussion below. |
| `theme_color` | Colors the Android title bar / iOS status-bar treatment; **must match the `<meta name="theme-color">`** you ship in HTML (vite-pwa minimal requirements; MDN). |
| `background_color` | Splash-screen background on Android/Chromium (MDN "Web application manifests", Splash screens). Should match the page background to avoid a flash. |
| `lang: "es"` | Content language; helps user agents pick fonts/TTS (W3C `lang` member). |

### `display`: `standalone` vs `minimal-ui` for a prayer guide

- `standalone`: no browser URL bar; app-like window; status bar remains. `minimal-ui`: keeps a small set of navigation controls (back/reload/share) whose exact set varies by browser (MDN `display` reference).
- **Recommendation: `standalone`.** Rationale: (a) for devotional reading the point of installing is "no browser chrome between me and the prayer"; (b) the coaching UI below (§3) covers the one thing users lose — a way out — by the site simply being a single scrollable page; (c) support: Safari on iOS honors `standalone`/`fullscreen` and does not expose meaningful `minimal-ui` — unsupported display modes fall back along the spec chain `fullscreen → standalone → minimal-ui → browser` (MDN), so on iPhone `minimal-ui` collapses to `standalone` anyway; (d) Chrome's install criteria accept either.
- Future-proofing note: if users ever report feeling "trapped", `display_override` can reorder the fallback; not needed now.
- Style with `@media (display-mode: standalone)` to adjust padding for the notched status bar (`viewport-fit=cover` + `env(safe-area-inset-*)`) — MDN documents the media query; WebKit's Safari 26 post confirms standalone web apps remain first-class.

---

## 3. Installability criteria & UX (Android/Chrome vs iOS/Safari)

### 3.1 Chromium (Android Chrome, Edge, Samsung Internet)

Chrome fires `beforeinstallprompt` and promotes installation only when **all** hold (web.dev "What does it take to be installable?"):

1. App not already installed.
2. **User engagement heuristics:** at least one click/tap on the page (any time, even a previous visit) **and** ≥ 30 seconds with the page open.
3. Served over **HTTPS** (Workers custom domain: yes).
4. Manifest with: `short_name` or `name`; `icons` including a **192px and a 512px** icon; `start_url`; `display` one of `fullscreen`, `standalone`, `minimal-ui`, `window-controls-overlay`; `prefer_related_applications` absent or `false`.

Note: a service worker is **no longer a Chrome install requirement** — MDN's installability guide states SWs are "not a requirement for a PWA to be installable" (they're for offline). We ship one anyway; it also unlocks the richer Android install dialog (`description` + `screenshots` are shown **on Android only** per MDN).

The site can provide its own install UX via `beforeinstallprompt` (MDN `beforeinstallprompt_event`; web.dev "How to provide your own in-app install experience"):

```js
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();          // suppress the mini-infobar
  deferredPrompt = e;
  installButton.hidden = false; // show our own button
});
installButton.addEventListener('click', async () => {
  await deferredPrompt.prompt();     // one-shot; can only be called once per event
  deferredPrompt = null;
});
window.addEventListener('appinstalled', () => (installButton.hidden = true));
```

`prompt()` can be called once per captured event; if dismissed, wait for the next `beforeinstallprompt` (web.dev). Detection of installed state / launch mode via `matchMedia('(display-mode: standalone)')` or the `appinstalled` event (web.dev).

### 3.2 iOS Safari Add to Home Screen — what actually differs

- **There is no programmatic install on iOS.** `beforeinstallprompt` is not implemented in Safari ("This is not supported on iOS" — MDN Making PWAs installable). Installation is the manual Share-sheet flow; no engagement heuristic, no automatic promotion banner.
- **Manual steps (Safari, iOS 16.4 → iOS 25):** open the site in Safari → tap the **Share** button (square with arrow) → scroll → **"Add to Home Screen"** → confirm name → **Add**. On iOS 16.4+ third-party browsers (Chrome, Edge, Firefox on iOS) may also offer Add to Home Screen from their Share menu, and the result still opens as a web app if the manifest says so (WebKit "Web Push for Web Apps on iOS and iPadOS", "Third-party browser support" section). Before 16.4, Safari-only.
- **iOS 26 change (current):** *every* site added to the Home Screen opens as a web app by default; the Add-to-Home-Screen sheet shows an **"Open as Web App"** toggle the user can turn off to get a plain bookmark instead. WebKit: "there are now zero requirements for 'installability' in Safari" — but "if you include a Web Application Manifest … the benefits it provides will be part of the user's experience. If you define your icons in the manifest, they're used" (WebKit, "WebKit Features in Safari 26.0"). So the manifest still controls icon, name, and standalone behavior; what changed is that its absence no longer forces bookmark-mode.
- **`display` support:** Safari honors `standalone` and `fullscreen` from the manifest (adopted in iOS 11.4, March 2018 — WebKit Safari 26 post history section; WebKit 16.4 post: "a manifest file with its `display` member set to `standalone` or `fullscreen`" makes a Home Screen web app). `minimal-ui` is not meaningfully exposed on iOS; fallback chain applies (MDN).
- **Icon:** `apple-touch-icon` link (180×180 PNG) **wins over manifest icons** on iOS (WebKit 16.4 post). iOS pre-16.4 without any icon used a screenshot; 16.4+ uses a monogram tile — both worse than a proper icon.
- **Title:** the Home Screen label defaults to `<title>`; `apple-mobile-web-app-title` can override (Apple, "Configuring Web Applications" — archived but still the reference for these keys). Status-bar styling: `apple-mobile-web-app-status-bar-style`. The legacy `apple-mobile-web-app-capable` meta is superseded by the manifest `display` member (WebKit's own history above); no need to ship it.
- **Offline:** iOS Home Screen web apps never *required* a service worker (WebKit Safari 26 post) but without one an offline launch shows a stale snapshot/error; with our precaching SW the app launches fully offline.

### 3.3 Coaching UI recommendation (elderly user on iPhone)

Because the iPhone path is manual and the user is elderly, the site itself must teach it. Recommended pattern (all client-side, ~1 component):

- **Detection:** show coaching only when relevant. On iOS Safari in browser mode: `const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent)` (or feature-detect `navigator.standalone !== undefined`); hide when already running standalone (`window.matchMedia('(display-mode: standalone)').matches || navigator.standalone` — web.dev documents this exact combo; `navigator.standalone` is the iOS-specific property from Apple's Configuring Web Applications doc).
- **iOS panel:** numbered, large-type steps in Spanish with the exact Safari chrome drawn out, since "the Share button" is the hard part:
  1. "Toca el botón **Compartir**" with an inline SVG replica of the square-with-up-arrow at the bottom of Safari;
  2. "Desliza hacia abajo y toca **'Agregar a pantalla de inicio'**";
  3. "Toca **'Agregar'** en la esquina superior derecha" (and on iOS 26: "deja activada la opción **'Abrir como app'**").
  Keep each step one line, ≥18px text, high contrast (the site's Tailwind `prose-lg` + dark mode already fit).
- **Android panel:** the `beforeinstallprompt`-driven "Instalar aplicación" button (§3.1). No step list needed — tapping it opens the native install dialog. Fall back to "Menú ⋮ → Instalar aplicación" text only if the event never fires (e.g. already-installed or heuristic not met).
- Persist dismissal in `localStorage` so it nags at most once, and re-check `display-mode: standalone` to stop showing it entirely after install.
- Accessibility: `role="dialog"`/`aria-live` toast for the offline-ready and update notifications (§1.4's `controllerchange` reload is silent; the "app ready offline" toast is worth one polite announcement).

---

## 4. Offline behavior specifics

**What works offline once the SW is active and precache is populated:**

- Cold launch from the Home Screen icon with airplane mode on: `start_url` `/` is a navigation request → served from precache (`/index.html` entry via `directoryIndex`/`navigateFallback`). Full HTML shell renders instantly.
- The Solid island: its `_astro/*.js` chunks + runtime are precached → hydration completes offline; the mystery-of-the-day logic is pure client-side date math (verified: no network use in `Misterios.tsx`). All Astro components render to static HTML at build time, so the non-island prayers need zero JS.
- CSS (Tailwind build), favicon, icons, manifest: all in `dist/` → all precached by the glob.

**Behavior on offline reload:** identical to online-by-precache. The workbox-precaching route is cache-first with network only as an error fallback, so an offline reload never shows the browser's dinosaur/`Safari can't open the page`. Only requests **not** in the precache would fail — this site makes none.

**`update` vs cache-first gotchas for a single-page site:**

- **Cache-first shell ≠ stale forever.** The precache is versioned by the SW's manifest; updates ride the SW lifecycle (§1.4). The residual staleness window is "until the next visit triggers the SW byte-check + skipWaiting + reload", i.e. one reload after a deploy, not days.
- **Never put `sw.js` itself in the precache** (self-caching SW = potentially bricked updates). `generateSW` never precaches its own output; keep it that way and don't add a runtime cache rule matching `/sw.js`.
- **The 24-hour ceiling:** browsers cap SW-script HTTP caching at 24h max even where headers are honored (Chrome's pre-68 behavior; modern Chrome bypasses HTTP cache entirely — web.dev lifecycle + "Fresher service workers"). Cloudflare's default `max-age=0, must-revalidate` on assets keeps this clean regardless (§6).
- **iOS long-lived sessions:** a Home Screen web app resumed from the app switchper may not navigate for days — the hourly `reg.update()` from §1.4 is the mitigation (web.dev "Manual updates"; vite-pwa periodic-updates guide).
- **First-visit-before-SW-ready is not offline:** a brand-new visitor who goes offline mid-install has a partially populated cache; `install` failing simply discards the SW (web.dev lifecycle). Acceptable: no data loss possible on this site.
- **Don't runtime-cache anything cross-origin.** Opaque responses count ~7 MB each against Chrome's storage quota (Chrome DevTools "Debug Progressive Web Apps", quota section). This site has zero cross-origin subresources — keep it that way and quota is a non-issue.

---

## 5. Astro-limitation verdict (explicit deliverable)

**Astro static output imposes NO limitation on PWA capabilities relative to a pure SPA. None.** This is definitive, for these evidence-backed reasons:

1. **PWA capabilities are defined by the client/runtime, not the framework.** Installability per web.dev/MDN requires: HTTPS + a manifest with certain members + (for offline) a service worker with scope over the document. Nothing in any criterion references the rendering architecture. All are satisfiable by any set of static files.
2. **Astro static output is exactly that — static files.** `astro build` emits `dist/index.html` + hashed `_astro/*` assets (verified in this repo's config: no adapter, no SSR). Workers serves them from its asset store with correct MIME/ETag/`Cache-Control` (§6). A service worker registered from `index.html` controls the document identically whether that document was server-rendered, statically generated, or hydrated by a SPA.
3. **The island is not a second-class citizen.** A Solid `client:load` island is hydrated **into the same document the SW controls**; its chunks are ordinary same-origin module scripts emitted into `dist` (Astro islands docs: static HTML with islands hydrated separately; JS bundled by Astro at build). The SW's fetch interception sees them like any same-origin request — they are precacheable and offline-capable, as established in §1.3/§4.
4. **The differences are authoring conveniences, not capabilities.** The only Astro-specific notes found across primary sources: (a) Astro "will not inject any script in your application" the way SPA entry points do, so the SW registration script must be added manually to the layout/head (vite-pwa Astro framework docs — we do this in §1.3 anyway); (b) `build.format` and `trailingSlash` affect precache-URL shapes, which is precisely what `@vite-pwa/astro`'s manifest transform papers over (its source, §1.2) and what our single-page config trivially handles with `navigateFallback` + `directoryIndex` defaults. Neither is a capability gap.
5. **What a SPA could do that static Astro can't:** nothing PWA-relevant. SPAs actually *hurt* here — they'd ship more JS to hydrate text that Astro renders at build time, and their app-shell HTML is emptier (worse offline-first paint, since with precaching the *build-time-rendered* HTML is what's cached).
6. The closest thing to a caveat is ecosystem tooling, not Astro: the dedicated Astro PWA integration is currently incompatible-by-peer-range with Astro 7 (§1.1) — a packaging gap with a two-line workaround, not an architectural limit.

**Therefore: any framework-migration discussion is closed from the PWA angle. Keeping the Cloudflare adapter removed and the CDN static-cache benefit is fully compatible with making the site an installable, fully-offline PWA.**

---

## 6. Cloudflare Workers static-assets specifics

Differences vs plain static hosting that matter for the SW/manifest:

1. **MIME types are assigned at upload, from the file extension, by Wrangler.** "A `Content-Type` header is attached to the response if one is provided during the asset upload process. Wrangler automatically determines the MIME type of the file, based on its extension" (Cloudflare, Workers Static Assets → Headers). So `.js` → JS media type (registration requires a valid JavaScript media type per MDN `register()`), `.webmanifest` → manifest MIME per Wrangler's extension map. *(OPEN item: I was mid-verification of Wrangler's exact `.webmanifest` mapping in the workers-sdk source when this research was time-boxed; the docs' guarantee "Wrangler determines MIME from extension" plus the mitigation below make this low-risk. Mitigation: if `curl -I https://rosario.jorgeglz.io/manifest.webmanifest` ever shows a wrong type, either rename to `.json` — MDN: "Browsers generally support manifests with other appropriate extensions like `.json`" — or force it via `_headers`.)*
2. **Default `Cache-Control: public, max-age=0, must-revalidate` + strong `ETag`.** This is *precisely* what a PWA wants for the update-critical files: `sw.js`, `index.html`, `manifest.webmanifest` are revalidated on every use and never served stale by the HTTP layer, while conditional `If-None-Match` revalidation keeps it cheap (same Cloudflare Headers doc). **No `_headers` override is needed for correctness.**
3. **`_headers` is supported and lives in the assets directory.** "The default response headers … can be overridden … by creating a plain text file called `_headers` … in the static asset directory of your project. This file will not itself be served as a static asset" (Cloudflare Headers doc). With Astro, author it at `public/_headers` so it lands in `dist/` and is consumed (not served) at deploy. Header rules support URL patterns, splats, placeholders, and `! Name` to strip a header (same doc).
   - Recommended optional addition — long-cache the hashed asset folder only (pattern from the same doc's "fingerprinted assets" example):
     ```txt
     /_astro/*
       Cache-Control: public, max-age=31556952, immutable
     ```
     Safe because `_astro/` filenames are content-hashed (Astro default; also what `dontCacheBustURLsMatching` assumes). Do **not** apply this to `/`, `/sw.js`, `/manifest.webmanifest`, `/index.html` — vite-pwa's deployment guide explicitly warns against `immutable` on those.
   - Note the caveat from the docs: `_headers` rules do **not** apply to responses generated by Worker code. Irrelevant here (no `main` script), but it becomes relevant if a Worker is ever added.
4. **Routing/`html_handling`:** default `auto-trailing-slash` serves `dist/index.html` for `/` (Cloudflare HTML handling doc's table: folder index files served with trailing slash). This matches the manifest `start_url: "/"` and SW `directoryIndex` behavior — no change needed to `wrangler.toml` for PWA support. `not_found_handling` can stay `none` (single page; the SW's `navigateFallback` handles offline), or `404-page` if a custom 404 is ever wanted (Cloudflare SSG routing doc).
5. **CDN edge caching is complementary, not conflicting.** Cloudflare caches static assets at the edge automatically (Static Assets → Caching behavior). The browser-facing `max-age=0, must-revalidate` still governs SW update checks; the edge cache just makes revalidation cheap. Deploy = new immutable asset set + fresh `sw.js` bytes → next visitor's SW byte-check sees the change (§1.4).
6. **HTTPS + custom domain** (`rosario.jorgeglz.io` custom_domain route in `wrangler.toml`) satisfies the secure-context requirement for both SW registration and installability (MDN: HTTPS or localhost required).
7. `run_worker_first` and the assets binding are irrelevant for this deployment (no Worker script) — nothing to configure.

---

## 7. Concrete recommendation for the follow-up implementation

### Dependencies

| Package | Type | Why |
|---|---|---|
| `workbox-build` (`^7.4.1`) | devDependency | Generates the SW from `dist/` post-build. Only PWA dependency needed at runtime: **zero**. |

- Do **not** add `@vite-pwa/astro` (peer-incompatible with Astro 7; §1.1). Re-evaluate if vite-pwa/astro#74 ships.
- Optional: `@vite-pwa/assets-generator` (dev) to emit 192/512/maskable/180 icons from `src/assets/LogoProject.svg` in one command (`pwa-assets-generator` CLI, minimal-2023 preset). Any icon generator works; this one emits exactly the set from §2.
- Optional: `workbox-precaching`/`workbox-routing` only if we later outgrow `generateSW` and switch to `injectManifest` (not needed now — no custom SW logic exists).

### Files to create/change (config snippet set)

1. **`scripts/build-sw.mjs`** — the `generateSW` call from §1.3 verbatim.
2. **`package.json`** — `"build": "astro build && node scripts/build-sw.mjs"`.
3. **`public/manifest.webmanifest`** — the manifest from §2.
4. **`public/_headers`** — the `/_astro/*` immutable rule from §6 (optional but recommended).
5. **Icons** — `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-512x512.png` (art inside the 40%-radius safe zone, opaque background), `public/apple-touch-icon.png` (180×180, opaque; iOS precedence per §3.2).
6. **`src/pages/index.astro` `<head>` additions:**
   ```html
   <link rel="manifest" href="/manifest.webmanifest" />
   <meta name="theme-color" content="#1f2937" />
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   <!-- existing favicon.svg stays -->
   <script>
     /* SW registration + hourly update + one-shot controllerchange reload — §1.4 */
   </script>
   ```
   (`astro.config.mjs`, `wrangler.toml`, and `src/` components otherwise unchanged — the SW registration script is page-level, and the coaching UI from §3.3 is one optional `<InstallCoach />` Astro component with a small inline script; no island needed.)
7. **Update behavior:** `skipWaiting: true, clientsClaim: true` in `generateSW` (autoUpdate semantics — safe per §1.4 analysis).
8. **Verification checklist for the implementer** (how to prove it works):
   - `curl -I` the deployed `/sw.js`, `/manifest.webmanifest`, `/_astro/<hashed>.js` and confirm MIME + `Cache-Control` (§6, closes the OPEN item).
   - Chrome DevTools → Application: Manifest tab (no installability errors; maskable icon safe-area check), Service Workers + Cache Storage populated; then Offline checkbox + reload.
   - Lighthouse PWA category on the production URL.
   - Real device: Android Chrome install via the in-page button; iPhone Safari manual A2HS (§3.2 steps), then airplane-mode launch on both.

### Estimated footprint

One dev dependency, ~40 lines of config/scripts, ~30 lines of page-level script + coaching component. No runtime dependencies added; no changes to the Astro/Vite build pipeline other than a post-build step.

---

## Sources

- Issue & repo: iksaku/rosario-web#29; worktree of `origin/main` @ `65b7a98`.
- Workbox: workbox-precaching — https://developer.chrome.com/docs/workbox/modules/workbox-precaching · workbox-build (modes, `skipWaiting`/`clientsClaim`/`navigateFallback`/`dontCacheBustURLsMatching`) — https://developer.chrome.com/docs/workbox/modules/workbox-build · workbox-strategies — https://developer.chrome.com/docs/workbox/modules/workbox-strategies
- Service worker lifecycle & updates: https://web.dev/articles/service-worker-lifecycle · Fresher service workers (Chrome 68+, `updateViaCache`) — https://developer.chrome.com/blog/fresher-sw/ · MDN `ServiceWorkerContainer.register()` (scope, `updateViaCache`, JS media type) — https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register · MDn Using Service Workers — https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_service_workers · W3C Service Worker Nightly (script request cache mode `"no-cache"`, `ServiceWorkerUpdateViaCache` enum) — https://w3c.github.io/ServiceWorker/
- Web app manifest: W3C Web Application Manifest (safe zone 2/5 radius; scope guidance; members) — https://www.w3.org/TR/appmanifest/ and https://w3c.github.io/manifest/ · MDN Web app manifests — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest · MDN `icons` — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons · MDN `display` — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display · MDN Define app icons (maskable, safe zone, opaque bg) — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons
- Installability: web.dev "What does it take to be installable?" — https://web.dev/articles/install-criteria · MDN Making PWAs installable (Chromium required members; HTTPS; iOS install support matrix; `beforeinstallprompt` not on iOS) — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable · MDN `beforeinstallprompt` — https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event · web.dev in-app install experience — https://web.dev/articles/customize-install · Chrome DevTools "Debug Progressive Web Apps" (opaque-response quota note) — https://developer.chrome.com/docs/devtools/progressive-web-apps/
- iOS/WebKit: WebKit "WebKit Features in Safari 26.0" (every site a web app; zero install requirements; manifest still provides icons/display) — https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ · WebKit "Web Push for Web Apps on iOS and iPadOS" (A2HS via Share menu; third-party browsers 16.4+; `apple-touch-icon` precedence; monogram fallback; `display` standalone/fullscreen; Manifest ID) — https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ · Apple "Configuring Web Applications" (apple-touch-icon, title, status-bar keys) — https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- Astro: Islands architecture — https://docs.astro.build/en/concepts/islands/
- vite-pwa: Astro framework guide (manual script injection warning; navigation fallback; experimental slash handler) — https://vite-pwa-org.netlify.app/frameworks/astro · Deployment requirements (manifest MIME, Cache-Control warnings) — https://vite-pwa-org.netlify.app/deployment/ · PWA minimal requirements — https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements · Assets generator (icon set, split any/maskable) — https://vite-pwa-org.netlify.app/assets-generator/ · Auto-update & prompt behaviors — https://vite-pwa-org.netlify.app/guide/auto-update and /guide/prompt-for-update · Periodic SW updates — https://vite-pwa-org.netlify.app/guide/periodic-sw-updates · source `src/options.ts` & docs `guide/static-assets.md` (default `globPatterns: ['**/*.{js,css,html}']`, `navigateFallback: 'index.html'`, autoUpdate forces skipWaiting/clientsClaim) — https://github.com/vite-pwa/vite-plugin-pwa
- vite-pwa/astro packaging: npm registry metadata for `@vite-pwa/astro@1.2.0` (peer `astro ^1.6.0||^2||^3||^4||^5`), `vite-plugin-pwa@1.3.0` (peer `vite ^3.1–^8`), `astro@7.2.2` (dep `vite ^8.0.13`) — https://www.npmjs.com/package/@vite-pwa/astro · issues #72/#73 (Astro 6 blocked; PR closed unmerged 2026-08-04) and #74 (Astro 7 support, open) — https://github.com/vite-pwa/astro/issues/74 · integration source `src/index.ts` @ v1.2.0 — https://github.com/vite-pwa/astro
- Cloudflare: Workers Static Assets — https://developers.cloudflare.com/workers/static-assets/ · Headers (default `Cache-Control: public, max-age=0, must-revalidate`, ETag, `_headers` syntax, immutable fingerprinted example, Worker-response caveat) — https://developers.cloudflare.com/workers/static-assets/headers/ · HTML handling — https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/ · SSG routing/`not_found_handling` — https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/ · Wrangler configuration (assets keys) — https://developers.cloudflare.com/workers/wrangler/configuration/
