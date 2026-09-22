/* Pocket AI V100 — photo reference behavior */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function go(id){if(window.PocketV39?.show?.(id))return true;const b=q('[data-go="'+id+'"]');if(b){b.click();return true}return false}
function keepCssLast(){
 const link=q('link[href*="photo-ui-v100.css"]');
 if(link&&link!==document.head.lastElementChild)document.head.appendChild(link);
}
function tuneChrome(){
 const top=q('.top-actions');
 if(top&&!q('#photoProfileButton',top)){
  const b=document.createElement('button');b.id='photoProfileButton';b.type='button';b.className='photo-profile-button';b.setAttribute('aria-label','Open workspace menu');
  b.innerHTML='<span class="photo-avatar">P</span><span class="photo-profile-copy"><strong>My workspace</strong><small>Local profile</small></span><span aria-hidden="true">⌄</span>';
  b.onclick=openMore;top.prepend(b);
 }
 const side=q('#paDesktopSidebar');
 if(side&&!q('#photoSideProfile',side)){
  const p=document.createElement('button');p.id='photoSideProfile';p.type='button';p.className='photo-side-profile';
  p.innerHTML='<span class="photo-avatar">P</span><span><strong>My workspace</strong><small>Stored on this device</small></span><b aria-hidden="true">•••</b>';
  p.onclick=openMore;side.appendChild(p);
 }
}
function tuneHome(){
 const grid=q('#home>.quick-grid');if(!grid)return;
 const wanted=[
  ['chat','💬','Chat','Ask anything'],
  ['research','🔎','Research','Find & explore'],
  ['files','📁','Files','Upload & work'],
  ['coding','🧑‍💻','Code','Build & create']
 ];
 wanted.forEach(([key,icon,title,sub],order)=>{
  const b=grid.querySelector('[data-quick="'+key+'"]');if(!b)return;
  b.hidden=false;b.style.display='';b.style.order=order;
  b.innerHTML='<span>'+icon+'</span><strong>'+title+'</strong><small>'+sub+'</small>';
 });
 qa('[data-quick]',grid).forEach(b=>{
  const keep=wanted.some(x=>x[0]===b.dataset.quick);
  if(!keep){b.hidden=true;b.style.display='none'}else{b.hidden=false;b.style.removeProperty('display')}
 });
 let mot=q('#photoMotivation');
 if(!mot){
  mot=document.createElement('section');mot.id='photoMotivation';
  mot.innerHTML='<div class="photo-motivation-icon">⭐</div><div><strong>Daily Motivation</strong><small>“You’re closer to your goals than you think.”</small></div>';
  grid.insertAdjacentElement('afterend',mot);
 }
 renderRecent();
 renderSuggestions();
}
function renderSuggestions(){
 const home=q('#home');if(!home)return;
 let box=q('#photoSuggestions');
 if(!box){box=document.createElement('section');box.id='photoSuggestions';home.appendChild(box)}
 const items=[
  ['💡','Plan my study session','chat','Help me plan a focused study session for today.'],
  ['📄','Summarize a document','files',''],
  ['🔎','Research a topic','surface','Research this topic and compare reliable sources: '],
  ['⌨️','Help me write code','coding','Help me build: '],
  ['✍️','Improve my writing','chat','Improve this writing while keeping my meaning: '],
  ['📚','Recommend a book','library','']
 ];
 box.innerHTML='<div class="photo-section-head"><div><p class="eyebrow">START SOMETHING</p><h2>Suggested prompts</h2></div><span>Choose a shortcut to continue</span></div><div class="photo-suggestion-grid">'+items.map((x,i)=>'<button type="button" data-photo-suggestion="'+i+'"><i>'+x[0]+'</i><span>'+x[1]+'</span><b>→</b></button>').join('')+'</div>';
 qa('[data-photo-suggestion]',box).forEach(b=>b.onclick=()=>runSuggestion(items[+b.dataset.photoSuggestion]));
}
function runSuggestion(item){
 const [,label,target,prompt]=item;go(target);
 setTimeout(()=>{
  const field=target==='surface'?q('#surfaceQuery'):target==='chat'?q('#prompt'):null;
  if(field&&prompt){field.value=prompt;field.focus();field.setSelectionRange?.(field.value.length,field.value.length)}
 },80);
}
function recentData(){
 return [
  {icon:'📖',title:'Pride and Prejudice',target:'library',meta:'Jane Austen'},
  {icon:'📄',title:'Research Notes.pdf',target:'files',meta:'2.4 MB'},
  {icon:'📘',title:'Project Plan.docx',target:'files',meta:'1.1 MB'},
  {icon:'💡',title:'Daily Ideas',target:'chat',meta:'Today'}
 ];
}
function renderRecent(){
 const home=q('#home');if(!home)return;
 let box=q('#photoRecent');
 if(!box){box=document.createElement('section');box.id='photoRecent';home.appendChild(box)}
 const items=recentData();
 box.innerHTML='<div class="photo-recent-title">Recently used</div><div class="photo-recent-grid">'+items.map((x,i)=>'<button class="photo-recent-card" type="button" data-photo-recent="'+i+'"><b>'+(x.icon||'•')+' '+escapeHtml(x.title||'Recent item')+'</b><small>'+escapeHtml(x.meta||relative(x.time))+'</small></button>').join('')+'</div>';
 qa('[data-photo-recent]',box).forEach(b=>b.onclick=()=>{const x=items[+b.dataset.photoRecent];go(x.target||'chat')});
}
function relative(t){if(!t)return 'Recent';const m=Math.max(1,Math.round((Date.now()-t)/60000));return m<60?m+' min ago':m<1440?Math.round(m/60)+' hr ago':'Recent'}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function tuneFiles(){
 const files=q('#files');if(!files||q('#photoFilesPromo',files))return;
 const promo=document.createElement('aside');promo.id='photoFilesPromo';
 promo.innerHTML='<strong>Organize<br>your ideas.<br>Create<br>your future ♡</strong><span>📁</span>';
 files.appendChild(promo);
}
function tuneThemes(){
 qa('.theme-grid [data-theme-choice]').forEach(b=>{if(q('.pa-theme-preview',b))return;const p=document.createElement('div');p.className='pa-theme-preview';b.prepend(p)});
}
function openMore(e){
 if(e){e.preventDefault();e.stopImmediatePropagation()}
 const sheet=q('#paMoreSheet');if(!sheet)return;
 sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');
}
function tuneMore(){
 const sheet=q('#paMoreSheet');if(!sheet)return;
 const panel=q('.pa-more-panel',sheet);

 const grid=q('.pa-more-grid',sheet);if(!grid)return;
 grid.innerHTML=[
  ['local','🧠','Local AI','Use models on your device'],
  ['github','◉','GitHub','Connect your repositories'],
  ['surface','🔎','Research','Explore sources'],
  ['settings','⚙️','Settings & Appearance','Theme, animation, privacy'],
  ['feedback','♥','Help & Feedback',"We’d love to hear from you"]
 ].map(x=>'<button type="button" data-photo-more="'+x[0]+'"><i>'+x[1]+'</i><span><strong>'+x[2]+'</strong><small>'+x[3]+'</small></span></button>').join('');
 qa('[data-photo-more]',grid).forEach(b=>b.onclick=()=>{
  const id=b.dataset.photoMore;
  sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');
  if(id==='settings'){const d=q('#settingsDialog');if(d?.showModal&&!d.open)d.showModal();return}
  if(id==='feedback'){openFeedback();return}
  go(id);
 });
}
function openFeedback(){
 let d=q('#photoFeedbackDialog');
 if(!d){
  d=document.createElement('dialog');d.id='photoFeedbackDialog';d.className='glass';
  d.innerHTML='<form method="dialog"><button class="close" value="cancel">×</button></form><h2>Help & Feedback</h2><p class="muted">Tell us what you want improved in Pocket AI.</p><textarea id="photoFeedbackText" rows="5" placeholder="Write feedback…"></textarea><div class="row"><button type="button" id="photoCopyFeedback" class="primary">Copy feedback</button><a class="link" href="https://github.com/linaticsan/-pocket-ai-web" target="_blank" rel="noopener">Open GitHub ↗</a></div><p id="photoFeedbackStatus" class="muted"></p>';
  document.body.appendChild(d);
  q('#photoCopyFeedback',d).onclick=async()=>{const t=q('#photoFeedbackText',d).value.trim();if(!t)return;try{await navigator.clipboard.writeText(t);q('#photoFeedbackStatus',d).textContent='Copied. You can paste it into GitHub or a message.'}catch{q('#photoFeedbackStatus',d).textContent='Select and copy the text manually.'}};
 }
 if(!d.open)d.showModal();
}
function syncNav(){
 const desktop=matchMedia('(min-width:1025px)').matches;
 const nav=q('#bottomNav');
 if(nav){if(desktop)nav.style.setProperty('display','none','important');else nav.style.removeProperty('display')}
}
function sync(){
 document.documentElement.classList.add('photo-ui-v100','reference-ui-active');
 tuneChrome();tuneHome();tuneMore();tuneFiles();tuneThemes();syncNav();q('#installBanner')?.setAttribute('hidden','');keepCssLast();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
addEventListener('resize',syncNav);
addEventListener('pocket-core-ready',()=>{sync();setTimeout(sync,80)});
addEventListener('pocket-features-ready',()=>{sync();setTimeout(sync,100)});
document.addEventListener('click',e=>{
  const trigger=e.target.closest?.('[data-pa-side="more"],[data-more]');
 if(trigger)openMore(e);
},true);
document.addEventListener('submit',e=>{if(e.target?.id==='chatForm'||e.target?.id==='surfaceForm')setTimeout(renderRecent,120)},true);
setTimeout(sync,350);setTimeout(sync,1200);setTimeout(sync,2600);
})();
