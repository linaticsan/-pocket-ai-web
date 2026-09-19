// Pocket AI V43 — home library experience
(() => {
const by=id=>document.getElementById(id);
function showLibrarySearch(q){
 const lib=by('library');if(!lib)return;
 document.querySelectorAll('.view').forEach(v=>{v.hidden=v!==lib;v.classList.toggle('active',v===lib)});
 document.querySelectorAll('.tabs [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go==='library'));
 setTimeout(()=>{const input=by('freeSearch');if(input){input.value=q||'';window.PocketLibraryOnline?.searchOnline?.();by('freeLibrary')?.scrollIntoView({block:'start',behavior:'smooth'})}},80);
}
function addHome(){
 const home=by('home'),grid=home?.querySelector('.quick-grid');if(!home||!grid||by('homeV43'))return false;
 if(!grid.querySelector('[data-quick="more"]')){const b=document.createElement('button');b.type='button';b.dataset.quick='more';b.innerHTML='<span>•••</span><strong>More</strong><small>All tools</small>';b.onclick=()=>document.querySelector('[data-more]')?.click();grid.appendChild(b)}
 const brand=document.querySelector('.brand small');if(brand)brand.textContent='Learn • Read • Create • Grow';
 const box=document.createElement('section');box.id='homeV43';box.className='home43';
 box.innerHTML='<button class="home43-hero" data-home-library><span class="home43-copy"><small>YOUR PERSONAL</small><strong>AI Library</strong><em>Discover • Read • Learn • Create</em><b>Explore Books →</b></span><span class="home43-art" aria-hidden="true"><i>☾</i><i>📖</i><i>✦</i></span></button><div class="home43-head"><h2>🔥 Trending Free Books</h2><button data-home-library>See all ›</button></div><div class="home43-books"><button data-book="Moby Dick"><span class="cover c1">MOBY<br>DICK</span><strong>Moby Dick</strong><small>Herman Melville</small></button><button data-book="Pride and Prejudice"><span class="cover c2">PRIDE &<br>PREJUDICE</span><strong>Pride and Prejudice</strong><small>Jane Austen</small></button><button data-book="Dracula"><span class="cover c3">DRACULA</span><strong>Dracula</strong><small>Bram Stoker</small></button><button data-book="Alice Wonderland"><span class="cover c4">ALICE</span><strong>Alice in Wonderland</strong><small>Lewis Carroll</small></button></div><div class="home43-head"><h2>✨ Popular Categories</h2><button data-home-library>See all ›</button></div><div class="home43-cats"><button data-category="fantasy"><span>🔮</span><strong>Fantasy</strong></button><button data-category="adventure"><span>⚔️</span><strong>Adventure</strong></button><button data-category="romance"><span>💗</span><strong>Romance</strong></button><button data-category="mystery"><span>🔎</span><strong>Mystery</strong></button></div>';
 grid.insertAdjacentElement('afterend',box);
 box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-home-library'))showLibrarySearch('');if(b.dataset.book)showLibrarySearch(b.dataset.book);if(b.dataset.category)showLibrarySearch(b.dataset.category)});
 return true;
}
function boot(){let n=0;const t=setInterval(()=>{if(addHome()||++n>25)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketHomeV43={showLibrarySearch};
})();