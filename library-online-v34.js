// Pocket AI V41 — immersive mobile reading experience
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
 const d=document.createElement('dialog');d.id='freeBookReader';d.className='free-reader reader-v41';
 d.innerHTML='<header class="reader41-head"><button id="freeReaderClose" class="reader41-round" aria-label="Back">‹</button><div class="reader41-title"><small id="freeReaderSource">FREE BOOK</small><strong id="freeReaderTitle">Book</strong><span id="freeReaderMeta"></span></div><button id="reader41MenuBtn" class="reader41-round" aria-label="Reader menu">•••</button></header><div class="reader41-progress"><i id="reader41Progress"></i></div><pre id="freeReaderText" tabindex="0"></pre><nav class="reader41-dock" aria-label="Reading controls"><button id="reader41Smaller" aria-label="Smaller text">A−<span>Smaller</span></button><button id="reader41Larger" aria-label="Larger text">A＋<span>Larger</span></button><button id="reader41Theme" aria-label="Reading theme">◐<span>Theme</span></button><button id="freeReaderTop" aria-label="Go to top">↑<span>Top</span></button><button id="reader41More" aria-label="More reading options">•••<span>More</span></button></nav><aside id="reader41Menu" class="reader41-menu" hidden><button id="freeReaderSave" class="primary">＋ Save to My Library</button><button id="reader41Comfort">☕ Comfort spacing</button><details><summary>Book access information</summary><p>Free access comes from Project Gutenberg. Results are limited to items Gutendex marks <b>copyright=false</b> (public domain in the USA). Copyright can differ by country, so check local law.</p></details><button id="reader41MenuClose">Done</button></aside>';
 document.body.appendChild(d);
 const pre=by('freeReaderText'),menu=by('reader41Menu');let size=+(localStorage.getItem('pocket-reader-size')||18),comfort=localStorage.getItem('pocket-reader-comfort')!=='0';
 const apply=()=>{pre.style.fontSize=size+'px';pre.classList.toggle('comfort',comfort)};
 const toggleMenu=()=>{menu.hidden=!menu.hidden};
 by('freeReaderClose').onclick=()=>d.close();by('freeReaderTop').onclick=()=>{pre.scrollTo({top:0,behavior:'smooth'})};
 by('freeReaderSave').onclick=saveActive;by('reader41MenuBtn').onclick=toggleMenu;by('reader41More').onclick=toggleMenu;by('reader41MenuClose').onclick=()=>menu.hidden=true;
 by('reader41Smaller').onclick=()=>{size=Math.max(14,size-2);try{localStorage.setItem('pocket-reader-size',size)}catch{};apply()};
 by('reader41Larger').onclick=()=>{size=Math.min(30,size+2);try{localStorage.setItem('pocket-reader-size',size)}catch{};apply()};
 by('reader41Comfort').onclick=()=>{comfort=!comfort;try{localStorage.setItem('pocket-reader-comfort',comfort?'1':'0')}catch{};apply()};
 by('reader41Theme').onclick=()=>{d.classList.toggle('reader-paper');try{localStorage.setItem('pocket-reader-paper',d.classList.contains('reader-paper')?'1':'0')}catch{}};
 if(localStorage.getItem('pocket-reader-paper')==='1')d.classList.add('reader-paper');apply();
 let progressTimer=0;
 pre.addEventListener('scroll',()=>{
   const max=pre.scrollHeight-pre.clientHeight,p=max>0?Math.min(100,Math.max(0,pre.scrollTop/max*100)):0;
   const bar=by('reader41Progress');if(bar)bar.style.width=p+'%';
   clearTimeout(progressTimer);
   progressTimer=setTimeout(()=>{
     try{localStorage.setItem('pocket-reader-progress-'+(activeBook?.id||'book'),String(pre.scrollTop))}catch{}
   },180);
 },{passive:true});
 d.addEventListener('close',()=>{menu.hidden=true});
}
function textURL(b){
 const f=b.formats||{},entries=Object.entries(f).filter(([k,u])=>u&&/^text\/plain/i.test(k)&&!/\.zip($|\?)/i.test(u));
 return entries.sort(([a],[b])=>(/utf-8/i.test(b)?1:0)-(/utf-8/i.test(a)?1:0))[0]?.[1]||'';
}
function htmlURL(b){const f=b.formats||{},e=Object.entries(f).filter(([k,u])=>u&&/^text\/html/i.test(k)&&!/\.zip($|\?)/i.test(u));return e[0]?.[1]||''}
function coverURL(b){const f=b.formats||{};return f['image/jpeg']||''}
function authorLine(b){return (b.authors||[]).map(a=>a.name).filter(Boolean).join(', ')||'Unknown author'}
async function getJSON(url){const r=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error('Catalog returned HTTP '+r.status);return r.json()}
async function fetchReadable(url,timeout=16000){
 const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),timeout);
 try{const r=await fetch(url,{cache:'no-store',signal:ac.signal,headers:{Accept:'text/plain,text/html;q=0.8,*/*;q=0.5'}});if(!r.ok)throw Error('HTTP '+r.status);const len=+(r.headers.get('content-length')||0);if(len>MAX_READ*1.5)throw Error('File is too large');const t=await r.text();if(t.trim().length<100)throw Error('Empty response');return t.slice(0,MAX_READ)}finally{clearTimeout(timer)}
}
async function getText(b,onStage){
 const plain=textURL(b),html=htmlURL(b),errors=[];
 if(!plain&&!html)throw Error('This edition has no readable text or HTML file.');
 // First try the publisher file directly. Some mobile browsers block this because
 // Gutenberg intentionally restricts deep-linked files, so failure is expected on some iPhones.
 if(plain){try{onStage?.('Loading book…');return await fetchReadable(plain,12000)}catch(e){errors.push('direct: '+(e?.message||e))}}
 // Jina Reader fetches the public source server-side and returns readable text.
 // This is a no-key fallback for cross-origin/deep-link restrictions, not a book source.
 for(const source of [plain,html].filter(Boolean)){
  try{onStage?.('Direct delivery was blocked. Trying the backup reader…');return await fetchReadable('https://r.jina.ai/'+source,24000)}
  catch(e){errors.push('backup: '+(e?.message||e))}
 }
 throw Error('Reader could not retrieve this edition. '+errors.slice(-2).join(' • '));
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
 by('freeReaderTitle').textContent=b.title||'Book';by('freeReaderMeta').textContent=authorLine(b)+' • '+(b.languages||[]).join(', ').toUpperCase();pre.textContent='Loading book…';by('reader41Progress').style.width='0%';d.showModal();
 try{activeText=await getText(b,msg=>{pre.textContent=msg});pre.textContent=activeText;requestAnimationFrame(()=>{const saved=+(localStorage.getItem('pocket-reader-progress-'+(b.id||'book'))||0);pre.scrollTop=Math.min(saved,Math.max(0,pre.scrollHeight-pre.clientHeight))})}catch(e){pre.textContent='Could not load this edition inside Pocket AI.\n\n'+(e?.message||e)+'\n\nClose and tap “Read in app” to retry.'}
}
async function saveBook(b,text){
 if(!b)return;const status=by('freeStatus');try{if(!text)text=await getText(b);const safe=(b.title||'Free book').replace(/[\\/:*?"<>|]+/g,'_').slice(0,90);const f=new File([text],safe+'.txt',{type:'text/plain'});await window.PocketLibrary.importFiles([f]);if(status)status.textContent='✓ Saved “'+b.title+'” to My Library on this device.';return true}catch(e){if(status)status.textContent='Could not save: '+(e?.message||e);return false}
}
async function saveActive(){const b=activeBook;if(!b)return;const btn=by('freeReaderSave');btn.disabled=true;btn.textContent='Saving…';const ok=await saveBook(b,activeText);btn.disabled=false;btn.textContent=ok?'✓ Saved to My Library':'＋ Save to My Library'}
async function actions(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.freeRead!=null)return openBook(+b.dataset.freeRead);if(b.dataset.freeSave!=null){b.disabled=true;try{await saveBook(books[+b.dataset.freeSave],'')}finally{b.disabled=false}}}
async function openByQuery(q){const input=by('freeSearch');if(input)input.value=q||'';await search();if(books.length){await openBook(0);return true}return false}
function init(){fixNavigation();addDiscovery()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
window.PocketLibraryOnline={searchOnline:search,showLibrary,openBook,openByQuery};
})();