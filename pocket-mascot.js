/* Shared Pocket mascot renderer + bounded living-creature movement. */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const CONTEXT_STATES={home:'idle',chat:'idle',research:'research',study:'study',coding:'coding',files:'files',projects:'files',settings:'idle',sidebar:'idle',local:'idle'};
const ACTIVE_STATES=new Set(['thinking','research','study','coding','files','listening','error','success','excited','offline','sleep','sleepy','annoyed','grumpy','very-annoyed']);
const RETURN_HOME_STATES=new Set(['thinking','research','study','coding','files','listening','error','success','excited','offline','sleep','sleepy']);
const wander=new WeakMap();
let globalState=window.PocketMascot?.getState?.()||'idle',blinkTimer=0,pointerFrame=0,lastPointer=null,mountFrame=0,autoTimer=0,resizeTimer=0,scrollResetTimer=0,heroLineIndex=-1;
const HERO_CLICK_LINES=[
 'Hi! What shall we explore? ✨',
 'Ask me anything.',
 'Want to study together?',
 'Need help with Japanese?',
 'Let’s research something.',
 'Want to build something?',
 'Hehe, you found me!',
 'Where should I hop next?',
 'I’m listening 👀',
 'Ready when you are.',
 'What are we working on?',
 'Tap again — I can move!',
 'Let’s make something useful.',
 'Your turn. What’s the plan?'
];
const CLICK_EXPRESSIONS=['cute','happy','sleepy','annoyed'];
const EXPRESSION_LABELS={cute:'Cute',happy:'Happy',sleepy:'Sleepy',annoyed:'Annoyed'};
function cycleClickExpression(el){
 if(!el)return'cute';
 const current=el.dataset.pocketExpression||'cute';
 const next=CLICK_EXPRESSIONS[(CLICK_EXPRESSIONS.indexOf(current)+1)%CLICK_EXPRESSIONS.length];
 el.dataset.pocketExpression=next;
 el.setAttribute('aria-label','Pocket — '+EXPRESSION_LABELS[next]);
 window.dispatchEvent(new CustomEvent('pocket-expression-change',{detail:{expression:next,element:el}}));
 return next;
}

function changeHeroSpeech(el){
 if(!el?.closest?.('.home-hero-pocket'))return;
 const speech=q('#homePocketSpeech');if(!speech)return;
 heroLineIndex=(heroLineIndex+1)%HERO_CLICK_LINES.length;
 speech.textContent=HERO_CLICK_LINES[heroLineIndex];
 speech.classList.remove('is-changing');void speech.offsetWidth;speech.classList.add('is-changing');
 setTimeout(()=>speech.classList.remove('is-changing'),320);
}

