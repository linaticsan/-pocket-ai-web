// Pocket AI V45 — in-app-first free novel library
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
const REFERENCE_SITES=['Wuxiaworld','NovelNow','MegaNovel','Tapas','Royal Road','Scribble Hub'];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showLibrary(){window.PocketLibraryOnline?.showLibrary?.()}
async function read(q,btn){
 showLibrary();if(btn){btn.disabled=true;btn.dataset.old=btn.textContent;btn.textContent='Opening…'}
 try{const ok=await window.PocketLibraryOnline?.openByQuery?.(q);if(!ok)by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'})}
 finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.old||'Read'}}
}
function featuredCard(x,i){return '<article class="wn44-book '+x.tone+'"><button data-wn44-read="'+i+'"><span class="wn44-cover"><i>'+x.icon+'</i><b>FREE</b><em>'+esc(x.tag)+'</em></span><strong>'+esc(x.title)+'</strong><small>'+esc(x.author)+'</small></button></article>'}
async function renderReading(){
 const host=by('wn44Reading');if(!host)return;
 try{const a=await window.PocketLibrary?.allBooks?.();if(Array.isArray(a)&&a.length){host.innerHTML='<div class="wn45-saved"><div class="wn44-title"><h3>📚 Saved on this device</h3><button data-wn44-library>My Library ›</button></div>'+a.slice(0,12).map(x=>'<button data-wn44-library><span>📖</span><div><strong>'+esc(x.name||x.title||'Saved book')+'</strong><small>Private • on-device</small></div><b>›</b></button>').join('')+'</div>';return}}catch{}
 host.innerHTML='<div class="wn44-empty"><span>📚</span><strong>Your reading list is empty</strong><p>Open a free novel and choose “Save to My Library”. It stays on this device for reading, study and AI questions.</p><button data-wn44-library>Open My Library</button></div>';
}
function addHub(){
 const lib=by('library'),free=by('freeLibrary');if(!lib||!free||by('webNovelHub'))return false;
 const box=document.createElement('section');box.id='webNovelHub';box.className='wn44';
 box.innerHTML='<header class="wn44-head"><div><p class="eyebrow">FREE NOVEL HUB</p><h2>Discover & read inside Pocket AI</h2><p>Search eligible free books, open them in the full-screen Pocket Reader, and keep your place without being sent to another site.</p></div><span>✨</span></header><form id="wn44Search" class="wn44-search"><span>⌕</span><input id="wn44Query" placeholder="Search novels, authors, genres…" autocomplete="off"><button>Search</button></form><nav class="wn44-tabs"><button class="active" data-wn44-tab="discover">Discover</button><button data-wn44-tab="reading">Reading</button><button data-wn44-tab="more">•••</button></nav><div id="wn44Discover" class="wn44-panel"><div class="wn44-section"><div class="wn44-title"><h3>🔥 Featured free stories</h3><button data-wn44-all>See all ›</button></div><div class="wn44-books">'+FEATURED.map(featuredCard).join('')+'</div></div><div class="wn44-section"><div class="wn44-title"><h3>✨ Find by genre</h3></div><div class="wn44-genres"><button data-wn44-q="fantasy">🔮<b>Fantasy</b></button><button data-wn44-q="adventure">⚔️<b>Adventure</b></button><button data-wn44-q="romance">💗<b>Romance</b></button><button data-wn44-q="mystery">🔎<b>Mystery</b></button><button data-wn44-q="horror">🌙<b>Horror</b></button><button data-wn44-q="science fiction">🚀<b>Sci-Fi</b></button></div></div></div><div id="wn44Reading" class="wn44-panel" hidden></div><div id="wn44More" class="wn44-panel" hidden><div class="wn44-safe"><strong>Why some web novels cannot be mirrored here</strong><p>Pocket AI can read public-domain/open books and files you add yourself. It does not copy, scrape, or bypass chapter locks from publishers. Sites such as '+REFERENCE_SITES.join(', ')+' may host copyrighted or account-controlled chapters, so those chapters stay with their publisher.</p></div><div class="wn45-sourcechips">'+REFERENCE_SITES.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><p class="fineprint">The main Discover and Reading tabs stay inside Pocket AI.</p></div>';
 free.insertAdjacentElement('beforebegin',box);
 box.addEventListener('click',onClick);by('wn44Search').onsubmit=e=>{e.preventDefault();const q=by('wn44Query').value.trim();if(q)read(q,e.submitter)};renderReading();return true;
}
function tab(name){document.querySelectorAll('[data-wn44-tab]').forEach(b=>b.classList.toggle('active',b.dataset.wn44Tab===name));['Discover','Reading','More'].forEach(x=>{const e=by('wn44'+x);if(e)e.hidden=x.toLowerCase()!==name});if(name==='reading')renderReading()}
function onClick(e){
 const t=e.target.closest('[data-wn44-tab]');if(t)return tab(t.dataset.wn44Tab);
 const r=e.target.closest('[data-wn44-read]');if(r)return read(FEATURED[+r.dataset.wn44Read].title,r);
 const q=e.target.closest('[data-wn44-q]');if(q)return read(q.dataset.wn44Q,q);
 if(e.target.closest('[data-wn44-all]')){by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'});return}
 if(e.target.closest('[data-wn44-library]')){by('libStorage')?.scrollIntoView({block:'start',behavior:'smooth'});return}
}
function boot(){let n=0;const t=setInterval(()=>{if(addHub()||++n>40)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketWebNovels={featured:FEATURED,read,renderReading};
})();