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
const THEME_CHOICES=new Set(['light','dark','sakura','green','oled','system']);
const MOTION_CHOICES=new Set(['full','gentle','off']);
const THEME_COLORS={light:'#f7f8ff',dark:'#212121',sakura:'#fff5fa',green:'#f0fff6',oled:'#000000'};
const systemThemeQuery=window.matchMedia?.('(prefers-color-scheme: dark)');
let themeTransitionTimer=0;
function normalizeSavedTheme(value){return THEME_CHOICES.has(value)?value:'system'}
function resolveTheme(choice){return choice==='system'?(systemThemeQuery?.matches?'dark':'light'):choice}
function setTheme(t,{persist=true}={}){
  const choice=normalizeSavedTheme(t);
  const resolved=resolveTheme(choice);
  const root=document.documentElement;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(root.dataset.theme&&root.dataset.theme!==resolved&&root.dataset.motion!=='off'&&!reduced){
    clearTimeout(themeTransitionTimer);
    root.classList.add('theme-switching');
    themeTransitionTimer=setTimeout(()=>root.classList.remove('theme-switching'),260);
  }
  root.dataset.theme=resolved;
  root.dataset.themeChoice=choice;
  root.style.colorScheme=(resolved==='dark'||resolved==='oled')?'dark':'light';
  if(persist)safeSet('pocket-theme',choice);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',THEME_COLORS[resolved]||THEME_COLORS.light);
  document.querySelectorAll('[data-theme-choice]').forEach(b=>{
    const active=b.dataset.themeChoice===choice;
    b.classList.toggle('active',active);
    b.setAttribute('aria-pressed',active?'true':'false');
  });
  window.dispatchEvent(new CustomEvent('pocket-theme-change',{detail:{theme:resolved,choice}}));
}
systemThemeQuery?.addEventListener?.('change',()=>{if(safeGet('pocket-theme','system')==='system')setTheme('system',{persist:false})});
window.PocketTheme={
  apply:setTheme,
  get:()=>document.documentElement.dataset.theme||'light',
  getChoice:()=>document.documentElement.dataset.themeChoice||safeGet('pocket-theme','system')
};
function setMotion(m){
 const choice=MOTION_CHOICES.has(m)?m:'full';
 const root=document.documentElement;
 root.dataset.motion=choice;
 root.classList.toggle('motion-off',choice==='off');
 safeSet('pocket-motion',choice);
 document.querySelectorAll('[data-motion]').forEach(b=>{const on=b.dataset.motion===choice;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
 const preview=q('motionPreviewText');if(preview)preview.textContent=choice==='full'?'Full: breathing, blinking, pointer-follow and small reactions.':choice==='gentle'?'Gentle: slow breathing and blinking only.':'Off: Pocket stays completely still.';
 window.dispatchEvent(new CustomEvent('pocket-motion-change',{detail:{motion:choice}}));
}


/* STEP 41 — user-gesture audio. No autoplay retries or background audio. */
const SOUND_KEY='pocket-sound-v1';
let pocketAudioContext=null;
function soundEnabled(){return safeGet(SOUND_KEY,'off')==='on'}
function renderSoundSetting(){
 document.querySelectorAll('[data-sound]').forEach(b=>{const on=b.dataset.sound===(soundEnabled()?'on':'off');b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
 const status=q('soundStatus');if(status)status.textContent=soundEnabled()?'Sound is on. Pocket sounds play after your interaction.':'Sound is off. No Pocket sounds will play.';
}
function getPocketAudioContext(){
 const Ctx=window.AudioContext||window.webkitAudioContext;
 if(!Ctx)return null;
 if(!pocketAudioContext)pocketAudioContext=new Ctx();
 return pocketAudioContext;
}
async function playPocketSound(kind='tap',{force=false}={}){
 if(!force&&!soundEnabled())return false;
 const ctx=getPocketAudioContext();if(!ctx)return false;
 try{
  if(ctx.state==='suspended')await ctx.resume();
  const now=ctx.currentTime;
  if(kind==='laugh'){
   const master=ctx.createGain(),compressor=ctx.createDynamicsCompressor();
   master.gain.setValueAtTime(.0001,now);
   master.gain.exponentialRampToValueAtTime(.16,now+.018);
   master.gain.setValueAtTime(.16,now+.38);
   master.gain.exponentialRampToValueAtTime(.0001,now+.58);
   compressor.threshold.setValueAtTime(-18,now);
   compressor.knee.setValueAtTime(18,now);
   compressor.ratio.setValueAtTime(4,now);
   compressor.attack.setValueAtTime(.003,now);
   compressor.release.setValueAtTime(.12,now);
   master.connect(compressor);compressor.connect(ctx.destination);
   const notes=[
    {f:690,t:0,d:.12,end:860},
    {f:820,t:.13,d:.12,end:1040},
    {f:760,t:.28,d:.1,end:940},
    {f:930,t:.39,d:.13,end:1180}
   ];
   notes.forEach((n,i)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),start=now+n.t;
    osc.type=i%2?'triangle':'sine';
    osc.frequency.setValueAtTime(n.f,start);
    osc.frequency.exponentialRampToValueAtTime(n.end,start+n.d);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(i===3 ? .095 : .082,start+.012);
    gain.gain.setValueAtTime(i===3 ? .095 : .082,start+n.d*.55);
    gain.gain.exponentialRampToValueAtTime(.0001,start+n.d);
    osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+n.d+.02);
    const sparkle=ctx.createOscillator(),sg=ctx.createGain();
    sparkle.type='sine';sparkle.frequency.setValueAtTime(n.f*2,start);
    sparkle.frequency.exponentialRampToValueAtTime(n.end*2,start+n.d);
    sg.gain.setValueAtTime(.0001,start);sg.gain.exponentialRampToValueAtTime(.018,start+.01);sg.gain.exponentialRampToValueAtTime(.0001,start+n.d);
    sparkle.connect(sg);sg.connect(master);sparkle.start(start);sparkle.stop(start+n.d+.02);
    const cleanup=()=>{try{osc.disconnect();gain.disconnect();sparkle.disconnect();sg.disconnect()}catch{}};
    sparkle.addEventListener?.('ended',cleanup,{once:true});
   });
   setTimeout(()=>{try{master.disconnect();compressor.disconnect()}catch{}},720);
   return true;
  }
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  const tones={tap:[520,620,.055],chirp:[720,930,.075],grumble:[185,145,.11],growl:[150,105,.14],happy:[660,880,.09],success:[740,1040,.12],error:[260,210,.12]};
  const [start,end,duration]=tones[kind]||tones.tap;
  osc.type='sine';osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,end),now+duration);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.05,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.02);
  osc.addEventListener?.('ended',()=>{try{osc.disconnect();gain.disconnect()}catch{}},{once:true});
  return true;
 }catch{return false}
}
document.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',async()=>{
 safeSet(SOUND_KEY,b.dataset.sound==='on'?'on':'off');renderSoundSetting();
 if(b.dataset.sound==='on'){const ok=await playPocketSound('happy');if(!ok&&q('soundStatus'))q('soundStatus').textContent='Sound is enabled, but this browser needs another tap before audio can start.'}
}));
q('soundTest')?.addEventListener('click',async()=>{
 if(!soundEnabled()){safeSet(SOUND_KEY,'on');renderSoundSetting()}
 const ok=await playPocketSound('success');
 if(q('soundStatus'))q('soundStatus').textContent=ok?'Sound is working.':'Audio could not start. Tap Test sound again or check Silent Mode / browser audio settings.';
});
q('homeMascot')?.addEventListener('click',()=>{void playPocketSound('happy')});
renderSoundSetting();
async function unlockPocketAudio(){
 const ctx=getPocketAudioContext();if(!ctx)return false;
 try{if(ctx.state==='suspended')await ctx.resume();return ctx.state==='running'}catch{return false}
}
window.PocketSound={
 play:playPocketSound,
 unlock:unlockPocketAudio,
 laugh:async()=>{if(!soundEnabled())return false;await unlockPocketAudio();return playPocketSound('laugh')},
 isEnabled:soundEnabled
};

