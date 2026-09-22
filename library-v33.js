// Pocket AI V51 — books-only on-device Library
(() => {
const $=s=>document.querySelector(s), by=id=>document.getElementById(id);
const DB='pocket-ai-library-v33', STORE='books', MAX=20*1024*1024;
let selected=new Set();

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function uid(){return crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)}
function openDB(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('name','name',{unique:false});s.createIndex('addedAt','addedAt',{unique:false})}};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function allBooks(){const db=await openDB();return new Promise((ok,no)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>ok(r.result||[]);r.onerror=()=>no(r.error)})}
async function putBook(x){const db=await openDB();return new Promise((ok,no)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).put(x);t.oncomplete=()=>ok(x);t.onerror=()=>no(t.error)})}
async function delBook(id){const db=await openDB();return new Promise((ok,no)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
function chunks(text,size=2600,overlap=300){const a=[];text=String(text||'');for(let i=0;i<text.length;i+=size-overlap){a.push(text.slice(i,i+size));if(i+size>=text.length)break}return a}
function terms(q){const s=String(q||'').toLowerCase().normalize('NFKC'),out=new Set((s.match(/[\p{L}\p{N}]{2,}/gu)||[]));const compact=s.replace(/\s+/g,'');for(let i=0;i<compact.length-1&&i<160;i++)out.add(compact.slice(i,i+2));return[...out].slice(0,80)}
function score(text,ts){const s=String(text||'').toLowerCase().normalize('NFKC');let n=0;for(const t of ts){let p=s.indexOf(t);if(p>=0)n+=t.length>3?4:1;while(p>=0&&n<120){p=s.indexOf(t,p+t.length);if(p>=0)n++}}return n}
async function retrieve(query,limit=10){const books=await allBooks(),ts=terms(query),hits=[],eligible=books.filter(b=>!selected.size||selected.has(b.id));for(const b of eligible){(b.chunks||chunks(b.text)).forEach((c,i)=>{const s=score(c,ts);if(s||!ts.length)hits.push({s,b,i,c})})}hits.sort((a,b)=>b.s-a.s);return hits.slice(0,limit)}
function prettyName(n){return String(n||'').replace(/\(\d+\)(?=\.[^.]+$)/,'').replace(/_/g,' ')}
function iconFor(type){return type==='pdf'?'📕':type==='docx'?'📘':'📖'}

function makeUI(){
 const old=by('library');
 if(old?.classList.contains('library-books-only-v53'))return old;
 if(old)old.remove();
 const nav=$('.tabs');
 if(nav&&!nav.querySelector('[data-go="library"]')){
  const b=document.createElement('button');b.dataset.go='library';b.innerHTML='📚<span>Library</span>';
  nav.insertBefore(b,nav.querySelector('[data-go="files"]')||null);
 }
 const s=document.createElement('section');
 s.id='library';s.className='view glass library-v33 library-books-only library-books-only-v53';s.hidden=true;
 s.innerHTML=
 '<header class="lib53-hero"><div class="lib53-copy"><p class="eyebrow">POCKET LIBRARY</p><h1>Find your next chapter.</h1><p>Saved books, free classics and connected web novels — all from one reading shelf.</p><div class="lib53-hero-actions"><button type="button" class="primary" data-lib53-jump="free">✨ Discover books</button></div></div><div class="lib53-art" aria-hidden="true"><span>📖</span><i>✦</i></div></header>'+
 '<div class="lib53-tabs" role="navigation" aria-label="Library sections"><button type="button" class="active" data-lib53-jump="mine">My Shelf</button><button type="button" data-lib53-jump="free">Free Books</button><button type="button" data-lib53-jump="novels">Web Novels</button></div>'+
 '<section id="lib53Continue" class="lib53-continue" hidden></section>'+
 '<section id="lib53Mine" class="lib53-mine"><div class="lib53-section-head"><div><p class="eyebrow">MY SHELF</p><h2>Your books</h2></div><span id="libCount" class="lib53-count">0 saved</span></div>'+
 '<div class="lib53-tools"><div class="lib-search"><span>⌕</span><input id="libSearch" placeholder="Search your books…"></div><label class="lib-upload">＋ Add book<input id="libInput" type="file" multiple accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown" hidden></label></div>'+
 '<div id="libStatus" class="muted book-library-status"></div><div id="libGrid" class="lib-grid book-only-grid"></div><div id="libStorage" class="muted book-library-storage"></div></section><section id="lib53TabState" class="lib-tab-state" hidden></section>';
 const files=by('files');(files?.parentNode||$('main')).insertBefore(s,files||null);
 return s;
}

async function storageInfo(){
 if(!navigator.storage?.estimate||!by('libStorage'))return;
 try{const e=await navigator.storage.estimate(),used=e.usage||0;by('libStorage').textContent='Private device storage used: '+(used/1048576).toFixed(1)+' MB.'}catch{}
}

async function render(){
 const grid=by('libGrid');if(!grid)return;
 const books=(await allBooks()).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0)),q=(by('libSearch')?.value||'').toLowerCase();
 if(by('libCount'))by('libCount').textContent=books.length+' saved';
 const show=books.filter(b=>!q||b.name.toLowerCase().includes(q)||(b.text||'').toLowerCase().includes(q));
 grid.innerHTML=show.length?show.map((b,i)=>
  '<article class="lib-card book-card" data-id="'+b.id+'"><div class="book-cover53 c'+(i%5)+'"><span>'+iconFor(b.type)+'</span><small>'+esc((b.type||'BOOK').toUpperCase())+'</small></div><div class="book-card-copy"><strong>'+esc(prettyName(b.name))+'</strong><small>'+((b.text||'').length/1000).toFixed(1)+'k chars • private on device</small><div class="lib-card-actions"><button data-open="'+b.id+'" class="book-open">Read</button><button data-remove="'+b.id+'" class="book-remove" aria-label="Delete book">•••</button></div></div></article>'
 ).join(''):'<div class="lib-empty book-empty"><span>📚</span><strong>Your shelf is empty.</strong><p>Add your first book or discover a free classic.</p><button type="button" class="primary" data-lib53-jump="free">Explore free books</button></div>';

 const cont=by('lib53Continue');
 if(cont){
  const recent=books[0];
  if(recent){
   cont.hidden=false;
   cont.innerHTML='<div class="lib53-continue-cover">'+iconFor(recent.type)+'</div><div><p class="eyebrow">CONTINUE READING</p><strong>'+esc(prettyName(recent.name))+'</strong><small>Saved privately on this device</small></div><button type="button" data-open="'+recent.id+'">Continue →</button>';
  }else cont.hidden=true;
 }
 storageInfo();
}

