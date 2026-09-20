// Pocket AI V58 — DOM normalization for the reference light theme
(() => {
 const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)], by=id=>document.getElementById(id);
 document.documentElement.classList.add('pocket-v58');
 document.documentElement.dataset.theme='light';
 try{localStorage.setItem('pocket-theme','light')}catch{}

 function show(id){
   if(window.PocketV39?.show){window.PocketV39.show(id);return}
   qa('.view').forEach(v=>{v.hidden=v.id!==id;v.classList.toggle('active',v.id===id)});
   qa('.tabs [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
   scrollTo({top:0,left:0,behavior:'auto'});
 }

 function header(){
   const a=q('.top-actions'); if(!a)return;
   a.innerHTML='<button id="settingsOpen58" aria-label="Settings">⚙️</button><button id="theme58" aria-label="Theme">🎨</button>';
   by('settingsOpen58').onclick=()=>by('settings')?.showModal?.()||by('settingsOpen')?.click();
   by('theme58').onclick=()=>by('settings')?.showModal?.()||by('theme')?.click();
 }

 function home(){
   const home=by('home'),grid=home?.querySelector('.quick-grid'),hv=by('homeV45');
   if(!home||!grid||!hv)return false;

   // Ensure a More shortcut exists.
   let more=grid.querySelector('[data-quick="more"]');
   if(!more){more=document.createElement('button');more.type='button';more.dataset.quick='more';grid.appendChild(more)}
   const cfg={library:['📚','Library'],chat:['💬','Chat'],files:['📁','Files'],more:['•••','More']};
   for(const [k,[icon,label]] of Object.entries(cfg)){
     const b=grid.querySelector('[data-quick="'+k+'"]');if(!b)continue;
     b.innerHTML='<span>'+icon+'</span><strong>'+label+'</strong><small></small>';
   }

   const search=by('home45Search');
   if(search&&!q('.p58-search-slot')){
     const slot=document.createElement('div');slot.className='p58-search-slot';
     search.parentNode.insertBefore(slot,search);slot.appendChild(search);
     grid.parentNode.insertBefore(slot,grid);
   }
   return true;
 }

 function library(){
   const lib=by('library'),tabs=lib?.querySelector('.lib53-tabs');
   if(lib&&tabs&&lib.firstElementChild!==tabs)lib.insertBefore(tabs,lib.firstChild);
   const input=lib?.querySelector('#libSearch');
   if(input){input.style.background='transparent';input.style.color='#2a233f'}
 }

 function chat(){
   const w=q('.v3-welcome'); if(!w)return;
   const h=w.querySelector('h2'); if(h)h.textContent='How can Pocket AI help you today?';
   const p=w.querySelector('p'); if(p)p.textContent='Use Local AI or Local only. Attach a document, start Study Mode, or just ask.';
 }

 // Keep visible buttons functional.
 document.addEventListener('click',e=>{
   const quick=e.target.closest?.('[data-quick]');
   if(quick){
     const k=quick.dataset.quick;
     if(k==='more'){e.preventDefault();window.PocketV39?.openMore?.();return}
     const map={library:'library',chat:'chat',files:'files'};
     if(map[k]){e.preventDefault();show(map[k]);return}
   }
 },true);

 let n=0;
 const t=setInterval(()=>{
   header(); const ok=home(); library(); chat();
   if((ok&&by('library')&&q('.v3-chat-shell'))||++n>60)clearInterval(t);
 },100);
})();