// Pocket AI V39 — stable touch navigation and focus-safe dialogs
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

function show(id){
 const view=$('#'+CSS.escape(id));if(!view)return false;
 $$('body > main > .view').forEach(v=>{const on=v===view;v.hidden=!on;v.classList.toggle('active',on)});
 $$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
 window.scrollTo({top:0,left:0,behavior:'auto'});return true;
}

function prepareDialog(dialog,opener=document.activeElement){
 if(!dialog)return false;
 if(opener instanceof HTMLElement)dialog.__pocketOpener=opener;
 if(!dialog.__pocketFocusBound){
   dialog.__pocketFocusBound=true;
   dialog.addEventListener('close',()=>{
     const back=dialog.__pocketOpener;dialog.__pocketOpener=null;
     if(back?.isConnected)requestAnimationFrame(()=>back.focus({preventScroll:true}));
   });
 }
 return true;
}
function openDialog(dialog,opener=document.activeElement,focusSelector=''){
 if(!prepareDialog(dialog,opener))return false;
 if(dialog.showModal&&!dialog.open)dialog.showModal();
 else if(!dialog.open)dialog.setAttribute('open','');
 if(focusSelector)requestAnimationFrame(()=>dialog.querySelector(focusSelector)?.focus({preventScroll:true}));
 return true;
}
window.PocketDialog={open:openDialog,prepare:prepareDialog};

function normalizeViews(){
 const views=$$('body > main > .view');
 if(!views.length)return;
 const active=views.find(v=>v.classList.contains('active')&&!v.hidden)||views.find(v=>v.id==='home')||views[0];
 views.forEach(v=>{const on=v===active;v.hidden=!on;v.classList.toggle('active',on)});
}

function bind(){
 document.documentElement.classList.add('pocket-v39');
 normalizeViews();
 document.documentElement.style.pointerEvents='auto';document.body.style.pointerEvents='auto';
 $('#pocketMore')?.remove();$('#v39More')?.remove();document.body.classList.remove('more-open','v39-more-open');

 document.addEventListener('click',e=>{
  const close=e.target.closest?.('dialog .close,#apiHubClose');
  if(close){
    const d=close.closest('dialog');
    if(d?.open){e.preventDefault();e.stopImmediatePropagation();d.close();return}
  }
  const ai=e.target.closest?.('#aiSetup,#v3Api');
  if(ai){
    e.preventDefault();e.stopImmediatePropagation();
    const d=$('#aiDialog');prepareDialog(d,ai);
    if(window.PocketAPI?.open)window.PocketAPI.open();
    else openDialog(d,ai);
    return;
  }
  const sources=e.target.closest?.('#sourceSetup');
  if(sources){
    e.preventDefault();e.stopImmediatePropagation();
    openDialog($('#sourceDialog'),sources);return;
  }
  const settings=e.target.closest?.('#settingsOpen,#theme,[data-v39-settings],[data-v39-theme]');
  if(settings){
    e.preventDefault();e.stopImmediatePropagation();
    openDialog($('#settingsDialog'),settings);return;
  }
  const commands=e.target.closest?.('#commandOpen');
  if(commands){
    e.preventDefault();e.stopImmediatePropagation();
    openDialog($('#commandDialog'),commands,'#commandSearch');return;
  }
  const quick=e.target.closest?.('[data-quick]');
  if(quick){
    const kind=quick.dataset.quick;
    const map={research:'surface',study:'chat',code:'coding'};
    const id=map[kind]||kind;
    if(show(id)){
      e.preventDefault();
      if(kind==='research'){
        setTimeout(()=>{const mode=$('#surfaceMode');if(mode)mode.value='research';$('#surfaceQuery')?.focus()},60);
      }else if(kind==='study'){
        setTimeout(()=>{
          const study=$('#v3Study');if(study&&!study.classList.contains('active'))study.click();
          const p=$('#prompt');if(p&&!p.value)p.value='Teach me this step by step, then quiz me: ';p?.focus();
        },80);
      }
      e.stopImmediatePropagation();return;
    }
  }
  const go=e.target.closest?.('[data-go]');
  if(go&&show(go.dataset.go)){e.preventDefault();e.stopImmediatePropagation()}
 },true);

 document.addEventListener('pointerdown',e=>{
   const d=e.target.closest?.('dialog[open]');
   if(d&&e.target===d){e.preventDefault();d.close()}
 },{capture:true});

 document.addEventListener('keydown',e=>{
   if(e.key!=='Escape')return;
   document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close()}catch{}});
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.PocketV39={show};
})();