const CACHE='sticker-tracker-2026-v1';
const FILES=['./','./index.html','./styles.css','./app.js','./data.js','./manifest.json','./assets/logo.png','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-180.png'];
self.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('fetch', e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
