// Pocket AI V37 — mobile glitch/duplicate control repair
(() => {
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let observer,scheduled=false;
const toolNames=new Set(['local','coding','github','surface']);
function cleanToolbar(){
 const bar=$('.v3-top-controls'); if(!bar)return;
 const defs=[['#v3Api','⚡','AI connections'],['#v3Study','🎓','Study mode'],['#v3Library','📚','Library context'],['#v3MobileHistory','☰','Chat history']];
 defs.forEach(([sel,icon,label])=>{const b=$(sel,bar);if(!b)return;if(b.dataset.v37!=='1'){b.textContent=icon;b.dataset.v37='1'}b.setAttribute('aria-label',label);b.title=label});
}
function cleanNav(){
 const nav=$('.tabs');if(!nav)return;
 // Remove accidental duplicates while preserving the first live destination.
 const seen=new Set();$$('[data-go]',nav).forEach(b=>{const k=b.dataset.go;if(seen.has(k)){b.remove();return}seen.add(k)});
 // V1 Coding Studio uses "coding" (not "code").
 const order=['home','chat','library','files','more'];
 const more=$('[data-go="more"]',nav);
 if(more)order.forEach(k=>{const b=$('[data-go="'+k+'"]',nav);if(b)nav.appendChild(b)});
 // Secondary tools are intentionally reached through More on phones.
 $$('[data-go]',nav).forEach(b=>{const k=b.dataset.go;b.classList.toggle('v37-secondary',toolNames.has(k))});
}
function fixMore(){
 const d=$('#pocketMore');if(!d)return;
 const code=$('[data-v36-go="code"]',d);if(code)code.dataset.v36Go='coding';
 const qa=$('.v36-sheet-actions a',d);if(qa)qa.href='./qa-v37.html';
}
function syncMoreActive(){
 const nav=$('.tabs');if(!nav)return;const more=$('[data-go="more"]',nav);if(!more)return;
 const active=$('.view.active:not([hidden]),.view:not([hidden])');const id=active?.id||'';
 more.classList.toggle('active',toolNames.has(id));
}
function repair(){
 scheduled=false;document.documentElement.classList.add('pocket-v37');cleanToolbar();cleanNav();fixMore();syncMoreActive();
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(repair)}
function start(){repair();observer=new MutationObserver(queue);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','data-go']});document.addEventListener('click',e=>{if(e.target.closest?.('[data-go],[data-v36-go]'))setTimeout(repair,0)},true);setTimeout(repair,500);setTimeout(repair,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.PocketV37={repair};
})();