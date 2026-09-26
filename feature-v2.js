const f=id=>document.getElementById(id);

// Files: live size feedback and small UX safety.
function updateFileCount(){const t=f('fileText')?.value||'';if(f('fileCount'))f('fileCount').textContent=`${t.length.toLocaleString()} characters • ${new Blob([t]).size.toLocaleString()} bytes`;}
f('fileText')?.addEventListener('input',updateFileCount);f('fileInput')?.addEventListener('change',()=>setTimeout(updateFileCount,60));f('clearFile')?.addEventListener('click',()=>setTimeout(updateFileCount,20));updateFileCount();

document.querySelectorAll('[data-gh-chip]').forEach(b=>b.addEventListener('click',()=>{f('ghQuery').value=b.dataset.ghChip;f('ghForm').requestSubmit();}));
f('deepResearch')?.addEventListener('click',()=>{if(!f('surfaceQuery').value.trim())return;const steps=f('researchSteps');steps.hidden=false;steps.querySelectorAll('span').forEach((s,i)=>{s.style.opacity=i?'.48':'1'});let i=0;const timer=setInterval(()=>{if(!f('deepResearch').disabled){clearInterval(timer);steps.querySelectorAll('span').forEach(s=>s.style.opacity='1');return}i=Math.min(i+1,3);steps.querySelectorAll('span').forEach((s,n)=>s.style.opacity=n<=i?'1':'.48');},1600);},{capture:true});
function addDiagnostics(){const box=document.createElement('details');box.className='diagnostics';box.innerHTML='<summary><strong>System check</strong> <span class="muted">• test this feature on this device</span></summary><div class="diag-list"></div><div class="row"><button type="button" class="run-diag">Run checks</button></div>';f('local')?.append(box);box.querySelector('.run-diag').onclick=runDiagnostics;}
function row(name,state,text){const d=document.createElement('div');d.className='diag-row';const a=document.createElement('span');a.textContent=name;const b=document.createElement('strong');b.className='diag-'+state;b.textContent=text;d.append(a,b);return d;}
async function fetchCheck(url,opts={}){try{const r=await fetch(url,{...opts,cache:'no-store'});return r.ok?['pass','OK']:['warn','HTTP '+r.status]}catch{return['fail','Blocked/offline']}}
async function runDiagnostics(){const list=document.querySelector('.diag-list');if(!list)return;list.replaceChildren(row('Browser','pass','Running'),row('HTTPS',location.protocol==='https:'?'pass':'warn',location.protocol==='https:'?'Secure':'Not HTTPS'),row('Network',navigator.onLine?'pass':'warn',navigator.onLine?'Online':'Offline'));let storage='pass',storageText='Available';try{localStorage.setItem('__pocket_test','1');localStorage.removeItem('__pocket_test')}catch{storage='fail';storageText='Unavailable'}list.append(row('Device storage',storage,storageText));let gpu='fail',gpuText='Unavailable';if(navigator.gpu){try{gpu=(await navigator.gpu.requestAdapter())?'pass':'warn';gpuText=gpu==='pass'?'WebGPU ready':'No adapter'}catch{gpu='fail'}}list.append(row('Local AI acceleration',gpu,gpuText));const [ghState,ghText]=await fetchCheck('https://api.github.com/rate_limit',{headers:{Accept:'application/vnd.github+json'}});list.append(row('GitHub public API',ghState,ghText));const [crState,crText]=await fetchCheck('https://api.crossref.org/works?rows=0');list.append(row('Research source',crState,crText));list.append(row('Pocket AI','pass','Local-first • no AI account login'));list.append(row('Local model','warn',localStorage.getItem('pocket-local-webllm-installed')==='1'?'Installed • connect to test':'Not installed'));}
addDiagnostics();

f('prompt')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&innerWidth>650){e.preventDefault();f('chatForm').requestSubmit(f('chatSend'));}});
function syncWorkspaceStates(){
 const ghEmpty=!(f('ghResults')?.children.length);
 f('github')?.classList.toggle('is-empty',ghEmpty);
 const hasResults=!!f('surfaceResults')?.children.length;
 const report=f('researchReport');
 const hasReport=!!report&&!report.hidden&&!!report.textContent.trim();
 f('surface')?.classList.toggle('is-empty',!hasResults&&!hasReport);
}
f('ghForm')?.addEventListener('submit',()=>f('github')?.classList.remove('is-empty'),{capture:true});f('surfaceForm')?.addEventListener('submit',()=>f('surface')?.classList.remove('is-empty'),{capture:true});f('deepResearch')?.addEventListener('click',()=>f('surface')?.classList.remove('is-empty'),{capture:true});syncWorkspaceStates();

