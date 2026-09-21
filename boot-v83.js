// Pocket AI V83 — friendly loading overlay
(() => {
 const boot=document.getElementById('pocketBoot'),text=document.getElementById('pocketBootText');
 if(!boot)return;
 const lines=['Waking up Pocket AI…','Polishing your workspace…','Getting Chat ready…','Putting your books and files in place…','Almost ready ✨'];
 let i=0,hidden=false;
 const timer=setInterval(()=>{if(text)text.textContent=lines[++i%lines.length]},850);
 const hide=()=>{
   if(hidden)return;hidden=true;clearInterval(timer);
   const elapsed=performance.now()-(window.__pocketBootStarted||0);
   const wait=Math.max(0,520-elapsed);
   setTimeout(()=>{boot.classList.add('done');setTimeout(()=>boot.remove(),350)},wait);
 };
 window.addEventListener('pocket-core-ready',hide,{once:true});
 window.addEventListener('load',()=>setTimeout(hide,900),{once:true});
 setTimeout(hide,5500);
})();