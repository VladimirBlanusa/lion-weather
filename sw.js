// ——— Service worker: prvi pogled i bez neta ———
// Keš "lav-vreme-v1" nosi okvir appa; slike i ostalo se keširaju kako se koriste.
// API pozivi (open-meteo) se ne diraju — kad nema mreze, podatke drzi localStorage kes u index.html.
var KES = "lav-vreme-v37"; // v3.87: usporeni oblaci ~40%, munje ređe (6-14s) i duži bljesak (.75s)
var OKVIR = ["index.html", "manifest.json", "apple-touch-icon.png", "og-lav.jpg"];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(KES).then(function(c) { return c.addAll(OKVIR); }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== KES; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  // API uvek sa mreze — fallback je localStorage kes iz appa
  if (url.hostname === "api.open-meteo.com" || url.hostname === "geocoding-api.open-meteo.com") return;
  // Ostalo: mreza pa kes — offline podize poslednje videno
  e.respondWith(
    fetch(e.request).then(function(r) {
      var kopija = r.clone();
      caches.open(KES).then(function(c) { c.put(e.request, kopija); });
      return r;
    }).catch(function() {
      return caches.match(e.request).then(function(p) {
        return p || caches.match("index.html");
      });
    })
  );
});
