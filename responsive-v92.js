/* Pocket AI V93 — single responsive shell controller */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function show(id){
 if(window.PocketV39?.show){window.PocketV39.show(id);return}
 qa('.view').forEach(v=>{const on=v.id===id;v.hidden=!on;v.classList.toggle('active',on)});
 qa('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
 scrollTo({top:0,left:0,behavior:'auto'});
}
function buildSidebar(){
 let side=q('#paDesktopSidebar');if(side)return;
 side=document.createElement('aside');side.id='paDesktopSidebar';side.className='pa-desktop-sidebar';
 side.innerHTML='<nav>'+[['home','⌂','Home'],['chat','◉','Chat'],['library','▣','Library'],['files','□','Files'],['more','•••','More']].map(x=>'<button type="button" data-pa-side="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</nav><div class="pa-side-art">A smarter, kinder<br>you ✨</div>';
 document.body.append(side);
 side.onclick=e=>{const b=e.target.closest('[data-pa-side]');if(b)show(b.dataset.paSide)};
}
function exactHome(){
 const grid=q('#home>.quick-grid');if(!grid)return;
 const desired=[['chat','💬','Chat','Ask anything'],['research','🔎','Research','Find & explore'],['files','📁','Files','Upload & work'],['coding','🧩','Code','Build & create']];
 desired.forEach(([id,icon,title,sub],order)=>{
  let b=grid.querySelector('[data-quick="'+id+'"]');
  if(!b){b=document.createElement('button');b.type='button';b.dataset.quick=id;grid.append(b)}
  b.hidden=false;b.style.display='';b.style.order=order;b.innerHTML='<span>'+icon+'</span><strong>'+title+'</strong><small>'+sub+'</small>';
  b.onclick=()=>show(id==='research'?'surface':id);
 });
 qa('[data-quick]',grid).forEach(b=>{if(!desired.some(x=>x[0]===b.dataset.quick)){b.hidden=true;b.style.display='none';b.style.order=99}});
 const quote=q('.pa-inspiration');if(quote)quote.innerHTML='<strong>⭐ Daily Motivation</strong><span>“You’re closer to your goals than you think.”</span>';
}
function buildRecent(){
 let section=q('#paRecent');if(section)return;
 section=document.createElement('section');section.id='paRecent';section.className='pa-recent';
 const items=[['📕','Pride and Prejudice','Jane Austen'],['📄','Research Notes.pdf','2.4 MB'],['📘','Project Plan.docx','1.1 MB'],['💡','Daily Ideas','Today']];
 section.innerHTML='<h2>Recently used</h2><div class="pa-recent-grid">'+items.map(x=>'<button type="button" class="pa-recent-card"><i>'+x[0]+'</i><span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span></button>').join('')+'</div>';
 (q('.pa-inspiration')||q('#home>.quick-grid'))?.insertAdjacentElement('afterend',section);
}
function buildMore(){
 let view=q('#more');
 if(!view){view=document.createElement('section');view.id='more';view.className='view glass pa-more-view';view.hidden=true;(q('#notice')?.parentNode||q('main')).insertBefore(view,q('#notice')||null)}
 const tools=[['local','🧠','Local AI','Use models on your device'],['github','◉','GitHub','Connect your repositories'],['surface','🔎','Research','Explore sources'],['settings','⚙️','Settings & Appearance','Theme, animation, privacy'],['help','♥','Help & Feedback',"We’d love to hear from you"]];
 view.innerHTML='<h1 class="pa-more-title">More</h1><div class="pa-more-list">'+tools.map(x=>'<button type="button" class="pa-more-item" data-pa-more="'+x[0]+'"><i>'+x[1]+'</i><span><strong>'+x[2]+'</strong><small>'+x[3]+'</small></span><b>›</b></button>').join('')+'</div>';
 view.onclick=e=>{const b=e.target.closest('[data-pa-more]');if(!b)return;const id=b.dataset.paMore;if(id==='settings'){q('#settingsDialog')?.showModal();return}if(id==='help'){const n=q('#notice');if(n)n.textContent='Help & Feedback will be available here.';return}show(id)};
 q('#paMoreSheet')?.remove();
 const more=q('#bottomNav [data-more],#bottomNav [data-go="more"]');if(more){more.removeAttribute('data-more');more.dataset.go='more';more.innerHTML='•••<span>More</span>';more.onclick=()=>show('more')}
}
function filesPromo(){
 const files=q('#files');if(!files||q('.pa-files-promo',files))return;const p=document.createElement('aside');p.className='pa-files-promo';p.innerHTML='Organize<br>your ideas.<br>Create<br>your future ♡';files.append(p)
}
function themes(){
 qa('.theme-grid [data-theme-choice]').forEach(b=>{if(q('.pa-theme-preview',b))return;const p=document.createElement('div');p.className='pa-theme-preview';b.prepend(p)})
}
function syncActive(){
 const id=q('.view.active:not([hidden])')?.id||'home';
 qa('[data-pa-side]').forEach(b=>b.classList.toggle('active',b.dataset.paSide===id));
 qa('#bottomNav [data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
}
function sync(){
 document.documentElement.classList.add('reference-ui-active','responsive-v92');
 q('#homeV59')?.remove();q('#homeV45')?.remove();q('#installBanner')?.setAttribute('hidden','');
 buildSidebar();exactHome();buildRecent();buildMore();filesPromo();themes();syncActive();
 const link=q('link[href*="responsive-v92.css"]');if(link&&link!==document.head.lastElementChild)document.head.append(link);
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-go]');if(b)setTimeout(syncActive,0)});
addEventListener('pocket-core-ready',sync);addEventListener('pocket-features-ready',sync);addEventListener('pocket-theme-change',themes);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
setTimeout(sync,500);setTimeout(sync,1800);
})();