// Pocket AI V45 — crystal home + in-app free reading
(() => {
const by=id=>document.getElementById(id);
function showLibrarySearch(q){
 const lib=by('library');if(!lib)return;
 if(window.PocketV39?.show)window.PocketV39.show('library');else{document.querySelectorAll('.view').forEach(v=>{v.hidden=v!==lib;v.classList.toggle('active',v===lib)})}
 setTimeout(()=>{const input=by('freeSearch');if(input){input.value=q||'';window.PocketLibraryOnline?.searchOnline?.();by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'})}},100);
}
function addHome(){
 const home=by('home'),grid=home?.querySelector('.quick-grid');if(!home||!grid||by('homeV45'))return false;
 let more=grid.querySelector('[data-quick="more"]');if(!more){more=document.createElement('button');more.type='button';more.dataset.quick='more';more.innerHTML='<span>•••</span><strong>More</strong><small>All tools</small>';grid.appendChild(more)}
 more.onclick=e=>{e.preventDefault();e.stopPropagation();window.PocketV39?.openMore?.()};
 const brand=document.querySelector('.brand small');if(brand)brand.textContent='Learn • Read • Create • Grow';
 const box=document.createElement('section');box.id='homeV45';box.className='home45';
 box.innerHTML='<form id="home45Search" class="home45-search"><span>⌕</span><input id="home45Query" placeholder="Search free books or authors…" autocomplete="off"><button aria-label="Search books">✦</button></form><button class="home45-hero" data-home-library><small>YOUR PERSONAL</small><strong>AI Library</strong><em>Discover • Read • Learn • Create</em><b>Explore Books →</b></button><div class="home45-head"><h2>🔥 Trending Free Books</h2><button data-home-library>See all ›</button></div><div class="home45-books"><button data-book="Moby Dick"><span class="home45-cover c1">MOBY<br>DICK</span><strong>Moby Dick</strong><small>Herman Melville</small></button><button data-book="Pride and Prejudice"><span class="home45-cover c2">PRIDE &<br>PREJUDICE</span><strong>Pride and Prejudice</strong><small>Jane Austen</small></button><button data-book="Dracula"><span class="home45-cover c3">DRACULA</span><strong>Dracula</strong><small>Bram Stoker</small></button><button data-book="Alice Wonderland"><span class="home45-cover c4">ALICE</span><strong>Alice in Wonderland</strong><small>Lewis Carroll</small></button></div><div class="home45-head"><h2>✨ Popular Categories</h2><button data-home-library>See all ›</button></div><div class="home45-cats"><button data-category="fantasy"><span>🔮</span><strong>Fantasy</strong></button><button data-category="adventure"><span>⚔️</span><strong>Adventure</strong></button><button data-category="romance"><span>💗</span><strong>Romance</strong></button><button data-category="mystery"><span>🔎</span><strong>Mystery</strong></button></div>';
 grid.insertAdjacentElement('afterend',box);
 by('home45Search').onsubmit=e=>{e.preventDefault();const q=by('home45Query').value.trim();showLibrarySearch(q)};
 box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-home-library'))showLibrarySearch('');if(b.dataset.book)showLibrarySearch(b.dataset.book);if(b.dataset.category)showLibrarySearch(b.dataset.category)});
 return true;
}
function boot(){let n=0;const t=setInterval(()=>{if(addHome()||++n>35)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketHomeV45={showLibrarySearch};
})();