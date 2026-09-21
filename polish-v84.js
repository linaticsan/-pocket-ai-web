// Pocket AI V84 — product polish
(() => {
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const ICONS={
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
 chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5h16v11H9l-5 4z"/></svg>',
 book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5h6.5A3.5 3.5 0 0 1 14 8v12a3.5 3.5 0 0 0-3.5-3.5H4zm16 0h-6.5A3.5 3.5 0 0 0 10 8v12a3.5 3.5 0 0 1 3.5-3.5H20z"/></svg>',
 folder:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h6l2 2H21v10H3.5z"/></svg>',
 more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
 search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
 study:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5z"/><path d="M7 12.5V17c2.8 2 7.2 2 10 0v-4.5"/></svg>',
 code:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 6-5 6 5 6M15.5 6l5 6-5 6M13.5 4l-3 16"/></svg>',
 cpu:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3m16-6h3m-3 6h3"/><circle cx="12" cy="12" r="2.5"/></svg>',
 settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.8-.7-1.7.8-2-2.1-2.1-2 .8-1.7-.7-.8-2h-3l-.8 2-1.7.7-2-.8L.9 6l.8 2-.7 1.7-2 .8v3l2 .8.7 1.7-.8 2L3 20.1l2-.8 1.7.7.8 2h3l.8-2 1.7-.7 2 .8 2.1-2.1-.8-2 .7-1.7z"/></svg>',
 spark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>',
 menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
 };
 const icon=n=>ICONS[n]||ICONS.spark;

 function decorate(){
   const nav=$('#bottomNav');
   if(nav){
     const map={home:['home','Home'],chat:['chat','Chat'],library:['book','Books'],files:['folder','Files']};
     $$('[data-go]',nav).forEach(b=>{const x=map[b.dataset.go];if(x)b.innerHTML='<span class="v84-nav-icon">'+icon(x[0])+'</span><span>'+x[1]+'</span>'});
     const more=$('[data-more]',nav);if(more)more.innerHTML='<span class="v84-nav-icon">'+icon('more')+'</span><span>More</span>';
   }
   $$('[data-v84-icon]').forEach(b=>{const target=b.querySelector('i,b')||b;if(target)target.innerHTML=icon(b.dataset.v84Icon)});
   $$('.v84-search-icon').forEach(x=>x.innerHTML=icon('search'));
   $$('.v84-mini-icon').forEach(x=>x.innerHTML=icon(x.dataset.icon));
   const settings=$('#settingsOpen');if(settings)settings.innerHTML=icon('settings');
   const motion={full:'spark',gentle:'spark',off:'menu'},privacy={balanced:'spark',private:'settings',offline:'folder'};
   $$('[data-motion]').forEach(b=>{if(!b.querySelector('.v84-setting-icon'))b.insertAdjacentHTML('afterbegin','<span class="v84-setting-icon">'+icon(motion[b.dataset.motion]||'spark')+'</span>')});
   $$('[data-privacy-setting]').forEach(b=>{if(!b.querySelector('.v84-setting-icon'))b.insertAdjacentHTML('afterbegin','<span class="v84-setting-icon">'+icon(privacy[b.dataset.privacySetting]||'settings')+'</span>')});
 }

 function install(){
   const banner=$('#installBanner');if(!banner)return;
   const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
   let dismissed=false;try{dismissed=localStorage.getItem('pocket-install-dismissed')==='1'}catch{}
   if(standalone||dismissed){banner.hidden=true;return}
   const home=$('#homeV59')||$('#home');
   if(home&&!home.contains(banner))home.appendChild(banner);
   banner.hidden=false;
   let deferred=null;
   addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
   $('#installDismiss')?.addEventListener('click',()=>{banner.hidden=true;try{localStorage.setItem('pocket-install-dismissed','1')}catch{}});
   $('#installNow')?.addEventListener('click',async()=>{
     if(deferred){deferred.prompt();await deferred.userChoice.catch(()=>{});deferred=null;banner.hidden=true}
     else alert('On iPhone/iPad: tap Share, then Add to Home Screen.');
   });
 }

 function localTimeout(){
   setTimeout(()=>{
     const badge=$('#homeLocalBadge'),text=$('#homeLocalText'),device=$('#localDevice'),compat=$('#localCompatibility'),status=$('#localStatus');
     const gpu=!!navigator.gpu;
     if(badge&&/checking/i.test(badge.textContent||'')){badge.textContent=gpu?'Not connected':'Unsupported';badge.classList.remove('connected')}
     if(text&&/check|open local/i.test(text.textContent||''))text.textContent=gpu?'Local AI is available. Open Local AI to connect.':'Local AI is not supported on this device/browser.';
     if(device&&/checking/i.test(device.textContent||''))device.textContent='This device';
     if(compat&&/checking/i.test(compat.textContent||''))compat.textContent=gpu?'WebGPU available':'Local AI not supported on this device';
     if(status&&/checking/i.test(status.textContent||''))status.textContent=gpu?'Local AI is ready to set up.':'Local AI not supported on this device';
   },3000);
 }

 function dialogs(){
   $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
   document.addEventListener('click',e=>{const c=e.target.closest?.('dialog .close');if(c)setTimeout(()=>c.blur(),0)},true);
 }

 function syncLibraryTab(){
   const lib=$('#library');if(window.PocketLibrary?.setTab&&lib)window.PocketLibrary.setTab(lib.dataset.libraryTab||'mine');
 }

 window.addEventListener('pocket-core-ready',()=>{decorate();install();syncLibraryTab()},{once:true});
 window.addEventListener('pocket-features-ready',()=>{decorate();syncLibraryTab()},{once:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-more]'))setTimeout(decorate,0)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{decorate();install();dialogs();localTimeout()},{once:true});else{decorate();install();dialogs();localTimeout()}
})();