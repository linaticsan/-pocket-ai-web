// Pocket AI V83 — friendly loading overlay
(() => {
 const text=document.getElementById('pocketBootText');
 if(!document.getElementById('pocketBoot'))return;
 const lines=['Getting the essentials ready…','Preparing Chat…','Loading your workspace…','Almost ready ✨'];
 let i=0,hidden=false;
 const timer=setInterval(()=>{if(text&&document.getElementById('pocketBoot'))text.textContent=lines[++i%lines.length]},850);
 const hide=()=>{
   if(hidden)return;hidden=true;clearInterval(timer);
   if(!document.getElementById('pocketBoot'))return;
   const elapsed=performance.now()-(window.__pocketBootStarted||0);
   const wait=Math.max(0,520-elapsed);
   setTimeout(()=>{
     if(!document.getElementById('pocketBoot'))return;
     if(window.__pocketForceBootClose)window.__pocketForceBootClose();
     else{
       const boot=document.getElementById('pocketBoot');
       if(!boot)return;
       boot.classList.add('done');
       setTimeout(()=>document.getElementById('pocketBoot')?.remove(),350);
     }
   },wait);
 };
 window.addEventListener('pocket-core-ready',hide,{once:true});
 window.addEventListener('load',()=>setTimeout(hide,900),{once:true});
 setTimeout(hide,5500);
})();
