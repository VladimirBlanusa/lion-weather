// LAV-VREME service worker — omogućava instalaciju kao aplikaciju (PWA)
// v3-4: keš se puni na mreži (offline radi), stari keš se briše, update ide odmah
var CACHE = "lav-vreme-v3-4";
var FAJLOVI = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(FAJLOVI);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (imena) {
      return Promise.all(imena.filter(function (ime) {
        return ime !== CACHE;
      }).map(function (ime) {
        return caches.delete(ime);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (odgovor) {
      if (odgovor && odgovor.ok) {
        var kopija = odgovor.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, kopija); });
      }
      return odgovor;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match("./index.html");
      });
    })
  );
});
