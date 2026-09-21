const polish=document.createElement('link');polish.rel='stylesheet';polish.href='./polish.css?v=20260916-1';document.head.appendChild(polish);
const q=id=>document.getElementById(id);
const safeGet=(k,f='')=>{try{return localStorage.getItem(k)||f}catch{return f}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const go=id=>{
  if(window.PocketV39?.show?.(id))return true;
  const btn=document.querySelector(`[data-go="${CSS.escape(id)}"]`);
  if(btn){btn.click();return true}
  const view=document.getElementById(id);
  if(!view)return false;
  document.querySelectorAll('.view').forEach(v=>{
    const on=v===view;
    v.hidden=!on;
    v.classList.toggle('active',on);
  });
  document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));
  window.scrollTo({top:0,left:0,behavior:'auto'});
  return true;
};

function greeting(){
 const el=q('homeGreeting');if(!el)return;
 const h=new Date().getHours(),word=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
 el.textContent=`${word}. What shall we work on?`;
}
function setTheme(t){
  if(window.PocketTheme?.apply){window.PocketTheme.apply(t);return}
  const choice=t||'light';
  const resolved=choice==='system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark':'light')
    : choice;
  document.documentElement.dataset.theme=resolved;
  document.documentElement.dataset.themeChoice=choice;
  safeSet('pocket-theme',choice);
  document.querySelectorAll('[data-theme-choice]').forEach(b=>{
    const active=b.dataset.themeChoice===choice;
    b.classList.toggle('active',active);
    b.setAttribute('aria-pressed',active?'true':'false');
  });
}
function setMotion(m){
 document.documentElement.dataset.motion=m;safeSet('pocket-motion',m);
 document.querySelectorAll('[data-motion]').forEach(b=>{const on=b.dataset.motion===m;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
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

greeting();setTheme(safeGet('pocket-theme','light'));setMotion(safeGet('pocket-motion','full'));setPrivacy(safeGet('pocket-privacy','balanced'));
if(q('settingsOpen'))q('settingsOpen').onclick=()=>q('settingsDialog')?.showModal?.();
if(q('commandOpen'))q('commandOpen').onclick=()=>{const d=q('commandDialog');if(d?.showModal&&!d.open)d.showModal();setTimeout(()=>q('commandSearch')?.focus(),50)};
document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeChoice));
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));
document.querySelectorAll('[data-privacy-setting],[data-privacy]').forEach(b=>b.onclick=()=>setPrivacy(b.dataset.privacySetting||b.dataset.privacy));

document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
   const d=q('commandDialog');if(!d?.showModal)return;
   e.preventDefault();if(!d.open)d.showModal();setTimeout(()=>q('commandSearch')?.focus(),50);
 }
});
if(q('commandSearch'))q('commandSearch').oninput=e=>{const s=e.target.value.toLowerCase();q('commandList')?.querySelectorAll('button').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(s));};
function command(name){
  q('commandDialog').close();
  if(name==='settings'){q('settingsDialog').showModal();return}
  if(name==='research'){
    go('surface');
    setTimeout(()=>{if(q('surfaceMode'))q('surfaceMode').value='research';q('surfaceQuery')?.focus()},100);
    return;
  }
  if(!go(name))q('notice').textContent='That workspace is still loading. Try again in a moment.';
}
document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>command(b.dataset.command));

if(q('homeComposer'))q('homeComposer').onsubmit=e=>{
 e.preventDefault();const hp=q('homePrompt'),text=hp?.value.trim()||'';if(!text)return;
 go('chat');if(q('prompt'))q('prompt').value=text;if(hp)hp.value='';
 setTimeout(()=>q('chatForm')?.requestSubmit?.(q('chatSend')),80);addRecent('💬',text,'chat');
};
document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{const x=b.dataset.quick;if(x==='research'){go('surface');q('surfaceMode').value='research';setTimeout(()=>q('surfaceQuery').focus(),80)}else if(x==='study'){go('chat');q('prompt').value='Study mode: Help me learn this topic step by step. Explain simply first, then quiz me: ';q('prompt').focus()}else go(x)});

