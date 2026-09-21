const f=id=>document.getElementById(id);

// Files: live size feedback and small UX safety.
function updateFileCount(){const t=f('fileText')?.value||'';if(f('fileCount'))f('fileCount').textContent=`${t.length.toLocaleString()} characters • ${new Blob([t]).size.toLocaleString()} bytes`;}
f('fileText')?.addEventListener('input',updateFileCount);f('fileInput')?.addEventListener('change',()=>setTimeout(updateFileCount,60));f('clearFile')?.addEventListener('click',()=>setTimeout(updateFileCount,20));updateFileCount();

document.querySelectorAll('[data-gh-chip]').forEach(b=>b.addEventListener('click',()=>{f('ghQuery').value=b.dataset.ghChip;f('ghForm').requestSubmit();}));
f('deepResearch')?.addEventListener('click',()=>{if(!f('surfaceQuery').value.trim())return;const steps=f('researchSteps');steps.hidden=false;steps.querySelectorAll('span').forEach((s,i)=>{s.style.opacity=i?'.48':'1'});let i=0;const timer=setInterval(()=>{if(!f('deepResearch').disabled){clearInterval(timer);steps.querySelectorAll('span').forEach(s=>s.style.opacity='1');return}i=Math.min(i+1,3);steps.querySelectorAll('span').forEach((s,n)=>s.style.opacity=n<=i?'1':'.48');},1600);},{capture:true});
function addDiagnostics(){const box=document.createElement('details');box.className='diagnostics';box.innerHTML='<summary><strong>System check</strong> <span class="muted">• test this feature on this device</span></summary><div class="diag-list"></div><div class="row"><button type="button" class="run-diag">Run checks</button></div>';f('local')?.append(box);box.querySelector('.run-diag').onclick=runDiagnostics;}
function row(name,state,text){const d=document.createElement('div');d.className='diag-row';const a=document.createElement('span');a.textContent=name;const b=document.createElement('strong');b.className='diag-'+state;b.textContent=text;d.append(a,b);return d;}
async function fetchCheck(url,opts={}){try{const r=await fetch(url,{...opts,cache:'no-store'});return r.ok?['pass','OK']:['warn','HTTP '+r.status]}catch{return['fail','Blocked/offline']}}
async function runDiagnostics(){const list=document.querySelector('.diag-list');list.replaceChildren(row('Browser','pass','Running'),row('HTTPS',location.protocol==='https:'?'pass':'warn',location.protocol==='https:'?'Secure':'Not HTTPS'),row('Network',navigator.onLine?'pass':'warn',navigator.onLine?'Online':'Offline'));let storage='pass',storageText='Available';try{localStorage.setItem('__pocket_test','1');localStorage.removeItem('__pocket_test')}catch{storage='fail';storageText='Unavailable'}list.append(row('Device storage',storage,storageText));let gpu='fail',gpuText='Unavailable';if(navigator.gpu){try{gpu=(await navigator.gpu.requestAdapter())?'pass':'warn';gpuText=gpu==='pass'?'WebGPU ready':'No adapter'}catch{gpu='fail'}}list.append(row('Local AI acceleration',gpu,gpuText));const [ghState,ghText]=await fetchCheck('https://api.github.com/rate_limit',{headers:{Accept:'application/vnd.github+json'}});list.append(row('GitHub public API',ghState,ghText));const [crState,crText]=await fetchCheck('https://api.crossref.org/works?rows=0');list.append(row('Research source',crState,crText));list.append(row('Pocket AI','pass','Local-first • no AI account login'));list.append(row('Local model','warn',localStorage.getItem('pocket-local-webllm-installed')==='1'?'Installed • connect to test':'Not installed'));}
addDiagnostics();

f('prompt')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&innerWidth>650){e.preventDefault();f('chatForm').requestSubmit(f('chatSend'));}});
document.addEventListener('click',e=>{const go=e.target.closest?.('[data-go]');if(!go)return;requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));},{capture:false});
function syncWorkspaceStates(){
 const ghEmpty=!(f('ghResults')?.children.length);
 f('github')?.classList.toggle('is-empty',ghEmpty);
 const hasResults=!!f('surfaceResults')?.children.length;
 const report=f('researchReport');
 const hasReport=!!report&&!report.hidden&&!!report.textContent.trim();
 f('surface')?.classList.toggle('is-empty',!hasResults&&!hasReport);
}
f('ghForm')?.addEventListener('submit',()=>f('github')?.classList.remove('is-empty'),{capture:true});f('surfaceForm')?.addEventListener('submit',()=>f('surface')?.classList.remove('is-empty'),{capture:true});f('deepResearch')?.addEventListener('click',()=>f('surface')?.classList.remove('is-empty'),{capture:true});syncWorkspaceStates();
function networkState(){document.documentElement.dataset.network=navigator.onLine?'online':'offline';}addEventListener('online',networkState);addEventListener('offline',networkState);networkState();

