/* TrueCaddie service worker — offline-ready app shell + course imagery.
   All paths are relative to the SW location so the app works at any mount path. */
const CACHE = 'truecaddie-v3'
const TILE_CACHE = 'truecaddie-tiles-v1'
const TILE_LIMIT = 600 // ~ a few courses' worth of satellite tiles
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const isTile = (url) => url.hostname.endsWith('arcgisonline.com')
const isWeather = (url) => url.hostname.endsWith('open-meteo.com')

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Satellite tiles: cache-first so visited holes work offline on the course.
  if (isTile(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const res = await fetch(request)
        if (res.ok) {
          cache.put(request, res.clone())
          trimCache(cache)
        }
        return res
      })
    )
    return
  }

  // Weather: network-first with cached fallback (a stale wind read beats none).
  if (isWeather(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  if (!request.url.startsWith(self.location.origin)) return

  // Navigation requests: network-first, fall back to cached shell for offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})

let trimming = false
async function trimCache(cache) {
  if (trimming) return
  trimming = true
  try {
    const keys = await cache.keys()
    if (keys.length > TILE_LIMIT) {
      // FIFO eviction of the oldest ~10%
      const drop = keys.slice(0, Math.ceil(TILE_LIMIT * 0.1))
      await Promise.all(drop.map((k) => cache.delete(k)))
    }
  } finally {
    trimming = false
  }
}
