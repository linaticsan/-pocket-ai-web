// Pocket AI V34 — Library navigation fix + legal open-source discovery
(() => {
const $=s=>document.querySelector(s), by=id=>document.getElementById(id);
let online=[];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showLibrary(){
 document.querySelectorAll('.view').forEach(v=>{v.hidden=v.id!=='library';v.classList.toggle('active',v.id==='library')});
 document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go==='library'));
 document.body.classList.remove('coding-active');scrollTo({top:0,left:0,behavior:'auto'});
}
function fixNavigation(){
 const b=$('[data-go="library"]');if(b){b.onclick=e=>{e.preventDefault();e.stopPropagation();showLibrary()};b.style.pointerEvents='auto';b.removeAttribute('disabled')}
 document.addEventListener('click',e=>{const x=e.target.closest?.('[data-go="library"],[data-quick="library"],[data-command="library"]');if(!x)return;e.preventDefault();e.stopPropagation();by('commandDialog')?.close();showLibrary()},{capture:true});
}
function addDiscovery(){
 const host=by('libStorage');if(!host||by('libOnline'))return;
 const box=document.createElement('section');box.id='libOnline';box.className='lib-online';
 box.innerHTML='<div class="lib-online-head"><div><p class="eyebrow">DISCOVER ONLINE</p><h2>Find open books & research</h2><p class="muted">Search Google Books, Open Library and OpenAlex. Read available books/papers at the original source, or add legally open full text to your private Library when the source permits it.</p></div><span class="privacy-pill">🌐 Open sources</span></div>'+
 '<form id="libOnlineForm" class="lib-online-form"><input id="libOnlineQuery" placeholder="Search books, papers, topics…"><select id="libOnlineSource"><option value="all">All sources</option><option value="google">Google Books</option><option value="openlibrary">Open Library</option><option value="papers">Open research</option><option value="archive">Internet Archive</option></select><button class="primary">Search</button></form>'+
 '<div class="lib-online-shortcuts"><button data-online-q="Japanese N3">Japanese N3</button><button data-online-q="human welfare">Human welfare</button><button data-online-q="criminology">Criminology</button><a id="libGoogleFiles" target="_blank" rel="noopener noreferrer">Search Google for PDF/PPT ↗</a></div>'+
 '<div id="libOnlineStatus" class="muted"></div><div id="libOnlineResults" class="lib-online-results"></div>';
 host.insertAdjacentElement('afterend',box);
 by('libOnlineForm').onsubmit=e=>{e.preventDefault();searchOnline()};
 box.querySelectorAll('[data-online-q]').forEach(b=>b.onclick=()=>{by('libOnlineQuery').value=b.dataset.onlineQ;searchOnline()});
 let timer;by('libOnlineQuery').oninput=()=>{clearTimeout(timer);const q=by('libOnlineQuery').value.trim();by('libGoogleFiles').href='https://www.google.com/search?q='+encodeURIComponent(q+' (filetype:pdf OR filetype:ppt OR filetype:pptx)');if(q.length>=3)timer=setTimeout(searchOnline,700)};
 by('libGoogleFiles').href='https://www.google.com/search?q='+encodeURIComponent('(filetype:pdf OR filetype:ppt OR filetype:pptx) open educational resources');
 by('libOnlineResults').onclick=handleOnlineAction;
}
async function getJSON(url){const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function googleBooks(q){
 const d=await getJSON('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q)+'&maxResults=12&printType=books');
 return (d.items||[]).map(x=>{const v=x.volumeInfo||{},a=x.accessInfo||{},view=a.viewability||'UNKNOWN',read=view!=='NO_PAGES'?(a.webReaderLink||v.previewLink||v.infoLink):v.infoLink;return{id:'g:'+x.id,source:'Google Books',kind:'book',title:v.title||'Untitled',authors:(v.authors||[]).join(', '),year:(v.publishedDate||'').slice(0,4),desc:v.description||'',cover:v.imageLinks?.thumbnail||'',readUrl:read||'',pdfUrl:a.pdf?.downloadLink||'',publicDomain:!!a.publicDomain,license:a.publicDomain?'Public domain':'Preview/access controlled by Google Books',canImport:!!a.publicDomain&&!!a.pdf?.downloadLink}})}
async function openLibrary(q){
 const fields='key,title,author_name,first_publish_year,cover_i,ebook_access,ia,public_scan_b';
 const d=await getJSON('https://openlibrary.org/search.json?q='+encodeURIComponent(q)+'&limit=12&fields='+encodeURIComponent(fields));
 return (d.docs||[]).map(x=>{const ia=x.ia?.[0]||'',pub=x.ebook_access==='public';return{id:'ol:'+x.key,source:'Open Library',kind:'book',title:x.title||'Untitled',authors:(x.author_name||[]).slice(0,3).join(', '),year:x.first_publish_year||'',desc:pub?'Publicly readable edition available.':x.ebook_access==='borrowable'?'Borrowable edition available.':'Catalog record.',cover:x.cover_i?'https://covers.openlibrary.org/b/id/'+x.cover_i+'-M.jpg':'',readUrl:ia?'https://archive.org/details/'+encodeURIComponent(ia):'https://openlibrary.org'+x.key,fullTextUrl:pub&&ia?'https://archive.org/download/'+encodeURIComponent(ia)+'/'+encodeURIComponent(ia)+'_djvu.txt':'',publicDomain:pub,license:pub?'Open Library public ebook':'Availability varies by edition',canImport:pub&&!!ia}})}
async function openAlex(q){
 const url='https://api.openalex.org/works?search='+encodeURIComponent(q)+'&filter=open_access.is_oa:true&per_page=12&select=id,title,publication_year,authorships,open_access,best_oa_location,doi';
 const d=await getJSON(url);
 return (d.results||[]).map(x=>{const loc=x.best_oa_location||{},lic=loc.license||'',pdf=loc.pdf_url||'',open=x.open_access?.oa_url||loc.landing_page_url||x.doi||x.id;const reusable=/^cc-|public-domain|cc0/i.test(lic);return{id:'oa:'+x.id,source:'OpenAlex',kind:'research',title:x.title||'Research paper',authors:(x.authorships||[]).slice(0,4).map(a=>a.author?.display_name).filter(Boolean).join(', '),year:x.publication_year||'',desc:'Open-access research • '+(lic||x.open_access?.oa_status||'license not listed'),readUrl:open,pdfUrl:pdf,license:lic||'OA access; reuse license not listed',canImport:!!pdf&&reusable}})}
async function archive(q){
 const query='('+q+') AND mediatype:texts';
 const u='https://archive.org/advancedsearch.php?q='+encodeURIComponent(query)+'&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date&fl[]=description&rows=10&page=1&output=json';
 const d=await getJSON(u);return (d.response?.docs||[]).map(x=>({id:'ia:'+x.identifier,source:'Internet Archive',kind:'document',title:x.title||x.identifier,authors:Array.isArray(x.creator)?x.creator.slice(0,3).join(', '):(x.creator||''),year:String(x.date||'').slice(0,4),desc:Array.isArray(x.description)?x.description[0]:(x.description||'Archive text/document'),readUrl:'https://archive.org/details/'+encodeURIComponent(x.identifier),license:'Check rights on item page',canImport:false}))}
function dedupe(a){const seen=new Set();return a.filter(x=>{const k=(x.title+'|'+x.authors).toLowerCase();if(seen.has(k))return false;seen.add(k);return true})}
async function searchOnline(){
 const q=by('libOnlineQuery')?.value.trim(),src=by('libOnlineSource')?.value||'all';if(!q)return;
 const status=by('libOnlineStatus'),grid=by('libOnlineResults');status.textContent='Searching open sources…';grid.innerHTML='';
 const jobs=[];if(src==='all'||src==='google')jobs.push(googleBooks(q));if(src==='all'||src==='openlibrary')jobs.push(openLibrary(q));if(src==='all'||src==='papers')jobs.push(openAlex(q));if(src==='all'||src==='archive')jobs.push(archive(q));
 const settled=await Promise.allSettled(jobs);online=dedupe(settled.filter(x=>x.status==='fulfilled').flatMap(x=>x.value)).slice(0,35);
 const errors=settled.filter(x=>x.status==='rejected').length;renderOnline();status.textContent=online.length+' results'+(errors?' • '+errors+' source(s) unavailable':'')+' • Full-text import appears only when rights/access allow it.';
}
function renderOnline(){
 const grid=by('libOnlineResults');if(!grid)return;grid.innerHTML=online.length?online.map((x,i)=>'<article class="online-card">'+(x.cover?'<img src="'+esc(x.cover)+'" alt="" loading="lazy">':'<div class="online-type">'+(x.kind==='research'?'📄':x.kind==='book'?'📚':'🗂️')+'</div>')+'<div class="online-body"><small>'+esc(x.source)+(x.year?' • '+esc(x.year):'')+'</small><strong>'+esc(x.title)+'</strong><p>'+esc(x.authors||x.desc||'')+'</p><span class="online-license">'+esc(x.license||'')+'</span><div class="online-actions">'+(x.readUrl?'<button data-online-read="'+i+'">Read / Open</button>':'')+(x.pdfUrl?'<button data-online-pdf="'+i+'">PDF</button>':'')+(x.canImport?'<button class="primary" data-online-import="'+i+'">＋ Add full text</button>':'<button data-online-save="'+i+'">＋ Save reference</button>')+'</div></div></article>').join(''):'<div class="lib-empty">No online results yet.</div>';
}
async function saveReference(x){
 const text=['ONLINE LIBRARY REFERENCE','Title: '+x.title,'Author(s): '+(x.authors||''),'Year: '+(x.year||''),'Source: '+x.source,'Access: '+(x.readUrl||x.pdfUrl||''),'License/access note: '+(x.license||''),'',x.desc||''].join('\n');
 const file=new File([text],(x.title||'online-reference').replace(/[\\/:*?"<>|]+/g,'_').slice(0,80)+'.txt',{type:'text/plain'});await window.PocketLibrary.importFiles([file]);
}
async function importFull(x){
 const status=by('libOnlineStatus');status.textContent='Adding legally open full text to your private Library…';
 try{
  if(x.fullTextUrl){const r=await fetch(x.fullTextUrl);if(!r.ok)throw Error('Full text server returned '+r.status);const t=await r.text();if(t.length<200)throw Error('No usable full text was returned');const f=new File([t],x.title.replace(/[\\/:*?"<>|]+/g,'_').slice(0,80)+'.txt',{type:'text/plain'});await window.PocketLibrary.importFiles([f]);status.textContent='Full text added. You can now quiz or chat with it.';return}
  if(x.pdfUrl){const r=await fetch(x.pdfUrl);if(!r.ok)throw Error('PDF server returned '+r.status);const b=await r.blob();const f=new File([b],x.title.replace(/[\\/:*?"<>|]+/g,'_').slice(0,80)+'.pdf',{type:'application/pdf'});await window.PocketLibrary.importFiles([f]);status.textContent='Open PDF added. You can now use it for quizzes and chat.';return}
  await saveReference(x);status.textContent='Reference saved.';
 }catch(e){status.textContent='The source blocks direct importing in Safari. Tap Read / Open, download the legal copy, then use “Add books & documents”. '+(e?.message||'')}
}
async function handleOnlineAction(e){
 const el=e.target.closest('button');if(!el)return;let i;
 if(el.dataset.onlineRead!=null){i=+el.dataset.onlineRead;open(online[i]?.readUrl,'_blank','noopener');return}
 if(el.dataset.onlinePdf!=null){i=+el.dataset.onlinePdf;open(online[i]?.pdfUrl,'_blank','noopener');return}
 if(el.dataset.onlineImport!=null){i=+el.dataset.onlineImport;el.disabled=true;try{await importFull(online[i])}finally{el.disabled=false}return}
 if(el.dataset.onlineSave!=null){i=+el.dataset.onlineSave;el.disabled=true;try{await saveReference(online[i]);by('libOnlineStatus').textContent='Reference saved to your private Library.'}finally{el.disabled=false}}
}
function init(){fixNavigation();addDiscovery()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
window.PocketLibraryOnline={searchOnline,showLibrary};
})();