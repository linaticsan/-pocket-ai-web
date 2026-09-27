/* STEP 45 — centralized offline season/weather particle engine. */
(()=>{'use strict';
const SEASON_KEY='pocket-environment-season-v1',EFFECTS_KEY='pocket-environment-effects-v1';
const seasons=new Set(['auto','spring','summer','autumn','winter']),modes=new Set(['full','gentle','off']);
const workspaceIntensity={home:1,local:.35,chat:.32,surface:.25,files:.2,coding:.08,library:.2,github:.14};
const pool=[];let layer=null,seasonChoice='auto',season='autumn',effects='full',effect=null,wind=0,eventTimer=0,eventStopTimer=0,previewTimer=0,workspace='home';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function safeGet(k,d){try{return localStorage.getItem(k)||d}catch{return d}}
function safeSet(k,v){try{localStorage.setItem(k,v)}catch{}}
function reduced(){return !!matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}
function motion(){return document.documentElement.dataset.motion||'full'}
function getCurrentSeason(date=new Date()){const m=date.getMonth()+1;return m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter'}
function resolvedSeason(){return seasonChoice==='auto'?getCurrentSeason():seasonChoice}
function effectiveMode(){if(motion()==='off'||effects==='off'||reduced())return'off';if(motion()==='gentle'||effects==='gentle')return'gentle';return'full'}
function quality(){if(effectiveMode()==='off')return'low';if(matchMedia('(max-width:767px)').matches)return'low';if(innerWidth>=1400&&devicePixelRatio<=2)return'high';return'medium'}
function countFor(type){
 const base={low:8,medium:16,high:24}[quality()],mode=effectiveMode();
 if(mode==='off')return 0;
 const factor=mode==='gentle' ? 0.55 : 1;
 const typeFactor=type==='rain'?1.15:type==='light' ? 0.55 : 1;
 return Math.max(3,Math.round(base*factor*typeFactor));
}
function ensureLayer(){
 if(layer)return layer;layer=document.createElement('div');layer.id='pocketEnvironment';layer.setAttribute('aria-hidden','true');document.body.prepend(layer);
 for(let i=0;i<30;i++){const p=document.createElement('i');p.className='pocket-env-particle';layer.appendChild(p);pool.push(p)}
 return layer;
}
function cancelParticle(p){try{p.getAnimations().forEach(a=>a.cancel())}catch{}p.className='pocket-env-particle';p.style.cssText='';}
function stopEffect(type){
 if(type&&effect!==type)return;clearTimeout(eventStopTimer);effect=null;pool.forEach(cancelParticle);document.documentElement.dataset.envWeather='calm';reactPocket('calm');
}
function particleFrames(type,p,w,h){
 const x=rand(-20,w+20),scale=rand(.72,1.22),drift=wind*w*.22+rand(-45,45),duration=type==='rain'?rand(900,1500):type==='snow'?rand(6500,11000):type==='light'?rand(4800,8000):rand(5200,9000);
 let frames;
 p.className='pocket-env-particle '+type;p.style.opacity=String(rand(.42,.82));p.style.transform='translate3d(-100px,-100px,0)';
 if(type==='snow'){const size=rand(2.5,6.5);p.style.setProperty('--flake',size+'px');frames=[{transform:`translate3d(${x}px,-12px,0) scale(${scale})`,opacity:0},{offset:.08,opacity:rand(.35,.78)},{transform:`translate3d(${x+drift}px,${h+18}px,0) scale(${scale}) rotate(${rand(80,220)}deg)`,opacity:.08}]}
 else if(type==='rain'){p.style.setProperty('--drop',rand(12,23)+'px');frames=[{transform:`translate3d(${x}px,-28px,0) rotate(${-5+wind*11}deg)`,opacity:0},{offset:.08,opacity:rand(.2,.52)},{transform:`translate3d(${x+drift*.3}px,${h+35}px,0) rotate(${-5+wind*11}deg)`,opacity:.08}]}
 else if(type==='light'){const y=rand(h*.12,h*.8);frames=[{transform:`translate3d(${x}px,${y}px,0) scale(.4)`,opacity:0},{offset:.35,opacity:.58},{offset:.7,transform:`translate3d(${x+rand(-25,25)}px,${y-rand(18,55)}px,0) scale(1)`,opacity:.42},{transform:`translate3d(${x+rand(-40,40)}px,${y-rand(40,85)}px,0) scale(.6)`,opacity:0}]}
 else {if(type==='leaf')p.style.setProperty('--leaf-color',['#c97932','#dd9d43','#b85d35','#e1b44f'][Math.floor(Math.random()*4)]);frames=[{transform:`translate3d(${x}px,-18px,0) rotate(0deg) scale(${scale})`,opacity:0},{offset:.08,opacity:rand(.4,.78)},{offset:.52,transform:`translate3d(${x+drift*.45+rand(-30,30)}px,${h*.48}px,0) rotate(${rand(90,260)}deg) scale(${scale})`},{transform:`translate3d(${x+drift}px,${h+24}px,0) rotate(${rand(280,620)}deg) scale(${scale})`,opacity:.06}]}
 return{frames,duration,delay:rand(0,duration*.9)};
}
function animatePool(type){
 ensureLayer();pool.forEach(cancelParticle);const n=countFor(type),w=innerWidth,h=innerHeight;
 for(let i=0;i<n;i++){const p=pool[i],cfg=particleFrames(type,p,w,h);try{p.animate(cfg.frames,{duration:cfg.duration,delay:-cfg.delay,iterations:Infinity,easing:'linear'}).play()}catch{}}
}
function reactPocket(type){
 if(!window.PocketMascot||motion()==='off'||document.hidden)return;
 if(type==='wind'){window.PocketMascot.setWind?.(wind);return}
 if(type==='snow'&&Math.random()<.45)window.PocketMascot.react?.('happy');
 if(['snow','sakura','leaf','rain'].includes(type))setTimeout(()=>{const el=q('.pocket-playground [data-pocket-character]');if(el){const r=el.getBoundingClientRect();window.PocketMascot.lookAt?.(r.left+r.width*.6,r.top-80,true)}},500+Math.random()*900);
}
function startEffect(type,{duration=0,preview=false,intensity=1}={}){
 const valid=new Set(['sakura','snow','rain','leaf','light']);if(!valid.has(type)||effectiveMode()==='off')return false;
 clearTimeout(eventStopTimer);effect=type;ensureLayer();animatePool(type);layer.style.setProperty('--env-effect-intensity',String(clamp(intensity,0,1)));document.documentElement.dataset.envWeather=type;reactPocket(type);
 if(duration>0)eventStopTimer=setTimeout(()=>{stopEffect(type);if(!preview)scheduleAmbient()},duration);return true;
}
function setWind(value=0){wind=clamp(Number(value)||0,-1,1);document.documentElement.style.setProperty('--env-wind',String(wind));window.PocketMascot?.setWind?.(wind);return wind}
function seasonalDefault(){
 if(season==='spring')return Math.random()<.76?'sakura':'rain';
 if(season==='summer')return Math.random()<.66?'light':'rain';
 if(season==='autumn')return'leaf';
 if(season==='winter')return'snow';return null;
}
function scheduleAmbient(initial=false){
 clearTimeout(eventTimer);clearTimeout(eventStopTimer);if(document.hidden||effectiveMode()==='off')return;
 const delay=initial?rand(1600,4500):rand(45000,150000);
 eventTimer=setTimeout(()=>{if(document.hidden||effectiveMode()==='off')return scheduleAmbient();const type=seasonalDefault();if(!type)return scheduleAmbient();if(Math.random()<.34)setWind(rand(-.42,.42));else setWind(rand(-.12,.12));startEffect(type,{duration:rand(15000,48000),intensity:effectiveMode()==='gentle' ? 0.45 : 0.75})},delay);
}
function applySeason(choice=seasonChoice,{persist=true}={}){
 seasonChoice=seasons.has(choice)?choice:'auto';season=resolvedSeason();document.documentElement.dataset.envSeason=season;document.documentElement.dataset.envSeasonChoice=seasonChoice;if(persist)safeSet(SEASON_KEY,seasonChoice);
 qa('[data-env-season-choice]').forEach(b=>{const on=b.dataset.envSeasonChoice===seasonChoice;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
 updateStatus();stopEffect();scheduleAmbient(true);return season;
}
function setEffectsMode(mode=effects,{persist=true}={}){
 effects=modes.has(mode)?mode:'full';document.documentElement.dataset.envEffects=effects;if(persist)safeSet(EFFECTS_KEY,effects);
 qa('[data-env-effects]').forEach(b=>{const on=b.dataset.envEffects===effects;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
 if(effectiveMode()==='off')stopEffect();else if(effect)animatePool(effect);else scheduleAmbient(true);updateStatus();return effects;
}
function setWeather(value={}){
 const type=value?.type||'calm';setWind(value?.wind??wind);if(type==='calm'||type==='none'){stopEffect();return true}
 return startEffect(type,{intensity:clamp(value?.intensity??.5,0,1)});
}
function preview(type){
 clearTimeout(previewTimer);if(type==='wind'){setWind(wind===0 ? 0.45 : -wind);reactPocket('wind');previewTimer=setTimeout(()=>setWind(0),5000);return true}
 stopEffect();const ok=startEffect(type,{preview:true,intensity:.7});previewTimer=setTimeout(()=>{stopEffect(type);scheduleAmbient()},6500);return ok;
}
function setWorkspace(id='home'){workspace=id;ensureLayer();const opacity=workspaceIntensity[id]??.16;layer.style.setProperty('--env-workspace-opacity',String(opacity));document.documentElement.dataset.envWorkspace=id}
function updateStatus(){const el=q('#environmentStatus');if(el)el.textContent='Season: '+season[0].toUpperCase()+season.slice(1)+(seasonChoice==='auto'?' (Auto)':'')+' • Effects: '+(effectiveMode()==='off'?'Off':effects==='gentle'||motion()==='gentle'?'Gentle':'On')}
function bindSettings(){
 qa('[data-env-season-choice]').forEach(b=>b.addEventListener('click',()=>applySeason(b.dataset.envSeasonChoice)));
 qa('[data-env-effects]').forEach(b=>b.addEventListener('click',()=>setEffectsMode(b.dataset.envEffects)));
 qa('[data-env-preview]').forEach(b=>b.addEventListener('click',()=>preview(b.dataset.envPreview)));
}
function pause(hidden){document.documentElement.dataset.envPaused=hidden?'true':'false';pool.forEach(p=>{try{p.getAnimations().forEach(a=>hidden?a.pause():a.play())}catch{}});if(hidden){clearTimeout(eventTimer);clearTimeout(eventStopTimer)}else scheduleAmbient(false)}
seasonChoice=safeGet(SEASON_KEY,'auto');effects=safeGet(EFFECTS_KEY,'full');if(!seasons.has(seasonChoice))seasonChoice='auto';if(!modes.has(effects))effects='full';ensureLayer();bindSettings();applySeason(seasonChoice,{persist:false});setEffectsMode(effects,{persist:false});setWorkspace('home');updateStatus();
window.addEventListener('pocket-view-change',e=>setWorkspace(e.detail?.id||'home'));
window.addEventListener('pocket-motion-change',()=>{if(effectiveMode()==='off')stopEffect();else{if(effect)animatePool(effect);scheduleAmbient(true)}updateStatus()});
window.addEventListener('resize',()=>{if(effect)animatePool(effect)},{passive:true});
document.addEventListener('visibilitychange',()=>pause(document.hidden));
window.PocketEnvironment={getCurrentSeason,getSeason:()=>season,getSeasonChoice:()=>seasonChoice,getEffectsMode:()=>effects,getEffect:()=>effect,getWind:()=>wind,setSeason:applySeason,setEffectsMode,startEffect,stopEffect,setWind,setWeather,preview,setWorkspace,getStatus:()=>({season,seasonChoice,effects,effectiveMode:effectiveMode(),effect,wind,quality:quality(),particles:effect?countFor(effect):0,workspace})};
})();
