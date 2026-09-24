/* Pocket AI V116 — navigation/sidebar only */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const go=id=>{if(window.PocketV39?.show?.(id))return true;const b=$('[data-go="'+id+'"]');if(b){b.click();return true}return false};

function buildSidebar(){
 if($('#paDesktopSidebar'))return;
 const aside=document.createElement('aside');
 aside.id='paDesktopSidebar';
 aside.className='pa-desktop-sidebar';
 aside.setAttribute('aria-label','Pocket AI navigation');
 aside.innerHTML=
 '<div class="pa-side-mobile-head"><button type="button" class="pa-side-close" aria-label="Close menu">×</button></div>'+
 '<button class="pa-new-chat" type="button" data-pa-action="new-chat"><strong>New Chat</strong></button>'+
 '<nav>'+
  '<div class="pa-nav-group"><small class="pa-nav-label">HOME</small><button type="button" data-pa-side="home"><span>Home</span></button></div>'+
  '<div class="pa-nav-group"><small class="pa-nav-label">WORK</small>'+
   '<button type="button" data-pa-side="chat"><span>Chat</span></button>'+
   '<button type="button" data-pa-side="coding"><span>Code</span></button>'+
   '<button type="button" data-pa-side="files"><span>Files</span></button>'+
   '<button type="button" data-pa-side="surface"><span>Research</span></button>'+
   '<button type="button" data-pa-side="study"><span>Study</span></button>'+
   '<button type="button" data-pa-side="projects"><span>Projects</span></button>'+
  '</div>'+
 '</nav>'+
 '<div class="pa-side-bottom">'+
  '<button type="button" data-pa-side="settings"><span>Settings</span></button>'+
  '<button type="button" data-pa-side="local" class="pa-local-status"><span class="pa-local-copy"><strong>Local AI</strong><small id="paLocalState">Checking…</small><i class="pa-status-dot" aria-hidden="true"></i></span></button>'+
 '</div>';
 document.body.appendChild(aside);

 const backdrop=document.createElement('button');
 backdrop.id='paSidebarBackdrop';backdrop.className='pa-sidebar-backdrop';backdrop.type='button';backdrop.setAttribute('aria-label','Close menu');
 document.body.appendChild(backdrop);

 const toggle=document.createElement('button');
 toggle.id='paSidebarToggle';toggle.className='pa-sidebar-toggle';toggle.type='button';toggle.setAttribute('aria-label','Open menu');toggle.setAttribute('aria-controls','paDesktopSidebar');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰';
 document.body.appendChild(toggle);

 aside.addEventListener('click',e=>{
   const close=e.target.closest('.pa-side-close');if(close){closeDrawer();return}
   const fresh=e.target.closest('[data-pa-action="new-chat"]');
   if(fresh){go('chat');setTimeout(()=>$('#v3NewChat')?.click(),80);closeDrawer();return}
   const b=e.target.closest('[data-pa-side]');if(!b)return;
   const id=b.dataset.paSide;
   if(id==='settings'){const d=$('#settingsDialog');if(d?.showModal&&!d.open)d.showModal();closeDrawer();return}
   if(id==='study'){go('chat');setTimeout(()=>$('#v3Study')?.click(),80);closeDrawer();return}
   if(id==='projects'){go('home');setTimeout(()=>$('#projectGrid')?.scrollIntoView({block:'start',behavior:'smooth'}),80);closeDrawer();return}
   go(id);closeDrawer();
 });
 toggle.addEventListener('click',()=>document.documentElement.classList.contains('pa-nav-open')?closeDrawer():openDrawer());
 backdrop.addEventListener('click',closeDrawer);
 addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
 syncStatus();
}

function openDrawer(){document.documentElement.classList.add('pa-nav-open');$('#paSidebarToggle')?.setAttribute('aria-expanded','true')}
function closeDrawer(){document.documentElement.classList.remove('pa-nav-open');$('#paSidebarToggle')?.setAttribute('aria-expanded','false')}

function syncStatus(){
 const out=$('#paLocalState'),dot=$('.pa-status-dot');if(!out)return;
 const source=$('#localStatus');
 const text=(source?.textContent||'').trim();
 const connected=/connected|ready/i.test(text)&&!/not connected|disconnected|not ready/i.test(text);
 out.textContent=connected?'Ready':'Not connected';
 dot?.classList.toggle('is-connected',connected);
}
function syncActive(){
 const active=$('.view.active:not([hidden])')?.id||'home';
 $$('[data-pa-side]').forEach(b=>{
   const id=b.dataset.paSide;
   const on=id===active||(id==='study'&&active==='chat'&&$('#v3Study')?.classList.contains('active'))||(id==='projects'&&active==='home'&&location.hash==='#projects');
   b.classList.toggle('active',on);
   if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 syncStatus();
}
function sync(){buildSidebar();syncActive();if(innerWidth>=768)closeDrawer()}
addEventListener('resize',sync);
document.addEventListener('click',e=>{if(e.target.closest?.('[data-go],#v3Study,#v3NewChat'))setTimeout(syncActive,30)},true);
addEventListener('pocket-core-ready',sync);addEventListener('pocket-features-ready',sync);
if(document.readyState==='loading')addEventListener('DOMContentLoaded',sync,{once:true});else sync();
setTimeout(sync,400);setTimeout(syncStatus,1400);
const obs=new MutationObserver(syncStatus);addEventListener('DOMContentLoaded',()=>{const s=$('#localStatus');if(s)obs.observe(s,{childList:true,subtree:true,characterData:true})},{once:true});
})();