const POCKET_BUILD='step58-expression-cycle';
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

greeting();setTheme(normalizeSavedTheme(safeGet('pocket-theme','system')),{persist:false});setMotion(safeGet('pocket-motion','full'));setPrivacy(safeGet('pocket-privacy','balanced'));
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
   box.innerHTML='<div class="recent-empty"><span class="friendly-empty-icon" aria-hidden="true">↗</span><strong>No recent activity yet</strong><span>Start with a chat and your recent work will appear here.</span><button type="button" class="recent-start">Start a chat</button></div>';
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
 const inline=q('pocketLevelInline'),sidebarLevel=q('paPocketLevel'),levelEl=q('pocketLevel'),xpText=q('pocketXPText'),fill=q('pocketXPFill'),name=q('pocketLevelName');
 if(inline)inline.textContent='• Lv. '+level;
 if(sidebarLevel)sidebarLevel.textContent='Lv. '+level;
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
  
  window.PocketMascot?.react?.('levelUp');
  showPocketSpeech('Level up! ✦',1800);
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
window.PocketProgression={recordAction:recordProgressionAction,render:renderProgression,getLevel:displayLevel};

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
 window.PocketMascot?.react?.('success');
 showPocketSpeech('New room decor available ✦',1800);
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
 window.PocketMascot?.react?.(starGame.score>=10?'levelUp':'happy');
 showPocketSpeech(starGame.score>=10?'Amazing! ✦':'Nice catching!',1500);
}
function startStarGame(){
 stopStarGame(false);
 starGame={state:'playing',score:0,timeLeft:STAR_GAME_SECONDS};
 if(q('starGameReady'))q('starGameReady').hidden=true;
 if(q('starGameResult'))q('starGameResult').hidden=true;
 renderStarGameHud();placeStarTarget(false);
 setMascotState('excited',700);showPocketSpeech("Let's play! ✦",1000);
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
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
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
 window.PocketMascot?.react?.('success');
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
  grid.innerHTML='<div class="project-empty"><div data-pocket-slot data-pocket-context="projects" data-pocket-size="medium" data-pocket-label="Pocket with a project folder"></div><strong>No projects yet</strong><p>Create your first project to group chats, files, code, and research.</p><button type="button" class="project-create">＋ New project</button></div>';window.PocketMascotViews?.hydrate?.(grid);
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
 if(ready)window.PocketMascot?.react?.('happy');
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
const MASCOT_STATES=new Set(['idle','thinking','happy','success','error','sleep','sleepy','listening','excited','offline','research','study','coding','files','curious','mischievous','annoyed','grumpy','very-annoyed']);
const MASCOT_TASK_STATES=new Set(['thinking','listening','research','study','coding','files']);
const MASCOT_SLEEP_MS=180000;
const mascotMoods={idle:'Ready',thinking:'Thinking',happy:'Happy',success:'Done',error:'Concerned',sleep:'Sleepy',sleepy:'Sleepy',listening:'Listening',excited:'Excited',offline:'Offline',research:'Researching',study:'Studying',coding:'Coding',files:'Files',curious:'Curious',mischievous:'Mischievous',annoyed:'Annoyed',grumpy:'Grumpy','very-annoyed':'Very annoyed'};
const mascotLines={
 friendly:['Hi!','Hehe.','That tickles.'],
 curious:['Hm?','What is it?'],
 annoyed:['Again?','Hey...','Hmph.'],
 very:['Stop poking me.','I\'m watching you.']
};
const mascotBusyReasons=new Set();
let mascotState='idle',mascotStateTimer=0,mascotSleepTimer=0,mascotBlinkTimer=0,mascotLookTimer=0,mascotPointerFrame=0,mascotPointerEvent=null;
let pressTimer=0,pressHandled=false;
let mascotAnnoyance=0,annoyThreshold=4+Math.floor(Math.random()*4),rapidTapCount=0,lastPersonalityTapAt=0,annoyRecoveryTimer=0;

function motionMode(){return document.documentElement.dataset.motion||'full'}
function reducedMotion(){return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches}
function mascotMotionAllowed(){return motionMode()!=='off'&&!reducedMotion()}
function mascotElement(){return q('homeMascot')}
function randomLine(group){const pool=mascotLines[group]||mascotLines.friendly;return pool[Math.floor(Math.random()*pool.length)]}
function annoyanceState(level=mascotAnnoyance){return level>=4?'very-annoyed':level===3?'grumpy':level===2?'annoyed':level===1?'curious':'idle'}
function restingMascotState(){return navigator.onLine===false?'offline':annoyanceState()}
function resetMascotEyes(){
 const home=mascotElement();if(!home)return;
 home.style.setProperty('--pocket-eye-x','0px');home.style.setProperty('--pocket-eye-y','0px');
}
function setMascotState(state='idle',ms=0){
 const home=mascotElement(),label=q('pocketMoodLabel');if(!home)return false;
 const next=MASCOT_STATES.has(state)?state:'idle';
 if(mascotBusyReasons.size&&!MASCOT_TASK_STATES.has(next)&&!['error','success','offline'].includes(next))return false;
 clearTimeout(mascotStateTimer);
 mascotState=next;home.dataset.mascotState=next;home.dataset.pocketState=next;resetMascotEyes();window.dispatchEvent(new CustomEvent('pocket-mascot-state',{detail:{state:next}}));
 if(label)label.textContent=mascotMoods[next]||'Ready';
 if(ms>0)mascotStateTimer=setTimeout(()=>{
   if(mascotBusyReasons.size)return;
   setMascotState(restingMascotState(),0);
 },ms);
 return true;
}
function showPocketSpeech(text,ms=2200){
 const b=q('pocketSpeech');if(!b)return;
 b.textContent=text;b.classList.add('is-visible');
 clearTimeout(showPocketSpeech._timer);
 showPocketSpeech._timer=setTimeout(()=>b.classList.remove('is-visible'),ms);
}
function spawnPocketParticles(kind='star',count=3){
 if(!mascotMotionAllowed())return;
 const box=q('pocketParticles');if(!box)return;
 const limit=motionMode()==='gentle'?Math.min(count,2):Math.min(count,5);
 for(let i=0;i<limit;i++){
   const p=document.createElement('i');p.className='pocket-particle '+(kind==='heart'?'heart':'star');p.setAttribute('aria-hidden','true');
   const a=(Math.PI*2*i/limit)-Math.PI/2+(Math.random()-.5)*.45,r=30+Math.random()*18;
   p.style.setProperty('--px',Math.cos(a)*r+'px');p.style.setProperty('--py',Math.sin(a)*r+'px');
   box.appendChild(p);setTimeout(()=>p.remove(),900);
 }
}
function bumpPocketInteractions(){
 let n=parseInt(safeGet(COMPANION_KEY,'0'),10);if(!Number.isFinite(n))n=0;safeSet(COMPANION_KEY,String(n+1));
}
function clearBlink(){mascotElement()?.classList.remove('is-blinking','is-double-blinking')}
function scheduleBlink(){
 clearTimeout(mascotBlinkTimer);
 if(document.hidden||motionMode()==='off'||reducedMotion())return;
 mascotBlinkTimer=setTimeout(()=>{
   const home=mascotElement();
   if(home&&!['sleep','sleepy'].includes(mascotState)){
     const doubleBlink=Math.random()<.16;
     home.classList.add(doubleBlink?'is-double-blinking':'is-blinking');
     setTimeout(clearBlink,doubleBlink?420:190);
   }
   scheduleBlink();
 },3000+Math.floor(Math.random()*4000));
}
function scheduleIdleLook(){
 clearTimeout(mascotLookTimer);
 if(document.hidden||motionMode()!=='full'||reducedMotion()||matchMedia('(pointer:coarse)').matches)return;
 mascotLookTimer=setTimeout(()=>{
   if(mascotState==='idle'&&!mascotBusyReasons.size){
     const home=mascotElement();
     if(home){
       const dir=Math.random()<.5?-1:1;
       home.style.setProperty('--pocket-eye-x',(dir*(1.2+Math.random()*1.3)).toFixed(1)+'px');
       home.style.setProperty('--pocket-eye-y',(Math.random()*.8-.4).toFixed(1)+'px');
       setTimeout(resetMascotEyes,650+Math.random()*450);
     }
   }
   scheduleIdleLook();
 },8000+Math.floor(Math.random()*7000));
}
function canSleep(){return !mascotBusyReasons.size&&document.visibilityState==='visible'&&navigator.onLine!==false}
function scheduleMascotSleep(){
 clearTimeout(mascotSleepTimer);
 if(motionMode()==='off')return;
 mascotSleepTimer=setTimeout(()=>{if(canSleep())setMascotState('sleep',0);else scheduleMascotSleep()},MASCOT_SLEEP_MS);
}
function wakeMascot(){
 if(['sleep','sleepy'].includes(mascotState)){
   setMascotState(restingMascotState(),0);
   const home=mascotElement();
   if(home&&mascotMotionAllowed()){home.classList.remove('is-waking');void home.offsetWidth;home.classList.add('is-waking');setTimeout(()=>home.classList.remove('is-waking'),650)}
 }
 scheduleMascotSleep();
}
function renderAnnoyance(){
 const home=mascotElement();if(home)home.dataset.pocketAnnoyance=String(mascotAnnoyance);
 document.documentElement.dataset.pocketAnnoyance=String(mascotAnnoyance);
}
function scheduleAnnoyanceRecovery(){
 clearTimeout(annoyRecoveryTimer);
 if(mascotAnnoyance<=0)return;
 const delay=5000+Math.floor(Math.random()*10001);
 annoyRecoveryTimer=setTimeout(()=>{
   if(document.hidden){scheduleAnnoyanceRecovery();return}
   mascotAnnoyance=Math.max(0,mascotAnnoyance-1);renderAnnoyance();
   if(!mascotBusyReasons.size)setMascotState(restingMascotState(),mascotAnnoyance?1000:550);
   if(mascotAnnoyance>0){annoyRecoveryTimer=setTimeout(function step(){mascotAnnoyance=Math.max(0,mascotAnnoyance-1);renderAnnoyance();if(!mascotBusyReasons.size)setMascotState(restingMascotState(),mascotAnnoyance?900:450);if(mascotAnnoyance>0)annoyRecoveryTimer=setTimeout(step,1800)},1800)}
   else{rapidTapCount=0;annoyThreshold=4+Math.floor(Math.random()*4)}
 },delay);
}
function setAnnoyance(level,{speak=false}={}){
 mascotAnnoyance=Math.max(0,Math.min(4,Number(level)||0));renderAnnoyance();
 if(!mascotBusyReasons.size)setMascotState(restingMascotState(),mascotAnnoyance?900:450);
 if(speak){
   const group=mascotAnnoyance>=4?'very':mascotAnnoyance>=2?'annoyed':mascotAnnoyance===1?'curious':'friendly';
   showPocketSpeech(randomLine(group),1500);
 }
 scheduleAnnoyanceRecovery();return mascotAnnoyance;
}
function calmAnnoyance(full=false){
 clearTimeout(annoyRecoveryTimer);
 mascotAnnoyance=full?0:Math.max(0,mascotAnnoyance-1);rapidTapCount=full?0:rapidTapCount;renderAnnoyance();
 if(full)annoyThreshold=4+Math.floor(Math.random()*4);
 if(!mascotBusyReasons.size)setMascotState(restingMascotState(),0);
 if(mascotAnnoyance>0)scheduleAnnoyanceRecovery();
 return mascotAnnoyance;
}
function triggerCuteChomp(){
 if(!mascotMotionAllowed())return;
 document.querySelectorAll('[data-pocket-character]').forEach(el=>{el.classList.remove('is-pocket-chomp');void el.offsetWidth;el.classList.add('is-pocket-chomp');setTimeout(()=>el.classList.remove('is-pocket-chomp'),320)});
}
function runAwayAnnoyed(){
 if(motionMode()==='off'||reducedMotion()||mascotBusyReasons.size)return false;
 setTimeout(()=>window.PocketMascotViews?.dashAway?.(),140);return true;
}
function handleMascotTap(){
 const now=Date.now(),delta=lastPersonalityTapAt?now-lastPersonalityTapAt:Infinity;lastPersonalityTapAt=now;
 bumpPocketInteractions();wakeMascot();
 if(mascotBusyReasons.size)return false;
 const home=mascotElement();
 if(home&&mascotMotionAllowed()){home.classList.remove('is-tap-reacting');void home.offsetWidth;home.classList.add('is-tap-reacting');setTimeout(()=>home.classList.remove('is-tap-reacting'),620)}

 if(delta>1800){
   rapidTapCount=1;
   if(mascotAnnoyance>0)mascotAnnoyance=Math.max(0,mascotAnnoyance-1);
   renderAnnoyance();
   setMascotState('happy',650);
   if(Math.random()<.46)showPocketSpeech(randomLine('friendly'),1400);
   spawnPocketParticles(Math.random()<.45?'heart':'star',2);
   void window.PocketSound?.play?.('chirp');
   scheduleAnnoyanceRecovery();
   return true;
 }

 rapidTapCount++;
 if(rapidTapCount<3){
   const playful=rapidTapCount===2&&Math.random()<.05;
   setMascotState(playful?'mischievous':'happy',playful?760:520);spawnPocketParticles('star',1);void window.PocketSound?.play?.('chirp');return true;
 }
 if(rapidTapCount<annoyThreshold){
   setAnnoyance(1,{speak:rapidTapCount===3});void window.PocketSound?.play?.('tap');return true;
 }
 const level=Math.min(4,2+Math.floor((rapidTapCount-annoyThreshold)/2));
 const changed=level>mascotAnnoyance;setAnnoyance(Math.max(level,mascotAnnoyance),{speak:changed||Math.random()<.3});
 if(mascotAnnoyance>=4){
   void window.PocketSound?.play?.('growl');
   if(Math.random()<.48)triggerCuteChomp();
   if(Math.random()<.68)runAwayAnnoyed();
 }else if(mascotAnnoyance>=2)void window.PocketSound?.play?.('grumble');
 return true;
}
function setMascotBusy(reason,on,state='thinking'){
 const key=String(reason||'task');
 if(on){mascotBusyReasons.add(key);setMascotState(state,0);wakeMascot()}
 else{mascotBusyReasons.delete(key);if(!mascotBusyReasons.size&&MASCOT_TASK_STATES.has(mascotState))setMascotState(restingMascotState(),0)}
}
function reactMascot(kind='tap'){
 const home=mascotElement();if(!home)return false;
 if(kind==='tap')return handleMascotTap();
 if(kind==='success'){
   calmAnnoyance(true);setMascotState('success',900);spawnPocketParticles('star',3);void window.PocketSound?.play?.('success');return true;
 }
 if(kind==='error'){setMascotState('error',950);void window.PocketSound?.play?.('error');return true}
 if(kind==='levelUp'){
   setMascotState('excited',1400);spawnPocketParticles('star',4);
   const xp=q('pocketXP');xp?.classList.add('is-level-up');setTimeout(()=>xp?.classList.remove('is-level-up'),1200);return true;
 }
 if(kind==='happy'){setMascotState('happy',750);spawnPocketParticles('star',2);return true}
 if(kind==='curious'){setMascotState('curious',700);return true}
 if(kind==='movement'){
   if(mascotBusyReasons.size||mascotAnnoyance>=2)return false;
   setMascotState(mascotAnnoyance===1?'curious':'happy',420);return true;
 }
 return false;
}
function lookMascotToward(clientX,clientY,temporary=false){
 const home=mascotElement();if(!home||motionMode()!=='full'||reducedMotion()||['sleep','sleepy'].includes(mascotState))return;
 const rect=home.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height*.46;
 const dx=clientX-cx,dy=clientY-cy,len=Math.max(1,Math.hypot(dx,dy)),max=2.5;
 home.style.setProperty('--pocket-eye-x',(dx/len*max).toFixed(2)+'px');
 home.style.setProperty('--pocket-eye-y',(dy/len*Math.min(max,1.8)).toFixed(2)+'px');
 if(temporary)setTimeout(resetMascotEyes,520);
}
function pocketTap(){return handleMascotTap()}
function pocketPet(){
 pressHandled=true;bumpPocketInteractions();wakeMascot();calmAnnoyance(false);setMascotState('happy',950);showPocketSpeech(randomLine('friendly'),1500);spawnPocketParticles('heart',3);void window.PocketSound?.play?.('chirp')
}

const homeMascot=q('homeMascot');
if(homeMascot){
 homeMascot.dataset.mascotState='idle';renderAnnoyance();
 homeMascot.addEventListener('click',()=>{if(pressHandled){pressHandled=false;return}pocketTap()});
 homeMascot.addEventListener('pointerdown',e=>{
   if(e.button!==undefined&&e.button!==0)return;
   pressHandled=false;wakeMascot();
   if(e.pointerType!=='mouse')lookMascotToward(e.clientX,e.clientY,true);
   homeMascot.setPointerCapture?.(e.pointerId);clearTimeout(pressTimer);pressTimer=setTimeout(()=>pocketPet(),650);
 });
 const endPress=e=>{clearTimeout(pressTimer);try{homeMascot.releasePointerCapture?.(e.pointerId)}catch{}};
 homeMascot.addEventListener('pointerup',endPress);homeMascot.addEventListener('pointercancel',endPress);homeMascot.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')clearTimeout(pressTimer)});
 homeMascot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pocketTap()}});
}
document.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'||matchMedia('(pointer:coarse)').matches||motionMode()!=='full'||reducedMotion()||document.hidden)return;
 mascotPointerEvent=e;if(mascotPointerFrame)return;
 mascotPointerFrame=requestAnimationFrame(()=>{mascotPointerFrame=0;const ev=mascotPointerEvent;mascotPointerEvent=null;if(ev&&['idle','happy','curious','mischievous'].includes(mascotState))lookMascotToward(ev.clientX,ev.clientY,false)});
},{passive:true});
document.addEventListener('pointerdown',wakeMascot,{passive:true});
document.addEventListener('keydown',wakeMascot,{passive:true});
if(!('PointerEvent' in window))document.addEventListener('touchstart',wakeMascot,{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){clearTimeout(mascotBlinkTimer);clearTimeout(mascotLookTimer);resetMascotEyes()}
 else{scheduleBlink();scheduleIdleLook();scheduleMascotSleep();if(mascotAnnoyance>0)scheduleAnnoyanceRecovery()}
});
window.addEventListener('pocket-motion-change',()=>{clearBlink();resetMascotEyes();scheduleBlink();scheduleIdleLook();scheduleMascotSleep()});
window.addEventListener('pocket-mascot-home',()=>{
 if(mascotBusyReasons.size||['success','error','thinking','listening','research','study','coding','files','offline'].includes(mascotState))return;
 calmAnnoyance(false);
});

