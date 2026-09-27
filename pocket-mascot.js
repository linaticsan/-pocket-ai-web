/* Shared Pocket mascot renderer + bounded living-creature movement. */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const CONTEXT_STATES={home:'idle',chat:'idle',research:'research',study:'study',coding:'coding',files:'files',projects:'files',settings:'idle',sidebar:'idle',local:'idle'};
const ACTIVE_STATES=new Set(['thinking','research','study','coding','files','listening','error','success','excited','offline','sleep']);
const wander=new WeakMap();
let globalState=window.PocketMascot?.getState?.()||'idle',blinkTimer=0,pointerFrame=0,lastPointer=null,mountFrame=0,autoTimer=0,resizeTimer=0;

function reduced(){return !!matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}
function motion(){return document.documentElement.dataset.motion||'full'}
function canWander(el,{autonomous=false}={}){return !!el?.closest?.('.pocket-playground')&&motion()!=='off'&&(!autonomous||!reduced())&&!document.hidden&&!window.PocketMascot?.isBusy?.()&&!ACTIVE_STATES.has(globalState)}
function html(context='home',size='medium',label='Pocket'){
 return '<span class="pocket-character" data-pocket-character data-pocket-context="'+context+'" data-pocket-state="idle" data-pocket-size="'+size+'" role="img" aria-label="'+label+'">'+
  '<span class="pocket-character__body" aria-hidden="true">'+
   '<span class="pocket-character__ear pocket-character__ear--left"></span>'+
   '<span class="pocket-character__ear pocket-character__ear--right"></span>'+
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
function initWander(el){
 if(!el||wander.has(el))return wander.get(el);
 const data={x:0,y:0,taps:0,returnAt:3+Math.floor(Math.random()*5),moving:false,queued:false,animation:null,lastMove:0};
 wander.set(el,data);el.style.setProperty('--wander-x','0px');el.style.setProperty('--wander-y','0px');return data;
}
function hydrate(root=document){
 qa('[data-pocket-slot]:not([data-pocket-hydrated])',root).forEach(slot=>{
  const context=slot.dataset.pocketContext||'home',size=slot.dataset.pocketSize||'medium',label=slot.dataset.pocketLabel||('Pocket '+context);
  slot.innerHTML=html(context,size,label);slot.dataset.pocketHydrated='1';
 });
 const legacy=q('#homeMascot');
 if(legacy&&!legacy.dataset.pocketCharacter){legacy.dataset.pocketCharacter='';legacy.dataset.pocketContext='home';legacy.dataset.pocketState=globalState}
 qa('[data-pocket-character]').forEach(initWander);
 syncAll();
}
function scheduleHydrate(){if(mountFrame)return;mountFrame=requestAnimationFrame(()=>{mountFrame=0;hydrate()})}
function clearBlink(el){el?.classList.remove('is-pocket-blinking','is-pocket-double-blinking')}
function blinkOne(el,doubleBlink=false){
 if(!el||motion()==='off'||reduced())return;
 clearBlink(el);el.classList.add(doubleBlink?'is-pocket-double-blinking':'is-pocket-blinking');
 setTimeout(()=>clearBlink(el),doubleBlink?430:190);
}
function scheduleBlink(){
 clearTimeout(blinkTimer);
 if(document.hidden||motion()==='off'||reduced())return;
 blinkTimer=setTimeout(()=>{
  const visible=qa('[data-pocket-character]').filter(el=>el.offsetParent!==null&&el.dataset.pocketState!=='sleep');
  visible.forEach((el,i)=>blinkOne(el,Math.random()<.13&&i===0));scheduleBlink();
 },3000+Math.floor(Math.random()*4000));
}
function setState(state){globalState=state||'idle';syncAll();if(ACTIVE_STATES.has(globalState))goHomeAll(false)}
function setContext(target,context){
 const nodes=typeof target==='string'?qa(target):target instanceof Element?[target]:[];
 nodes.forEach(node=>{const el=node.matches?.('[data-pocket-character]')?node:q('[data-pocket-character]',node);if(el){el.dataset.pocketContext=context;syncOne(el)}});
}
function syncFilesEmpty(){
 const files=q('#files'),editor=q('#fileText');if(!files)return;
 files.classList.toggle('has-pocket-document',!!editor?.value?.trim());
}
function boundsFor(el){
 const box=el.closest('.pocket-playground');if(!box)return null;
 const br=box.getBoundingClientRect(),er=el.getBoundingClientRect(),d=initWander(el);
 const homeLeft=er.left-d.x,homeTop=er.top-d.y,pad=10;
 let minX=br.left+pad-homeLeft,maxX=br.right-pad-er.width-homeLeft,minY=br.top+pad-homeTop,maxY=br.bottom-pad-er.height-homeTop;
 const mobile=matchMedia('(max-width:767px)').matches,limit=mobile?Math.min(110,br.width*.27):Math.min(210,br.width*.38),vLimit=mobile?Math.min(72,br.height*.25):Math.min(105,br.height*.34);
 minX=Math.max(minX,-limit);maxX=Math.min(maxX,limit);minY=Math.max(minY,-vLimit);maxY=Math.min(maxY,vLimit);
 if(minX>maxX||minY>maxY)return null;return{box,br,er,homeLeft,homeTop,minX,maxX,minY,maxY,pad};
}
function overlapsExclusion(el,x,y,b){
 const next={left:b.homeLeft+x,top:b.homeTop+y,right:b.homeLeft+x+b.er.width,bottom:b.homeTop+y+b.er.height};
 const zones=qa('[data-pocket-exclusion]',b.box);
 return zones.some(z=>{const r=z.getBoundingClientRect(),gap=6;return next.left<r.right+gap&&next.right>r.left-gap&&next.top<r.bottom+gap&&next.bottom>r.top-gap});
}
function randomDestination(el){
 const b=boundsFor(el);if(!b)return null;
 for(let i=0;i<10;i++){
  const x=b.minX+Math.random()*(b.maxX-b.minX),y=b.minY+Math.random()*(b.maxY-b.minY);
  if(!overlapsExclusion(el,x,y,b))return{x,y};
 }
 return{x:0,y:0,home:true};
}
function faceDirection(el,dx){
 if(Math.abs(dx)<4)return;
 el.dataset.pocketFacing=dx<0?'left':'right';
 el.style.setProperty('--pocket-eye-x',dx<0?'-2px':'2px');
}
function landingReaction(el){
 const roll=Math.random();
 if(roll<.28)blinkOne(el,Math.random()<.25);
 else if(roll<.5){el.classList.add('is-pocket-settle');setTimeout(()=>el.classList.remove('is-pocket-settle'),460)}
 else if(roll<.68)window.PocketMascot?.react?.('happy');
 else if(roll<.82){el.classList.add('is-pocket-antenna-wiggle');setTimeout(()=>el.classList.remove('is-pocket-antenna-wiggle'),650)}
 setTimeout(()=>{if(!el.matches(':hover')){el.style.setProperty('--pocket-eye-x','0px');el.style.setProperty('--pocket-eye-y','0px')}},700);
}
async function animateMove(el,x,y,{home=false,quick=false}={}){
 const d=initWander(el);if(d.moving)return false;
 const dx=x-d.x,dy=y-d.y,dist=Math.hypot(dx,dy);
 if(dist<2){d.x=x;d.y=y;return true}
 d.moving=true;d.lastMove=Date.now();faceDirection(el,dx);el.classList.add('is-pocket-moving');
 const lowMotion=reduced()||motion()==='gentle',duration=lowMotion?240:Math.max(520,Math.min(980,(quick?420:520)+dist*2.15)),hops=lowMotion?1:dist>95?3:dist>42?2:1;
 const frames=[{transform:`translate3d(${d.x}px,${d.y}px,0) scale(1)`}];
 for(let i=1;i<hops;i++){const p=i/hops,arc=7+Math.min(8,dist*.035);frames.push({offset:p,transform:`translate3d(${d.x+dx*p}px,${d.y+dy*p-arc}px,0) scale(1.015,.985)`})}
 if(lowMotion)frames.push({transform:`translate3d(${x}px,${y}px,0) scale(1)`});
 else frames.push({offset:.9,transform:`translate3d(${x}px,${y-5}px,0) scale(.985,1.02)`},{transform:`translate3d(${x}px,${y}px,0) scale(1)`});
 try{d.animation=el.animate(frames,{duration,easing:'cubic-bezier(.22,.74,.2,1)',fill:'forwards'});await d.animation.finished}catch{}
 d.animation=null;d.x=x;d.y=y;el.style.setProperty('--wander-x',x.toFixed(1)+'px');el.style.setProperty('--wander-y',y.toFixed(1)+'px');el.style.transform=`translate3d(${x}px,${y}px,0)`;el.classList.remove('is-pocket-moving');
 if(home){d.taps=0;d.returnAt=3+Math.floor(Math.random()*5);el.dataset.pocketHome='true'}else{delete el.dataset.pocketHome}
 d.moving=false;landingReaction(el);
 if(d.queued){d.queued=false;setTimeout(()=>moveRandom(el,{autonomous:false}),90)}
 return true;
}
function goHome(el=q('.pocket-playground [data-pocket-character]'),animate=true){
 if(!el)return Promise.resolve(false);const d=initWander(el);d.queued=false;
 if(d.animation){try{d.animation.cancel()}catch{}d.animation=null;d.moving=false}
 if(!animate||motion()==='off'||reduced()){d.x=0;d.y=0;d.taps=0;d.returnAt=3+Math.floor(Math.random()*5);el.style.transform='translate3d(0,0,0)';el.style.setProperty('--wander-x','0px');el.style.setProperty('--wander-y','0px');el.dataset.pocketHome='true';return Promise.resolve(true)}
 return animateMove(el,0,0,{home:true});
}
function goHomeAll(animate=true){qa('.pocket-playground [data-pocket-character]').forEach(el=>void goHome(el,animate))}
function moveRandom(el=q('.pocket-playground [data-pocket-character]'),{autonomous=false}={}){
 if(!el||!canWander(el,{autonomous}))return false;const d=initWander(el);
 if(d.moving){d.queued=!autonomous;return false}
 if(Date.now()-d.lastMove<480)return false;
 const firstTap=d.taps===0;d.taps++;
 if(d.taps>=d.returnAt&&!firstTap)return void goHome(el,true);
 const roll=firstTap&&!autonomous?.5:Math.random();
 if(!firstTap&&roll<.05)return void goHome(el,true);
 if(!firstTap&&roll<.25){window.PocketMascot?.react?.('tap');blinkOne(el);return false}
 if(!firstTap&&roll<.35){el.classList.add('is-pocket-play-jump');setTimeout(()=>el.classList.remove('is-pocket-play-jump'),620);return false}
 const dest=randomDestination(el);if(!dest)return void goHome(el,true);
 if(dest.home&&firstTap){const b=boundsFor(el);if(!b)return false;dest.x=Math.max(b.minX,Math.min(b.maxX,(b.maxX>=24?24:b.maxX)));dest.y=0;delete dest.home}
 else if(dest.home)return void goHome(el,true);
 const scale=reduced()?0.24:motion()==='gentle'?0.46:1;
 let x=d.x+(dest.x-d.x)*scale,y=d.y+(dest.y-d.y)*scale;
 if(firstTap&&Math.hypot(x-d.x,y-d.y)<18){const b=boundsFor(el);x=Math.max(b.minX,Math.min(b.maxX,d.x+(b.maxX-d.x>=18?22:-22)));y=Math.max(b.minY,Math.min(b.maxY,d.y))}
 void animateMove(el,x,y,{quick:lowMotionMove()||roll>.91});return true;
}
function lowMotionMove(){return reduced()||motion()==='gentle'}
function tap(el){
 if(!el||el.dataset.pocketTapLock==='1')return;
 el.dataset.pocketTapLock='1';el.classList.remove('is-pocket-tapped');void el.offsetWidth;el.classList.add('is-pocket-tapped');
 window.PocketMascot?.react?.('tap');
 if(el.closest('.pocket-playground'))setTimeout(()=>moveRandom(el),90);
 setTimeout(()=>{el.classList.remove('is-pocket-tapped');delete el.dataset.pocketTapLock},650);
 scheduleAutonomous();
}
function scheduleAutonomous(){
 clearTimeout(autoTimer);if(motion()!=='full'||reduced()||document.hidden)return;
 autoTimer=setTimeout(()=>{const el=q('.pocket-playground [data-pocket-character]');if(el&&canWander(el)&&Date.now()-initWander(el).lastMove>18000)moveRandom(el,{autonomous:true});scheduleAutonomous()},20000+Math.floor(Math.random()*40000));
}
function handleLayoutReset(){
 clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{qa('.pocket-playground [data-pocket-character]').forEach(el=>{const d=initWander(el),b=boundsFor(el);if(!b||d.x<b.minX||d.x>b.maxX||d.y<b.minY||d.y>b.maxY)void goHome(el,true)})},180);
}
document.addEventListener('click',e=>{const el=e.target.closest?.('[data-pocket-character]');if(el&&el.id!=='homeMascot')tap(el);if(e.target.closest?.('[aria-haspopup="dialog"]'))setTimeout(()=>goHomeAll(true),60)});
document.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'||matchMedia('(pointer:coarse)').matches||motion()!=='full'||reduced()||document.hidden)return;
 lastPointer=e;if(pointerFrame)return;
 pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;const ev=lastPointer;lastPointer=null;if(!ev)return;qa('[data-pocket-character]').forEach(el=>{if(el.id==='homeMascot'||el.offsetParent===null)return;const rect=el.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height*.46,dx=ev.clientX-cx,dy=ev.clientY-cy,len=Math.max(1,Math.hypot(dx,dy));el.style.setProperty('--pocket-eye-x',(dx/len*2.4).toFixed(2)+'px');el.style.setProperty('--pocket-eye-y',(dy/len*1.6).toFixed(2)+'px')})});
},{passive:true});
document.addEventListener('change',e=>{if(e.target?.id==='fileInput')setTimeout(syncFilesEmpty,0)});
document.addEventListener('input',e=>{if(e.target?.id==='fileText')syncFilesEmpty()});
window.addEventListener('pocket-mascot-state',e=>setState(e.detail?.state||'idle'));
window.addEventListener('pocket-motion-change',()=>{syncAll();scheduleBlink();if(motion()==='off')goHomeAll(false);scheduleAutonomous()});
window.addEventListener('pocket-view-change',e=>{if(e.detail?.id!=='home')goHomeAll(true);scheduleHydrate();syncAll()});
window.addEventListener('resize',handleLayoutReset,{passive:true});window.addEventListener('orientationchange',()=>goHomeAll(true),{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(blinkTimer);clearTimeout(autoTimer)}else{scheduleBlink();scheduleAutonomous()}});
const observer=new MutationObserver(scheduleHydrate);
if(document.body)observer.observe(document.body,{childList:true,subtree:true});else addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
window.PocketMascotViews={hydrate,sync:syncAll,setState,setContext,html,moveRandom,goHome,goHomeAll};
hydrate();scheduleBlink();scheduleAutonomous();
})();
