// Pocket AI V57 — reference-image DOM cleanup
(() => {
 const by=id=>document.getElementById(id);
 const q=s=>document.querySelector(s);
 const qa=s=>[...document.querySelectorAll(s)];

 // Force the supplied light reference look for this redesign.
 document.documentElement.classList.add('pocket-ref57');
 document.documentElement.dataset.theme='light';
 try{localStorage.setItem('pocket-theme','light')}catch{}

 function show(id){
  if(window.PocketV39?.show){window.PocketV39.show(id);return}
  qa('.view').forEach(v=>{v.hidden=v.id!==id;v.classList.toggle('active',v.id===id)});
  qa('.tabs [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
  scrollTo({top:0,left:0,behavior:'auto'});
 }

 function makeHeader(){
  const top=q('.topbar'),actions=q('.top-actions');
  if(!top||!actions)return;
  // Keep only Settings and palette as shown in the user's reference.
  actions.innerHTML='<button id="settingsOpen57" class="round" aria-label="Settings">⚙️</button><button id="theme57" class="round" aria-label="Theme">🎨</button>';
  by('settingsOpen57').onclick=()=>by('settingsDialog')?.showModal();
  by('theme57').onclick=()=>by('settingsDialog')?.showModal();
 }

 function normalizeHome(){
  const home=by('home'),grid=home?.querySelector('.quick-grid'),enhanced=by('homeV45');
  if(!home||!grid||!enhanced)return false;

  // Ensure exactly four reference shortcuts.
  let more=grid.querySelector('[data-quick="more"]');
  if(!more){
    more=document.createElement('button');more.type='button';more.dataset.quick='more';
    grid.appendChild(more);
  }
  const config={
    library:['▣','Library'],
    chat:['●','Chat'],
    files:['▰','Files'],
    more:['••','More']
  };
  Object.entries(config).forEach(([k,v])=>{
    const b=grid.querySelector('[data-quick="'+k+'"]');if(!b)return;
    b.innerHTML='<span>'+v[0]+'</span><strong>'+v[1]+'</strong><small></small>';
  });

  // Put search exactly above the shortcuts.
  const search=by('home45Search');
  if(search&&!q('.ref57-search-wrap')){
    const wrap=document.createElement('div');wrap.className='ref57-search-wrap';
    search.parentNode.insertBefore(wrap,search);wrap.appendChild(search);
    grid.parentNode.insertBefore(wrap,grid);
  }

  // More opens the existing tool sheet.
  more.onclick=e=>{e.preventDefault();window.PocketV39?.openMore?.()};
  return true;
 }

 function reorderLibrary(){
   const lib=by('library'),tabs=lib?.querySelector('.lib53-tabs'),hero=lib?.querySelector('.lib53-hero');
   if(lib&&tabs&&hero&&tabs.previousElementSibling!==null){
     lib.insertBefore(tabs,lib.firstChild);
   }
 }

 function repairChatLabels(){
   const w=q('.v3-welcome');
   if(!w)return;
   const h=w.querySelector('h2'); if(h)h.textContent='How can Pocket AI help you today?';
   const p=w.querySelector('p'); if(p)p.textContent='Use Local AI or Local only. Attach a document, start Study Mode, or just ask.';
 }

 // Make buttons deterministic rather than visually interactive but dead.
 document.addEventListener('click',e=>{
   const nav=e.target.closest?.('[data-go]');
   if(nav){e.preventDefault();show(nav.dataset.go);return}
   const quick=e.target.closest?.('[data-quick]');
   if(!quick)return;
   const k=quick.dataset.quick;
   if(k==='more'){e.preventDefault();window.PocketV39?.openMore?.();return}
   const map={chat:'chat',library:'library',files:'files'};
   if(map[k]){e.preventDefault();show(map[k])}
 },true);

 let tries=0;
 const timer=setInterval(()=>{
   makeHeader();
   const ok=normalizeHome();
   reorderLibrary();
   repairChatLabels();
   if((ok&&by('library')&&q('.v3-chat-shell'))||++tries>50)clearInterval(timer);
 },100);
})();