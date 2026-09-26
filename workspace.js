const q=id=>document.getElementById(id);
const openPocketDialog=(dialog,opener,focusSelector='')=>{
 if(!dialog)return false;
 if(window.PocketDialog?.open)return window.PocketDialog.open(dialog,opener||document.activeElement,focusSelector);
 if(dialog.showModal&&!dialog.open)dialog.showModal();else if(!dialog.open)dialog.setAttribute('open','');
 if(focusSelector)requestAnimationFrame(()=>dialog.querySelector(focusSelector)?.focus());
 return true;
};
const safeGet=(k,f='')=>{try{return localStorage.getItem(k)||f}catch{return f}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const go=id=>window.PocketNav?.show?.(id)??false;

function greeting(){
 const el=q('homeGreeting');if(!el)return;
 const h=new Date().getHours(),word=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
 el.textContent=word+' ✨';
}
const THEME_CHOICES=new Set(['light','dark','sakura','green','oled']);
const MOTION_CHOICES=new Set(['full','gentle','off']);
const THEME_COLORS={light:'#f7f8ff',dark:'#212121',sakura:'#fff5fa',green:'#f0fff6',oled:'#000000'};
let themeTransitionTimer=0;
function normalizeSavedTheme(value){
  if(value==='system'){
    const resolved=window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark':'light';
    safeSet('pocket-theme',resolved);
    return resolved;
  }
  return THEME_CHOICES.has(value)?value:'light';
}
function setTheme(t,{persist=true}={}){
  const choice=normalizeSavedTheme(t);
  const root=document.documentElement;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(root.dataset.theme&&root.dataset.theme!==choice&&root.dataset.motion!=='off'&&!reduced){
    clearTimeout(themeTransitionTimer);
    root.classList.add('theme-switching');
    themeTransitionTimer=setTimeout(()=>root.classList.remove('theme-switching'),260);
  }
  root.dataset.theme=choice;
  root.dataset.themeChoice=choice;
  root.style.colorScheme=(choice==='dark'||choice==='oled')?'dark':'light';
  if(persist)safeSet('pocket-theme',choice);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',THEME_COLORS[choice]||THEME_COLORS.light);
  document.querySelectorAll('[data-theme-choice]').forEach(b=>{
    const active=b.dataset.themeChoice===choice;
    b.classList.toggle('active',active);
    b.setAttribute('aria-pressed',active?'true':'false');
  });
  window.dispatchEvent(new CustomEvent('pocket-theme-change',{detail:{theme:choice,choice}}));
}
window.PocketTheme={
  apply:setTheme,
  get:()=>document.documentElement.dataset.theme||'light',
  getChoice:()=>document.documentElement.dataset.themeChoice||'light'
};
function setMotion(m){
 const choice=MOTION_CHOICES.has(m)?m:'full';
 const root=document.documentElement;
 root.dataset.motion=choice;
 root.classList.toggle('motion-off',choice==='off');
 safeSet('pocket-motion',choice);
 document.querySelectorAll('[data-motion]').forEach(b=>{const on=b.dataset.motion===choice;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
 window.dispatchEvent(new CustomEvent('pocket-motion-change',{detail:{motion:choice}}));
}

const POCKET_BUILD='step39-theme-motion-fix';
function standaloneMode(){return !!(window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true)}
async function getDiagnostics(){
 let sw='Unavailable';
 if('serviceWorker' in navigator){
  try{
   const reg=await navigator.serviceWorker.getRegistration();
   sw=reg?.installing?'Updating':reg?.waiting?'Update ready':navigator.serviceWorker.controller?'Active':reg?.active?'Active (not controlling)':'Not active';
  }catch{sw='Unavailable'}
 }
 return {
  'Build':POCKET_BUILD,
  'Service Worker':sw,
  'Network':navigator.onLine===false?'Offline':'Online',
  'Mode':standaloneMode()?'Installed PWA':'Browser',
  'Device':/iPhone|iPad|iPod/i.test(navigator.userAgent)?'iPhone/iPad':/Android/i.test(navigator.userAgent)?'Android':'Desktop / other'
 };
}
async function renderDiagnostics(){
 const box=q('diagnosticsList');if(!box)return;
 const data=await getDiagnostics();
 box.replaceChildren(...Object.entries(data).map(([key,value])=>{
  const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=key;dd.textContent=value;row.append(dt,dd);return row;
 }));
}
async function copyDiagnostics(){
 const data=await getDiagnostics(),text=Object.entries(data).map(([k,v])=>k+': '+v).join('\n');
 try{await navigator.clipboard.writeText(text);if(q('diagnosticsStatus'))q('diagnosticsStatus').textContent='Diagnostics copied.'}
 catch{
  const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');if(q('diagnosticsStatus'))q('diagnosticsStatus').textContent='Diagnostics copied.'}catch{if(q('diagnosticsStatus'))q('diagnosticsStatus').textContent='Copy failed.'}
  ta.remove();
 }
}
async function refreshPocketAppFiles(){
 const btn=q('refreshAppFiles'),status=q('diagnosticsStatus');
 if(navigator.onLine===false){
  if(status)status.textContent='You are offline. Reconnect before refreshing app files.';
  return;
 }
 if(btn)btn.disabled=true;
 if(status)status.textContent='Refreshing Pocket AI app files…';
 try{
  if('caches' in window){
   const keys=await caches.keys();
   await Promise.all(keys.filter(key=>key.startsWith('pocket-ai-web-shell-')||key==='pocket-ai-web-step1-css').map(key=>caches.delete(key)));
  }
  if('serviceWorker' in navigator){
   const reg=await navigator.serviceWorker.getRegistration();
   try{await reg?.update()}catch{}
  }
  const url=new URL(location.href);url.searchParams.set('v','step39-refresh-'+Date.now());location.replace(url.toString());
 }catch{
  if(status)status.textContent='Could not refresh app files. Check your connection and try again.';
  if(btn)btn.disabled=false;
 }
}

const modeText={balanced:'Uses Local AI first; web tools only when you open them.',private:'Local AI only for AI tasks. No account login required.',offline:'Cached app + Local AI + local files. Web tools need internet.'};
function setPrivacy(m){
 safeSet('pocket-privacy',m);
 document.querySelectorAll('[data-privacy],[data-privacy-setting]').forEach(b=>{
   const v=b.dataset.privacy||b.dataset.privacySetting;
   const on=v===m;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');
 });
 const hint=q('modeHint');if(hint)hint.textContent=modeText[m]||modeText.balanced;
}

greeting();setTheme(normalizeSavedTheme(safeGet('pocket-theme','light')),{persist:true});setMotion(safeGet('pocket-motion','full'));setPrivacy(safeGet('pocket-privacy','balanced'));
document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeChoice));
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));
q('copyDiagnostics')?.addEventListener('click',copyDiagnostics);
q('refreshAppFiles')?.addEventListener('click',refreshPocketAppFiles);
const settingsDialog=q('settingsDialog');
if(settingsDialog){
 const settingsOpenObserver=new MutationObserver(()=>{if(settingsDialog.open)renderDiagnostics()});
 settingsOpenObserver.observe(settingsDialog,{attributes:true,attributeFilter:['open']});
}
window.addEventListener('online',renderDiagnostics);window.addEventListener('offline',renderDiagnostics);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderDiagnostics()});
renderDiagnostics();
document.querySelectorAll('[data-privacy-setting],[data-privacy]').forEach(b=>b.onclick=()=>setPrivacy(b.dataset.privacySetting||b.dataset.privacy));