try{const k='pocket-v3-chats',a=JSON.parse(localStorage.getItem(k)||'[]');if(Array.isArray(a)){let kept=false;const clean=a.filter(c=>{const blank=(c?.title||'New chat')==='New chat'&&(!Array.isArray(c?.messages)||c.messages.length===0);if(!blank)return true;if(kept)return false;kept=true;return true});if(clean.length!==a.length)localStorage.setItem(k,JSON.stringify(clean));}}catch(err){console.warn('Pocket AI chat history cleanup skipped',err)}

const v3style=document.createElement('link');v3style.rel='stylesheet';v3style.href='./v3.css?v=20260921-v76';document.head.appendChild(v3style);
const v3hotfix=document.createElement('link');v3hotfix.rel='stylesheet';v3hotfix.href='./v3-hotfix.css?v=20260921-v76';document.head.appendChild(v3hotfix);
const codeStyle=document.createElement('link');codeStyle.rel='stylesheet';codeStyle.href='./coding-v1.css?v=20260918-1';document.head.appendChild(codeStyle);
const mobile30=document.createElement('link');mobile30.rel='stylesheet';mobile30.href='./mobile-v30.css?v=20260921-v76';document.head.appendChild(mobile30);const lib33=document.createElement('link');lib33.rel='stylesheet';lib33.href='./library-v33.css?v=20260920-v53';document.head.appendChild(lib33);const lib34=document.createElement('link');lib34.rel='stylesheet';lib34.href='./library-online-v34.css?v=20260920-v52';document.head.appendChild(lib34);const wn42=document.createElement('link');wn42.rel='stylesheet';wn42.href='./webnovel-v42.css?v=20260920-v52';document.head.appendChild(wn42);const files31=document.createElement('link');files31.rel='stylesheet';files31.href='./files-v31.css?v=20260920-v52';document.head.appendChild(files31);const motion32=document.createElement('link');motion32.rel='stylesheet';motion32.href='./motion-v32.css?v=20260921-v59';document.head.appendChild(motion32);const ui59=document.createElement('link');ui59.rel='stylesheet';ui59.href='./ui-v59.css?v=20260921-v77';document.head.appendChild(ui59);const chat77=document.createElement('link');chat77.rel='stylesheet';chat77.href='./chat-v77.css?v=20260921-v78';document.head.appendChild(chat77);
// Emergency performance safe mode: keep the stable V3 core interactive and remove
// additive workspaces that can leave expensive observers/DOM behind on mobile.
try{
  const filesPanel=document.getElementById('files');
  document.getElementById('artifactShell')?.remove();
  filesPanel?.classList.remove('artifact-v3');
  filesPanel?.querySelectorAll('.artifact-old').forEach(el=>el.classList.remove('artifact-old'));
  document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close()}catch{}});
  document.documentElement.classList.add('pocket-performance-safe');
  const safeStyle=document.createElement('style');
  safeStyle.id='pocketPerformanceSafe';
  safeStyle.textContent='.pocket-performance-safe .sky{display:none!important}.pocket-performance-safe .mascot,.pocket-performance-safe [data-mascot]{animation:none!important}.pocket-performance-safe *{scroll-behavior:auto!important}';
  document.head.appendChild(safeStyle);
}catch(err){console.warn('Pocket AI safe-mode cleanup skipped',err)}
(async()=>{
 const load=async(path)=>{try{return await import(path)}catch(err){console.error('Pocket AI optional module failed:',path,err);return null}};
 await Promise.all([load('./api-hub.js?v=20260921-v74'),load('./v3.js?v=20260921-v78')]);
 await load('./v3-guard.js?v=20260920-v56');
 await load('./ui-v59.js?v=20260921-v78');
 await Promise.all([
   load('./coding-v1.js?v=20260921-v74'),
   load('./files-v32.js?v=20260921-v74'),
   load('./library-v33.js?v=20260921-v74')
 ]);
 await load('./library-online-v34.js?v=20260921-v74');
 await load('./webnovel-v42.js?v=20260921-v74');
})();

