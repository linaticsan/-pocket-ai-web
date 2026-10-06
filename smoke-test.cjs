const fs=require('fs');
const path=require('path');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const root=__dirname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const exists=f=>fs.existsSync(path.join(root,f));

const index=read('index.html');
const sw=read('sw.js');
const app=read('app.js');
const workspace=read('workspace.js');
const feature=read('feature-v2.js');
const ux=read('ux-v39.js');
const responsive=read('responsive-v92.js');
const icons=read('icons-v132.js');
const uiCore=read('ui-core.css');
const pocketCss=read('pocket-mascot.css');
const pocketJs=read('pocket-mascot.js');
const environmentJs=read('pocket-environment.js');
const environmentCss=read('pocket-environment.css');
const manifest=JSON.parse(read('manifest.webmanifest'));

// 1. Local asset integrity.
const localRefs=new Set();
for(const source of [index,feature]){
  for(const m of source.matchAll(/(?:src|href|load\()\s*=?\s*["']\.\/([^"'?]+\.(?:js|css|webmanifest|svg))(?:\?[^"']*)?["']/g)) localRefs.add(m[1]);
}
for(const f of localRefs) assert(exists(f),'Missing referenced asset: '+f);

// 2. Root browser JavaScript must parse.
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.js'))){
  try{new Function(read(f))}catch(e){throw new Error('Syntax error in '+f+': '+e.message)}
}

// 3. No duplicate real HTML IDs.
const ids=[...index.matchAll(/(?:^|\s)id=["']([^"']+)["']/g)].map(m=>m[1]);
const duplicateIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
assert(duplicateIds.length===0,'Duplicate HTML ids: '+duplicateIds.join(', '));

// 4. Build/version synchronization.
const pageBuild=/const BUILD='([^']+)'/.exec(index)?.[1];
const swBuild=/const BUILD='([^']+)'/.exec(sw)?.[1];
assert(pageBuild,'Page build marker is missing');
assert(swBuild,'Service-worker build marker is missing');
assert(pageBuild===swBuild,'Page/SW build mismatch: '+pageBuild+' vs '+swBuild);
assert(index.includes('window.__POCKET_BUILD=BUILD'),'Global page build identifier is missing');
assert(workspace.includes("const POCKET_BUILD=window.__POCKET_BUILD||'"+pageBuild+"'"),'Diagnostics build fallback is out of sync');
assert(workspace.includes("url.searchParams.set('v',POCKET_BUILD+'-refresh-'+Date.now())"),'Refresh app files must use the current build marker');
assert(index.includes('manifest.webmanifest?v=20261006-'+pageBuild),'Manifest cache-bust is out of sync');
assert(index.includes('icon.svg?v=20261006-'+pageBuild),'Icon cache-bust is out of sync');
assert(manifest.icons?.some(x=>String(x.src||'').includes(pageBuild)),'Manifest icon cache-bust is out of sync');
assert(index.includes('<dt>Build</dt><dd>STEP '+pageBuild.match(/step(\d+)/i)?.[1]+'</dd>'),'Visible diagnostics build label is stale');

// 5. PWA/offline safety.
assert(app.includes("navigator.serviceWorker.register('./sw.js'"),'Service-worker registration is missing');
assert(sw.includes("event.request.mode==='navigate'"),'Navigation fallback is missing');
assert(sw.includes('ignoreSearch:true'),'Offline cache-bust fallback must ignore query strings');
assert(sw.includes('navigationPreload.enable()'),'Navigation preload is missing');
assert(sw.includes('const CORE_ASSETS=')&&sw.includes('const OPTIONAL_ASSETS='),'Core/optional cache split is missing');
assert(!sw.includes('await cacheOptional(cache)'),'Optional assets must not be eagerly cached');
assert(sw.includes("key.startsWith(APP_CACHE_PREFIX)"),'Service worker must only clear Pocket-owned caches');
assert(!/caches\.keys\(\)[\s\S]{0,450}map\([^)]*caches\.delete/.test(index),'Index must not globally delete caches');

