// Pocket AI V46 — Web Novel Hub + permission-aware in-app web reader
(() => {
const by=id=>document.getElementById(id);
const FEATURED=[
 {title:'Moby Dick',author:'Herman Melville',tag:'Adventure',icon:'🌊',tone:'ocean'},
 {title:'Pride and Prejudice',author:'Jane Austen',tag:'Romance',icon:'🌸',tone:'rose'},
 {title:'Dracula',author:'Bram Stoker',tag:'Horror',icon:'🌙',tone:'blood'},
 {title:'Alice in Wonderland',author:'Lewis Carroll',tag:'Fantasy',icon:'♠️',tone:'sky'},
 {title:'Frankenstein',author:'Mary Shelley',tag:'Dark fantasy',icon:'⚡',tone:'green'},
 {title:'The Adventures of Sherlock Holmes',author:'Arthur Conan Doyle',tag:'Mystery',icon:'🔎',tone:'gold'}
];
const SOURCES=[
 {id:'pocketfree',name:'Pocket Free Library',icon:'📚',url:'#freeLibrary',note:'Public-domain & open books',mode:'native',badge:'Native reader'},
 {id:'gutenberg',name:'Project Gutenberg',icon:'🏛️',url:'https://www.gutenberg.org/',note:'Public-domain books',mode:'native',badge:'Native reader'},
 {id:'internetarchive',name:'Internet Archive',icon:'🌐',url:'https://archive.org/',note:'Open-access collection',mode:'native',badge:'Native reader'},
 {id:'royalroad',name:'Royal Road',icon:'🏰',url:'https://www.royalroad.com/',note:'Author-published fiction',mode:'embed',badge:'Try in app'},
 {id:'scribblehub',name:'Scribble Hub',icon:'✍️',url:'https://www.scribblehub.com/',note:'Author-published fiction',mode:'embed',badge:'Try in app'},
 {id:'wuxiaworld',name:'Wuxiaworld',icon:'⚔️',url:'https://www.wuxiaworld.com/',note:'Licensed translations',mode:'official',badge:'Official reader',reason:'Wuxiaworld controls how its licensed chapters may be displayed. Pocket AI can save and launch the source, but it cannot remove the publisher UI or copy locked chapters.'},
 {id:'tapas',name:'Tapas',icon:'🎨',url:'https://tapas.io/',note:'Comics & novels',mode:'official',badge:'Official reader',reason:'Tapas controls chapter access and display. Pocket AI keeps the source connected without copying or bypassing its reader.'},
 {id:'meganovel',name:'MegaNovel',icon:'✨',url:'https://www.meganovel.com/',note:'Free & premium novels',mode:'official',badge:'Official reader',reason:'Pocket AI does not mirror or bypass this publisher’s reader or access controls.'}
];
const LINK_KEY='pocket-webnovel-links-v46';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function links(){try{return JSON.parse(localStorage.getItem(LINK_KEY)||'[]')}catch{return[]}}
function store(a){localStorage.setItem(LINK_KEY,JSON.stringify(a.slice(0,80)))}
function showLibrary(){window.PocketLibraryOnline?.showLibrary?.()}
async function readFree(q,btn){
 showLibrary();if(btn){btn.disabled=true;btn.dataset.old=btn.textContent;btn.textContent='Opening…'}
 try{const ok=await window.PocketLibraryOnline?.openByQuery?.(q);if(!ok)by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'})}
 finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.old||'Read'}}
}
function ensureWebReader(){
 if(by('webReader46'))return;
 const d=document.createElement('dialog');d.id='webReader46';d.className='webreader46';
 d.innerHTML='<header><button id="webReader46Back" aria-label="Close reader">‹</button><div><small>WEB NOVEL</small><strong id="webReader46Title">Pocket Web Reader</strong><span id="webReader46Host"></span></div><button id="webReader46More" aria-label="Reader options">•••</button></header><div class="webreader46-bar"><i></i></div><main id="webReader46Stage"><div class="webreader46-loading"><span>✦</span><strong>Opening inside Pocket AI…</strong><small>The publisher may block embedding.</small></div></main><nav><button id="webReader46Home">⌂<span>Home</span></button><button id="webReader46Reload">↻<span>Reload</span></button><button id="webReader46Save">♡<span>Save</span></button><button id="webReader46Official">↗<span>Official</span></button></nav><aside id="webReader46Sheet" hidden><strong>Reader options</strong><p id="webReader46Note">Pocket AI displays the publisher page only when embedding is permitted. It never scrapes or copies locked chapters.</p><button id="webReader46SheetClose">Done</button></aside>';
 document.body.appendChild(d);
 by('webReader46Back').onclick=()=>d.close();by('webReader46More').onclick=()=>by('webReader46Sheet').hidden=false;by('webReader46SheetClose').onclick=()=>by('webReader46Sheet').hidden=true;
 by('webReader46Reload').onclick=()=>{const f=d.querySelector('iframe');if(f)f.src=f.src};
 by('webReader46Home').onclick=()=>{d.close();window.PocketV39?.show?.('library');setTimeout(()=>by('webNovelHub')?.scrollIntoView({block:'start'}),80)};
 by('webReader46Save').onclick=()=>saveCurrent();
 d.addEventListener('close',()=>{by('webReader46Sheet').hidden=true;const f=d.querySelector('iframe');if(f)f.remove()});
}
let currentWeb=null;
function saveCurrent(){
 if(!currentWeb)return;const a=links();if(!a.some(x=>x.url===currentWeb.url)){a.unshift({title:currentWeb.title||currentWeb.name||new URL(currentWeb.url).hostname,url:currentWeb.url,added:Date.now()});store(a)}const b=by('webReader46Save');if(b){b.innerHTML='♥<span>Saved</span>';setTimeout(()=>b.innerHTML='♡<span>Save</span>',1200)}renderReading();
}
function openWeb(item){
 ensureWebReader();
 currentWeb={title:item.title||item.name,url:item.url};
 const d=by('webReader46'),stage=by('webReader46Stage');
 let host='';
 try{host=new URL(item.url).hostname.replace(/^www\./,'')}catch{}
 by('webReader46Title').textContent=item.title||item.name||'Web novel';
 by('webReader46Host').textContent=host;
 by('webReader46Official').onclick=()=>{if(item.url&&item.url[0]!=='#')window.open(item.url,'_blank','noopener,noreferrer')};
 d.showModal();stage.innerHTML='';

 if(item.mode==='native'){
  d.close();showLibrary();setTimeout(()=>by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'}),100);return;
 }

 if(item.mode==='official'||item.embed===false){
  stage.innerHTML='<section class="webreader46-blocked"><span>🛡️</span><h2>Official reader required</h2><p>'+esc(item.reason||'This source controls how its chapters are displayed, so Pocket AI cannot show it as a clean native reader.')+'</p><p>You can still save the link in your reading list and open the official chapter page.</p><button id="webReader46OpenOfficial" class="primary">Open official reader ↗</button></section>';
  by('webReader46OpenOfficial').onclick=()=>window.open(item.url,'_blank','noopener,noreferrer');return;
 }

 const f=document.createElement('iframe');
 f.title=(item.title||item.name||'Web novel')+' reader';
 f.referrerPolicy='strict-origin-when-cross-origin';
 f.sandbox='allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
 f.src=item.url;
 stage.appendChild(f);
 const tip=document.createElement('div');tip.className='webreader46-tip';
 tip.innerHTML='<span>ⓘ</span><p>If the page stays blank or refuses to load, the publisher blocks embedded readers. Use <b>Official</b> below.</p>';
 stage.appendChild(tip);
}
function featuredCard(x,i){return '<article class="wn44-book '+x.tone+'"><button data-wn44-read="'+i+'"><span class="wn44-cover"><i>'+x.icon+'</i><b>FREE</b><em>'+esc(x.tag)+'</em></span><strong>'+esc(x.title)+'</strong><small>'+esc(x.author)+'</small></button></article>'}
function sourceCard(s){
 const cls=s.mode==='native'?'native':s.mode==='official'?'official':'embed';
 return '<article class="wn46-source '+cls+'"><span class="wn46-source-icon">'+s.icon+'</span><div class="wn46-source-copy"><strong>'+esc(s.name)+'</strong><small>'+esc(s.note)+'</small><em>'+esc(s.badge||'Connected')+'</em></div><button data-wn46-source="'+s.id+'">'+(s.mode==='native'?'Browse':s.mode==='official'?'Official':'Open')+'</button></article>';
}
async function renderReading(){
 const host=by('wn44Reading');if(!host)return;const saved=links();let local=[];
 try{const a=await window.PocketLibrary?.allBooks?.();if(Array.isArray(a))local=a.slice(0,8)}catch{}
 host.innerHTML=(saved.length?'<div class="wn46-list"><h3>🔖 Web novel links</h3>'+saved.map((x,i)=>'<article><button data-wn46-saved="'+i+'"><span>🌐</span><div><strong>'+esc(x.title)+'</strong><small>'+esc(new URL(x.url).hostname)+'</small></div></button><button data-wn46-del="'+i+'" aria-label="Remove">×</button></article>').join('')+'</div>':'')+(local.length?'<div class="wn45-saved"><div class="wn44-title"><h3>📚 Saved books</h3><button data-wn44-library>My Library ›</button></div>'+local.map(x=>'<button data-wn44-library><span>📖</span><div><strong>'+esc(x.name||x.title||'Saved book')+'</strong><small>Private • on-device</small></div><b>›</b></button>').join('')+'</div>':'')+(!saved.length&&!local.length?'<div class="wn44-empty"><span>📚</span><strong>Your reading list is empty</strong><p>Open a free book or add a web-novel link.</p></div>':'');
}
function addHub(){
 const lib=by('library'),free=by('freeLibrary');if(!lib||!free||by('webNovelHub'))return false;ensureWebReader();
 const box=document.createElement('section');box.id='webNovelHub';box.className='wn44 wn46';
 box.innerHTML='<header class="wn44-head wn48-head"><div><p class="eyebrow">WEB NOVEL • CONNECTED LIBRARY</p><h2>Read from one beautiful shelf</h2><p>Pocket AI gives open/public-domain books a clean native reader, and keeps publisher novels connected to their permitted official or embedded reader.</p><div class="wn48-badges"><span>✓ Native open books</span><span>◈ Connected sources</span><span>♡ Reading list</span></div></div><span class="wn48-orb">✦</span></header><form id="wn44Search" class="wn44-search"><span>⌕</span><input id="wn44Query" placeholder="Search free novels, authors, genres…" autocomplete="off"><button>Search</button></form><nav class="wn44-tabs wn46-tabs"><button class="active" data-wn44-tab="discover">Discover</button><button data-wn44-tab="reading">Reading List</button><button data-wn44-tab="add">Add Link</button></nav><div id="wn44Discover" class="wn44-panel"><div class="wn44-section"><div class="wn44-title"><h3>🔥 Featured free stories</h3><button data-wn44-all>See all ›</button></div><div class="wn44-books">'+FEATURED.map(featuredCard).join('')+'</div></div><div class="wn44-section"><div class="wn44-title"><h3>🌐 Connected novel sources</h3><span class="wn48-source-note">Native where permitted</span></div><div class="wn46-sources">'+SOURCES.map(sourceCard).join('')+'</div></div><div class="wn44-section"><div class="wn44-title"><h3>✨ Find by genre</h3></div><div class="wn44-genres"><button data-wn44-q="fantasy">🔮<b>Fantasy</b></button><button data-wn44-q="adventure">⚔️<b>Adventure</b></button><button data-wn44-q="romance">💗<b>Romance</b></button><button data-wn44-q="mystery">🔎<b>Mystery</b></button><button data-wn44-q="horror">🌙<b>Horror</b></button><button data-wn44-q="science fiction">🚀<b>Sci-Fi</b></button></div></div></div><div id="wn44Reading" class="wn44-panel" hidden></div><div id="wn44Add" class="wn44-panel" hidden><form id="wn46AddForm" class="wn46-add"><label>Novel or chapter link<input id="wn46Url" type="url" inputmode="url" placeholder="https://…" required></label><label>Title (optional)<input id="wn46Title" maxlength="120" placeholder="My web novel"></label><button class="primary">Open in Pocket Reader</button></form><p class="fineprint">Pocket AI stores only the title and link. It does not scrape, mirror, unlock, or republish chapters.</p></div>';
 free.insertAdjacentElement('beforebegin',box);
 box.addEventListener('click',onClick);by('wn44Search').onsubmit=e=>{e.preventDefault();const q=by('wn44Query').value.trim();if(q)readFree(q,e.submitter)};
 by('wn46AddForm').onsubmit=e=>{e.preventDefault();try{const u=new URL(by('wn46Url').value.trim());if(!/^https?:$/.test(u.protocol))throw Error();const x={title:by('wn46Title').value.trim()||u.hostname,url:u.href,embed:'try'};const a=links();if(!a.some(v=>v.url===x.url)){a.unshift({title:x.title,url:x.url,added:Date.now()});store(a)}e.target.reset();openWeb(x);renderReading()}catch{by('wn46Url').setCustomValidity('Enter a valid http or https link');by('wn46Url').reportValidity();setTimeout(()=>by('wn46Url').setCustomValidity(''),600)}};
 renderReading();return true;
}
function tab(name){document.querySelectorAll('[data-wn44-tab]').forEach(b=>b.classList.toggle('active',b.dataset.wn44Tab===name));['Discover','Reading','Add'].forEach(x=>{const e=by('wn44'+x);if(e)e.hidden=x.toLowerCase()!==name});if(name==='reading')renderReading()}
function onClick(e){
 const t=e.target.closest('[data-wn44-tab]');if(t)return tab(t.dataset.wn44Tab);
 const r=e.target.closest('[data-wn44-read]');if(r)return readFree(FEATURED[+r.dataset.wn44Read].title,r);
 const q=e.target.closest('[data-wn44-q]');if(q)return readFree(q.dataset.wn44Q,q);
 const src=e.target.closest('[data-wn46-source]');if(src){const x=SOURCES.find(v=>v.id===src.dataset.wn46Source);if(x)return openWeb(x)}
 const sv=e.target.closest('[data-wn46-saved]');if(sv){const x=links()[+sv.dataset.wn46Saved];if(x)return openWeb({...x,embed:'try'})}
 const del=e.target.closest('[data-wn46-del]');if(del){const a=links();a.splice(+del.dataset.wn46Del,1);store(a);renderReading();return}
 if(e.target.closest('[data-wn44-all]'))return by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'});
 if(e.target.closest('[data-wn44-library]'))return by('libStorage')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function boot(){let n=0;const t=setInterval(()=>{if(addHub()||++n>40)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketWebNovels={featured:FEATURED,sources:SOURCES,read:readFree,openWeb,renderReading};
})();
/* PocketReaderPrefsV49 — light/sepia/dark, font and progress helpers for the native free-book reader */
(() => {
 const KEY='pocket-reader-prefs-v49';
 const read=()=>{try{return Object.assign({theme:'dark',font:17,line:1.72},JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return{theme:'dark',font:17,line:1.72}}};
 const save=p=>localStorage.setItem(KEY,JSON.stringify(p));
 function apply(){
  const d=document.querySelector('.free-reader'); if(!d)return;
  const p=read(); d.dataset.readerTheme=p.theme;
  const pre=d.querySelector('pre'); if(pre){pre.style.fontSize=p.font+'px';pre.style.lineHeight=String(p.line)}
 }
 function install(){
  const d=document.querySelector('.free-reader'); if(!d||document.getElementById('pocketReaderControls49'))return;
  const actions=d.querySelector('.free-reader-actions'); if(!actions)return;
  const controls=document.createElement('div');controls.id='pocketReaderControls49';controls.className='reader49-controls';
  controls.innerHTML='<button type="button" data-reader49-theme="dark">🌙</button><button type="button" data-reader49-theme="sepia">☕</button><button type="button" data-reader49-theme="light">☀️</button><button type="button" data-reader49-font="-1">A−</button><button type="button" data-reader49-font="1">A+</button>';
  actions.appendChild(controls);
  controls.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const p=read();if(b.dataset.reader49Theme)p.theme=b.dataset.reader49Theme;if(b.dataset.reader49Font)p.font=Math.max(14,Math.min(24,p.font+Number(b.dataset.reader49Font)));save(p);apply()});
  apply();
 }
 const obs=new MutationObserver(()=>{install();apply()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();obs.observe(document.body,{subtree:true,childList:true})},{once:true});
 else{install();obs.observe(document.body,{subtree:true,childList:true})}
 window.PocketReaderPrefsV49={apply};
})();
