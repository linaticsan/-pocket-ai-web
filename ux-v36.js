// Pocket AI V36 — compact mobile navigation, accessibility and UX polish
(() => {
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function go(name){const b=$('.tabs [data-go="'+name+'"]');if(b){b.click();closeMore();setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),30)}}
function closeMore(){const d=$('#pocketMore');if(d)d.classList.remove('open');document.body.classList.remove('more-open')}
function makeMore(){
 if($('#pocketMore'))return;
 const nav=$('.tabs');if(!nav)return;
 let more=$('[data-go="more"]',nav);if(!more){more=document.createElement('button');more.type='button';more.dataset.go='more';more.className='v36-more';more.innerHTML='•••<span>More</span>';more.setAttribute('aria-label','More tools');nav.appendChild(more)}
 const d=document.createElement('div');d.id='pocketMore';d.className='v36-more-sheet';d.setAttribute('aria-hidden','true');
 d.innerHTML='<button class="v36-scrim" aria-label="Close more tools"></button><section class="v36-sheet" role="dialog" aria-modal="true" aria-label="Pocket AI tools"><div class="v36-handle"></div><div class="v36-sheet-head"><div><small>POCKET AI</small><h2>More tools</h2></div><button class="v36-close" aria-label="Close">×</button></div><div class="v36-tool-grid"><button data-v36-go="local"><b>🧠</b><span>Local AI</span><small>Private model</small></button><button data-v36-go="code"><b>⌨️</b><span>Code</span><small>Build & preview</small></button><button data-v36-go="github"><b>⌘</b><span>GitHub</span><small>Repositories</small></button><button data-v36-go="surface"><b>🔎</b><span>Research</span><small>Open sources</small></button></div><div class="v36-sheet-actions"><button data-v36-settings>⚙️ Settings</button><button data-v36-theme>🎨 Change theme</button><a href="./qa-v36.html" target="_blank" rel="noopener">✓ QA report</a></div></section>';
 document.body.appendChild(d);
 more.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=!d.classList.contains('open');d.classList.toggle('open',open);d.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('more-open',open)});
 $('.v36-scrim',d).onclick=closeMore;$('.v36-close',d).onclick=closeMore;
 $$('[data-v36-go]',d).forEach(b=>b.onclick=()=>go(b.dataset.v36Go));
 $('[data-v36-settings]',d).onclick=()=>{closeMore();$('#settingsOpen')?.click()};
 $('[data-v36-theme]',d).onclick=()=>{closeMore();$('#theme')?.click()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMore()});
}
function labels(){
 const map={home:'Home',chat:'Chat',local:'Local AI',library:'Library',files:'Files',code:'Code',github:'GitHub',surface:'Research'};
 $$('.tabs [data-go]').forEach(b=>{const n=b.dataset.go;if(map[n])b.setAttribute('aria-label',map[n])});
 $$('button').forEach(b=>{if(!b.getAttribute('aria-label')&&!b.textContent.trim())b.setAttribute('aria-label','Action')});
}
function status(){
 if($('#v36Net'))return;const s=document.createElement('div');s.id='v36Net';s.className='v36-net';s.setAttribute('role','status');document.body.appendChild(s);
 const paint=()=>{s.textContent=navigator.onLine?'● Online':'● Offline';s.classList.toggle('offline',!navigator.onLine);s.classList.add('show');clearTimeout(paint.t);paint.t=setTimeout(()=>s.classList.remove('show'),1800)};
 addEventListener('online',paint);addEventListener('offline',paint);
}
function libraryBadge(){
 const nav=$('.tabs [data-go="library"]');if(!nav||nav.querySelector('.v36-dot'))return;const dot=document.createElement('i');dot.className='v36-dot';dot.hidden=true;nav.appendChild(dot);
 const update=()=>{const n=$$('.lib-card.selected').length;dot.hidden=!n;dot.textContent=n>9?'9+':String(n);nav.setAttribute('aria-label',n?'Library, '+n+' selected':'Library')};
 new MutationObserver(update).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});update();
}
function enhance(){
 document.documentElement.classList.add('pocket-v36');makeMore();labels();status();libraryBadge();
 // Keep the four secondary tools out of the cramped iPhone bottom bar; they remain one tap away in More.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,80));else setTimeout(enhance,80);
window.PocketV36={go,closeMore};
})();