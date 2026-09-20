// Pocket AI V55 — UI reliability + recent files
(() => {
 const by=id=>document.getElementById(id);
 const q=(s,r=document)=>r.querySelector(s);
 const qa=(s,r=document)=>[...r.querySelectorAll(s)];
 const RECENT='pocket-recent-files-v55';

 function show(id){
  if(window.PocketV39?.show){window.PocketV39.show(id);return}
  qa('.view').forEach(v=>{v.hidden=v.id!==id;v.classList.toggle('active',v.id===id)});
  qa('.tabs [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
  window.scrollTo({top:0,left:0,behavior:'auto'});
 }

 // Robust navigation fallback for controls that were visually present but sometimes dead.
 document.addEventListener('click',e=>{
  const more=e.target.closest?.('[data-more]');
  if(more){e.preventDefault();window.PocketV39?.openMore?.();return}
  const quick=e.target.closest?.('[data-quick]');
  if(!quick)return;
  const kind=quick.dataset.quick;
  if(kind==='more'){e.preventDefault();window.PocketV39?.openMore?.();return}
  const map={chat:'chat',library:'library',files:'files',local:'local',github:'github',research:'surface',coding:'coding'};
  if(map[kind]){e.preventDefault();show(map[kind]);return}
  if(kind==='study'){
   e.preventDefault();show('chat');
   setTimeout(()=>{const p=by('prompt');if(p){p.value='Help me study this topic step by step: ';p.focus()}},50);
  }
 },{capture:true});

 // Make "See all" buttons and home hero routes resilient.
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-home-library]');
  if(!b)return;
  e.preventDefault();
  show('library');
 },{capture:true});

 function readRecent(){try{const x=JSON.parse(localStorage.getItem(RECENT)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
 function writeRecent(items){try{localStorage.setItem(RECENT,JSON.stringify(items.slice(0,6)))}catch{}}
 function remember(name,size=0,type='file'){
  if(!name)return;
  const now=Date.now(),items=readRecent().filter(x=>x.name!==name);
  items.unshift({name,size,type,at:now});writeRecent(items);renderRecent();
 }
 function formatSize(n){if(!n)return'';if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(1)+' MB'}
 function icon(name){const ext=(name.split('.').pop()||'').toLowerCase();return ext==='pdf'?'📕':ext==='docx'?'📘':ext==='pptx'?'📙':ext==='xlsx'?'📗':'📄'}
 function renderRecent(){
  const files=by('files');if(!files)return;
  let box=by('v55RecentFiles');
  if(!box){
   box=document.createElement('section');box.id='v55RecentFiles';box.className='v55-recent-files';
   const status=by('fileStatus');(status?.parentNode||files).insertBefore(box,status?.nextSibling||null);
  }
  const items=readRecent();
  box.innerHTML='<div class="v55-recent-head"><h3>Recent files</h3><small>'+items.length+' recent</small></div><div class="v55-recent-list">'+
   (items.length?items.map(x=>'<div class="v55-recent-item"><span>'+icon(x.name)+'</span><div><strong>'+escapeHtml(x.name)+'</strong><small>'+[formatSize(x.size),new Date(x.at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})].filter(Boolean).join(' • ')+'</small></div><span>•••</span></div>').join(''):'<div class="v55-recent-empty">Opened files will appear here on this device.</div>')+
   '</div>';
 }
 function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

 const fileInput=by('fileInput');
 fileInput?.addEventListener('change',()=>{[...(fileInput.files||[])].forEach(f=>remember(f.name,f.size,f.type||'file'))});
 by('saveFile')?.addEventListener('click',()=>setTimeout(()=>remember(by('fileName')?.value||'pocket-notes.txt',new Blob([by('fileText')?.value||'']).size,'text/plain'),30));

 // Ensure common primary controls have type=button unless they deliberately submit a form.
 qa('button').forEach(b=>{if(!b.hasAttribute('type')&&!b.closest('form'))b.type='button'});

 renderRecent();
 window.PocketUIV55={show,remember,renderRecent};
})();