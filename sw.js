const APP_CACHE_PREFIX='pocket-ai-web-shell-';
const CACHE=APP_CACHE_PREFIX+'v43';
const BUILD='step38-copy-dedup-cleanup';
const LEGACY_APP_CACHES=['pocket-ai-web-step1-css'];

const CORE_ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg',
  './boot-v83.css','./boot-v83.js','./icons-v132.css','./icons-v132.js',
  './ui-core.css','./app.js','./workspace.js','./feature-v2.js',
  './ux-v39.js','./responsive-v92.js',
  './api-hub.js','./local-oneclick.js','./v3.css',
  './v3.js','./v3-guard.js','./chat-v77.css','./library-v33.css',
  './library-v33.js','./motion-v32.css'
];

const OPTIONAL_ASSETS=[
  './coding-v1.css','./coding-v1.js',
  './files-v31.css','./files-v32.js','./files-v80.css',
  './library-online-v34.css','./library-online-v34.js',
  './webnovel-v42.css','./webnovel-v42.js'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>
          (key.startsWith(APP_CACHE_PREFIX)||LEGACY_APP_CACHES.includes(key)) &&
          key!==CACHE
        )
        .map(key=>caches.delete(key))
    );
    if(self.registration.navigationPreload){
      try{await self.registration.navigationPreload.enable()}catch{}
    }
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:'POCKET_SW_VERSION',build:BUILD,cache:CACHE}));
  })());
});

async function networkNavigation(event,cache){
  try{
    const preload=await event.preloadResponse;
    if(preload?.ok){
      await cache.put('./index.html',preload.clone());
      return preload;
    }
    const response=await fetch(event.request);
    if(response.ok)await cache.put('./index.html',response.clone());
    return response;
  }catch{
    return (await cache.match('./index.html'))||(await cache.match('./'))||Response.error();
  }
}

self.addEventListener('message',event=>{
  if(event.data?.type==='POCKET_GET_VERSION'){
    event.source?.postMessage?.({type:'POCKET_SW_VERSION',build:BUILD,cache:CACHE});
  }
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      return networkNavigation(event,cache);
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request);
    if(cached){
      event.waitUntil(
        fetch(event.request)
          .then(response=>{
            if(response.ok)return cache.put(event.request,response.clone());
          })
          .catch(()=>{})
      );
      return cached;
    }
    try{
      const response=await fetch(event.request);
      if(response.ok)event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
      return response;
    }catch{
      return (await cache.match(event.request,{ignoreSearch:true}))||Response.error();
    }
  })());
});
