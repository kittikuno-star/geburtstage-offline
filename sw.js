'use strict';
const PREFIX='geburtstage-offline-v140-release-';
const CACHE=PREFIX+'4e399065ed60716f';
const ASSETS=['./','./index.html','./offline-core.js','./offline-store.js','./legacy-ui.js','./offline-ui.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const allowed=new Set(ASSETS.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
// No skipWaiting: updates activate only after the previous app windows close.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!allowed.has(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;
  return fetch(event.request); // App-code assets only. No person data endpoints.
 }));
});
