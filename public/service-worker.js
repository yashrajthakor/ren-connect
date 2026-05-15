const CACHE_NAME = "ren-connect-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/site.webmanifest",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});

// Handle messages from the main thread (for showing notifications)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
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