try{const k='pocket-v3-chats',a=JSON.parse(localStorage.getItem(k)||'[]');if(Array.isArray(a)){let kept=false;const clean=a.filter(c=>{const blank=(c?.title||'New chat')==='New chat'&&(!Array.isArray(c?.messages)||c.messages.length===0);if(!blank)return true;if(kept)return false;kept=true;return true});if(clean.length!==a.length)localStorage.setItem(k,JSON.stringify(clean));}}catch(err){console.warn('Pocket AI chat history cleanup skipped',err)}

const loadedStyles=new Map();
const loadedModules=new Map();
function addPocketStyle(href){
  const base=href.split('?')[0];
  if(loadedStyles.has(base))return loadedStyles.get(base);
  const existing=document.querySelector('link[href^="'+base+'"]');
  if(existing){loadedStyles.set(base,Promise.resolve(existing));return loadedStyles.get(base)}
  const promise=new Promise(resolve=>{
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;
    link.onload=()=>resolve(link);link.onerror=()=>resolve(link);
    document.head.appendChild(link);
  });
  loadedStyles.set(base,promise);
  return promise;
}
function loadPocketModule(path){
  const base=path.split('?')[0];
  if(!loadedModules.has(base)){
    loadedModules.set(base,import(path).catch(err=>{console.error('Pocket AI optional module failed:',path,err);return null}));
  }
  return loadedModules.get(base);
}
const coreStyles=[
 './v3.css?v=20260925-step19-css-debt',
 './library-v33.css?v=20260925-step19-css-debt',
 './motion-v32.css?v=20260921-v59',
 './chat-v77.css?v=20260925-step20c-chat-focus'
];
coreStyles.forEach(addPocketStyle);
const coreStyle=document.querySelector('link[href*="ui-core.css"]');
if(coreStyle&&coreStyle!==document.head.lastElementChild)document.head.appendChild(coreStyle);

const FEATURE_BUNDLES={
  coding:{
    styles:['./coding-v1.css?v=20260918-1'],
    modules:['./coding-v1.js?v=20260925-step16']
  },
  files:{
    styles:['./files-v31.css?v=20260925-step19-css-debt','./files-v80.css?v=20260925-step19-css-debt'],
    modules:['./files-v32.js?v=20260922-v88']
  },
  library:{
    styles:['./library-online-v34.css?v=20260920-v52','./webnovel-v42.css?v=20260920-v52'],
    modules:['./library-online-v34.js?v=20260922-v94','./webnovel-v42.js?v=20260922-v94']
  }
};
function ensureFeatureBundle(name){
  const bundle=FEATURE_BUNDLES[name];if(!bundle)return Promise.resolve([]);
  if(bundle.promise)return bundle.promise;
  bundle.promise=Promise.all([
    ...bundle.styles.map(addPocketStyle),
    ...bundle.modules.map(loadPocketModule)
  ]);
  return bundle.promise;
}
window.PocketFeatures={ensure:ensureFeatureBundle,ready:Promise.resolve()};

function featureFromTrigger(el){
  const key=el?.dataset?.go||el?.dataset?.paSide||el?.dataset?.roomAction||'';
  if(key==='coding')return'coding';
  if(key==='files')return'files';
  if(key==='library')return'library';
  return'';
}
document.addEventListener('pointerdown',e=>{
  const name=featureFromTrigger(e.target.closest?.('[data-go],[data-pa-side],[data-room-action]'));
  if(name)ensureFeatureBundle(name);
},{capture:true,passive:true});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const name=featureFromTrigger(e.target.closest?.('[data-go],[data-pa-side],[data-room-action]'));
  if(name)ensureFeatureBundle(name);
},{capture:true});

(async()=>{
 const started=performance.now();
 await Promise.all([
   loadPocketModule('./api-hub.js?v=20260922-v88'),
   loadPocketModule('./v3.js?v=20260925-step16'),
   loadPocketModule('./v3-guard.js?v=20260925-step12'),
   loadPocketModule('./library-v33.js?v=20260922-v94')
 ]);
 window.dispatchEvent(new CustomEvent('pocket-core-ready',{detail:{ms:Math.round(performance.now()-started)}}));

 // Keep optional workspaces genuinely lazy. They load only when the user points,
 // taps, or keyboard-activates their navigation target.
 window.PocketFeatures.ready=Promise.resolve();
 window.dispatchEvent(new CustomEvent('pocket-features-ready'));
})();