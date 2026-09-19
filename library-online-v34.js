// Pocket AI V38 — free-book discovery + in-app reader
(() => {
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)], by=id=>document.getElementById(id);
let books=[],activeBook=null,activeText='';
const MAX_READ=6*1024*1024;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showLibrary(){
 $$('.view').forEach(v=>{v.hidden=v.id!=='library';v.classList.toggle('active',v.id==='library')});
 $$('.tabs [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go==='library'));
 document.body.classList.remove('coding-active');window.scrollTo({top:0,left:0,behavior:'auto'});
}
function fixNavigation(){
 document.addEventListener('click',e=>{const x=e.target.closest?.('[data-go="library"],[data-quick="library"],[data-command="library"]');if(!x)return;e.preventDefault();e.stopPropagation();by('commandDialog')?.close();showLibrary()},{capture:true});
}
function ensureReader(){
 if(by('freeBookReader'))return;
 const d=document.createElement('dialog');d.id='freeBookReader';d.className='free-reader';
 d.innerHTML='<div class="free-reader-head"><div><small id="freeReaderSource">FREE BOOK</small><h2 id="freeReaderTitle">Book</h2><p id="freeReaderMeta"></p></div><button id="freeReaderClose" aria-label="Close reader">×</button></div><div class="free-reader-actions"><button id="freeReaderSave" class="primary">＋ Save to My Library</button><button id="freeReaderTop">↑ Top</button></div><div class="free-rights">Free access comes from Project Gutenberg. Catalog results are limited to items Gutendex marks <b>copyright=false</b> (public domain in the USA). Copyright can differ by country, so readers outside the U.S. should check local law.</div><pre id="freeReaderText" tabindex="0"></pre>';
 document.body.appendChild(d);
 by('freeReaderClose').onclick=()=>d.close();by('freeReaderTop').onclick=()=>{by('freeReaderText').scrollTop=0};
 by('freeReaderSave').onclick=saveActive;
}
function textURL(b){
 const f=b.formats||{},entries=Object.entries(f).filter(([k,u])=>u&&/^text\/plain/i.test(k)&&!/\.zip($|\?)/i.test(u));
 return entries.sort(([a],[b])=>(/utf-8/i.test(b)?1:0)-(/utf-8/i.test(a)?1:0))[0]?.[1]||'';
}
function coverURL(b){const f=b.formats||{};return f['image/jpeg']||''}
function authorLine(b){return (b.authors||[]).map(a=>a.name).filter(Boolean).join(', ')||'Unknown author'}
async function getJSON(url){const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error('Catalog returned HTTP '+r.status);return r.json()}
async function getText(b){
 const u=textURL(b);if(!u)throw Error('This edition has no plain-text reading file.');
 const r=await fetch(u,{cache:'force-cache'});if(!r.ok)throw Error('Book text returned HTTP '+r.status);
 const len=+(r.headers.get('content-length')||0);if(len>MAX_READ)throw Error('This edition is too large for the mobile reader.');
 const t=await r.text();if(t.length<100)throw Error('No readable book text was returned.');return t.slice(0,MAX_READ);
}
function addDiscovery(){
 by('libOnline')?.remove();const host=by('libStorage');if(!host||by('freeLibrary'))return;
 const box=document.createElement('section');box.id='freeLibrary';box.className='free-library';
 box.innerHTML='<div class="free-head"><div><p class="eyebrow">FREE BOOKS • READ INSIDE POCKET AI</p><h2>Free Book Library</h2><p class="muted">Search free-access classics, open them here without leaving Pocket AI, and save a copy to your private on-device Library for study and AI questions.</p></div><span class="privacy-pill">📖 In-app reader</span></div><form id="freeSearchForm" class="free-search"><input id="freeSearch" placeholder="Search title or author…"><select id="freeLanguage" aria-label="Language"><option value="">Any language</option><option value="en">English</option><option value="ja">Japanese</option><option value="fr">French</option><option value="de">German</option><option value="es">Spanish</option></select><button class="primary">Search free books</button></form><div class="free-chips"><button data-free-q="children">Children</button><button data-free-q="japanese">Japanese</button><button data-free-q="psychology">Psychology</button><button data-free-q="crime">Crime</button><button data-free-q="history">History</button><button data-free-q="">Popular</button></div><p class="free-legal">Only catalog items marked public domain in the U.S. are shown. Availability outside the U.S. depends on local copyright law.</p><div id="freeStatus" class="muted"></div><div id="freeResults" class="free-results"></div>';
 host.insertAdjacentElement('afterend',box);ensureReader();
 by('freeSearchForm').onsubmit=e=>{e.preventDefault();search()};
 box.querySelectorAll('[data-free-q]').forEach(b=>b.onclick=()=>{by('freeSearch').value=b.dataset.freeQ;search()});
 by('freeLanguage').onchange=search;by('freeResults').onclick=actions;
 setTimeout(()=>search(),80);
}
async function search(){
 const q=by('freeSearch')?.value.trim()||'',lang=by('freeLanguage')?.value||'',status=by('freeStatus'),grid=by('freeResults');if(!status||!grid)return;
 status.textContent='Loading free books…';grid.innerHTML='<div class="free-loading">📚 Finding readable books…</div>';
 const p=new URLSearchParams({copyright:'false','mime_type':'text/plain',sort:'popular'});if(q)p.set('search',q);if(lang)p.set('languages',lang);
 try{const d=await getJSON('https://gutendex.com/books/?'+p.toString());books=(d.results||[]).filter(b=>b.copyright===false&&textURL(b)).slice(0,24);render();status.textContent=books.length+' free book'+(books.length===1?'':'s')+' ready to read inside Pocket AI.'}
 catch(e){books=[];grid.innerHTML='<div class="lib-empty"><strong>Free catalog is unavailable right now.</strong><p>Check your internet connection and try again. Pocket AI will not send you to another website.</p></div>';status.textContent=e?.message||String(e)}
}
function render(){
 const grid=by('freeResults');if(!grid)return;grid.innerHTML=books.length?books.map((b,i)=>'<article class="free-card">'+(coverURL(b)?'<img src="'+esc(coverURL(b))+'" alt="" loading="lazy">':'<div class="free-cover">📖</div>')+'<div class="free-book-body"><small>Free book • '+esc((b.languages||[]).join(', ').toUpperCase())+'</small><strong>'+esc(b.title||'Untitled')+'</strong><p>'+esc(authorLine(b))+'</p><span>'+Number(b.download_count||0).toLocaleString()+' downloads</span><div class="free-actions"><button class="primary" data-free-read="'+i+'">📖 Read in app</button><button data-free-save="'+i+'">＋ My Library</button></div></div></article>').join(''):'<div class="lib-empty"><strong>No free readable books found.</strong><p>Try another title, author, language or the Popular button.</p></div>';
}
async function openBook(i){
 const b=books[i];if(!b)return;activeBook=b;activeText='';ensureReader();const d=by('freeBookReader'),pre=by('freeReaderText');
 by('freeReaderTitle').textContent=b.title||'Book';by('freeReaderMeta').textContent=authorLine(b)+' • '+(b.languages||[]).join(', ').toUpperCase();pre.textContent='Loading book…';d.showModal();
 try{activeText=await getText(b);pre.textContent=activeText;pre.scrollTop=0}catch(e){pre.textContent='Could not load this edition inside Pocket AI.\n\n'+(e?.message||e)}
}
async function saveBook(b,text){
 if(!b)return;const status=by('freeStatus');try{if(!text)text=await getText(b);const safe=(b.title||'Free book').replace(/[\\/:*?"<>|]+/g,'_').slice(0,90);const f=new File([text],safe+'.txt',{type:'text/plain'});await window.PocketLibrary.importFiles([f]);if(status)status.textContent='✓ Saved “'+b.title+'” to My Library on this device.';return true}catch(e){if(status)status.textContent='Could not save: '+(e?.message||e);return false}
}
async function saveActive(){const b=activeBook;if(!b)return;const btn=by('freeReaderSave');btn.disabled=true;btn.textContent='Saving…';const ok=await saveBook(b,activeText);btn.disabled=false;btn.textContent=ok?'✓ Saved to My Library':'＋ Save to My Library'}
async function actions(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.freeRead!=null)return openBook(+b.dataset.freeRead);if(b.dataset.freeSave!=null){b.disabled=true;try{await saveBook(books[+b.dataset.freeSave],'')}finally{b.disabled=false}}}
function init(){fixNavigation();addDiscovery()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
window.PocketLibraryOnline={searchOnline:search,showLibrary,openBook};
})();