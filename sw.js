// Зараа PWA service worker — "сүлжээ эхэнд" (network-first) горим
// Ингэснээр шинэчилсэн контент үргэлж эхэлж ачаалагдана, хуучин хувилбар гацахгүй.
const CACHE = 'zaraa-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  // Зөвхөн GET хүсэлтийг боловсруулна; бусдыг (POST г.м) сүлжээгээр шууд явуулна
  if (req.method !== 'GET') return;
  // Supabase API болон гадаад хүсэлтэд хөндлөнгөөс оролцохгүй
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(function(res) {
      // Амжилттай хариуг кэшэд хадгална (офлайн нөөц болгож)
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function() {
      // Сүлжээгүй үед кэшнээс өгнө
      return caches.match(req);
    })
  );
});
