import { generateSW } from "workbox-build";

// Single-page site: precache the whole dist tree; _astro files are
// content-hashed by Astro, so their URL is the revision.
await generateSW({
    globDirectory: "dist",
    swDest: "dist/sw.js",
    globPatterns: ["**/*.{html,js,css,svg,png,ico,webmanifest}"],
    dontCacheBustURLsMatching: /^_astro\//,
    navigateFallback: "index.html",
    navigateFallbackAllowlist: [/^\/$/],
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
});