document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
   const d=q('commandDialog');if(!d)return;
   e.preventDefault();openPocketDialog(d,document.activeElement,'#commandSearch');
 }
});
if(q('commandSearch'))q('commandSearch').oninput=e=>{const s=e.target.value.toLowerCase();q('commandList')?.querySelectorAll('button').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(s));};
function focusCommandDestination(name){
 const map={chat:'#prompt',local:'#localSetup',files:'#fileInput',github:'#ghQuery',research:'#surfaceQuery'};
 const target=q('commandDialog')?.ownerDocument.querySelector(map[name]||'');
 if(target)requestAnimationFrame(()=>target.focus({preventScroll:true}));
}
function command(name){
  const commandDialog=q('commandDialog');
  const rootOpener=commandDialog?.__pocketOpener||q('settingsOpen');
  if(commandDialog){commandDialog.__pocketOpener=null;commandDialog.close()}
  if(name==='settings'){openPocketDialog(q('settingsDialog'),rootOpener);return}
  if(name==='research'){
    go('surface');
    setTimeout(()=>{if(q('surfaceMode'))q('surfaceMode').value='research';q('surfaceQuery')?.focus()},100);
    return;
  }
  if(!go(name)){q('notice').textContent='That workspace is still loading. Try again in a moment.';return}
  focusCommandDestination(name);
}
document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>command(b.dataset.command));

if(q('homeComposer'))q('homeComposer').onsubmit=e=>{
 e.preventDefault();const hp=q('homePrompt'),text=hp?.value.trim()||'';if(!text)return;
 go('chat');if(q('prompt'))q('prompt').value=text;if(hp)hp.value='';
 setTimeout(()=>q('chatForm')?.requestSubmit?.(q('chatSend')),80);addRecent('💬',text,'chat');
};

