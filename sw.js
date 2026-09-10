/* Halloween Ikura Blast — service worker
 *
 * DELIBERATELY DOES NOT CACHE ANYTHING.
 *
 * It exists for one reason: Chrome on Android will only offer to install a web app (and only then
 * fires `beforeinstallprompt`) if the site registers a service worker WITH A FETCH HANDLER. A
 * fetch handler is the requirement — caching is not.
 *
 * Caching here would be actively harmful for how this project is worked on. index.html is
 * re-uploaded constantly, and a caching worker would keep serving players the previous build after
 * an upload, with no obvious symptom other than "my change didn't take". That is a much worse
 * problem than a missing install prompt, so every request goes straight to the network.
 *
 * ── IF YOU EVER ADD CACHING, READ THIS FIRST ────────────────────────────────────────────────
 * A backend is planned (Cloudflare Pages Functions in front of D1/R2), and this worker sits in
 * front of EVERY request the page makes — including those API calls. Caching them would be worse
 * than caching the game:
 *   - a cached GET would serve a stale leaderboard and look like the backend was broken;
 *   - a replayed POST could double-submit a score.
 * So the two guards below are here to make that mistake hard rather than easy. They cost nothing
 * today (everything still goes to the network either way) and they mean a future `caches.match()`
 * added to the bottom of the handler cannot silently swallow the API.
 * Bump CACHE_VERSION on every deploy if caching is ever introduced.
 */

// Requests that must NEVER be served from a cache, whatever else this file grows into.
// Matched on the pathname so it holds whether the site is at a GitHub Pages subpath
// (/Halloween-Game2-CLD/) or at a Cloudflare domain root (/).
const NEVER_CACHE = /\/api\/|\/functions\//i;

// Take over as soon as installed rather than waiting for every tab to close, so a player who
// installs mid-session is controlled immediately.
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Anything that changes server state, and anything on an API path, is passed straight through
  // and left entirely alone. Not respondWith at all: returning without calling it hands the
  // request back to the browser's own networking, which is the least surprising thing possible.
  if (req.method !== 'GET' || NEVER_CACHE.test(new URL(req.url).pathname)) return;

  // Everything else: still no cache. This is the fetch handler Chrome's install criteria require,
  // and pass-through keeps behaviour identical to having no worker at all.
  event.respondWith(fetch(req));
});
