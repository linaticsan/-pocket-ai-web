// Pocket AI V39 — stable touch navigation, no mutation-observer repair loops
(() => {
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let sheet=null;
function show(id){
 const view=$('#'+CSS.escape(id));if(!view)return false;
 $$('.view').forEach(v=>{const on=v===view;v.hidden=!on;v.classList.toggle('active',on)});
 $$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
 $('[data-more]')?.classList.toggle('active',['local','coding','github','surface'].includes(id));
 closeMore();window.scrollTo({top:0,left:0,behavior:'auto'});return true;
}
function closeMore(){if(!sheet)return;sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');document.body.classList.remove('v39-more-open')}
function makeMore(){
 sheet=$('#v39More');if(sheet)return;
 sheet=document.createElement('div');sheet.id='v39More';sheet.className='v39-more-sheet';sheet.setAttribute('aria-hidden','true');
 sheet.innerHTML='<button class="v39-scrim" aria-label="Close tools"></button><section class="v39-sheet" role="dialog" aria-modal="true" aria-label="More Pocket AI tools"><div class="v39-handle"></div><div class="v39-sheet-head"><div><small>POCKET AI</small><h2>More tools</h2></div><button class="v39-close" aria-label="Close">×</button></div><div class="v39-tools"><button data-v39-go="local"><b>🧠</b><span>Local AI</span><small>Private model</small></button><button data-v39-go="coding"><b>⌨️</b><span>Code</span><small>Build & preview</small></button><button data-v39-go="github"><b>💻</b><span>GitHub</span><small>Repositories</small></button><button data-v39-go="surface"><b>🔎</b><span>Research</span><small>Open sources</small></button></div><div class="v39-settings"><button data-v39-settings>⚙️ Settings</button><button data-v39-theme>🎨 Theme</button></div></section>';
 document.body.appendChild(sheet);
 $('.v39-scrim',sheet).onclick=closeMore;$('.v39-close',sheet).onclick=closeMore;
 $$('[data-v39-go]',sheet).forEach(b=>b.onclick=()=>show(b.dataset.v39Go));
 $('[data-v39-settings]',sheet).onclick=()=>{closeMore();$('#settingsOpen')?.click()};
 $('[data-v39-theme]',sheet).onclick=()=>{closeMore();$('#theme')?.click()};
}
function openMore(){makeMore();sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');document.body.classList.add('v39-more-open')}
function bind(){
 document.documentElement.classList.add('pocket-v39');
 document.documentElement.style.pointerEvents='auto';document.body.style.pointerEvents='auto';
 // Remove obsolete repair sheets if a stale script created one before V39.
 $('#pocketMore')?.remove();document.body.classList.remove('more-open');
 makeMore();
 const more=$('[data-more]');if(more){more.onclick=e=>{e.preventDefault();e.stopPropagation();openMore()}}
 // Capture navigation once, without observing/mutating classes continuously.
 document.addEventListener('click',e=>{
  const quick=e.target.closest?.('[data-quick]');
  if(quick){const map={research:'surface',study:'chat',code:'coding'};const id=map[quick.dataset.quick]||quick.dataset.quick;if(show(id)){e.preventDefault();e.stopImmediatePropagation();return}}
  const go=e.target.closest?.('[data-go]');
  if(go&&show(go.dataset.go)){e.preventDefault();e.stopImmediatePropagation()}
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMore()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.PocketV39={show,openMore,closeMore};
})();