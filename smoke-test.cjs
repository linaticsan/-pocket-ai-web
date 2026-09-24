const fs=require('fs');
const path=require('path');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const index=read('index.html');
const feature=read('feature-v2.js');
const sw=read('sw.js');
const ux=read('ux-v39.js');
const app=read('app.js');
const icons=read('icons-v132.js');
const refs=new Set();
for(const m of index.matchAll(/(?:src|href)=["']\.\/([^"'?]+\.(?:js|css|webmanifest|svg))(?:\?[^"']*)?["']/g))refs.add(m[1]);
for(const m of feature.matchAll(/["']\.\/([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g))refs.add(m[1]);
for(const f of refs)assert(fs.existsSync(path.join(__dirname,f)),'Missing referenced asset: '+f);
for(const f of [...refs].filter(x=>x.endsWith('.js'))){
  try{new Function(read(f))}catch(e){throw new Error('Syntax error in '+f+': '+e.message)}
}
for(const f of refs)assert(sw.includes("'./"+f+"'")||sw.includes('"./'+f+'"'),'Service worker does not precache current asset: '+f);
assert(ux.includes("$$('body > main > .view').forEach"),'Navigation show() must use the multi-element selector');
assert(ux.includes("const views=$$('body > main > .view');"),'Navigation normalization must use the multi-element selector');
assert(app.includes("navigator.serviceWorker.register('./sw.js'"),'Service worker registration is missing');
assert(sw.includes("ignoreSearch:true"),'Offline cache must ignore cache-busting query strings');
assert(sw.includes("event.request.mode==='navigate'"),'Offline HTML fallback must be navigation-only');

assert(index.includes("const BUILD='step9-sound'"),'STEP 9 build marker is missing');
assert(index.includes('window.__pocketForceBootClose=removeBoot'),'Independent inline boot closer is missing');
assert(index.includes('setTimeout(removeBoot,6500)'),'Independent 6.5s inline boot watchdog is missing');
assert(index.indexOf('setTimeout(removeBoot,6500)')<index.indexOf('src="./boot-v83.js'),'Inline boot watchdog must be defined before external boot-v83.js');
assert(sw.includes("const CACHE=APP_CACHE_PREFIX+'v8'"),'STEP 9 app-shell cache must be v8');
assert(!icons.includes('new MutationObserver(()=>queueMicrotask(run))'),'Dangerous icon MutationObserver microtask loop must not return');
assert(!icons.includes("document.addEventListener('click',()=>queueMicrotask(run)"),'Icon click refresh must not queue run() as a microtask');
assert(icons.includes('function scheduleIconRun()'),'Coalesced icon scheduler is missing');
assert(icons.includes('requestAnimationFrame'),'Icon scheduler must yield to the browser');
assert(icons.includes('function ensureIcon('),'Idempotent icon helper is missing');
assert(index.includes('./icons-v132.js?v=20260924-step8c'),'STEP 8C icon cache-bust is missing');
assert(index.includes('data-sound="off"')&&index.includes('data-sound="on"'),'Sound settings controls are missing');
const workspace=read('workspace.js');
assert(workspace.includes("const SOUND_KEY='pocket-sound-v1'"),'Sound storage key is missing');
assert(workspace.includes('function playPocketSound(type)'),'Central Pocket sound API is missing');
assert(workspace.includes('window.AudioContext||window.webkitAudioContext'),'iOS-compatible Web Audio fallback is missing');
const ids=[...index.matchAll(/\sid=["']([^"']+)["']/g)].map(m=>m[1]);
const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);
assert(dup.length===0,'Duplicate static IDs: '+[...new Set(dup)].join(', '));
for(const id of ['home','chat','files','local','github','surface','bottomNav','settingsDialog','commandDialog','chatForm','prompt'])assert(ids.includes(id),'Missing core DOM id: '+id);
console.log('Pocket AI smoke checks passed:',refs.size,'current assets verified.');
