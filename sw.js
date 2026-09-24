const APP_CACHE_PREFIX='pocket-ai-web-shell-';
const CACHE=APP_CACHE_PREFIX+'v6';
const LEGACY_APP_CACHES=['pocket-ai-web-step1-css'];

const ASSETS=["./","./index.html","./api-hub.js","./app.js","./boot-v83.css","./boot-v83.js","./chat-v77.css","./coding-v1.css","./coding-v1.js","./desktop-workspace-v115.js","./feature-v2.js","./files-v31.css","./files-v32.js","./files-v80.css","./icon.svg","./icons-v132.css","./icons-v132.js","./library-online-v34.css","./library-online-v34.js","./library-v33.css","./library-v33.js","./local-oneclick.js","./manifest.webmanifest","./mobile-v30.css","./motion-v32.css","./photo-ui-v100.js","./polish-v84.css","./polish-v84.js","./qa-v79.js","./reference-ui-v89.js","./responsive-v92.js","./simple-v87.css","./ui-core.css","./ui-v59.css","./ui-v59.js","./ux-v39.js","./v3-guard.js","./v3-hotfix.css","./v3.css","./v3.js","./visibility-v82.css","./webnovel-v42.css","./webnovel-v42.js","./workspace.js"];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(key=>
            (key.startsWith(APP_CACHE_PREFIX)||LEGACY_APP_CACHES.includes(key)) &&
            key!==CACHE
          )
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE)
            .then(cache=>cache.put(event.request,copy))
            .catch(()=>{});
        }
        return response;
      })
      .catch(async()=>{
        const cache=await caches.open(CACHE);
        const hit=await cache.match(event.request,{ignoreSearch:true});
        if(hit)return hit;
        if(event.request.mode==='navigate'){
          return (await cache.match('./index.html'))||Response.error();
        }
        return Response.error();
      })
  );
});
