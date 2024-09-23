var cacheName = 'bopbash-pwa';
var filesToCache = [
    '/',
    '/index.html'
]

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache);
        })
    );
});
self.addEventListener('fetch', (e) => {
    e.waitUntil(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});