/* steep-version.js — the SINGLE source of the two per-deploy constants (R158, v4.25).
   Loaded by index.html FIRST (before steep-data.js, the earliest reader) AND importScripts'd by
   service-worker.js, so the page and the service worker read the SAME note from ONE place. Attached to
   `self` so a bare `APP_VERSION` / `WHATS_NEW` resolves in BOTH the window and the SW global scope.
   BUMP BOTH HERE EVERY DEPLOY (deploy ritual 2b/2c) — nowhere else. The update banner shows the INCOMING
   version's note by messaging it off the waiting SW (which importScripts this file); the running page's
   constant is only the fallback, so a stale value here mislabels what the next deploy tells users. */
self.APP_VERSION = 'v4.38';
// WHATS_NEW — one human sentence, the quiet second line on the update banner (v3.69+). '' suppresses it.
self.WHATS_NEW = "On phones, the field you're filling now stays above the keyboard, and the shop/vendor box suggests shops you've used.";
