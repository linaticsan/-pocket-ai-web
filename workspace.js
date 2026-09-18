const polish=document.createElement('link');polish.rel='stylesheet';polish.href='./polish.css?v=20260916-1';document.head.appendChild(polish);
const q=id=>document.getElementById(id);
const safeGet=(k,f='')=>{try{return localStorage.getItem(k)||f}catch{return f}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const go=id=>document.querySelector(`[data-go="${id}"]`)?.click();

function greeting(){const h=new Date().getHours();const word=h<12?'Good morning':h<18?'Good afternoon':'Good evening';q('homeGreeting').textContent=`${word}. What shall we work on?`;}
function setTheme(t){document.documentElement.dataset.theme=t;safeSet('pocket-theme',t);document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===t));}
function setMotion(m){document.documentElement.dataset.motion=m;safeSet('pocket-motion',m);document.querySelectorAll('[data-motion]').forEach(b=>b.classList.toggle('active',b.dataset.motion===m));}
const modeText={balanced:'Uses Local AI first; web tools only when you open them.',private:'Local AI only for AI tasks. No account login required.',offline:'Cached app + Local AI + local files. Web tools need internet.'};
function setPrivacy(m){safeSet('pocket-privacy',m);document.querySelectorAll('[data-privacy],[data-privacy-setting]').forEach(b=>{const v=b.dataset.privacy||b.dataset.privacySetting;b.classList.toggle('active',v===m)});q('modeHint').textContent=modeText[m]||modeText.balanced;}

greeting();setTheme(safeGet('pocket-theme','light'));setMotion(safeGet('pocket-motion','full'));setPrivacy(safeGet('pocket-privacy','balanced'));
q('settingsOpen').onclick=()=>q('settingsDialog').showModal();q('commandOpen').onclick=()=>{q('commandDialog').showModal();setTimeout(()=>q('commandSearch').focus(),50)};
document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeChoice));
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>setMotion(b.dataset.motion));
document.querySelectorAll('[data-privacy-setting],[data-privacy]').forEach(b=>b.onclick=()=>setPrivacy(b.dataset.privacySetting||b.dataset.privacy));

document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();q('commandDialog').showModal();setTimeout(()=>q('commandSearch').focus(),50)}});
q('commandSearch').oninput=e=>{const s=e.target.value.toLowerCase();q('commandList').querySelectorAll('button').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(s));};
function command(name){q('commandDialog').close();if(name==='settings'){q('settingsDialog').showModal();return}if(name==='research'){go('surface');setTimeout(()=>{q('surfaceMode').value='research';q('surfaceQuery').focus()},100);return}go(name);}
document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>command(b.dataset.command));

q('homeComposer').onsubmit=e=>{e.preventDefault();const text=q('homePrompt').value.trim();if(!text)return;go('chat');q('prompt').value=text;q('homePrompt').value='';setTimeout(()=>q('chatForm').requestSubmit(q('chatSend')),80);addRecent('💬',text,'chat');};
document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{const x=b.dataset.quick;if(x==='research'){go('surface');q('surfaceMode').value='research';setTimeout(()=>q('surfaceQuery').focus(),80)}else if(x==='study'){go('chat');q('prompt').value='Study mode: Help me learn this topic step by step. Explain simply first, then quiz me: ';q('prompt').focus()}else go(x)});

const REC='pocket-recent-v2';function recent(){try{return JSON.parse(localStorage.getItem(REC)||'[]')}catch{return[]}}function addRecent(icon,title,target){const arr=[{icon,title:title.slice(0,80),target,time:Date.now()},...recent().filter(x=>x.title!==title)].slice(0,6);safeSet(REC,JSON.stringify(arr));renderRecent();}function renderRecent(){const box=q('recentActivity'),arr=recent();if(!arr.length){box.innerHTML='<p class="muted">Your recent chats and research will appear here on this device.</p>';return}box.replaceChildren(...arr.slice(0,4).map(x=>{const b=document.createElement('button');b.className='recent-item';b.textContent=`${x.icon} ${x.title}`;b.onclick=()=>go(x.target);return b}))}renderRecent();
q('chatForm').addEventListener('submit',()=>{const t=q('prompt').value.trim();if(t)addRecent('💬',t,'chat')},true);q('deepResearch').addEventListener('click',()=>{const t=q('surfaceQuery').value.trim();if(t)addRecent('🔎',t,'surface')},true);

const PROJ='pocket-projects-v2';const defaults=[{emoji:'🎓',name:'Study',note:'Notes, exam prep and learning'},{emoji:'💻',name:'Pocket AI',note:'Development and ideas'},{emoji:'🔬',name:'Research',note:'Saved research topics'}];function projects(){try{const a=JSON.parse(localStorage.getItem(PROJ)||'null');return Array.isArray(a)?a:defaults}catch{return defaults}}function saveProjects(a){safeSet(PROJ,JSON.stringify(a));renderProjects()}function renderProjects(){q('projectGrid').replaceChildren(...projects().map((x,i)=>{const b=document.createElement('button');b.className='project-card';b.innerHTML=`<span class="emoji">${x.emoji}</span><strong></strong><small></small>`;b.querySelector('strong').textContent=x.name;b.querySelector('small').textContent=x.note||'Local workspace';b.onclick=()=>{go('chat');q('prompt').value=`Project: ${x.name}\n`;q('prompt').focus()};b.oncontextmenu=e=>{e.preventDefault();if(confirm(`Delete project “${x.name}”?`)){const a=projects();a.splice(i,1);saveProjects(a)}};return b}))}renderProjects();
q('newProject').onclick=()=>{const name=prompt('Project name');if(!name?.trim())return;const a=projects();a.push({emoji:'✨',name:name.trim().slice(0,50),note:'Personal workspace'});saveProjects(a)};

function syncLocalHome(){const installed=safeGet('pocket-local-webllm-installed')==='1',enabled=safeGet('pocket-local-webllm-enabled')==='1';const badge=q('homeLocalBadge');if(installed&&enabled){badge.textContent='Ready';badge.classList.add('connected');q('homeLocalText').textContent='Local AI is installed on this device and set to reconnect.'}else if(installed){badge.textContent='Installed';badge.classList.remove('connected');q('homeLocalText').textContent='Your model is saved. Reconnect it with one tap.'}else{badge.textContent='Not set up';badge.classList.remove('connected');q('homeLocalText').textContent='Set up a small private on-device model with one tap.'}}syncLocalHome();document.querySelectorAll('[data-go="home"],[data-go="local"]').forEach(b=>b.addEventListener('click',()=>setTimeout(syncLocalHome,150)));

const mascots=document.querySelectorAll('[data-mascot]');function mascot(face,ms=1800){mascots.forEach(x=>x.textContent=face);setTimeout(()=>mascots.forEach(x=>x.textContent='◕‿◕'),ms)}q('chatForm').addEventListener('submit',()=>mascot('•ᴗ•'));q('deepResearch').addEventListener('click',()=>mascot('◉‿◉',3000));q('localSend').addEventListener('click',()=>mascot('•̀ᴗ•́'));

window.addEventListener('online',()=>{document.body.dataset.network='online'});window.addEventListener('offline',()=>{document.body.dataset.network='offline';if(safeGet('pocket-privacy')==='balanced')setPrivacy('offline')});