// Every service-worker asset path must exist.
for(const m of sw.matchAll(/['"]\.\/([^"'?]+)['"]/g)){
  const f=m[1];
  if(!f||f==='')continue;
  assert(exists(f),'Service worker references missing asset: '+f);
}

// 6. Boot reliability.
assert(index.includes('window.__pocketForceBootClose=removeBoot'),'Inline boot closer is missing');
assert(/setTimeout\(\(\)=>\{[\s\S]*?removeBoot\(\);[\s\S]*?\},6500\)/.test(index),'6.5s boot watchdog is missing');
assert(index.includes("window.dispatchEvent(new CustomEvent('pocket-startup-timeout'))"),'Startup timeout event is missing');

// 7. Navigation and responsive ownership.
assert(ux.includes("const views=$$('body > main > .view');"),'Canonical navigation view list is missing');
assert(ux.includes('window.PocketNav={show}'),'Canonical PocketNav API is missing');
assert(!ux.includes('window.PocketV39'),'Legacy PocketV39 alias must stay removed');
assert(!responsive.includes('PocketV39'),'Responsive layer must use canonical navigation only');
assert(responsive.includes('function scheduleSync()'),'Resize work must remain throttled');

// 8. Theme engine.
assert(workspace.includes("const THEME_CHOICES=new Set(['light','dark','sakura','green','oled','system'])"),'Six-theme engine is missing');
assert(workspace.includes('root.dataset.themeChoice=choice'),'Theme choice state is missing');
for(const theme of ['dark','oled','sakura','green']){
  assert(pocketCss.includes('html[data-theme="'+theme+'"]'),'Mascot palette missing theme: '+theme);
}

// 9. One canonical mascot implementation.
assert(pocketJs.includes('window.PocketMascotViews={'),'Shared mascot renderer is missing');
assert(workspace.includes('window.PocketMascot={'),'Mascot controller is missing');
assert(workspace.includes('function lookMascotToward(')&&workspace.includes('lookAt:lookMascotToward'),'PocketMascot lookAt API must reference a defined helper');
assert(pocketCss.includes('STEP 69 — canonical refresh mascot'),'Canonical mascot CSS marker is missing');
for(const stale of ['STEP 65 — restored purple horned Pocket identity','STEP 66 — match the refresh/loading mascot exactly','STEP 67 — mascot identity is theme-invariant','STEP 68 — mascot palette follows the active app theme']){
  assert(!pocketCss.includes(stale),'Stale mascot override returned: '+stale);
}
assert((pocketCss.match(/STEP 69 — canonical refresh mascot/g)||[]).length===1,'Canonical mascot block must exist exactly once');
assert(!pocketCss.includes('STEP 62 — cute jelly polish'),'Obsolete STEP 62 mascot override returned');
assert(pocketCss.includes('STEP 88 — canonical scary Pocket identity'),'Canonical scary Pocket visual layer is missing');
assert(!pocketCss.includes('STEP 69 — canonical refresh mascot'),'Obsolete STEP 69 mascot override returned');
assert(!pocketCss.includes('STEP 87 — scary Pocket character'),'Obsolete STEP 87 mascot override returned');
assert(!uiCore.includes('sound-setting-row'),'Removed sound-settings CSS returned');
assert(pocketJs.includes('pocket-character__horn--left')&&pocketJs.includes('pocket-character__horn--right'),'Refresh-style mascot horns are missing');

// 10. Audio feature removal must remain complete.
for(const [name,source] of [['index',index],['workspace',workspace],['mascot',pocketJs]]){
  assert(!/data-sound|soundTest|soundStatus|PocketSound|AudioContext|pocket-sound-v1/.test(source),'Obsolete Pocket audio remains in '+name);
}
assert(!index.includes('value="audio"'),'Audio research option must stay removed');
assert(!/mode==='audio'|async function itunes\(/.test(app),'Audio research runtime must stay removed');

// 11. Environment ownership/safety.
assert(environmentCss.includes('#pocketEnvironment')&&environmentCss.includes('pointer-events:none'),'Environment overlay must not intercept input');
assert(!/weatherapi|openweathermap|fetch\(/i.test(environmentJs),'Base environment must remain offline/API-free');
assert(!environmentCss.includes('pocket-character__antenna'),'Environment CSS still targets removed antenna');

// 12. Known loop/duplication regressions.
assert(!icons.includes('new MutationObserver(()=>queueMicrotask(run))'),'Dangerous icon microtask observer must stay removed');
assert(!icons.includes("document.addEventListener('click',()=>queueMicrotask(run)"),'Icon click microtask loop must stay removed');
assert(!workspace.includes("document.querySelectorAll('[data-quick]').forEach(b=>b.onclick"),'Quick Action navigation must have one owner');
assert(!workspace.includes("q('settingsOpen').onclick"),'Settings dialog must have one owner');

// 13. Manifest essentials.
assert(manifest.name==='Pocket AI','Manifest name is wrong');
assert(manifest.display==='standalone','Manifest display mode must remain standalone');
assert(Array.isArray(manifest.icons)&&manifest.icons.length>0,'Manifest icon is missing');
assert(manifest.categories?.includes('productivity'),'Manifest productivity category is missing');

console.log('Pocket AI smoke checks passed for '+pageBuild+' ('+ids.length+' unique IDs, '+localRefs.size+' linked assets).');
