// Pocket AI V38 — resilient mobile navigation + home grid repair
(() => {
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let queued=false,obs=null;
const secondary=new Set(['local','coding','code','github','surface']);
function closeMore(){const d=$('#pocketMore');if(d){d.classList.remove('open');d.setAttribute('aria-hidden','true')}document.body.classList.remove('more-open')}
function go(name){const target=name==='code'?'coding':name;const b=$('.tabs [data-go="'+target+'"]');if(b){b.click();closeMore();setTimeout(()=>scrollTo({top:0,left:0,behavior:'auto'}),20)}}
function makeMore(){
 const nav=$('.tabs');if(!nav)return;
 let more=$('[data-go="more"]',nav);if(!more){more=document.createElement('button');more.type='button';more.dataset.go='more';more.className='v38-more';more.innerHTML='•••<span>More</span>';more.setAttribute('aria-label','More tools');nav.appendChild(more)}
 let d=$('#pocketMore');if(!d){d=document.createElement('div');d.id='pocketMore';d.className='v36-more-sheet';d.setAttribute('aria-hidden','true');d.innerHTML='<button class="v36-scrim" aria-label="Close more tools"></button><section class="v36-sheet" role="dialog" aria-modal="true" aria-label="Pocket AI tools"><div class="v36-handle"></div><div class="v36-sheet-head"><div><small>POCKET AI</small><h2>More tools</h2></div><button class="v36-close" aria-label="Close">×</button></div><div class="v36-tool-grid"><button data-v38-go="local"><b>🧠</b><span>Local AI</span><small>Private model</small></button><button data-v38-go="coding"><b>⌨️</b><span>Code</span><small>Build & preview</small></button><button data-v38-go="github"><b>⌘</b><span>GitHub</span><small>Repositories</small></button><button data-v38-go="surface"><b>🔎</b><span>Research</span><small>Open sources</small></button></div><div class="v36-sheet-actions"><button data-v38-settings>⚙️ Settings</button><button data-v38-theme>🎨 Theme</button><button data-v38-close>✓ Done</button></div></section>';document.body.appendChild(d)}
 if(more.dataset.v38!=='1'){more.dataset.v38='1';more.onclick=e=>{e.preventDefault();e.stopPropagation();const open=!d.classList.contains('open');d.classList.toggle('open',open);d.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('more-open',open)}}
 d.querySelector('.v36-scrim').onclick=closeMore;d.querySelector('.v36-close').onclick=closeMore;d.querySelector('[data-v38-close]')?.addEventListener('click',closeMore);
 $$('[data-v38-go]',d).forEach(b=>b.onclick=()=>go(b.dataset.v38Go));const st=$('[data-v38-settings]',d);if(st)st.onclick=()=>{closeMore();$('#settingsOpen')?.click()};const th=$('[data-v38-theme]',d);if(th)th.onclick=()=>{closeMore();$('#theme')?.click()};
}
function cleanNav(){
 const nav=$('.tabs');if(!nav)return;const seen=new Set();$$('[data-go]',nav).forEach(b=>{let k=b.dataset.go;if(k==='code')k='coding';if(seen.has(k)){b.remove();return}seen.add(k);if(b.dataset.go==='code')b.dataset.go='coding'});
 makeMore();['home','chat','library','files','more'].forEach(k=>{const b=$('[data-go="'+k+'"]',nav);if(b)nav.appendChild(b)});
 $$('[data-go]',nav).forEach(b=>b.classList.toggle('v38-secondary',secondary.has(b.dataset.go)));
}
function fixHome(){
 const g=$('.quick-grid');if(!g||g.querySelector('[data-quick="coding"]'))return;const b=document.createElement('button');b.dataset.quick='coding';b.innerHTML='<span>⌨️</span><strong>Code</strong><small>Build & preview</small>';b.onclick=()=>go('coding');g.appendChild(b);
}
function sync(){
 queued=false;document.documentElement.classList.add('pocket-v38');cleanNav();fixHome();
 const active=$('.view.active:not([hidden]),.view:not([hidden])')?.id||'';const m=$('.tabs [data-go="more"]');if(m)m.classList.toggle('active',secondary.has(active));
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync)}
function start(){sync();obs=new MutationObserver(queue);obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','data-go']});setTimeout(sync,400);setTimeout(sync,1200);setTimeout(sync,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.PocketV38={go,closeMore,repair:sync};
})();