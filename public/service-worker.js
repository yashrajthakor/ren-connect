// ===================================================================
// RBN Service Worker — production cache-safe version
// -------------------------------------------------------------------
// Strategy:
//   - HTML / navigations  -> NetworkFirst (always try fresh, fall back to cache offline)
//   - Hashed JS/CSS/img   -> CacheFirst   (filenames change every build, safe to cache forever)
//   - version.json / sw   -> Never cached (bypass entirely)
//   - API / Supabase      -> Never cached (bypass entirely)
//
// The cache name embeds the build id so every new deployment gets a fresh
// cache namespace and stale entries are evicted on activate.
// ===================================================================

// __BUILD_ID__ is replaced by the Vite build plugin (see vite.config.ts).
// In dev (when no replacement runs) it stays as the literal string, which is
// fine because we register the SW only in production builds.
const BUILD_ID = "__BUILD_ID__";
const RUNTIME_CACHE = `rbn-runtime-${BUILD_ID}`;
const STATIC_CACHE = `rbn-static-${BUILD_ID}`;

const NEVER_CACHE_PATHS = [
  "/version.json",
  "/service-worker.js",
  "/sw.js",
  "/manifest.webmanifest",
  "/site.webmanifest",
];

const isHashedAsset = (url) =>
  /\/assets\/.+-[A-Za-z0-9_]{6,}\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|avif|gif)$/.test(
    url.pathname,
  );

const isNavigation = (request) =>
  request.mode === "navigate" ||
  (request.method === "GET" &&
    request.headers.get("accept")?.includes("text/html"));

const isBypassed = (url) => {
  if (NEVER_CACHE_PATHS.includes(url.pathname)) return true;
  // Don't touch cross-origin (Supabase, analytics, CDNs, etc.)
  if (url.origin !== self.location.origin) return true;
  // Don't touch any API-shaped path.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rest/") ||
      url.pathname.startsWith("/auth/") || url.pathname.startsWith("/storage/") ||
      url.pathname.startsWith("/realtime/") || url.pathname.startsWith("/functions/")) {
    return true;
  }
  return false;
};

self.addEventListener("install", (event) => {
  // Activate the new SW immediately on install.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache that does not belong to the current build.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n !== RUNTIME_CACHE && n !== STATIC_CACHE)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.status === 200 && fresh.type === "basic") {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await cache.match("/index.html");
    if (shell) return shell;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.status === 200 && fresh.type === "basic") {
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isBypassed(url)) return; // let the browser handle it normally

  if (isNavigation(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: try network, fall back to cache.
  event.respondWith(networkFirst(request));
});

// Handle messages from the main thread (for showing notifications)
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
    return;
  }

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
});

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let notificationData = {
    title: "🔔 RBN Notification",
    body: "You have a new notification",
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    tag: "rbn-notification",
    data: { link: "/dashboard/notifications" },
    requireInteraction: false,
    vibrate: [200, 100, 200], // Mobile vibration pattern
  };

  try {
    const data = event.data.json();
    notificationData = {
      ...notificationData,
      title: data.title || notificationData.title,
      body: data.body || notificationData.body,
      data: {
        link: data.link || data.data?.link || "/dashboard/notifications",
        notificationId: data.id || data.notificationId,
      },
      tag: data.id || data.notificationId || "rbn-notification",
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
    };
  } catch (e) {
    // If parsing JSON fails, use text as body
    try {
      notificationData.body = event.data.text() || notificationData.body;
    } catch (textErr) {
      console.error("Failed to parse push data:", textErr);
    }
  }

  notificationData.actions = [
    { action: "view", title: "View" },
    { action: "dismiss", title: "Dismiss" },
  ];
  notificationData.renotify = true;

  event.waitUntil(self.registration.showNotification(notificationData.title, notificationData));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag);
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data.link || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus any open RBN window and navigate it to the link
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ("focus" in client) {
          if ("navigate" in client) {
            try { client.navigate(urlToOpen); } catch (_) {}
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Handle notification close events (for analytics)
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
