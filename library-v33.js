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
 if(old?.classList.contains('library-books-only-v51'))return old;
 if(old)old.remove();
 const nav=$('.tabs');
 if(nav&&!nav.querySelector('[data-go="library"]')){
  const b=document.createElement('button');b.dataset.go='library';b.innerHTML='📚<span>Library</span>';
  nav.insertBefore(b,nav.querySelector('[data-go="files"]')||null);
 }
 const s=document.createElement('section');
 s.id='library';s.className='view glass library-v33 library-books-only library-books-only-v51';s.hidden=true;
 s.innerHTML=
 '<div class="lib-head book-only-head"><div><p class="eyebrow">LIBRARY • BOOKS</p><h1>Your reading shelf.</h1><p class="muted">Books only. Read free/open books, save your own books and keep web novels together.</p></div><span class="privacy-pill">📚 Books</span></div>'+
 '<div class="book-library-toolbar"><label class="lib-upload">＋ Add my book<input id="libInput" type="file" multiple accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown" hidden></label><div class="lib-search"><input id="libSearch" placeholder="Search saved books…"><span id="libCount"></span></div></div>'+
 '<div id="libStatus" class="muted book-library-status"></div><div id="libStorage" class="muted book-library-storage"></div>'+
 '<div class="book-library-section"><div class="book-library-title"><div><p class="eyebrow">MY BOOKS</p><h2>Saved on this device</h2></div></div><div id="libGrid" class="lib-grid book-only-grid"></div></div>';
 const files=by('files');(files?.parentNode||$('main')).insertBefore(s,files||null);
 return s;
}

async function storageInfo(){
 if(!navigator.storage?.estimate||!by('libStorage'))return;
 try{const e=await navigator.storage.estimate(),used=e.usage||0;by('libStorage').textContent='Private device storage used: '+(used/1048576).toFixed(1)+' MB.'}catch{}
}

async function render(){
 const grid=by('libGrid');if(!grid)return;
 const books=await allBooks(),q=(by('libSearch')?.value||'').toLowerCase();
 if(by('libCount'))by('libCount').textContent=books.length+' saved';
 const show=books.filter(b=>!q||b.name.toLowerCase().includes(q)||(b.text||'').toLowerCase().includes(q));
 grid.innerHTML=show.length?show.map(b=>
  '<article class="lib-card book-card" data-id="'+b.id+'"><div class="lib-icon book-spine">'+iconFor(b.type)+'</div><div class="book-card-copy"><strong>'+esc(prettyName(b.name))+'</strong><small>'+((b.text||'').length/1000).toFixed(1)+'k chars • saved privately</small><div class="lib-card-actions"><button data-open="'+b.id+'" class="book-open">📖 Open</button><button data-remove="'+b.id+'" class="book-remove">Delete</button></div></div></article>'
 ).join(''):'<div class="lib-empty book-empty"><span>📚</span><strong>Your shelf is empty.</strong><p>Add a book above or save one from the Free Book Library below.</p></div>';
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

function bind(){
 by('libInput').onchange=e=>{importFiles(e.target.files);e.target.value=''};
 by('libSearch').oninput=render;
 by('libGrid').onclick=async e=>{
  const card=e.target.closest('.lib-card');if(!card)return;const id=card.dataset.id;
  if(e.target.closest('[data-open]'))return openBook(id);
  if(e.target.closest('[data-remove]')){if(confirm('Remove this book from this device library?')){await delBook(id);selected.delete(id);render()}return}
 };
}

async function init(){
 makeUI();bind();await render();
 try{if(navigator.storage?.persist)navigator.storage.persist()}catch{}
}
init();
window.PocketLibrary={allBooks,retrieve,importFiles,contextFor,render};
})();