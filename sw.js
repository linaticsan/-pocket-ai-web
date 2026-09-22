const CACHE='pocket-ai-web-v97';
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon.svg","./styles.css","./boot-v83.css","./polish.css","./panels-v2.css","./ux-v39.css","./home-v45.css","./nav-fix-v61.css","./reference-ui-v89.css","./responsive-v92.css","./desktop-v97.css","./v3.css","./v3-hotfix.css","./coding-v1.css","./mobile-v30.css","./library-v33.css","./library-online-v34.css","./webnovel-v42.css","./files-v31.css","./motion-v32.css","./ui-v59.css","./chat-v77.css","./files-v80.css","./visibility-v82.css","./polish-v84.css","./simple-v87.css","./boot-v83.js","./app.js","./local-oneclick.js","./workspace.js","./feature-v2.js","./ux-v39.js","./polish-v84.js","./reference-ui-v89.js","./responsive-v92.js","./api-hub.js","./v3.js","./v3-guard.js","./ui-v59.js","./library-v33.js","./coding-v1.js","./files-v32.js","./library-online-v34.js","./webnovel-v42.js","./qa-v79.js"];
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
