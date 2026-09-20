// Pocket AI V59 — consolidated DOM + reliability
(() => {
 const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)], by=id=>document.getElementById(id);
 document.documentElement.classList.add('pocket-v59');
 document.documentElement.dataset.theme='light';
 try{localStorage.setItem('pocket-theme','light')}catch{}

 // Remove experimental classes that had conflicting overrides.
 document.documentElement.classList.remove('pocket-ref57');

 function show(id){
   if(window.PocketV39?.show){window.PocketV39.show(id);return}
   qa('.view').forEach(v=>{v.hidden=v.id!==id;v.classList.toggle('active',v.id===id)});
   qa('.tabs [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
   scrollTo({top:0,left:0,behavior:'auto'});
 }

 function header(){
   const a=q('.top-actions');if(!a)return;
   a.innerHTML='<button id="settings59" aria-label="Settings">⚙️</button><button id="theme59" aria-label="Theme">🎨</button>';
   by('settings59').onclick=()=>by('settings')?.showModal?.()||by('settingsOpen')?.click();
   by('theme59').onclick=()=>by('settings')?.showModal?.()||by('theme')?.click();
 }

 function ensureHome(){
   const home=by('home');if(!home)return false;
   let box=by('homeV59');
   if(!box){
     box=document.createElement('section');box.id='homeV59';box.className='v59-home';
     box.innerHTML=
      '<form class="v59-search" id="v59Search"><span>⌕</span><input id="v59Query" placeholder="Search books, documents, or ask anything…" autocomplete="off"><button aria-label="Search">✦</button></form>'+
      '<div class="v59-shortcuts"><button class="v59-shortcut" data-v59-go="library"><i>📚</i><strong>Library</strong></button><button class="v59-shortcut" data-v59-go="chat"><i>💬</i><strong>Chat</strong></button><button class="v59-shortcut" data-v59-go="files"><i>📁</i><strong>Files</strong></button><button class="v59-shortcut" data-v59-more><i>•••</i><strong>More</strong></button></div>'+
      '<section class="v59-hero"><small>YOUR PERSONAL</small><h1>AI LIBRARY</h1><p>Discover • Read • Learn • Create</p><button data-v59-go="library">Explore Books →</button><span class="v59-hero-art">📚</span></section>'+
      '<div class="v59-section-head"><h2>🔥 Trending Books</h2><button data-v59-go="library">See All ›</button></div>'+
      '<div class="v59-books"><button class="v59-book" data-v59-book="Moby Dick"><span class="v59-cover blue"><span>🌊</span><b>MOBY DICK</b></span><strong>Moby Dick</strong><small>Herman Melville</small></button><button class="v59-book" data-v59-book="Pride and Prejudice"><span class="v59-cover pink"><span>🌸</span><b>PRIDE & PREJUDICE</b></span><strong>Pride and Prejudice</strong><small>Jane Austen</small></button><button class="v59-book" data-v59-go="library"><span class="v59-cover indigo"><span>🗾</span><b>DAILY JAPANESE</b></span><strong>Daily Japanese</strong><small>Your Library</small></button></div>';
     home.appendChild(box);
   }
   // Hide generated older home enhancement instead of relying on it.
   const old=by('homeV45');if(old)old.hidden=true;
   return true;
 }

 function normalizeLibrary(){
   const lib=by('library'),tabs=lib?.querySelector('.lib53-tabs');
   if(lib&&tabs&&lib.firstElementChild!==tabs)lib.insertBefore(tabs,lib.firstChild);
 }

 function normalizeChat(){
   const w=q('.v3-welcome');if(!w)return;
   const h=w.querySelector('h2');if(h)h.textContent='How can Pocket AI help you today?';
   const p=w.querySelector('p');if(p)p.textContent='Use Local AI or Local only. Attach a document, start Study Mode, or just ask.';
 }

 document.addEventListener('click',e=>{
   const go=e.target.closest?.('[data-v59-go]');
   if(go){e.preventDefault();show(go.dataset.v59Go);return}
   if(e.target.closest?.('[data-v59-more]')){e.preventDefault();window.PocketV39?.openMore?.();return}
   const book=e.target.closest?.('[data-v59-book]');
   if(book){
     e.preventDefault();show('library');
     setTimeout(()=>{
       const input=by('freeSearch');
       if(input){input.value=book.dataset.v59Book;window.PocketLibraryOnline?.searchOnline?.();by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'})}
     },100);
   }
 },true);

 document.addEventListener('submit',e=>{
   if(e.target?.id!=='v59Search')return;
   e.preventDefault();const text=by('v59Query')?.value.trim();if(!text)return;
   show('chat');setTimeout(()=>{const p=by('prompt');if(p){p.value=text;p.focus()}},60);
 },true);

 let tries=0;
 const timer=setInterval(()=>{
   header();const h=ensureHome();normalizeLibrary();normalizeChat();
   if((h&&by('library')&&q('.v3-chat-shell'))||++tries>80)clearInterval(timer);
 },100);
})();