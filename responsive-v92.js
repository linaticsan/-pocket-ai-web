/* Pocket AI V92 — responsive shell controller */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function go(id){const b=q('#bottomNav [data-go="'+id+'"]')||q('[data-go="'+id+'"]');if(b)b.click();else window.PocketV39?.show?.(id)}
function buildSidebar(){
 if(q('#paDesktopSidebar'))return;
 const side=document.createElement('aside');side.id='paDesktopSidebar';side.className='pa-desktop-sidebar';
 side.innerHTML='<nav>'+
 [['home','⌂','Home'],['chat','◉','Chat'],['library','▣','Library'],['files','□','Files'],['more','•••','More']].map(x=>'<button type="button" data-pa-side="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+
 '</nav><div class="pa-side-art">A smarter, kinder<br>you ✨</div>';
 document.body.append(side);
 side.onclick=e=>{const b=e.target.closest('[data-pa-side]');if(!b)return;b.dataset.paSide==='more'?q('[data-more]')?.click():go(b.dataset.paSide)};
 document.addEventListener('click',e=>{const g=e.target.closest?.('[data-go]');if(!g)return;qa('[data-pa-side]').forEach(x=>x.classList.toggle('active',x.dataset.paSide===g.dataset.go))});
 q('[data-pa-side=home]')?.classList.add('active');
}
function tuneHome(){
 const grid=q('#home>.quick-grid');if(!grid)return;
 const order=[
  ['chat','💬','Chat','Ask anything'],
  ['research','🔎','Research','Find & explore'],
  ['files','📁','Files','Upload & work'],
  ['coding','🧑‍💻','Code','Build & create']
 ];
 order.forEach(([key,icon,name,sub],i)=>{const b=grid.querySelector('[data-quick="'+key+'"]');if(!b)return;b.style.order=i;b.innerHTML='<span>'+icon+'</span><strong>'+name+'</strong><small>'+sub+'</small>';b.style.display=''});
 [...grid.children].forEach(b=>{if(!order.some(x=>b.dataset.quick===x[0]))b.style.order=99});
 const quote=q('.pa-inspiration');if(quote)quote.textContent='“Small steps every day lead to big results. ♡”';
}
function themeGallery(){
 qa('.theme-grid [data-theme-choice]').forEach(b=>{if(b.querySelector('.pa-theme-preview'))return;const p=document.createElement('div');p.className='pa-theme-preview';b.prepend(p)});
}
function sync(){
 document.documentElement.classList.add('reference-ui-active','responsive-v92');
 q('#homeV59')?.remove();q('#homeV45')?.remove();buildSidebar();tuneHome();themeGallery();
 const css=q('link[href*="responsive-v92.css"]');if(css&&css!==document.head.lastElementChild)document.head.append(css);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
addEventListener('pocket-core-ready',sync);addEventListener('pocket-features-ready',sync);addEventListener('pocket-theme-change',themeGallery);
setTimeout(sync,500);setTimeout(sync,1800);
})();