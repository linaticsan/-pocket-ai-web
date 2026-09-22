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
 if(!arr.length){box.className='recent-list is-empty';box.innerHTML='<div class="recent-empty"><span class="friendly-empty-icon" aria-hidden="true">✦</span><strong>No activity yet</strong><span>Start something with Pocket AI and it’ll show up here.</span></div>';return}
 box.className='recent-list has-items';
 const shown=arr.slice(0,limit);
 box.innerHTML='<div class="recent-rows">'+shown.map((x,i)=>'<button type="button" class="recent-row" data-recent-index="'+i+'"><span class="recent-icon">'+(x.icon||recentIcon(x.target))+'</span><span class="recent-copy"><strong></strong><small>'+(x.type||recentType(x.target))+'</small></span><time>'+recentTime(x.time)+'</time><b aria-hidden="true">→</b></button>').join('')+'</div>'+(arr.length>limit?'<button type="button" class="recent-view-all">View all →</button>':'');
 box.querySelectorAll('[data-recent-index]').forEach((b,i)=>{b.querySelector('.recent-copy strong').textContent=shown[i].title||'Recent item';b.onclick=()=>go(shown[i].target||'home')});
 box.querySelector('.recent-view-all')?.addEventListener('click',()=>renderRecent(Math.min(10,arr.length)));
}
renderRecent();
q('chatForm')?.addEventListener('submit',()=>{const t=q('prompt')?.value.trim()||'';if(t)addRecent('💬',t,'chat','Chat')},true);
q('deepResearch')?.addEventListener('click',()=>{const t=q('surfaceQuery')?.value.trim()||'';if(t)addRecent('🔎',t,'surface','Research')},true);
q('fileInput')?.addEventListener('change',()=>{const file=q('fileInput')?.files?.[0];if(file)addRecent('📄',file.name,'files','File')},true);
document.addEventListener('click',e=>{const p=e.target.closest?.('#projectGrid .project-card');if(p){const name=p.querySelector('strong')?.textContent?.trim();if(name)addRecent('▦',name,'home','Project')}},true);

const PROJ='pocket-projects-v2';
function projects(){try{const a=JSON.parse(localStorage.getItem(PROJ)||'null');return Array.isArray(a)?a:[]}catch{return[]}}
function saveProjects(a){safeSet(PROJ,JSON.stringify(a));renderProjects()}
function projectTime(t){if(!t)return'';const m=Math.max(0,Math.floor((Date.now()-t)/60000));if(m<1)return'Updated just now';if(m<60)return'Updated '+m+' min ago';const h=Math.floor(m/60);if(h<24)return'Updated '+h+' hr ago';if(h<48)return'Updated yesterday';return'Updated '+new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function createProject(){
 const name=prompt('Project name');if(!name?.trim())return;
 const a=projects();a.unshift({id:Date.now().toString(36),emoji:'✨',name:name.trim().slice(0,50),note:'Personal workspace',updated:Date.now(),items:{chats:[],files:[],code:[],research:[],notes:[]}});
 saveProjects(a);
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