const REC='pocket-recent-v2';function recent(){try{return JSON.parse(localStorage.getItem(REC)||'[]')}catch{return[]}}function addRecent(icon,title,target){const arr=[{icon,title:title.slice(0,80),target,time:Date.now()},...recent().filter(x=>x.title!==title)].slice(0,6);safeSet(REC,JSON.stringify(arr));renderRecent();}function renderRecent(){
 const box=q('recentActivity');if(!box)return;
 const arr=recent();
 if(!arr.length){box.innerHTML='<p class="muted">Your recent chats and research will appear here on this device.</p>';return}
 box.replaceChildren(...arr.slice(0,4).map(x=>{
   const b=document.createElement('button');b.className='recent-item';
   b.textContent=`${x.icon} ${x.title}`;b.onclick=()=>go(x.target);return b;
 }));
}renderRecent();
q('chatForm')?.addEventListener('submit',()=>{const t=q('prompt')?.value.trim()||'';if(t)addRecent('💬',t,'chat')},true);
q('deepResearch')?.addEventListener('click',()=>{const t=q('surfaceQuery')?.value.trim()||'';if(t)addRecent('🔎',t,'surface')},true);

const PROJ='pocket-projects-v2';const defaults=[{emoji:'🎓',name:'Study',note:'Notes, exam prep and learning'},{emoji:'💻',name:'Pocket AI',note:'Development and ideas'},{emoji:'🔬',name:'Research',note:'Saved research topics'}];function projects(){try{const a=JSON.parse(localStorage.getItem(PROJ)||'null');return Array.isArray(a)?a:defaults}catch{return defaults}}function saveProjects(a){safeSet(PROJ,JSON.stringify(a));renderProjects()}function renderProjects(){const grid=q('projectGrid');if(!grid)return;grid.replaceChildren(...projects().map((x,i)=>{const b=document.createElement('button');b.className='project-card';b.innerHTML=`<span class="emoji">${x.emoji}</span><strong></strong><small></small>`;b.querySelector('strong').textContent=x.name;b.querySelector('small').textContent=x.note||'Local workspace';b.onclick=()=>{go('chat');q('prompt').value=`Project: ${x.name}\n`;q('prompt').focus()};b.oncontextmenu=e=>{e.preventDefault();if(confirm(`Delete project “${x.name}”?`)){const a=projects();a.splice(i,1);saveProjects(a)}};return b}))}renderProjects();
if(q('newProject'))q('newProject').onclick=()=>{const name=prompt('Project name');if(!name?.trim())return;const a=projects();a.push({emoji:'✨',name:name.trim().slice(0,50),note:'Personal workspace'});saveProjects(a)};

function syncLocalHome(){
 const badge=q('homeLocalBadge'),text=q('homeLocalText');if(!badge||!text)return;
 const installed=safeGet('pocket-local-webllm-installed')==='1',enabled=safeGet('pocket-local-webllm-enabled')==='1';
 if(installed&&enabled){badge.textContent='Ready';badge.classList.add('connected');text.textContent='Local AI is installed on this device and set to reconnect.'}
 else if(installed){badge.textContent='Installed';badge.classList.remove('connected');text.textContent='Your model is saved. Reconnect it with one tap.'}
 else{badge.textContent='Not set up';badge.classList.remove('connected');text.textContent='Set up a small private on-device model with one tap.'}
}syncLocalHome();document.querySelectorAll('[data-go="home"],[data-go="local"]').forEach(b=>b.addEventListener('click',()=>setTimeout(syncLocalHome,150)));

const mascots=document.querySelectorAll('[data-mascot]');function mascot(face,ms=1800){mascots.forEach(x=>x.textContent=face);setTimeout(()=>mascots.forEach(x=>x.textContent='◕‿◕'),ms)}q('chatForm')?.addEventListener('submit',()=>mascot('•ᴗ•'));
q('deepResearch')?.addEventListener('click',()=>mascot('◉‿◉',3000));
q('localSend')?.addEventListener('click',()=>mascot('•̀ᴗ•́'));

window.addEventListener('online',()=>{
  document.body.dataset.network='online';
  const mode=safeGet('pocket-privacy','balanced');
  setPrivacy(mode);
});
window.addEventListener('offline',()=>{
  document.body.dataset.network='offline';
  // Network loss is temporary: do not overwrite the user's saved privacy preference.
  const hint=q('modeHint');
  if(hint)hint.textContent='Offline right now. Local AI and local files still work; web tools will resume when internet returns.';
});