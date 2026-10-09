/* İSG Takip — Service Worker
   Sürüm: 1.0 — PWA offline desteği (isteğe bağlı, network-first strateji)
   Bu dosya yalnızca PWA kurulum desteği için gereklidir.
   Offline çalışma: index.html önbellekte saklanır.
*/
const CACHE_NAME = 'isg-takip-v2';
const STATIC = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

/* Kurulum: statik dosyaları önbellekle */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC)).catch(() => {})
  );
  self.skipWaiting();
});

/* Aktivasyon: eski önbellekleri temizle */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: Network-first, başarısız olursa önbellekten sun */
self.addEventListener('fetch', e => {
  // Yalnızca GET isteklerini yönet
  if (e.request.method !== 'GET') return;
  // Firebase ve harici CDN isteklerini geç
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') ||
      url.includes('cdnjs') || url.includes('unpkg') ||
      url.includes('gemini')) return;

  e.respondWith(
    fetch(e.request).then(res => {
      // Başarılı network yanıtını önbelleğe yaz
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
