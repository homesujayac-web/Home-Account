// বাড়ির হিসাব — অফলাইন সার্ভিস ওয়ার্কার
// অ্যাপ আপডেট করলে নিচের VERSION নম্বর বাড়িয়ে দিন (v1 → v2), তাহলে ফোনে নতুন সংস্করণ চলে আসবে।
const VERSION = 'bari-hisab-v5';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'bari-hisab-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // সিঙ্ক (POST) সরাসরি নেটে যাবে
  const url = new URL(req.url);
  // বাংলা ফন্ট (Google Fonts): একবার নামলে ফোনে রেখে দেয়, পরে অফলাইনেও চলে
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('bari-hisab-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== self.location.origin) return; // Google Script ইত্যাদি ক্যাশ নয়
  // নেট থাকলে নতুন ফাইল আনে ও ক্যাশ আপডেট করে, না থাকলে ক্যাশ থেকে দেয়
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