async function importFiles(files){
 const status=by('libStatus');
 for(const f of [...files]){
  if(f.size>MAX){if(status)status.textContent=f.name+' is over 20 MB and was skipped.';continue}
  try{
   if(status)status.textContent='Reading '+f.name+'…';
   const text=await window.PocketFiles.readOne(f);
   const old=(await allBooks()).find(b=>b.name===f.name);
   const rec={id:old?.id||uid(),name:f.name,type:(f.name.split('.').pop()||'file').toLowerCase(),size:f.size,addedAt:Date.now(),text,blob:f,chunks:chunks(text)};
   await putBook(rec);selected.add(rec.id);
  }catch(e){if(status)status.textContent='Could not add '+f.name+': '+(e?.message||e)}
 }
 if(status)status.textContent='✓ Book shelf updated.';
 await render();
}

async function openBook(id){
 const b=(await allBooks()).find(x=>x.id===id);if(!b)return;
 window.PocketV39?.show?.('files')||document.querySelector('[data-go="files"]')?.click();
 const text=by('fileText'),name=by('fileName'),status=by('fileStatus');
 if(text){text.value=b.text||'';text.dispatchEvent(new Event('input'))}
 if(name)name.value=b.name.replace(/\.(pdf|docx)$/i,'.txt');
 if(status)status.textContent='Opened from Library: '+b.name;
}

async function contextFor(query){
 const hits=await retrieve(query,10);if(!hits.length)return'';
 return '\n\n--- POCKET LIBRARY CONTEXT ---\n'+hits.map((h,i)=>'[SOURCE '+(i+1)+' • '+h.b.name+' • chunk '+(h.i+1)+']\n'+h.c).join('\n\n');
}

function activateLibraryTab(kind='mine'){
 const root=by('library');if(!root)return;
 root.dataset.libraryTab=kind;
 root.querySelectorAll('.lib53-tabs button').forEach(b=>{const on=b.dataset.lib53Jump===kind;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')});
 const mine=by('lib53Mine'),free=by('freeLibrary'),novels=by('webNovelHub'),state=by('lib53TabState');
 if(mine)mine.hidden=kind!=='mine';
 if(free)free.hidden=kind!=='free';
 if(novels)novels.hidden=kind!=='novels';
 const missing=(kind==='free'&&!free)||(kind==='novels'&&!novels);
 if(state){
   state.hidden=!missing;
   if(missing)state.innerHTML='<div class="lib-empty lib-loading"><span>✨</span><strong>Opening '+(kind==='free'?'free books':'web novels')+'…</strong><p>Please wait a moment.</p></div>';
 }
 if(missing){
   let tries=0;
   const wait=setInterval(()=>{
     const f=by('freeLibrary'),n=by('webNovelHub'),ready=kind==='free'?f:n;
     if(ready){clearInterval(wait);activateLibraryTab(kind)}
     else if(++tries>20){clearInterval(wait);if(state){state.hidden=false;state.innerHTML='<div class="lib-empty"><span>📚</span><strong>Could not open this section.</strong><p>Try again or return to My Shelf.</p><button type="button" data-lib53-jump="mine">Back to My Shelf</button></div>'}}
   },150);
 }
 if(kind==='mine')by('libSearch')?.focus?.({preventScroll:true});
}
function bind(){
 by('libInput').onchange=e=>{importFiles(e.target.files);e.target.value=''};
 by('libSearch').oninput=render;
 by('library').addEventListener('click',async e=>{
  const jump=e.target.closest('[data-lib53-jump]');
  if(jump){
   activateLibraryTab(jump.dataset.lib53Jump);
   return;
  }
  const open=e.target.closest('[data-open]');
  if(open)return openBook(open.dataset.open);
  const remove=e.target.closest('[data-remove]');
  if(remove){const card=remove.closest('.lib-card');if(card&&confirm('Remove this book from this device library?')){await delBook(card.dataset.id);selected.delete(card.dataset.id);render()}return}
 });
}

async function init(){
 makeUI();bind();activateLibraryTab('mine');
 window.addEventListener('pocket-features-ready',()=>activateLibraryTab(by('library')?.dataset.libraryTab||'mine'),{once:true});
 try{
   await render();
   try{if(navigator.storage?.persist)navigator.storage.persist()}catch{}
 }catch(err){
   const status=by('libStatus');
   if(status)status.textContent='Library storage is unavailable in this browser mode: '+(err?.message||err);
   console.warn('Pocket AI Library unavailable',err);
 }
}
init().catch(err=>console.warn('Pocket AI Library init failed',err));
window.PocketLibrary={allBooks,retrieve,importFiles,contextFor,render,setTab:activateLibraryTab};
})();