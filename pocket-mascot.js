/* Shared Pocket mascot view renderer. State ownership remains window.PocketMascot. */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const CONTEXT_STATES={home:'idle',chat:'idle',research:'research',study:'study',coding:'coding',files:'files',projects:'files',settings:'idle',sidebar:'idle',local:'idle'};
let globalState='idle',blinkTimer=0,pointerFrame=0,lastPointer=null,mountFrame=0;

function reduced(){return !!matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}
function motion(){return document.documentElement.dataset.motion||'full'}
function html(context='home',size='medium',label='Pocket'){
 return '<span class="pocket-character" data-pocket-character data-pocket-context="'+context+'" data-pocket-state="idle" data-pocket-size="'+size+'" role="img" aria-label="'+label+'">'+
  '<span class="pocket-character__body" aria-hidden="true">'+
   '<span class="pocket-character__antenna"></span>'+
   '<span class="pocket-character__eye pocket-character__eye--left"></span>'+
   '<span class="pocket-character__eye pocket-character__eye--right"></span>'+
   '<span class="pocket-character__mouth"></span>'+
   '<span class="pocket-character__blush pocket-character__blush--left"></span>'+
   '<span class="pocket-character__blush pocket-character__blush--right"></span>'+
   '<span class="pocket-character__prop"></span>'+
  '</span>'+
  '<span class="pocket-character__dots" aria-hidden="true">• • •</span>'+
  '<span class="pocket-character__sparkles" aria-hidden="true"><i></i><i></i><i></i></span>'+
 '</span>';
}
function effectiveState(el){
 const context=el.dataset.pocketContext||'home';
 if(['thinking','happy','success','error','sleep','listening','excited','offline'].includes(globalState))return globalState;
 if(context==='chat'&&q('#v3Study')?.classList.contains('active'))return'study';
 return CONTEXT_STATES[context]||'idle';
}
function syncOne(el){if(!el)return;el.dataset.pocketState=effectiveState(el)}
function syncAll(){qa('[data-pocket-character]').forEach(syncOne);syncFilesEmpty()}
function hydrate(root=document){
 qa('[data-pocket-slot]:not([data-pocket-hydrated])',root).forEach(slot=>{
  const context=slot.dataset.pocketContext||'home',size=slot.dataset.pocketSize||'medium',label=slot.dataset.pocketLabel||('Pocket '+context);
  slot.innerHTML=html(context,size,label);slot.dataset.pocketHydrated='1';
 });
 const legacy=q('#homeMascot');
 if(legacy&&!legacy.dataset.pocketCharacter){
  legacy.dataset.pocketCharacter='';legacy.dataset.pocketContext='home';legacy.dataset.pocketState=globalState;
 }
 syncAll();
}
function scheduleHydrate(){if(mountFrame)return;mountFrame=requestAnimationFrame(()=>{mountFrame=0;hydrate()})}
function clearBlink(el){el?.classList.remove('is-pocket-blinking','is-pocket-double-blinking')}
function scheduleBlink(){
 clearTimeout(blinkTimer);
 if(document.hidden||motion()==='off'||reduced())return;
 blinkTimer=setTimeout(()=>{
  const visible=qa('[data-pocket-character]').filter(el=>el.offsetParent!==null&&el.dataset.pocketState!=='sleep');
  visible.forEach((el,i)=>{
   const dbl=Math.random()<.13&&i===0;el.classList.add(dbl?'is-pocket-double-blinking':'is-pocket-blinking');
   setTimeout(()=>clearBlink(el),dbl?430:190);
  });
  scheduleBlink();
 },3000+Math.floor(Math.random()*4000));
}
function setState(state){globalState=state||'idle';syncAll()}
function setContext(target,context){
 const nodes=typeof target==='string'?qa(target):target instanceof Element?[target]:[];
 nodes.forEach(node=>{const el=node.matches?.('[data-pocket-character]')?node:q('[data-pocket-character]',node);if(el){el.dataset.pocketContext=context;syncOne(el)}});
}
function syncFilesEmpty(){
 const files=q('#files'),editor=q('#fileText');if(!files)return;
 files.classList.toggle('has-pocket-document',!!editor?.value?.trim());
}
function tap(el){
 if(!el||el.dataset.pocketTapLock==='1')return;
 el.dataset.pocketTapLock='1';el.classList.remove('is-pocket-tapped');void el.offsetWidth;el.classList.add('is-pocket-tapped');
 window.PocketMascot?.react?.('tap');
 setTimeout(()=>{el.classList.remove('is-pocket-tapped');delete el.dataset.pocketTapLock},560);
}
document.addEventListener('click',e=>{const el=e.target.closest?.('[data-pocket-character]');if(el&&el.id!=='homeMascot')tap(el)});
document.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'||matchMedia('(pointer:coarse)').matches||motion()!=='full'||reduced()||document.hidden)return;
 lastPointer=e;if(pointerFrame)return;
 pointerFrame=requestAnimationFrame(()=>{
  pointerFrame=0;const ev=lastPointer;lastPointer=null;if(!ev)return;
  qa('[data-pocket-character]').forEach(el=>{
   if(el.id==='homeMascot'||el.offsetParent===null)return;
   const rect=el.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height*.46,dx=ev.clientX-cx,dy=ev.clientY-cy,len=Math.max(1,Math.hypot(dx,dy));
   el.style.setProperty('--pocket-eye-x',(dx/len*2.4).toFixed(2)+'px');
   el.style.setProperty('--pocket-eye-y',(dy/len*1.6).toFixed(2)+'px');
  });
 });
},{passive:true});
document.addEventListener('change',e=>{if(e.target?.id==='fileInput')setTimeout(syncFilesEmpty,0)});
document.addEventListener('input',e=>{if(e.target?.id==='fileText')syncFilesEmpty()});
window.addEventListener('pocket-mascot-state',e=>setState(e.detail?.state||'idle'));
window.addEventListener('pocket-motion-change',()=>{syncAll();scheduleBlink()});
window.addEventListener('pocket-view-change',()=>{scheduleHydrate();syncAll()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(blinkTimer);else scheduleBlink()});
const observer=new MutationObserver(scheduleHydrate);
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
else addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
window.PocketMascotViews={hydrate,sync:syncAll,setState,setContext,html};
hydrate();scheduleBlink();
})();