const REC='pocket-recent-v2';
function recent(){try{const a=JSON.parse(localStorage.getItem(REC)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
function addRecent(icon,title,target,type){const clean=String(title||'').trim();if(!clean)return;const arr=[{icon,title:clean.slice(0,80),target,type:type||recentType(target),time:Date.now()},...recent().filter(x=>!(x.title===clean&&x.target===target))].slice(0,20);safeSet(REC,JSON.stringify(arr));renderRecent()}
function recentType(target){return target==='chat'?'Chat':target==='coding'?'Code':target==='files'?'File':target==='surface'?'Research':target==='home'?'Project':'Activity'}
function recentIcon(target){return target==='chat'?'💬':target==='coding'?'💻':target==='files'?'📄':target==='surface'?'🔎':target==='home'?'▦':'•'}
function recentTime(t){const d=Number(t)||0;if(!d)return'Recent';const diff=Date.now()-d,m=Math.max(0,Math.floor(diff/60000));if(m<1)return'Just now';if(m<60)return m+' min ago';const h=Math.floor(m/60);if(h<24)return h+' hr ago';if(h<48)return'Yesterday';return new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function combinedRecent(){
 const items=[...recent()];
 try{const chats=JSON.parse(localStorage.getItem('pocket-v3-chats')||'[]');if(Array.isArray(chats))chats.forEach(x=>{if((x.messages?.length||0)>0)items.push({icon:'💬',title:x.title||'Chat',target:'chat',type:'Chat',time:x.updated||x.created||0})})}catch{}
 try{const research=JSON.parse(localStorage.getItem('pocket-v3-research')||'[]');if(Array.isArray(research))research.forEach(x=>items.push({icon:'🔎',title:x.q||'Research',target:'surface',type:'Research',time:x.time||0}))}catch{}
 const seen=new Set();return items.sort((a,b)=>(Number(b.time)||0)-(Number(a.time)||0)).filter(x=>{const k=(x.target||'')+'|'+(x.title||'');if(seen.has(k))return false;seen.add(k);return true})
}
function renderRecent(limit=5){
 const box=q('recentActivity');if(!box)return;
 const arr=combinedRecent();
 const head=q('home')?.querySelector('.home-recent .recent-view-all');
 if(!arr.length){
   box.className='recent-list is-empty';
   box.innerHTML='<div class="recent-empty"><strong>No adventures yet.</strong><span>Start a chat, research something, or open a file.</span><button type="button" class="recent-start">Start chatting</button></div>';
   box.querySelector('.recent-start').onclick=()=>go('chat');
   if(head)head.hidden=true;
   return;
 }
 box.className='recent-list has-items';
 const shown=arr.slice(0,limit);
 box.innerHTML='<div class="recent-rows">'+shown.map((x,i)=>'<button type="button" class="recent-row" data-recent-index="'+i+'"><span class="recent-icon"></span><span class="recent-copy"><strong></strong><small>'+(x.type||recentType(x.target))+'</small></span><span class="recent-kind">'+(x.type||recentType(x.target))+'</span><time>'+recentTime(x.time)+'</time><b aria-hidden="true">→</b></button>').join('')+'</div>';
 box.querySelectorAll('[data-recent-index]').forEach((b,i)=>{b.querySelector('.recent-copy strong').textContent=shown[i].title||'Recent item';b.dataset.recentType=shown[i].type||recentType(shown[i].target);b.onclick=()=>go(shown[i].target||'home')});
 if(head){head.hidden=arr.length<=limit;head.onclick=()=>renderRecent(Math.min(10,arr.length))}
}
renderRecent();
q('chatForm')?.addEventListener('submit',()=>{const t=q('prompt')?.value.trim()||'';if(t){addRecent('💬',t,'chat','Chat');recordProgressionAction('chat')}},true);
q('deepResearch')?.addEventListener('click',()=>{const t=q('surfaceQuery')?.value.trim()||'';if(t){addRecent('🔎',t,'surface','Research');recordProgressionAction('research')}},true);
q('fileInput')?.addEventListener('change',()=>{const file=q('fileInput')?.files?.[0];if(file)addRecent('📄',file.name,'files','File')},true);
document.addEventListener('click',e=>{const p=e.target.closest?.('#projectGrid .project-card');if(p){const name=p.querySelector('strong')?.textContent?.trim();if(name)addRecent('▦',name,'home','Project')}},true);


/* STEP 5 — Pocket progression: cosmetic only; never gates app functionality. */
const PROGRESSION_KEY='pocket-progression-v1';
const XP_PER_LEVEL=100;
const DISPLAY_LEVEL_CAP=20;
const QUESTS={
 chat:{reward:20},
 research:{reward:30},
 make:{reward:30}
};
const ACTION_REWARDS={
 chat:{xp:10,cooldown:5*60*1000},
 research:{xp:20,cooldown:10*60*1000},
 file:{xp:15,cooldown:10*60*1000}
};
function localDayKey(d=new Date()){
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return y+'-'+m+'-'+day;
}
function defaultProgression(){return{xp:0,completedQuests:[],rewardedActions:{},lastQuestReset:localDayKey()}}
function loadProgression(){
 let s=defaultProgression();
 try{
  const raw=JSON.parse(localStorage.getItem(PROGRESSION_KEY)||'null');
  if(raw&&typeof raw==='object'){
   s.xp=Math.max(0,Math.floor(Number(raw.xp)||0));
   s.completedQuests=Array.isArray(raw.completedQuests)?raw.completedQuests.filter(x=>QUESTS[x]):[];
   s.rewardedActions=raw.rewardedActions&&typeof raw.rewardedActions==='object'?raw.rewardedActions:{};
   s.lastQuestReset=typeof raw.lastQuestReset==='string'?raw.lastQuestReset:localDayKey();
  }
 }catch{}
 return s;
}
let progression=loadProgression();
function saveProgression(){
 try{localStorage.setItem(PROGRESSION_KEY,JSON.stringify(progression))}catch{}
}
function currentLevel(total=progression.xp){return Math.floor(Math.max(0,total)/XP_PER_LEVEL)+1}
function displayLevel(total=progression.xp){return Math.min(DISPLAY_LEVEL_CAP,currentLevel(total))}
function currentLevelXP(total=progression.xp){return Math.max(0,total)%XP_PER_LEVEL}
function levelName(level=displayLevel()){
 if(level<=3)return'Curious Pocket';
 if(level<=6)return'Bright Pocket';
 if(level<=10)return'Clever Pocket';
 if(level<=15)return'Explorer Pocket';
 return'Star Pocket';
}
function resetDailyQuestsIfNeeded(){
 const today=localDayKey();
 if(progression.lastQuestReset===today)return false;
 progression.completedQuests=[];
 progression.lastQuestReset=today;
 saveProgression();
 return true;
}
function showXPFeedback(text){
 const el=q('pocketXPToast');if(!el)return;
 el.textContent=text;el.classList.add('is-visible');
 clearTimeout(showXPFeedback._timer);
 showXPFeedback._timer=setTimeout(()=>el.classList.remove('is-visible'),1800);
}
function renderProgression(){
 resetDailyQuestsIfNeeded();
 const level=displayLevel(),isMax=progression.xp>=DISPLAY_LEVEL_CAP*XP_PER_LEVEL,within=isMax?XP_PER_LEVEL:currentLevelXP();
 const inline=q('pocketLevelInline'),levelEl=q('pocketLevel'),xpText=q('pocketXPText'),fill=q('pocketXPFill'),name=q('pocketLevelName');
 if(inline)inline.textContent='• Lv. '+level;
 if(levelEl)levelEl.textContent='Lv. '+level;
 if(xpText)xpText.textContent=isMax?'MAX':within+' / 100 XP';
 if(fill)fill.style.width=within+'%';
 const track=q('pocketXP')?.querySelector('[role="progressbar"]');
 if(track)track.setAttribute('aria-valuenow',String(within));
 if(name)name.textContent=levelName(level);
 q('homeMascot')?.classList.toggle('pocket-level-5',level>=5);
 q('homeMascot')?.classList.toggle('pocket-level-10',level>=10);
 const room=q('pocketRoom');if(room)room.dataset.roomLevel=String(level);
 renderQuests();
}
function awardXP(amount,label=''){
 const add=Math.max(0,Math.floor(Number(amount)||0));if(!add)return false;
 const before=displayLevel();
 progression.xp+=add;
 saveProgression();
 renderProgression();
 const after=displayLevel();
 showXPFeedback((label?label+' ':'')+'+'+add+' XP ✦');
 if(after>before){
  
  setMascotState('excited',2200);
  showPocketSpeech('Level up! ✦',2400);
  spawnPocketParticles('star',4);
  setTimeout(()=>showXPFeedback('Pocket reached Lv. '+displayLevel(),''),250);
  if(crossedRoomDecorThreshold(before,after))setTimeout(roomDecorUnlockedFeedback,650);
 }else 
 return true;
}
function canRewardAction(category,cooldown){
 const last=Number(progression.rewardedActions[category]||0);
 return !last||Date.now()-last>=cooldown;
}
function rewardTimedAction(category){
 const cfg=ACTION_REWARDS[category];if(!cfg||!canRewardAction(category,cfg.cooldown))return false;
 progression.rewardedActions[category]=Date.now();
 saveProgression();
 return awardXP(cfg.xp);
}
function rewardLocalConnection(){
 const today=localDayKey();
 if(progression.rewardedActions.localDay===today)return false;
 progression.rewardedActions.localDay=today;saveProgression();return awardXP(15);
}
function rewardProjectCreation(projectId){
 const key='project:'+String(projectId||'');
 if(!projectId||progression.rewardedActions[key])return false;
 progression.rewardedActions[key]=1;saveProgression();return awardXP(25);
}
function completeQuest(id){
 resetDailyQuestsIfNeeded();
 if(!QUESTS[id]||progression.completedQuests.includes(id))return false;
 progression.completedQuests.push(id);saveProgression();
 awardXP(QUESTS[id].reward,'Quest complete!');
 return true;
}
function renderQuests(){
 const done=new Set(progression.completedQuests);
 document.querySelectorAll('#pocketQuests [data-quest]').forEach(card=>{
  const complete=done.has(card.dataset.quest);
  card.classList.toggle('is-complete',complete);
  const state=card.querySelector('.pocket-quest-state');
  if(state)state.textContent=complete?'✓ Completed':'○ Ready';
 });
}
function recordProgressionAction(kind,detail=''){
 if(kind==='chat'){rewardTimedAction('chat');completeQuest('chat');}
 else if(kind==='research'){rewardTimedAction('research');completeQuest('research');}
 else if(kind==='file'){rewardTimedAction('file');completeQuest('make');}
 else if(kind==='project'){rewardProjectCreation(detail);completeQuest('make');}
 else if(kind==='local'){rewardLocalConnection();}
}
resetDailyQuestsIfNeeded();
renderProgression();
window.PocketProgression={recordAction:recordProgressionAction};

const ROOM_COSMETICS_KEY='pocket-room-cosmetics-v1';
const ROOM_COSMETICS={
 wall:{simple:{level:1},stars:{level:5},moon:{level:12}},
 floor:{plain:{level:1},cloud:{level:8},stars:{level:15}},
 desk:{simple:{level:1},lamp:{level:10},bot:{level:18}}
};
const ROOM_COSMETIC_DEFAULTS={wall:'simple',floor:'plain',desk:'simple'};
const ROOM_DECOR_THRESHOLDS=[5,8,10,12,15,18];
let roomCosmetics={...ROOM_COSMETIC_DEFAULTS};
function validatedRoomCosmetics(raw,level=displayLevel()){
 const out={...ROOM_COSMETIC_DEFAULTS};
 for(const slot of Object.keys(ROOM_COSMETICS)){
  const id=raw&&typeof raw[slot]==='string'?raw[slot]:'';
  const item=ROOM_COSMETICS[slot][id];
  if(item&&item.level<=level)out[slot]=id;
 }
 return out;
}
function loadRoomCosmetics(){
 let raw=null;try{raw=JSON.parse(localStorage.getItem(ROOM_COSMETICS_KEY)||'null')}catch{}
 roomCosmetics=validatedRoomCosmetics(raw);
 applyRoomCosmetics(false);
}
function saveRoomCosmetics(){
 try{localStorage.setItem(ROOM_COSMETICS_KEY,JSON.stringify({wall:roomCosmetics.wall,floor:roomCosmetics.floor,desk:roomCosmetics.desk}))}catch{}
}
function applyRoomCosmetics(save=true){
 const room=q('pocketRoom');if(!room)return;
 roomCosmetics=validatedRoomCosmetics(roomCosmetics);
 room.dataset.roomWall=roomCosmetics.wall;
 room.dataset.roomFloor=roomCosmetics.floor;
 room.dataset.roomDesk=roomCosmetics.desk;
 if(save)saveRoomCosmetics();
 renderRoomCosmeticsPanel();
}
function renderRoomCosmeticsPanel(){
 const level=displayLevel();
 document.querySelectorAll('#roomDecorDialog [data-cosmetic-slot]').forEach(button=>{
  const slot=button.dataset.cosmeticSlot,id=button.dataset.cosmeticId,item=ROOM_COSMETICS[slot]?.[id];
  if(!item)return;
  const locked=item.level>level,selected=roomCosmetics[slot]===id;
  button.disabled=locked;
  button.setAttribute('aria-pressed',String(selected));
  button.classList.toggle('is-selected',selected);
  button.classList.toggle('is-locked',locked);
  const meta=button.querySelector('small'),state=button.querySelector('em');
  if(meta)meta.textContent=locked?'Unlocks at Lv. '+item.level:'Lv. '+item.level;
  if(state)state.textContent=selected?'✓ Selected':locked?'Locked':'Select';
 });
}
function openRoomDecor(){
 renderRoomCosmeticsPanel();
 openPocketDialog(q('roomDecorDialog'),q('roomDecorateOpen'),'.room-cosmetic-option:not([disabled])');
}
q('roomDecorateOpen')?.addEventListener('click',openRoomDecor);
document.querySelectorAll('#roomDecorDialog [data-cosmetic-slot]').forEach(button=>button.addEventListener('click',()=>{
 const slot=button.dataset.cosmeticSlot,id=button.dataset.cosmeticId,item=ROOM_COSMETICS[slot]?.[id];
 if(!item||item.level>displayLevel()||roomCosmetics[slot]===id)return;
 roomCosmetics[slot]=id;applyRoomCosmetics(true);
}));
function crossedRoomDecorThreshold(before,after){
 return ROOM_DECOR_THRESHOLDS.some(level=>before<level&&after>=level);
}
function roomDecorUnlockedFeedback(){
 setMascotState('excited',1800);
 showPocketSpeech('New room decor available ✦',2100);
}
function syncPocketRoom(){
 const room=q('pocketRoom');if(!room)return;
 const h=new Date().getHours();
 room.dataset.roomTime=h<10?'morning':h<17?'day':h<21?'evening':'night';
 room.dataset.roomLevel=String(displayLevel());
}
loadRoomCosmetics();

const STAR_GAME_KEY='pocket-star-game-v1';
const STAR_GAME_SECONDS=20;
let starGame={state:'ready',score:0,timeLeft:STAR_GAME_SECONDS};
let starGameTimer=0,starGameTarget=null;
function loadStarGameBest(){
 let best=0;
 try{
  const raw=JSON.parse(localStorage.getItem(STAR_GAME_KEY)||'null');
  best=Number.parseInt(raw?.best,10);
 }catch{}
 return Number.isFinite(best)?Math.min(999,Math.max(0,best)):0;
}
let starGameBest=loadStarGameBest();
function saveStarGameBest(){
 try{localStorage.setItem(STAR_GAME_KEY,JSON.stringify({best:starGameBest}))}catch{}
}
function renderStarGameHud(){
 if(q('starGameScore'))q('starGameScore').textContent=String(starGame.score);
 if(q('starGameBest'))q('starGameBest').textContent=String(starGameBest);
 if(q('starGameTime'))q('starGameTime').textContent=String(Math.max(0,starGame.timeLeft));
}
function removeStarTarget(){
 if(starGameTarget){starGameTarget.remove();starGameTarget=null}
}
function stopStarGame(resetReady=false){
 if(starGameTimer){clearInterval(starGameTimer);starGameTimer=0}
 removeStarTarget();
 if(resetReady){
  starGame={state:'ready',score:0,timeLeft:STAR_GAME_SECONDS};
  q('starGameReady')?.removeAttribute('hidden');
  if(q('starGameResult'))q('starGameResult').hidden=true;
  renderStarGameHud();
 }
}
function placeStarTarget(focusTarget=false){
 removeStarTarget();
 if(starGame.state!=='playing')return;
 const field=q('starGameField');if(!field)return;
 const target=document.createElement('button');
 target.type='button';target.className='star-game-target';target.setAttribute('aria-label','Catch star');
 target.innerHTML='<span aria-hidden="true"></span>';
 const size=matchMedia('(max-width: 767px)').matches?52:46;
 const hudSafe=12,pad=10;
 const maxX=Math.max(pad,field.clientWidth-size-pad);
 const minY=44,maxY=Math.max(minY,field.clientHeight-size-pad);
 target.style.left=Math.round(pad+Math.random()*(maxX-pad))+'px';
 target.style.top=Math.round(minY+Math.random()*(maxY-minY))+'px';
 target.addEventListener('click',event=>{
  if(starGame.state!=='playing')return;
  const keyboard=event.detail===0;
  starGame.score+=1;renderStarGameHud();placeStarTarget(keyboard);
 });
 field.appendChild(target);starGameTarget=target;
 if(focusTarget)requestAnimationFrame(()=>target.focus());
}
function finishStarGame(){
 if(starGame.state!=='playing')return;
 if(starGameTimer){clearInterval(starGameTimer);starGameTimer=0}
 removeStarTarget();starGame.state='finished';starGame.timeLeft=0;
 const isBest=starGame.score>starGameBest;
 if(isBest){starGameBest=Math.min(999,starGame.score);saveStarGameBest()}
 
 renderStarGameHud();
 if(q('starGameReady'))q('starGameReady').hidden=true;
 const result=q('starGameResult');if(result)result.hidden=false;
 if(q('starGameResultText'))q('starGameResultText').textContent='You caught '+starGame.score+' '+(starGame.score===1?'star.':'stars.');
 if(q('starGameBestMessage'))q('starGameBestMessage').textContent=isBest?'New best! ✦':starGame.score>=10?'Amazing! ✦':'Nice catching!';
 setMascotState(starGame.score>=10?'excited':'happy',1800);
 showPocketSpeech(starGame.score>=10?'Amazing! ✦':'Nice catching!',1800);
}
function startStarGame(){
 stopStarGame(false);
 starGame={state:'playing',score:0,timeLeft:STAR_GAME_SECONDS};
 if(q('starGameReady'))q('starGameReady').hidden=true;
 if(q('starGameResult'))q('starGameResult').hidden=true;
 renderStarGameHud();placeStarTarget(false);
 setMascotState('excited',900);showPocketSpeech("Let's play! ✦",1200);
 starGameTimer=setInterval(()=>{
  if(starGame.state!=='playing'){stopStarGame(false);return}
  starGame.timeLeft=Math.max(0,starGame.timeLeft-1);renderStarGameHud();
  if(starGame.timeLeft===0)finishStarGame();
 },1000);
}
function openStarGame(){
 stopStarGame(true);starGameBest=loadStarGameBest();renderStarGameHud();
 openPocketDialog(q('starGameDialog'),q('roomPlayOpen'),'#starGameStart');
}
q('roomPlayOpen')?.addEventListener('click',openStarGame);
q('starGameStart')?.addEventListener('click',startStarGame);
q('starGameAgain')?.addEventListener('click',startStarGame);
q('starGameClose')?.addEventListener('click',()=>q('starGameDialog')?.close());
q('starGameDialog')?.addEventListener('close',()=>stopStarGame(true));
q('starGameDialog')?.addEventListener('cancel',()=>stopStarGame(true));
addEventListener('pagehide',()=>stopStarGame(false));
const ROOM_REACTIONS={
 chat:{state:'happy',speech:"Let's talk! ✦",target:'chat'},
 research:{state:'thinking',speech:"Let's explore!",target:'surface'},
 files:{state:'curious',speech:"Let's look inside!",target:'files'},
 coding:{state:'excited',speech:"Let's build!",target:'coding'}
};
document.querySelectorAll('#pocketRoom [data-room-action]').forEach(button=>{
 button.addEventListener('click',()=>{
  const action=button.dataset.roomAction,cfg=ROOM_REACTIONS[action];if(!cfg)return;
  
  button.classList.remove('room-object-react');void button.offsetWidth;button.classList.add('room-object-react');
  setTimeout(()=>button.classList.remove('room-object-react'),260);
  setMascotState(cfg.state==='curious'?'surprised':cfg.state,650);
  showPocketSpeech(cfg.speech,900);
  const navigate=()=>{if(action==='research'){go('surface');if(q('surfaceMode'))q('surfaceMode').value='research';}else go(cfg.target)};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const delay=motionMode()==='off'||reduced?0:140;
  if(delay)setTimeout(navigate,delay);else navigate();
 });
});
syncPocketRoom();


const PROJ='pocket-projects-v2';
function projects(){try{const a=JSON.parse(localStorage.getItem(PROJ)||'null');return Array.isArray(a)?a:[]}catch{return[]}}
function saveProjects(a){safeSet(PROJ,JSON.stringify(a));renderProjects()}
function projectTime(t){if(!t)return'';const m=Math.max(0,Math.floor((Date.now()-t)/60000));if(m<1)return'Updated just now';if(m<60)return'Updated '+m+' min ago';const h=Math.floor(m/60);if(h<24)return'Updated '+h+' hr ago';if(h<48)return'Updated yesterday';return'Updated '+new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function createProject(){
 const name=prompt('Project name');if(!name?.trim())return;
 const a=projects(),project={id:Date.now().toString(36),emoji:'✨',name:name.trim().slice(0,50),note:'Personal workspace',updated:Date.now(),items:{chats:[],files:[],code:[],research:[],notes:[]}};
 a.unshift(project);
 saveProjects(a);
 recordProgressionAction('project',project.id);
}
function openProject(x){
 const a=projects(),i=a.findIndex(p=>(p.id&&p.id===x.id)||p.name===x.name);
 if(i>=0){a[i]={...a[i],updated:Date.now(),items:a[i].items||{chats:[],files:[],code:[],research:[],notes:[]}};safeSet(PROJ,JSON.stringify(a))}
 addRecent(x.emoji||'▦',x.name,'home','Project');
 go('chat');if(q('prompt')){q('prompt').value='Project: '+x.name+'\n';q('prompt').focus()}
}
function renderProjects(limit=3){
 const section=document.querySelector('#home .home-projects'),grid=q('projectGrid'),create=q('newProject');if(!section||!grid)return;
 let head=section.querySelector('.project-head');
 if(!head){const h=section.querySelector(':scope>h2');head=document.createElement('div');head.className='project-head';head.innerHTML='<h2>Projects</h2><button type="button" class="project-view-all">View all →</button>';h?.replaceWith(head)}
 const arr=projects();
 if(!arr.length){
  grid.className='project-grid is-empty';
  grid.innerHTML='<div class="project-empty"><span class="friendly-empty-icon" aria-hidden="true">◇</span><strong>Nothing here yet</strong><p>Create your first project and keep everything together.</p><button type="button" class="project-create">Create project</button></div>';
  grid.querySelector('.project-create').onclick=createProject;
  head.querySelector('.project-view-all').hidden=true;
  if(create)create.hidden=true;
  return;
 }
 grid.className='project-grid has-items';
 const shown=arr.slice(0,limit);
 grid.replaceChildren(...shown.map(x=>{const b=document.createElement('button');b.type='button';b.className='project-card';b.innerHTML='<span class="emoji"></span><span class="project-copy"><strong></strong><small></small><em></em></span><span class="project-arrow">→</span>';b.querySelector('.emoji').textContent=x.emoji||'▦';b.querySelector('strong').textContent=x.name;b.querySelector('small').textContent=x.note||'Project workspace';b.querySelector('em').textContent=projectTime(x.updated);b.onclick=()=>openProject(x);return b}));
 const view=head.querySelector('.project-view-all');view.hidden=arr.length<=limit;view.onclick=()=>renderProjects(arr.length);
 if(create){create.hidden=false;create.textContent='＋ New project';create.onclick=createProject}
}
renderProjects();
if(q('newProject'))q('newProject').onclick=createProject;

function syncLocalHome(){
 const status=q('homeAiStatus'),pill=q('home')?.querySelector('.home-ai-status'),mood=q('homeMood'),moodText=q('homeMoodText');
 if(!status||!pill)return;
 const ready=!!window.PocketLocalAI?.isConnected?.()||(safeGet('pocket-local-webllm-installed')==='1'&&safeGet('pocket-local-webllm-enabled')==='1');
 const model=window.PocketLocalAI?.model||'';
 pill.classList.toggle('is-ready',ready);
 mood?.classList.toggle('is-ready',ready);
 status.textContent=ready?('Local AI ready'+(model?' · '+model:'')):'Local AI not set up';
 if(moodText)moodText.textContent=ready?'Pocket is ready ✦':'Ready when you are';
 if(ready)setMascotState?.('happy',1400);
}
syncLocalHome();document.querySelectorAll('[data-go="home"],[data-go="local"]').forEach(b=>b.addEventListener('click',()=>setTimeout(syncLocalHome,150)));
const progressionLocalStatus=q('localStatus');
if(progressionLocalStatus){
 let wasLocalConnected=!!window.PocketLocalAI?.isConnected?.();
 const localProgressObserver=new MutationObserver(()=>{
  const now=!!window.PocketLocalAI?.isConnected?.()||q('localStatusCard')?.dataset.state==='connected';
  if(now&&!wasLocalConnected)recordProgressionAction('local');
  wasLocalConnected=now;
 });
 localProgressObserver.observe(progressionLocalStatus,{childList:true,subtree:true,characterData:true});
}

const COMPANION_KEY='pocket-companion-interactions-v1';
const mascotMoods={normal:'Ready',happy:'Happy',excited:'Excited',surprised:'Curious',sleepy:'Sleepy',thinking:'Thinking',wave:'Curious',petted:'Happy',sending:'Excited',local:'Happy',concerned:'Curious',secret:'Excited'};
const tapStates=['happy','excited','surprised','sleepy','thinking','wave'];
const tapMessages=['Hi! ✦','Ready!','What are we making?','Let\'s learn something.','You found me!','Need help?','Let\'s build!','Good to see you.'];
let mascotIdleTimer=0,pressTimer=0,pressStarted=0,pressHandled=false,tapWindow=[];
function motionMode(){return document.documentElement.dataset.motion||'full'}
function setMascotState(state='normal',ms=1800){
 const home=q('homeMascot'),label=q('pocketMoodLabel');if(!home)return;
 home.dataset.mascotState=state;
 if(label)label.textContent=mascotMoods[state]||'Ready';
 clearTimeout(setMascotState._timer);
 if(ms>0)setMascotState._timer=setTimeout(()=>{home.dataset.mascotState='normal';if(label)label.textContent='Ready'},ms);
}
function mascot(state='normal',ms=1800){setMascotState(state,ms)}
function showPocketSpeech(text,ms=2400){
 const b=q('pocketSpeech');if(!b)return;
 b.textContent=text;b.classList.add('is-visible');
 clearTimeout(showPocketSpeech._timer);
 showPocketSpeech._timer=setTimeout(()=>b.classList.remove('is-visible'),ms);
}
function spawnPocketParticles(kind='star',count=3){
 if(motionMode()==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const box=q('pocketParticles');if(!box)return;
 const limit=motionMode()==='gentle'?Math.min(count,2):count;
 for(let i=0;i<limit;i++){
   const p=document.createElement('i');p.className='pocket-particle '+(kind==='heart'?'heart':'star');p.setAttribute('aria-hidden','true');
   const a=(Math.PI*2*i/limit)-Math.PI/2+(Math.random()-.5)*.6,r=36+Math.random()*20;
   p.style.setProperty('--px',Math.cos(a)*r+'px');p.style.setProperty('--py',Math.sin(a)*r+'px');
   box.appendChild(p);setTimeout(()=>p.remove(),1100);
 }
}
function bumpPocketInteractions(){
 let n=parseInt(safeGet(COMPANION_KEY,'0'),10);if(!Number.isFinite(n))n=0;safeSet(COMPANION_KEY,String(n+1));
}
function scheduleMascotIdle(){
 clearTimeout(mascotIdleTimer);
 mascotIdleTimer=setTimeout(()=>{
   const home=q('home'),prompt=q('homePrompt');
   if(!home?.classList.contains('active')||prompt===document.activeElement||prompt?.value?.trim()){scheduleMascotIdle();return}
   const state=Math.random()<.5?'thinking':'sleepy';setMascotState(state,1800);
   scheduleMascotIdle();
 },20000+Math.floor(Math.random()*20000));
}
function checkMascotSecret(){
 const now=Date.now();tapWindow=tapWindow.filter(t=>now-t<4000);tapWindow.push(now);
 if(tapWindow.length>=7){
   tapWindow=[];setMascotState('secret',1200);showPocketSpeech('You found my secret! ✦',2600);spawnPocketParticles('star',4);return true;
 }
 return false;
}
let mascotRunAnimation=null,mascotRunLocked=false;
function runPocketMascot(){
 const source=q('homeMascot'),room=q('pocketRoom');
 if(!source||!room||mascotRunLocked||motionMode()==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
 const sourceRect=source.getBoundingClientRect(),roomRect=room.getBoundingClientRect();
 const maxX=Math.max(0,roomRect.width-sourceRect.width-20),maxY=Math.max(0,roomRect.height-sourceRect.height-28);
 const startX=sourceRect.left-roomRect.left,startY=sourceRect.top-roomRect.top;
 const points=[0,1,2].map((_,i)=>{
   const x=10+Math.random()*maxX,y=10+Math.random()*maxY;
   const dx=x-startX,dy=y-startY,flip=i%2===0?1:-1;
   return {transform:`translate(${dx}px,${dy}px) scaleX(${flip}) translateY(${i===1?-7:0}px)`};
 });
 mascotRunLocked=true;source.classList.add('is-game-running');
 mascotRunAnimation=source.animate([
  {transform:'translate(0,0) scaleX(1)',offset:0},
  {...points[0],offset:.3},
  {...points[1],offset:.62},
  {...points[2],offset:.86},
  {transform:'translate(0,0) scaleX(1)',offset:1}
 ],{duration:motionMode()==='gentle'?1050:1450,easing:'cubic-bezier(.2,.75,.25,1)'});
 mascotRunAnimation.finished.catch(()=>{}).finally(()=>{source.classList.remove('is-game-running');mascotRunLocked=false;mascotRunAnimation=null});
 spawnPocketParticles('star',3);
 return true;
}
function runCuteLogo(source){
 if(!source||source.id==='homeMascot')return runPocketMascot();
 if(motionMode()==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
 const rect=source.getBoundingClientRect(),ghost=source.cloneNode(true);
 ghost.removeAttribute('id');ghost.removeAttribute('data-mascot');ghost.classList.add('pocket-logo-runner');
 Object.assign(ghost.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',zIndex:'9999',pointerEvents:'none'});
 document.body.appendChild(ghost);
 const distance=Math.max(90,Math.min(innerWidth*.55,360)),dir=rect.left<innerWidth/2?1:-1;
 const animation=ghost.animate([
  {transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1},
  {transform:`translate(${dir*distance*.28}px,-12px) rotate(${dir*8}deg) scale(1.06)`,offset:.3},
  {transform:`translate(${dir*distance*.62}px,3px) rotate(${dir*-5}deg) scale(.98)`,offset:.62},
  {transform:`translate(${dir*distance}px,-8px) rotate(${dir*5}deg) scale(1.03)`,opacity:.9}
 ],{duration:850,easing:'cubic-bezier(.22,.72,.24,1)'});
 animation.finished.catch(()=>{}).finally(()=>ghost.remove());
 return true;
}
document.addEventListener('click',e=>{
 const cute=e.target instanceof Element?e.target.closest('[data-mascot]'):null;
 if(cute&&cute.id!=='homeMascot')runCuteLogo(cute);
},{passive:true});

function pocketTap(){
 runPocketMascot();bumpPocketInteractions();
 if(checkMascotSecret())return;
 const state=tapStates[Math.floor(Math.random()*tapStates.length)];
 setMascotState(state,1700);
 if(state==='happy'||state==='excited')spawnPocketParticles(state==='happy'?'heart':'star',3);
 if(Math.random()<.42)showPocketSpeech(tapMessages[Math.floor(Math.random()*tapMessages.length)],2200);
 scheduleMascotIdle();
}
function pocketPet(){
 pressHandled=true;bumpPocketInteractions();setMascotState('petted',2100);showPocketSpeech(Math.random()<.5?'Hehe ✦':'That tickles!',2200);spawnPocketParticles('heart',4);scheduleMascotIdle();
}
const homeMascot=q('homeMascot');
if(homeMascot){
 homeMascot.addEventListener('click',e=>{if(pressHandled){pressHandled=false;return}pocketTap()});
 homeMascot.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;pressHandled=false;pressStarted=Date.now();homeMascot.setPointerCapture?.(e.pointerId);clearTimeout(pressTimer);pressTimer=setTimeout(()=>pocketPet(),600)});
 const endPress=e=>{clearTimeout(pressTimer);try{homeMascot.releasePointerCapture?.(e.pointerId)}catch{}};
 homeMascot.addEventListener('pointerup',endPress);homeMascot.addEventListener('pointercancel',endPress);homeMascot.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')clearTimeout(pressTimer)});
 homeMascot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pocketTap()}});
}
q('homePrompt')?.addEventListener('focus',()=>clearTimeout(mascotIdleTimer));
q('homePrompt')?.addEventListener('input',()=>clearTimeout(mascotIdleTimer));
q('homePrompt')?.addEventListener('blur',scheduleMascotIdle);
q('homeComposer')?.addEventListener('submit',()=>setMascotState('sending',1800),true);
q('chatForm')?.addEventListener('submit',()=>mascot('sending'));
q('deepResearch')?.addEventListener('click',()=>mascot('thinking',3000));
q('localSend')?.addEventListener('click',()=>mascot('local'));
scheduleMascotIdle();

window.addEventListener('pocket-network-change',event=>{
  if(event.detail?.online){
    const mode=safeGet('pocket-privacy','balanced');
    setPrivacy(mode);
  }else{
    // Network loss is temporary: do not overwrite the user's saved privacy preference.
    const hint=q('modeHint');
    if(hint)hint.textContent='Offline right now. Local AI and local files still work; web tools will resume when internet returns.';
  }
  renderDiagnostics();
});