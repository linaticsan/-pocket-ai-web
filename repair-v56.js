// Pocket AI V56 — resilient module boot + mobile preview repair.
(() => {
 const by=id=>document.getElementById(id);

 // Mark regular browser/webview vs installed PWA for future layout tuning.
 const standalone=window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone===true;
 document.documentElement.classList.toggle('pocket-standalone',!!standalone);
 document.documentElement.classList.toggle('pocket-browser',!standalone);

 // If Home enhancement did not load because an earlier optional module failed,
 // load it independently instead of leaving a mostly empty Home screen.
 setTimeout(async()=>{
   if(!by('homeV45')){
     try{await import('./home-v43.js?v=20260920-v56-repair')}catch(err){console.error('Home repair failed',err)}
   }
 },300);

 // Same protection for the books-only Library.
 setTimeout(async()=>{
   const lib=by('library');
   const legacy=lib && /Your books become AI context/i.test(lib.textContent||'');
   if(!lib || legacy){
     try{
       lib?.remove();
       await import('./library-v33.js?v=20260920-v56-repair');
       setTimeout(()=>window.PocketLibrary?.render?.(),50);
     }catch(err){console.error('Library repair failed',err)}
   }
 },450);

 // Basic tap feedback prevents controls from appearing dead.
 document.addEventListener('click',e=>{
   const b=e.target.closest?.('button');
   if(!b || b.disabled)return;
   b.classList.add('v56-tapped');
   setTimeout(()=>b.classList.remove('v56-tapped'),180);
 },{passive:true});
})();