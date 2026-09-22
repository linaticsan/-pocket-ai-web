const CACHE='pocket-ai-web-step1-css';
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon.svg","./boot-v83.css","./icons-v132.css","./ui-core.css","./boot-v83.js","./app.js","./local-oneclick.js","./workspace.js","./feature-v2.js","./ux-v39.js","./polish-v84.js","./reference-ui-v89.js","./responsive-v92.js","./photo-ui-v100.js","./desktop-workspace-v115.js","./icons-v132.js","./api-hub.js","./v3.js","./v3-guard.js","./ui-v59.js","./library-v33.js","./coding-v1.js","./files-v32.js","./library-online-v34.js","./webnovel-v42.js","./qa-v79.js"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
      return response;
    }).catch(async()=>{
      const hit=await caches.match(event.request,{ignoreSearch:true});
      if(hit)return hit;
      if(event.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
      return Response.error();
    })
  );
});
