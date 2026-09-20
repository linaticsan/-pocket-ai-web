// Pocket AI V46 — premium crystal home
(() => {
const by=id=>document.getElementById(id);
function showLibrarySearch(q){
 const lib=by('library');if(!lib)return;
 if(window.PocketV39?.show)window.PocketV39.show('library');else document.querySelectorAll('.view').forEach(v=>{v.hidden=v!==lib;v.classList.toggle('active',v===lib)});
 setTimeout(()=>{const input=by('freeSearch');if(input){input.value=q||'';window.PocketLibraryOnline?.searchOnline?.();by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'})}},120);
}
function showNovelHub(){
 if(window.PocketV39?.show)window.PocketV39.show('library');
 setTimeout(()=>by('webNovelHub')?.scrollIntoView({block:'start',behavior:'smooth'}),120);
}
function upgradeHeader(){
 const top=document.querySelector('.topbar');if(!top||by('home46Top'))return;
 top.id='home46Top';const brand=top.querySelector('.brand');if(brand){const sm=brand.querySelector('small');if(sm)sm.textContent='Learn • Read • Create • Grow'}
 const a=top.querySelector('.top-actions');if(a)a.innerHTML='<button id="home46SearchBtn" class="round crystal-round" aria-label="Search">⌕</button><button id="home46Bell" class="round crystal-round notify" aria-label="Notifications">♢<i></i></button><button id="home46Avatar" class="home46-avatar" aria-label="Profile">🌸</button>';
 by('home46SearchBtn')?.addEventListener('click',()=>{window.PocketV39?.show?.('home');setTimeout(()=>by('home45Query')?.focus(),80)});
 by('home46Bell')?.addEventListener('click',()=>{const n=by('notice');if(n)n.textContent='✨ You are all caught up.'});
 by('home46Avatar')?.addEventListener('click',()=>by('settingsOpen')?.click());
}
function startVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition,input=by('home45Query');if(!SR||!input){input?.focus();return}
 const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>{input.value=e.results[0][0].transcript;input.focus()};r.onerror=()=>input.focus();r.start();
}
function addHome(){
 const home=by('home'),grid=home?.querySelector('.quick-grid');if(!home||!grid||by('homeV45'))return false;upgradeHeader();
 let more=grid.querySelector('[data-quick="more"]');if(!more){more=document.createElement('button');more.type='button';more.dataset.quick='more';more.innerHTML='<span>•••</span><strong>More</strong><small>All Tools</small>';grid.appendChild(more)}
 const config={library:['▣','Library','Books & PDFs'],chat:['●','Chat','Ask & Learn'],files:['▰','Files','Documents'],more:['•••','More','All Tools']};
 Object.entries(config).forEach(([k,v])=>{const b=grid.querySelector('[data-quick="'+k+'"]');if(b)b.innerHTML='<span>'+v[0]+'</span><strong>'+v[1]+'</strong><small>'+v[2]+'</small>'});
 more.onclick=e=>{e.preventDefault();e.stopPropagation();window.PocketV39?.openMore?.()};
 const box=document.createElement('section');box.id='homeV45';box.className='home45';
 box.innerHTML='<form id="home45Search" class="home45-search"><span class="home45-mag">⌕</span><input id="home45Query" placeholder="Search books, documents, or ask anything…" autocomplete="off"><button id="home45Mic" type="button" aria-label="Voice search">♩</button><button class="home45-ai" aria-label="Search">✦</button></form><button class="home45-hero" data-home-library><small>YOUR PERSONAL</small><strong>AI LIBRARY</strong><em>Discover • Read • Learn • Create</em><b>Explore Books →</b><span class="home45-art" aria-hidden="true">📚<i>✦</i></span></button><div class="home45-head"><h2>🔥 Trending Books</h2><button data-home-library>See All ›</button></div><div class="home45-books"><button data-book="Moby Dick"><span class="home45-cover c1"><i>🌊</i><b>FREE</b><em>MOBY DICK</em></span><strong>Moby Dick ♡</strong><small>Herman Melville</small></button><button data-book="Pride and Prejudice"><span class="home45-cover c2"><i>🌸</i><b>FREE</b><em>PRIDE & PREJUDICE</em></span><strong>Pride and Prejudice ♡</strong><small>Jane Austen</small></button><button data-home-library><span class="home45-cover c3 yours"><i>🗾</i><b>Yours</b><em>JAPANESE</em></span><strong>Daily Japanese ♡</strong><small>Your Library</small></button><button data-home-library><span class="home45-cover c4 yours"><i>📖</i><b>Yours</b><em>SUPER LEARNER</em></span><strong>Super Learner ♡</strong><small>Your Library</small></button></div><div class="home45-head"><h2>✨ Popular Categories</h2><button data-home-library>See All ›</button></div><div class="home45-cats"><button data-category="novel"><span>▣</span><strong>Novel</strong></button><button data-novel-hub><span>♛</span><strong>New Novel</strong></button><button data-novel-hub><span>🎮</span><strong>Comic</strong></button><button data-category="science"><span>🎓</span><strong>Academic</strong></button></div>';
 grid.insertAdjacentElement('afterend',box);
 by('home45Search').onsubmit=e=>{e.preventDefault();const q=by('home45Query').value.trim();showLibrarySearch(q)};
 by('home45Mic').onclick=startVoice;
 box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();if(b.hasAttribute('data-home-library'))return showLibrarySearch('');if(b.dataset.book)return showLibrarySearch(b.dataset.book);if(b.dataset.category)return showLibrarySearch(b.dataset.category==='novel'?'fiction':b.dataset.category);if(b.hasAttribute('data-novel-hub'))return showNovelHub()});
 return true;
}
function boot(){upgradeHeader();let n=0;const t=setInterval(()=>{if(addHome()||++n>35)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketHomeV46={showLibrarySearch,showNovelHub};
})();