// Pocket AI V43 — in-app novel discovery + rights-safe official sources
(() => {
const by=id=>document.getElementById(id);
const SOURCES=[
 {id:'wuxiaworld',name:'Wuxiaworld',icon:'⚔️',url:'https://www.wuxiaworld.com/',note:'Licensed translations • official reader required'},
 {id:'novelnow',name:'NovelNow',icon:'📖',url:'https://www.novelnow.com/',note:'Official web reader • access varies'},
 {id:'meganovel',name:'MegaNovel',icon:'✨',url:'https://www.meganovel.com/',note:'Official web reader • free/premium varies'},
 {id:'tapas',name:'Tapas',icon:'🎨',url:'https://tapas.io/',note:'Official comics & novels'},
 {id:'royalroad',name:'Royal Road',icon:'🏰',url:'https://www.royalroad.com/',note:'Author-published fiction'},
 {id:'scribblehub',name:'Scribble Hub',icon:'✍️',url:'https://www.scribblehub.com/',note:'Author-published fiction'}
];
const KEY='pocket-webnovel-links-v43';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function loadLinks(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saveLinks(a){localStorage.setItem(KEY,JSON.stringify(a.slice(0,80)))}
function openOfficial(url){try{const u=new URL(url);if(/^https?:$/.test(u.protocol))window.open(u.href,'_blank','noopener,noreferrer')}catch{}}
function readInPocket(q){
 const input=by('freeSearch');if(!input)return;input.value=q||'';window.PocketLibraryOnline?.searchOnline?.();by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function sourceCard(s){return '<article class="wn42-source"><div class="wn42-icon">'+s.icon+'</div><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.note)+'</small></div><button data-wn-official="'+s.id+'">Official</button></article>'}
function addHub(){
 const lib=by('library');if(!lib||by('webNovelHub'))return false;
 const free=by('freeLibrary'),anchor=free||by('libStorage')||lib.lastElementChild;
 const box=document.createElement('section');box.id='webNovelHub';box.className='wn42 wn43';
 box.innerHTML='<div class="wn42-head"><div><p class="eyebrow">WEB NOVEL • IN APP</p><h2>Discover stories</h2><p class="muted">Choose a genre and read free eligible books in the Pocket AI reader. Your reading position stays on this device.</p></div><span class="privacy-pill">📖 Pocket Reader</span></div><div class="wn42-tabs"><button class="active" data-wn-tab="discover">Discover</button><button data-wn-tab="saved">Reading list</button><button data-wn-tab="sources">Sources</button></div><div id="wn43Discover" class="wn42-panel"><div class="wn43-search"><button data-wn-query="fantasy"><span>🔮</span><strong>Fantasy</strong><small>Magic & worlds</small></button><button data-wn-query="adventure"><span>⚔️</span><strong>Adventure</strong><small>Quests & journeys</small></button><button data-wn-query="romance"><span>💗</span><strong>Romance</strong><small>Classic love stories</small></button><button data-wn-query="mystery"><span>🔎</span><strong>Mystery</strong><small>Crime & secrets</small></button><button data-wn-query="horror"><span>🌙</span><strong>Horror</strong><small>Dark classics</small></button><button data-wn-query="science fiction"><span>🚀</span><strong>Sci-Fi</strong><small>Future worlds</small></button></div><div class="wn43-feature"><div><small>READ WITHOUT LEAVING POCKET AI</small><strong>Free classics in a modern web-novel reader</strong><span>Search, open, change font/theme, remember progress and save to your Library.</span></div><button data-wn-query="">Explore free books →</button></div></div><div id="wn43Saved" class="wn42-panel" hidden></div><div id="wn43Sources" class="wn42-panel" hidden><p class="wn43-source-note">These publishers keep their copyrighted chapters in their own official readers. Pocket AI does not copy, scrape, frame, or bypass locked chapters.</p><div class="wn42-grid">'+SOURCES.map(sourceCard).join('')+'</div><details class="wn43-add"><summary>＋ Save an official novel/chapter link</summary><form id="wn42Form"><label>Novel or chapter link<input id="wn42Url" type="url" inputmode="url" placeholder="https://…" required></label><label>Title (optional)<input id="wn42Title" maxlength="120" placeholder="My web novel"></label><button class="primary">Save link</button></form></details></div>';
 anchor?.insertAdjacentElement('afterend',box);box.addEventListener('click',onClick);by('wn42Form').onsubmit=onSave;renderSaved();return true;
}
function setTab(name){
 document.querySelectorAll('.wn42-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.wnTab===name));
 ['Discover','Saved','Sources'].forEach(x=>{const el=by('wn43'+x);if(el)el.hidden=x.toLowerCase()!==name});if(name==='saved')renderSaved();
}
function onClick(e){
 const tab=e.target.closest('[data-wn-tab]');if(tab){setTab(tab.dataset.wnTab);return}
 const q=e.target.closest('[data-wn-query]');if(q){readInPocket(q.dataset.wnQuery);return}
 const op=e.target.closest('[data-wn-official]');if(op){const s=SOURCES.find(x=>x.id===op.dataset.wnOfficial);if(s)openOfficial(s.url);return}
 const saved=e.target.closest('[data-wn-saved]');if(saved){const a=loadLinks(),x=a[+saved.dataset.wnSaved];if(x)openOfficial(x.url);return}
 const del=e.target.closest('[data-wn-del]');if(del){const a=loadLinks();a.splice(+del.dataset.wnDel,1);saveLinks(a);renderSaved()}
}
function onSave(e){e.preventDefault();const raw=by('wn42Url').value.trim(),title=by('wn42Title').value.trim();try{const u=new URL(raw);if(!/^https?:$/.test(u.protocol))throw Error();const a=loadLinks();a.unshift({url:u.href,title:title||u.hostname,added:Date.now()});saveLinks(a);e.target.reset();setTab('saved')}catch{by('wn42Url').setCustomValidity('Enter a valid http or https link');by('wn42Url').reportValidity();setTimeout(()=>by('wn42Url').setCustomValidity(''),500)}}
function renderSaved(){const host=by('wn43Saved');if(!host)return;const a=loadLinks();host.innerHTML=a.length?'<div class="wn42-reading">'+a.map((x,i)=>'<article><button class="wn42-read" data-wn-saved="'+i+'"><span>🔖</span><div><strong>'+esc(x.title)+'</strong><small>'+esc(new URL(x.url).hostname)+' • official reader</small></div></button><button class="wn42-del" data-wn-del="'+i+'" aria-label="Remove">×</button></article>').join('')+'</div>':'<div class="lib-empty"><strong>No official links saved yet.</strong><p>Use Sources → Save link. Free eligible books you save from Pocket Reader appear in My Library above.</p></div>'}
function boot(){let n=0;const t=setInterval(()=>{if(addHub()||++n>30)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketWebNovels={sources:SOURCES,addHub,readInPocket};
})();