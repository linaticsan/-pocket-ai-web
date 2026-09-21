// Pocket AI V59 — consolidated DOM + reliability
(() => {
 const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)], by=id=>document.getElementById(id);
 document.documentElement.classList.add('pocket-v59');
 try{document.documentElement.dataset.theme=localStorage.getItem('pocket-theme')||'light'}catch{document.documentElement.dataset.theme='light'}

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
   // Keep stable IDs used by the core app and More sheet.
   a.innerHTML='<button id="settingsOpen" aria-label="Settings">⚙️</button><button id="theme" aria-label="Theme">🎨</button>';
   const openSettings=()=>{const d=by('settingsDialog');if(d?.showModal&&!d.open)d.showModal()};
   by('settingsOpen').onclick=openSettings;
   by('theme').onclick=openSettings;
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

/* V62 — fallback handlers for controls that must never be dead */
document.addEventListener('click',e=>{
  const by=id=>document.getElementById(id);
  const go=e.target.closest?.('[data-go]');
  if(go&&window.PocketV39?.show){e.preventDefault();window.PocketV39.show(go.dataset.go);return}
  const more=e.target.closest?.('[data-more]');
  if(more&&window.PocketV39?.openMore){e.preventDefault();window.PocketV39.openMore();return}
  const tool=e.target.closest?.('[data-v39-go]');
  if(tool&&window.PocketV39?.show){e.preventDefault();window.PocketV39.show(tool.dataset.v39Go);return}
  if(e.target.closest?.('[data-v39-settings],[data-v39-theme]')){
    e.preventDefault();const d=by('settingsDialog');if(d?.showModal&&!d.open)d.showModal();return;
  }
},false);


/* V64 — theme engine */
(() => {
  const root=document.documentElement;
  const allowed=new Set(['system','light','dark','sakura','green','oled']);

  const media=window.matchMedia?.('(prefers-color-scheme: dark)');
  let selected='light';

  function resolveTheme(choice){
    return choice==='system' ? (media?.matches?'dark':'light') : choice;
  }

  function applyTheme(theme,{persist=true,close=true}={}){
    const choice=allowed.has(theme)?theme:'light';
    selected=choice;
    const resolved=resolveTheme(choice);
    root.dataset.theme=resolved;
    root.dataset.themeChoice=choice;
    root.style.colorScheme=(resolved==='dark'||resolved==='oled')?'dark':'light';

    if(persist){try{localStorage.setItem('pocket-theme',choice)}catch{}}

    document.querySelectorAll('[data-theme-choice]').forEach(btn=>{
      const on=btn.dataset.themeChoice===choice;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
    });

    const meta=document.querySelector('meta[name="theme-color"]');
    const metaColors={light:'#f8f6ff',dark:'#111018',sakura:'#fff6fa',green:'#f3fbf7',oled:'#000000'};
    if(meta)meta.setAttribute('content',metaColors[resolved]||metaColors.light);

    if(close){
      const d=document.getElementById('settingsDialog');
      if(d?.open) setTimeout(()=>d.close(),120);
    }

    window.dispatchEvent(new CustomEvent('pocket-theme-change',{detail:{theme:resolved,choice}}));
  }

  window.PocketTheme={
    apply:applyTheme,
    get:()=>root.dataset.theme||'light',
    getChoice:()=>root.dataset.themeChoice||selected
  };

  let saved='light';
  try{saved=localStorage.getItem('pocket-theme')||'light'}catch{}
  applyTheme(saved,{persist:false,close:false});
  media?.addEventListener?.('change',()=>{if(selected==='system')applyTheme('system',{persist:false,close:false})});

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-theme-choice]');
    if(!btn)return;
    e.preventDefault();
    applyTheme(btn.dataset.themeChoice);
  },true);

  // Header palette opens theme settings; it no longer toggles/overwrites theme directly.
  document.addEventListener('click',e=>{
    const palette=e.target.closest?.('#theme');
    if(!palette)return;
    e.preventDefault();
    const d=document.getElementById('settingsDialog');
    if(d?.showModal&&!d.open)d.showModal();
  },true);

  const d=document.getElementById('settingsDialog');
  d?.addEventListener('toggle',()=>applyTheme(root.dataset.theme||saved,{persist:false,close:false}));
})();


/* V65 — force a complete repaint when switching themes */
window.addEventListener('pocket-theme-change',e=>{
  const t=e.detail?.theme;
  if(!t)return;
  document.documentElement.classList.remove('theme-light-repaint');
  if(t==='light'){
    // Force the browser to recalculate all legacy dark selectors immediately.
    void document.documentElement.offsetWidth;
    document.documentElement.classList.add('theme-light-repaint');
  }
});


/* V66 — polished themes: persistent, immediate, and accessible */
(() => {
  const root=document.documentElement;
  const names={system:'System',light:'Light',dark:'Dark',sakura:'Sakura',green:'Green',oled:'OLED'};
  const icons={system:'🖥️',light:'☀️',dark:'🌙',sakura:'🌸',green:'🌿',oled:'◼️'};

  function syncThemeUI(){
    const current=root.dataset.theme||'light';
    const choice=root.dataset.themeChoice||current;
    document.querySelectorAll('[data-theme-choice]').forEach(btn=>{
      const active=btn.dataset.themeChoice===choice;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
    const palette=document.getElementById('theme');
    if(palette){
      palette.title='Theme: '+(names[choice]||choice);
      palette.setAttribute('aria-label','Theme: '+(names[choice]||choice));
      palette.textContent=icons[choice]||icons[current]||'🎨';
    }
    document.body.dataset.themeName=names[choice]||choice;
  }

  window.addEventListener('pocket-theme-change',syncThemeUI);
  document.addEventListener('DOMContentLoaded',syncThemeUI,{once:true});
  setTimeout(syncThemeUI,0);
})();
