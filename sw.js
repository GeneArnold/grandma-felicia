// The service worker: on the first visit it stores every file of the game on the phone, and from
// then on it answers from that copy, so the game starts with no internet at all.
// VERSION must change whenever any file changes; the next online visit then fetches the new copy.
// Amplify does that on every release (amplify.yml stamps in the commit); "dev" is for local runs.
// Every file the game needs must be in FILES, or it won't work offline: tools/sw-files.py rewrites the list.
const VERSION = "casino-dev";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "vendor/phaser.min.js",
  "js/audio.js",
  "js/config.js",
  "js/install.js",
  "js/machines.js",
  "js/main.js",
  "js/rules.js",
  "js/scenes/AlbumScene.js",
  "js/scenes/BoardScene.js",
  "js/scenes/BootScene.js",
  "js/scenes/FloorScene.js",
  "js/scenes/IntroScene.js",
  "js/scenes/PlayScene.js",
  "js/scenes/ResultsScene.js",
  "js/scenes/ScratchScene.js",
  "js/scenes/TitleScene.js",
  "js/share.js",
  "js/storage.js",
  "js/taps.js",
  "js/textures.js",
  "js/ui.js",
  "js/update.js",
  "js/version.js",
  "js/voices.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "img/felicia.png",
  "img/santa-sleigh.png",
  "img/symbols/deer-baby.png",
  "img/symbols/deer-bells.png",
  "img/symbols/deer-gold.png",
  "img/symbols/deer-rednose.png",
  "img/symbols/deer-scarf.png",
  "img/symbols/deer-sleigh.png",
  "img/symbols/jingle-bell.png",
  "img/symbols/jingle-gift.png",
  "img/symbols/jingle-snowman.png",
  "img/symbols/jingle-star.png",
  "img/symbols/jingle-stocking.png",
  "img/symbols/jingle-tree.png",
  "img/symbols/shop-bear.png",
  "img/symbols/shop-elf.png",
  "img/symbols/shop-horse.png",
  "img/symbols/shop-santa.png",
  "img/symbols/shop-soldier.png",
  "img/symbols/shop-train.png",
  "img/symbols/snow-cocoa.png",
  "img/symbols/snow-flake.png",
  "img/symbols/snow-globe.png",
  "img/symbols/snow-mittens.png",
  "img/symbols/snow-skates.png",
  "img/symbols/snow-sled.png",
  "img/symbols/ticket.png",
  "voices/big-1.mp3",
  "voices/big-2.mp3",
  "voices/big-3.mp3",
  "voices/felicia-back-1.mp3",
  "voices/felicia-big-1.mp3",
  "voices/felicia-big-2.mp3",
  "voices/felicia-hello-1.mp3",
  "voices/felicia-hello-2.mp3",
  "voices/felicia-jackpot-1.mp3",
  "voices/jackpot-1.mp3",
  "voices/jackpot-2.mp3",
  "voices/machine-1.mp3",
  "voices/over-1.mp3",
  "voices/over-2.mp3",
  "voices/santa-1.mp3",
  "voices/santa-2.mp3",
  "voices/ticket-1.mp3",
  "voices/ticket-2.mp3",
  "voices/welcome-1.mp3",
  "voices/welcome-2.mp3",
  "voices/win-1.mp3",
  "voices/win-2.mp3",
  "voices/win-3.mp3",
  "voices/win-4.mp3",
  "voices/win-5.mp3",
  "voices/win-6.mp3",
  "voices/win-7.mp3",
  "voices/win-8.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(FILES);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: the stored copy answers at once, online or not.
self.addEventListener("fetch", (event) => {
  // Only the game's own files; version.json, which says whether a newer release is out, is never answered from the stored copy.
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("/version.json")) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)),
  );
});