function setMascotWind(value=0){
 const v=Math.max(-1,Math.min(1,Number(value)||0));
 document.documentElement.style.setProperty('--pocket-wind-angle',(v*7).toFixed(2)+'deg');
 if(Math.abs(v)>.16&&mascotState==='idle'){
   const home=mascotElement();if(home){home.style.setProperty('--pocket-eye-x',(v>0?1.2:-1.2)+'px');setTimeout(resetMascotEyes,900)}
 }
 return v;
}
window.PocketMascot={
 init:()=>{window.PocketMascotViews?.hydrate?.();setMascotState(restingMascotState(),0);return true},
 setState:setMascotState,
 react:reactMascot,
 tap:handleMascotTap,
 setBusy:setMascotBusy,
 calm:()=>calmAnnoyance(true),
 sleep:()=>{if(canSleep()){setMascotState('sleep',0);window.PocketMascotViews?.goHomeAll?.(true)}},
 wake:wakeMascot,
 lookAt:lookMascotToward,
 setWind:setMascotWind,
 moveRandom:()=>window.PocketMascotViews?.moveRandom?.(),
 goHome:()=>window.PocketMascotViews?.goHomeAll?.(true),
 getState:()=>mascotState,
 getAnnoyance:()=>mascotAnnoyance,
 getAnnoyThreshold:()=>annoyThreshold,
 isBusy:()=>mascotBusyReasons.size>0
};

q('homePrompt')?.addEventListener('focus',wakeMascot);
q('homePrompt')?.addEventListener('input',wakeMascot);
scheduleBlink();scheduleIdleLook();scheduleMascotSleep();
if(navigator.onLine===false)setMascotState('offline',0);

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