function reduced(){return !!matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}
function motion(){return document.documentElement.dataset.motion||'full'}
function canWander(el,{autonomous=false,force=false}={}){return !!el?.closest?.('.pocket-playground')&&motion()!=='off'&&(!autonomous||!reduced())&&!document.hidden&&!window.PocketMascot?.isBusy?.()&&(force||!ACTIVE_STATES.has(globalState))}
function characterParts(){
 return '<span class="pocket-character__body" aria-hidden="true">'+
   '<span class="pocket-character__ear pocket-character__ear--left"></span>'+
   '<span class="pocket-character__ear pocket-character__ear--right"></span>'+
   '<span class="pocket-character__eye pocket-character__eye--left"></span>'+
   '<span class="pocket-character__eye pocket-character__eye--right"></span>'+
   '<span class="pocket-character__eyelid pocket-character__eyelid--left"></span>'+
   '<span class="pocket-character__eyelid pocket-character__eyelid--right"></span>'+
   '<span class="pocket-character__brow pocket-character__brow--left"></span>'+
   '<span class="pocket-character__brow pocket-character__brow--right"></span>'+
   '<span class="pocket-character__mouth"><span class="pocket-character__teeth"><i></i><i></i><i></i></span></span>'+
   '<span class="pocket-character__blush pocket-character__blush--left"></span>'+
   '<span class="pocket-character__blush pocket-character__blush--right"></span>'+
      '<span class="pocket-character__prop"></span>'+
  '</span>'+
  '<span class="pocket-character__dots" aria-hidden="true">• • •</span>';
}
function html(context='home',size='medium',label='Pocket'){
 return '<span class="pocket-character" data-pocket-character data-pocket-context="'+context+'" data-pocket-state="idle" data-pocket-expression="cute" data-pocket-size="'+size+'" role="img" aria-label="'+label+'">'+characterParts()+'</span>';
}
function effectiveState(el){
 const context=el.dataset.pocketContext||'home';
 if(['thinking','happy','success','error','sleep','sleepy','listening','excited','offline','curious','mischievous','annoyed','grumpy','very-annoyed'].includes(globalState))return globalState;
 if(context==='chat'&&q('#v3Study')?.classList.contains('active'))return'study';
 return CONTEXT_STATES[context]||'idle';
}
function syncOne(el){if(!el)return;el.dataset.pocketState=effectiveState(el)}
function syncAll(){qa('[data-pocket-character]').forEach(syncOne);syncFilesEmpty()}
function initWander(el){
 if(!el||wander.has(el))return wander.get(el);
 const data={x:0,y:0,taps:0,returnAt:3+Math.floor(Math.random()*5),moving:false,queued:false,animation:null,lastMove:0,stayTimer:0,stayUntil:0,lastZone:''};
 wander.set(el,data);el.style.setProperty('--wander-x','0px');el.style.setProperty('--wander-y','0px');return data;
}
function hydrate(root=document){
 qa('[data-pocket-slot]:not([data-pocket-hydrated])',root).forEach(slot=>{
  const context=slot.dataset.pocketContext||'home',size=slot.dataset.pocketSize||'medium',label=slot.dataset.pocketLabel||('Pocket '+context);
  slot.innerHTML=html(context,size,label);slot.dataset.pocketHydrated='1';
 });
 qa('[data-pocket-character]',root).forEach(el=>{
  if(!q('.pocket-character__body',el))el.insertAdjacentHTML('afterbegin',characterParts());
  if(!el.dataset.pocketContext)el.dataset.pocketContext='home';
  if(!el.dataset.pocketState)el.dataset.pocketState=globalState;if(!el.dataset.pocketExpression)el.dataset.pocketExpression='cute';
  if(!el.dataset.pocketSize)el.dataset.pocketSize='medium';
  if(el.tagName!=='BUTTON'&&!el.hasAttribute('role'))el.setAttribute('role','img');
 });
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
function setState(state){globalState=state||'idle';syncAll();if(RETURN_HOME_STATES.has(globalState))goHomeAll(false)}
function setContext(target,context){
 const nodes=typeof target==='string'?qa(target):target instanceof Element?[target]:[];
 nodes.forEach(node=>{const el=node.matches?.('[data-pocket-character]')?node:q('[data-pocket-character]',node);if(el){el.dataset.pocketContext=context;syncOne(el)}});
}
function syncFilesEmpty(){
 const files=q('#files'),editor=q('#fileText');if(!files)return;
 files.classList.toggle('has-pocket-document',!!editor?.value?.trim());
}
function boundsFor(el){
 const roam=el.closest('[data-pocket-roam-root]')||el.closest('.pocket-playground');if(!roam)return null;
 const rr=roam.getBoundingClientRect(),er=el.getBoundingClientRect(),d=initWander(el),pad=12;
 const homeLeft=er.left-d.x,homeTop=er.top-d.y;
 const visibleTop=Math.max(rr.top+pad,8),visibleBottom=Math.min(rr.bottom-pad,innerHeight-12);
 let minX=rr.left+pad-homeLeft,maxX=rr.right-pad-er.width-homeLeft,minY=visibleTop-homeTop,maxY=visibleBottom-er.height-homeTop;
 const mobile=matchMedia('(max-width:767px)').matches;
 const xCap=mobile?Math.min(170,rr.width*.44):Math.min(620,rr.width*.62),yCap=mobile?Math.min(250,Math.max(80,innerHeight*.3)):Math.min(420,Math.max(120,innerHeight*.46));
 minX=Math.max(minX,-xCap);maxX=Math.min(maxX,xCap);minY=Math.max(minY,-yCap);maxY=Math.min(maxY,yCap);
 if(minX>maxX){minX=0;maxX=0} if(minY>maxY){minY=0;maxY=0}
 if(minX===0&&maxX===0&&minY===0&&maxY===0)return null;
 return{box:roam,br:rr,er,homeLeft,homeTop,minX,maxX,minY,maxY,pad};
}
function exclusionRects(b){
 const explicit=qa('[data-pocket-exclusion],[data-pocket-exclusion-group]',b.box);
 return explicit.filter(z=>z.offsetParent!==null).map(z=>z.getBoundingClientRect());
}
function overlapsExclusion(el,x,y,b){
 const next={left:b.homeLeft+x,top:b.homeTop+y,right:b.homeLeft+x+b.er.width,bottom:b.homeTop+y+b.er.height};
 return exclusionRects(b).some(r=>{const gap=10;return next.left<r.right+gap&&next.right>r.left-gap&&next.top<r.bottom+gap&&next.bottom>r.top-gap});
}
function targetFromPoint(b,cx,cy,name){
 return{x:cx-b.er.width/2-b.homeLeft,y:cy-b.er.height/2-b.homeTop,zone:name};
}
function clampDestination(dest,b){
 dest.x=Math.max(b.minX,Math.min(b.maxX,dest.x));dest.y=Math.max(b.minY,Math.min(b.maxY,dest.y));return dest;
}
function anchorDestinations(el,b){
 const r=b.br,w=r.width,h=Math.max(180,Math.min(r.height,innerHeight-r.top)),composer=q('#homeComposer');
 const cr=composer?.getBoundingClientRect();
 const points=[
  [r.left+w*.12,r.top+70,'top-left'],[r.left+w*.5,r.top+62,'top-middle'],[r.right-w*.12,r.top+70,'top-right'],
  [r.left+w*.08,r.top+h*.38,'left-side'],[r.left+w*.5,r.top+h*.38,'middle'],[r.right-w*.08,r.top+h*.38,'right-side'],
  [r.left+w*.14,r.top+h*.66,'lower-left'],[r.left+w*.5,r.top+h*.62,'lower-middle'],[r.right-w*.14,r.top+h*.66,'lower-right']
 ];
 if(cr){
  points.push([cr.left-b.er.width*.65,cr.top+cr.height*.5,'composer-left']);
  points.push([cr.right+b.er.width*.65,cr.top+cr.height*.5,'composer-right']);
  points.push([cr.left+cr.width*.5,cr.top-b.er.height*.7,'composer-above']);
  points.push([cr.left+cr.width*.5,cr.bottom+b.er.height*.7,'composer-below']);
 }
 return points.map(p=>clampDestination(targetFromPoint(b,p[0],p[1],p[2]),b)).filter(d=>!overlapsExclusion(el,d.x,d.y,b));
}
function randomDestination(el,{far=false}={}){
 const b=boundsFor(el);if(!b)return null;const d=initWander(el),anchors=anchorDestinations(el,b).filter(a=>!far||Math.hypot(a.x-d.x,a.y-d.y)>70);
 const pool=anchors.filter(a=>a.zone!==d.lastZone);
 if(pool.length){const chosen=(pool.length?pool:anchors)[Math.floor(Math.random()*(pool.length||anchors.length))];return{...chosen}}
 for(let i=0;i<14;i++){
  const x=b.minX+Math.random()*(b.maxX-b.minX),y=b.minY+Math.random()*(b.maxY-b.minY);
  if(!overlapsExclusion(el,x,y,b)&&(!far||Math.hypot(x-d.x,y-d.y)>55))return{x,y,zone:'free'};
 }
 return{x:0,y:0,home:true,zone:'home'};
}
function clearStay(el){const d=initWander(el);clearTimeout(d.stayTimer);d.stayTimer=0;d.stayUntil=0;delete el.dataset.pocketStayUntil}
function scheduleStay(el){
 const d=initWander(el);clearStay(el);
 if(motion()!=='full'||reduced()||document.hidden||window.PocketMascot?.isBusy?.())return;
 const stay=5000+Math.floor(Math.random()*6500);d.stayUntil=Date.now()+stay;el.dataset.pocketStayUntil=String(d.stayUntil);
 d.stayTimer=setTimeout(()=>{d.stayTimer=0;if(canWander(el,{autonomous:true}))moveRandom(el,{autonomous:true})},stay);
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
 else if(roll<.68)window.PocketMascot?.react?.('movement');
 else if(roll<.82){el.classList.add('is-pocket-antenna-wiggle');setTimeout(()=>el.classList.remove('is-pocket-antenna-wiggle'),650)}
 setTimeout(()=>{if(!el.matches(':hover')){el.style.setProperty('--pocket-eye-x','0px');el.style.setProperty('--pocket-eye-y','0px')}},700);
}
async function animateMove(el,x,y,{home=false,quick=true,zone=''}={}){
 const d=initWander(el);if(d.moving)return false;clearStay(el);
 const dx=x-d.x,dy=y-d.y,dist=Math.hypot(dx,dy);if(dist<2){d.x=x;d.y=y;scheduleStay(el);return true}
 d.moving=true;d.lastMove=Date.now();faceDirection(el,dx);
 if(reduced()){
  d.x=x;d.y=y;d.lastZone=zone||d.lastZone;el.dataset.pocketZone=d.lastZone||'free';el.style.setProperty('--wander-x',x.toFixed(1)+'px');el.style.setProperty('--wander-y',y.toFixed(1)+'px');el.style.transform=`translate3d(${x}px,${y}px,0)`;
  if(home){d.taps=0;d.returnAt=3+Math.floor(Math.random()*5);el.dataset.pocketHome='true';window.dispatchEvent(new CustomEvent('pocket-mascot-home',{detail:{element:el}}))}else delete el.dataset.pocketHome;
  d.moving=false;scheduleStay(el);return true;
 }
 el.classList.add('is-pocket-moving');
 const low=motion()==='gentle',duration=low?220:Math.max(260,Math.min(460,250+dist*.38)),hops=low?1:dist>260?2:1;
 const frames=[{transform:`translate3d(${d.x}px,${d.y}px,0) scale(1)`}];
 if(hops>1)frames.push({offset:.52,transform:`translate3d(${d.x+dx*.52}px,${d.y+dy*.52-10}px,0) scale(.98,1.03)`});
 frames.push({offset:.88,transform:`translate3d(${x}px,${y-4}px,0) scale(1.025,.975)`},{transform:`translate3d(${x}px,${y}px,0) scale(1)`});
 try{d.animation=el.animate(frames,{duration,easing:'cubic-bezier(.16,.84,.2,1)',fill:'forwards'});await d.animation.finished}catch{}
 d.animation=null;d.x=x;d.y=y;d.lastZone=zone||d.lastZone;el.dataset.pocketZone=d.lastZone||'free';el.style.setProperty('--wander-x',x.toFixed(1)+'px');el.style.setProperty('--wander-y',y.toFixed(1)+'px');el.style.transform=`translate3d(${x}px,${y}px,0)`;el.classList.remove('is-pocket-moving');
 if(home){d.taps=0;d.returnAt=3+Math.floor(Math.random()*5);el.dataset.pocketHome='true';window.dispatchEvent(new CustomEvent('pocket-mascot-home',{detail:{element:el}}))}else delete el.dataset.pocketHome;
 d.moving=false;landingReaction(el);scheduleStay(el);
 if(d.queued){d.queued=false;setTimeout(()=>moveRandom(el,{autonomous:false}),70)}
 return true;
}
function goHome(el=q('.pocket-playground [data-pocket-character]'),animate=true){
 if(!el)return Promise.resolve(false);const d=initWander(el);clearStay(el);d.queued=false;
 if(d.animation){try{d.animation.cancel()}catch{}d.animation=null;d.moving=false}
 if(!animate||motion()==='off'||reduced()){d.x=0;d.y=0;d.taps=0;d.lastZone='home';d.returnAt=3+Math.floor(Math.random()*5);el.style.transform='translate3d(0,0,0)';el.style.setProperty('--wander-x','0px');el.style.setProperty('--wander-y','0px');el.dataset.pocketHome='true';window.dispatchEvent(new CustomEvent('pocket-mascot-home',{detail:{element:el}}));return Promise.resolve(true)}
 return animateMove(el,0,0,{home:true,zone:'home'});
}
function goHomeAll(animate=true){qa('.pocket-playground [data-pocket-character]').forEach(el=>void goHome(el,animate))}
function moveRandom(el=q('.pocket-playground [data-pocket-character]'),{autonomous=false,force=false}={}){
 if(!el||!canWander(el,{autonomous,force}))return false;const d=initWander(el);clearStay(el);
 if(d.moving){d.queued=!autonomous;return false}
 if(Date.now()-d.lastMove<(autonomous?700:80))return false;
 d.taps++;
 if(autonomous&&Math.random()<.08)return void goHome(el,true);
 const dest=randomDestination(el,{far:!autonomous});if(!dest)return void goHome(el,true);
 if(dest.home)return void goHome(el,true);
 const scale=reduced()?0.24:motion()==='gentle'?0.55:1;
 let x=d.x+(dest.x-d.x)*scale,y=d.y+(dest.y-d.y)*scale;
 if(reduced()){
  const dx=x-d.x,dy=y-d.y,dist=Math.max(1,Math.hypot(dx,dy)),cap=36;
  if(dist>cap){x=d.x+dx/dist*cap;y=d.y+dy/dist*cap}
 }
 if(!autonomous&&Math.hypot(x-d.x,y-d.y)<18){
  const b=boundsFor(el);if(b){x=Math.max(b.minX,Math.min(b.maxX,d.x+(dest.x>=d.x?20:-20)));y=Math.max(b.minY,Math.min(b.maxY,y))}
 }
 void animateMove(el,x,y,{quick:true,zone:dest.zone});return true;
}
function tap(el){
 if(!el||el.dataset.pocketTapLock==='1')return;
 const d=initWander(el);clearStay(el);el.dataset.pocketTapLock='1';el.classList.remove('is-pocket-tapped');void el.offsetWidth;el.classList.add('is-pocket-tapped');
 if(el.closest('.pocket-playground'))moveRandom(el,{autonomous:false});
 window.PocketMascot?.tap?.({source:'roaming',element:el});
 changeHeroSpeech(el);
 setTimeout(()=>{el.classList.remove('is-pocket-tapped');delete el.dataset.pocketTapLock},360);
}
function scheduleAutonomous(){
 clearTimeout(autoTimer);if(motion()!=='full'||reduced()||document.hidden)return;
 autoTimer=setTimeout(()=>{const el=q('.pocket-playground [data-pocket-character]');if(el&&canWander(el,{autonomous:true})&&!initWander(el).stayTimer)moveRandom(el,{autonomous:true});scheduleAutonomous()},12000+Math.floor(Math.random()*16000));
}
function handleLayoutReset(){
 clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{qa('.pocket-playground [data-pocket-character]').forEach(el=>{const d=initWander(el),b=boundsFor(el);if(!b||d.x<b.minX||d.x>b.maxX||d.y<b.minY||d.y>b.maxY)void goHome(el,true)})},180);
}
function handleScrollReset(){
 clearTimeout(scrollResetTimer);
 scrollResetTimer=setTimeout(()=>goHomeAll(false),90);
}
document.addEventListener('pointerdown',e=>{const el=e.target.closest?.('[data-pocket-character]');if(el)void window.PocketSound?.unlock?.()},{passive:true});
if(!('PointerEvent' in window))document.addEventListener('touchstart',e=>{const el=e.target.closest?.('[data-pocket-character]');if(el)void window.PocketSound?.unlock?.()},{passive:true});
document.addEventListener('click',e=>{const el=e.target.closest?.('[data-pocket-character]');if(el){cycleClickExpression(el);if(el.id!=='homeMascot')tap(el)}if(e.target.closest?.('[aria-haspopup="dialog"]'))goHomeAll(true)});
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
window.addEventListener('resize',handleLayoutReset,{passive:true});window.addEventListener('scroll',handleScrollReset,{passive:true});window.addEventListener('orientationchange',()=>goHomeAll(true),{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(blinkTimer);clearTimeout(autoTimer)}else{scheduleBlink();scheduleAutonomous()}});
const observer=new MutationObserver(scheduleHydrate);
if(document.body)observer.observe(document.body,{childList:true,subtree:true});else addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
window.PocketMascotViews={hydrate,sync:syncAll,setState,setContext,html,characterParts,moveRandom,goHome,goHomeAll,dashAway:(el=q('.pocket-playground [data-pocket-character]'))=>moveRandom(el,{autonomous:false,force:true})};
hydrate();scheduleBlink();scheduleAutonomous();
})();
