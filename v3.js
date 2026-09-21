const V3={key:'pocket-v3-chats',research:'pocket-v3-research',active:null,busy:false,stop:false,attachments:[],lastPrompt:'',lastMode:'auto'};
const $v=id=>document.getElementById(id),esc=s=>(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readJSON=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}},writeJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

function chats(){const a=readJSON(V3.key,[]);return Array.isArray(a)?a:[]}
function saveChats(a){writeJSON(V3.key,a);renderChatList()}
function activeChat(){let a=chats(),c=a.find(x=>x.id===V3.active);if(!c){c={id:uid(),title:'New chat',created:Date.now(),updated:Date.now(),messages:[]};a.unshift(c);V3.active=c.id;saveChats(a)}return c}
function updateChat(c){let a=chats(),i=a.findIndex(x=>x.id===c.id);c.updated=Date.now();if(i<0)a.unshift(c);else a[i]=c;a.sort((x,y)=>y.updated-x.updated);saveChats(a)}
function newChat(){V3.active=null;V3.attachments=[];activeChat();renderConversation();renderAttachments();const p=$v('prompt');if(p){p.value='';p.focus()}}
function deleteChat(id){const a=chats().filter(x=>x.id!==id);if(V3.active===id)V3.active=a[0]?.id||null;saveChats(a);renderConversation()}
function renderChatList(){const box=$v('v3ChatList');if(!box)return;box.replaceChildren(...chats().slice(0,30).map(c=>{const b=document.createElement('button');b.className='v3-chat-item'+(c.id===V3.active?' active':'');b.innerHTML=`<span>${esc(c.title||'New chat')}</span><small>${new Date(c.updated).toLocaleDateString()}</small>`;b.onclick=()=>{V3.active=c.id;renderChatList();renderConversation();$v('v3ChatShell')?.classList.remove('show-sidebar')};b.oncontextmenu=e=>{e.preventDefault();if(confirm('Delete this chat?'))deleteChat(c.id)};return b}))}
function formatText(t){return esc(t).replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}
function msgNode(m,i){const d=document.createElement('article');d.className='v3-msg '+m.role;d.dataset.index=i;const who=m.role==='user'?'You':'Pocket AI';const badge=m.engine?`<span class="v3-engine">${esc(m.engine)}</span>`:'';d.innerHTML=`<div class="v3-avatar">${m.role==='user'?'◉':'◕‿◕'}</div><div class="v3-bubble"><header><strong>${who}</strong>${badge}</header><div class="v3-text">${formatText(m.content||'')}</div><footer><button data-copy>Copy</button>${m.role==='assistant'?'<button data-regen>Regenerate</button>':''}</footer></div>`;d.querySelector('[data-copy]').onclick=()=>navigator.clipboard?.writeText(m.content||'');d.querySelector('[data-regen]')?.addEventListener('click',()=>regenerate(i));return d}
function renderConversation(){const c=activeChat(),box=$v('messages');if(!box)return;box.classList.add('v3-messages');if(!c.messages.length){box.innerHTML='<div class="v3-welcome"><span class="cat big">◕‿◕</span><h2>How can Pocket AI help?</h2><p>Use Auto Local or Local only. Attach a document, start Study Mode, or just ask.</p><div class="v3-suggestions"><button>Explain something simply</button><button>Help me study Japanese</button><button>Analyze my document</button><button>Help with code</button></div></div>';box.querySelectorAll('.v3-suggestions button').forEach(b=>b.onclick=()=>{$v('prompt').value=b.textContent;$v('prompt').focus()});}else box.replaceChildren(...c.messages.map(msgNode));box.scrollTop=box.scrollHeight;renderChatList()}
function titleFrom(s){return s.replace(/\s+/g,' ').trim().slice(0,46)||'New chat'}
function addMsg(role,content,engine=''){const c=activeChat();c.messages.push({role,content,engine,time:Date.now()});if(c.title==='New chat'&&role==='user')c.title=titleFrom(content);updateChat(c);renderConversation();return c.messages.length-1}
function patchMsg(i,text,engine){
 const c=activeChat();if(!c.messages[i])return;
 c.messages[i].content=text;if(engine)c.messages[i].engine=engine;updateChat(c);
 const box=$v('messages');
 const node=box?.querySelector(`[data-index="${i}"] .v3-text`);
 if(node)node.innerHTML=formatText(text);
 if(box)box.scrollTop=box.scrollHeight;
}
function setupChatUI(){const chat=$v('chat');if(!chat||$v('v3ChatShell'))return;const messages=$v('messages'),form=$v('chatForm');if(!messages||!form){console.warn('Pocket AI chat UI could not initialize: base chat elements are missing.');return}chat.querySelector('.hero')?.remove();chat.querySelector('.engine-row')?.remove();const shell=document.createElement('div');shell.id='v3ChatShell';shell.className='v3-chat-shell';shell.innerHTML=`<aside class="v3-sidebar"><div class="v3-side-head"><strong>Chats</strong><button id="v3NewChat">＋</button></div><div id="v3ChatList"></div></aside><div class="v3-chat-main"><div class="v3-chat-top"><div><p class="eyebrow">POCKET AI V3</p><strong id="v3ChatTitle">Unified conversation</strong></div><div class="v3-top-controls"><button id="v3Api" title="AI connections" aria-label="AI connections">⚡</button><button id="v3Study" title="Study mode" aria-label="Study mode">🎓</button><button id="v3Library" title="Library context" aria-label="Library context">📚</button><button id="v3MobileHistory" title="Chat history" aria-label="Chat history">☰</button></div></div></div>`;chat.insertBefore(shell,messages);shell.querySelector('.v3-chat-main').append(messages,form);form.classList.add('v3-composer');form.innerHTML=`<div id="v3Attachments" class="v3-attachments"></div><textarea id="prompt" rows="1" maxlength="40000" placeholder="Message Pocket AI…" required></textarea><div class="v3-compose-row"><div><input id="v3Attach" type="file" multiple hidden accept=".txt,.md,.json,.csv,.pdf,.docx,.pptx,text/*,application/pdf"><button type="button" id="v3AttachBtn">＋ Attach</button><span id="v3RouteBadge">✨ Auto routing</span></div><div><button type="button" id="v3Stop" hidden>■ Stop</button><button class="primary" id="chatSend">Send ➤</button></div></div>`;$v('clearChat')?.remove();$v('v3NewChat').onclick=newChat;$v('v3Api').onclick=()=>{if(window.PocketAPI?.open)window.PocketAPI.open();else $v('aiDialog')?.showModal()};$v('v3Study').onclick=()=>{const on=$v('v3Study').classList.toggle('active');$v('prompt').placeholder=on?'Ask what you want to learn…':'Message Pocket AI…';const n=$v('notice');if(n)n.textContent=on?'🎓 Study Mode on':'Study Mode off'};$v('v3Library').onclick=()=>{const on=$v('v3Library').classList.toggle('active');$v('prompt').placeholder=on?'Ask your saved Library books…':'Message Pocket AI…';const n=$v('notice');if(n)n.textContent=on?'📚 Library context on':'Library context off'};$v('v3MobileHistory').onclick=()=>shell.classList.toggle('show-sidebar');$v('v3AttachBtn').onclick=()=>$v('v3Attach').click();$v('v3Attach').onchange=handleAttachments;$v('v3Stop').onclick=()=>{V3.stop=true;$v('v3Stop').textContent='Stopping…'};form.onsubmit=sendV3;$v('prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit($v('chatSend'))}};routeBadge();renderConversation()}
function routeBadge(){const b=$v('v3RouteBadge');if(!b)return;b.textContent=window.PocketAPI?.hasKeys?.()?'✨ Smart routing':'🔒 Local AI'}
async function extractFile(file){const ext=file.name.split('.').pop().toLowerCase();if(file.size>12*1024*1024)throw Error(file.name+' is over 12 MB');if(['txt','md','json','csv'].includes(ext)||file.type.startsWith('text/'))return(await file.text()).slice(0,50000);if(ext==='pdf'){const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;let out='';for(let i=1;i<=Math.min(pdf.numPages,40);i++){const p=await pdf.getPage(i),tc=await p.getTextContent();out+='\n[Page '+i+']\n'+tc.items.map(x=>x.str).join(' ');if(out.length>50000)break}return out.slice(0,50000)}if(['docx','pptx'].includes(ext)){const JSZip=(await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;const zip=await JSZip.loadAsync(await file.arrayBuffer());const paths=Object.keys(zip.files).filter(p=>ext==='docx'?p.startsWith('word/')&&p.endsWith('.xml'):p.startsWith('ppt/slides/slide')&&p.endsWith('.xml')).sort();let out='';for(const p of paths){const xml=await zip.file(p).async('text');out+='\n'+xml.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ');if(out.length>50000)break}return out.slice(0,50000)}throw Error('Unsupported file: '+file.name)}
async function handleAttachments(e){for(const file of [...e.target.files].slice(0,5)){const item={id:uid(),name:file.name,type:file.type,size:file.size,status:'Reading…',text:''};V3.attachments.push(item);renderAttachments();try{item.text=await extractFile(file);item.status=item.text?'Ready':'No readable text'}catch(err){item.status=err.message}renderAttachments()}e.target.value=''}
function renderAttachments(){const box=$v('v3Attachments');if(!box)return;box.replaceChildren(...V3.attachments.map(a=>{const b=document.createElement('button');b.type='button';b.className='v3-file-chip';b.innerHTML=`📎 <span>${esc(a.name)}</span><small>${esc(a.status)}</small> ×`;b.onclick=()=>{V3.attachments=V3.attachments.filter(x=>x.id!==a.id);renderAttachments()};return b}))}
function systemPrompt(){let s='You are Pocket AI V3, a helpful, accurate assistant. Use conversation context. Never claim an action you did not perform.';if($v('v3Study')?.classList.contains('active'))s+=' Study Mode is ON: teach step by step, use simple explanations, examples, then check understanding with a short quiz. Adapt to the learner.';return s}
function simpleGreeting(prompt){return /^(hi|hello|hey|hiya|yo|good\s+(morning|afternoon|evening)|namaste|namaskar|こんにちは|こんばんは|おはよう|もしもし)[!,.?\s]*$/i.test(String(prompt||'').trim())}
function chooseRoute(prompt){const privacy=localStorage.getItem('pocket-privacy')||'balanced';if(simpleGreeting(prompt)&&!V3.attachments.length&&!window.PocketLocalAI?.isConnected?.()&&!window.PocketAPI?.hasKeys?.())return'welcome';if(privacy==='private'||privacy==='offline')return'local';return window.PocketAPI?.hasKeys?.()?'api':'local'}

async function apiRun(messages,onText){if(!window.PocketAPI?.hasKeys?.())throw Error('No API key is saved. Open AI options and save Gemini, Groq or OpenRouter once.');onText('Choosing a saved AI provider…');const r=await window.PocketAPI.generate(messages,{provider:'auto'});if(!V3.stop)onText(r.text);return r}
async function localRun(messages,onText){if(!window.PocketLocalAI?.isConnected?.()){if(!window.PocketLocalAI?.connect)throw Error('The free AI engine has not loaded yet. Refresh once and try again.');onText('Preparing Pocket AI for free use…\n\nOn the first real AI question, Pocket AI automatically downloads its small on-device model. This happens once; later chats reconnect automatically.');await window.PocketLocalAI.connect();}if(!window.PocketLocalAI?.isConnected?.())throw Error('Automatic AI setup could not start on this browser. Open Local AI to see the device compatibility message.');const text=await window.PocketLocalAI.generate(messages);if(!V3.stop)onText(text);return text}
async function sendV3(e){e.preventDefault();if(V3.busy)return;const box=$v('prompt'),prompt=box.value.trim();if(!prompt&&!V3.attachments.length)return;let docs=V3.attachments.filter(x=>x.text).map(x=>`\n\n--- ATTACHMENT: ${x.name} ---\n${x.text}`).join('');const userText=prompt||'Please analyze the attached document(s).';if($v('v3Library')?.classList.contains('active')&&window.PocketLibrary?.contextFor){try{docs+=await window.PocketLibrary.contextFor(userText)}catch(err){console.warn('Library context unavailable',err)}}V3.lastPrompt=userText;const route=chooseRoute(userText);addMsg('user',userText+(V3.attachments.length?`\n\n📎 ${V3.attachments.map(x=>x.name).join(', ')}`:''));box.value='';
if(route==='welcome'){V3.attachments=[];renderAttachments();addMsg('assistant','Hello! 👋 Pocket AI is ready. Just ask me something. If AI has not been prepared on this device yet, Pocket AI will set up the free on-device model automatically on your first real question. No account login is required.','Pocket AI');box.focus();return}
V3.attachments=[];renderAttachments();const aiIndex=addMsg('assistant','',route==='api'?'☁️ API':'🔒 Local');V3.busy=true;V3.stop=false;$v('chatSend').disabled=true;$v('v3Stop').hidden=false;const c=activeChat();const history=c.messages.slice(0,-1).slice(-16).map(m=>({role:m.role,content:m.role==='user'&&m===c.messages[c.messages.length-2]?userText+docs:m.content}));const messages=[{role:'system',content:systemPrompt()},...history];try{let reply;if(route==='api'){const r=await apiRun(messages,t=>patchMsg(aiIndex,t,'☁️ API'));reply=r.text;patchMsg(aiIndex,reply,'☁️ '+r.label);}else reply=await localRun(messages,t=>patchMsg(aiIndex,t,'🔒 Local'));if(!reply&&!V3.stop)throw Error('No response was returned.');if(V3.stop&&!(activeChat().messages[aiIndex]?.content))patchMsg(aiIndex,'Stopped.');}catch(err){const detail=err?.message||err?.msg||err?.error?.message||err?.error||err?.code||(typeof err==='string'?err:'Local AI returned an error.');patchMsg(aiIndex,'I could not complete that request: '+String(detail));}finally{V3.busy=false;$v('chatSend').disabled=false;$v('v3Stop').hidden=true;$v('v3Stop').textContent='■ Stop';box.focus()}}
async function regenerate(i){
 if(V3.busy)return;
 const c=activeChat();
 const prevIndex=[...c.messages].slice(0,i).map((m,j)=>({m,j})).reverse().find(x=>x.m.role==='user')?.j;
 if(prevIndex==null)return;
 const prev=c.messages[prevIndex];
 c.messages.splice(i,1);
 updateChat(c);
 const route=chooseRoute(prev.content);
 if(route==='welcome'){
   addMsg('assistant','Hello! 👋 Pocket AI is ready. Ask me anything.','Pocket AI');
   return;
 }
 const aiIndex=addMsg('assistant','',route==='api'?'☁️ API':'🔒 Local');
 V3.busy=true;V3.stop=false;
 const sendBtn=$v('chatSend'),stopBtn=$v('v3Stop');
 if(sendBtn)sendBtn.disabled=true;
 if(stopBtn)stopBtn.hidden=false;
 const history=activeChat().messages.slice(0,aiIndex).slice(-16).map(m=>({role:m.role,content:m.content}));
 const messages=[{role:'system',content:systemPrompt()},...history];
 try{
   let reply;
   if(route==='api'){
     const r=await apiRun(messages,t=>patchMsg(aiIndex,t,'☁️ API'));
     reply=r.text;patchMsg(aiIndex,reply,'☁️ '+r.label);
   }else{
     reply=await localRun(messages,t=>patchMsg(aiIndex,t,'🔒 Local'));
   }
   if(!reply&&!V3.stop)throw Error('No response was returned.');
   if(V3.stop&&!(activeChat().messages[aiIndex]?.content))patchMsg(aiIndex,'Stopped.');
 }catch(err){
   const detail=err?.message||err?.msg||err?.error?.message||err?.error||err?.code||(typeof err==='string'?err:'AI returned an error.');
   patchMsg(aiIndex,'I could not regenerate that response: '+String(detail));
 }finally{
   V3.busy=false;
   if(sendBtn)sendBtn.disabled=false;
   if(stopBtn){stopBtn.hidden=true;stopBtn.textContent='■ Stop'}
   $v('prompt')?.focus();
 }
}

function setupDocumentIntelligence(){
 const files=$v('files');if(!files||$v('v3DocTools'))return;
 const tools=document.createElement('section');
 tools.id='v3DocTools';
 tools.className='v3-doc-tools document-studio-v50';
 tools.setAttribute('aria-label','Document Studio');
 tools.innerHTML=`<div class="doc-studio-head"><div><p class="eyebrow">DOCUMENT STUDIO</p><strong>Work with your document</strong><small>Use the file currently open in the editor to summarize, explain, study, or create.</small></div><span class="doc-studio-spark" aria-hidden="true">✨</span></div><div class="doc-studio-grid"><button id="v3DocSummary" type="button"><span class="doc-icon">📝</span><span class="doc-copy"><strong>Summarize</strong><small>Key points</small></span></button><button id="v3DocExplain" type="button"><span class="doc-icon">💡</span><span class="doc-copy"><strong>Explain</strong><small>Simple language</small></span></button><button id="v3DocQuiz" type="button"><span class="doc-icon">🎓</span><span class="doc-copy"><strong>Quiz</strong><small>Questions + answers</small></span></button><button id="v3DocStudy" type="button"><span class="doc-icon">📚</span><span class="doc-copy"><strong>Study guide</strong><small>Learn step by step</small></span></button><button id="v3DocSlides" type="button"><span class="doc-icon">🖥️</span><span class="doc-copy"><strong>Slides</strong><small>Presentation outline</small></span></button><button id="v3DocFlash" type="button"><span class="doc-icon">🗂️</span><span class="doc-copy"><strong>Flashcards</strong><small>Q / A cards</small></span></button></div><button id="v3DocChat" type="button" class="primary doc-studio-chat"><span>💬</span> Ask about this document in Chat <b>→</b></button>`;
 const editorLabel=$v('fileText')?.closest('label');
 if(editorLabel)editorLabel.after(tools);else files.querySelector('.file-tools')?.after(tools);
 const send=(prefix)=>{
   const text=$v('fileText')?.value.trim()||'';
   if(!text){alert('Open or write a document first.');$v('fileText')?.focus();return}
   if(window.PocketV39?.show)window.PocketV39.show('chat');else document.querySelector('[data-go="chat"]')?.click();
   setTimeout(()=>{
     const prompt=$v('prompt');if(!prompt)return;
     prompt.value=prefix+'\n\n'+text.slice(0,30000);prompt.focus();
   },40);
 };
 $v('v3DocSummary').onclick=()=>send('Summarize this document with clear headings and key points:');
 $v('v3DocExplain').onclick=()=>send('Explain this document simply and clearly. Define difficult terms and use examples:');
 $v('v3DocQuiz').onclick=()=>send('Create a useful study quiz from this document. Put a separate answer key after the questions:');
 $v('v3DocStudy').onclick=()=>send('Create a structured study guide from this document with key concepts, vocabulary, examples, review questions and answers:');
 $v('v3DocSlides').onclick=()=>send('Turn this document into a presentation outline. Use slide titles followed by concise bullet points:');
 $v('v3DocFlash').onclick=()=>send('Create flashcards from this document. Format each as Q: then A:');
 $v('v3DocChat').onclick=()=>send('Use this document as context and help me with it:');
}
function setupResearchLibrary(){const surface=$v('surface');if(!surface||$v('v3ResearchLibrary'))return;const box=document.createElement('details');box.id='v3ResearchLibrary';box.className='v3-library';box.innerHTML='<summary>📚 Research Library <span id="v3ResearchCount"></span></summary><div class="row"><button id="v3SaveResearch">Save current report</button><button id="v3ClearResearch">Clear library</button></div><div id="v3ResearchItems"></div>';surface.append(box);$v('v3SaveResearch').onclick=()=>{const report=$v('researchReport');if(report.hidden||!report.textContent.trim())return alert('Run Deep Research first.');const raw=readJSON(V3.research,[]),a=Array.isArray(raw)?raw:[];a.unshift({id:uid(),q:$v('surfaceQuery')?.value.trim()||'Research',text:report.textContent,time:Date.now()});writeJSON(V3.research,a.slice(0,30));renderResearch()};$v('v3ClearResearch').onclick=()=>{if(confirm('Clear saved research on this device?')){writeJSON(V3.research,[]);renderResearch()}};renderResearch()}
function renderResearch(){const raw=readJSON(V3.research,[]),a=Array.isArray(raw)?raw:[],box=$v('v3ResearchItems');if(!box)return;const count=$v('v3ResearchCount');if(count)count.textContent=a.length?`• ${a.length} saved`:'';box.replaceChildren(...a.map(x=>{const b=document.createElement('button');b.className='v3-library-item';b.innerHTML=`<strong>${esc(x.q)}</strong><small>${new Date(x.time).toLocaleString()}</small>`;b.onclick=()=>{$v('surfaceQuery').value=x.q;$v('researchReport').hidden=false;window.PocketLinkifyReport?window.PocketLinkifyReport(x.text):($v('researchReport').textContent=x.text)};return b}))}
function setupGitHubIntelligence(){const gh=$v('github');if(!gh||$v('v3GhIntel'))return;const box=document.createElement('div');box.id='v3GhIntel';box.className='v3-gh-intel';box.innerHTML=`<p class="eyebrow">REPOSITORY INTELLIGENCE</p><div class="searchline"><input id="v3Repo" placeholder="owner/repository or GitHub URL"><button id="v3AnalyzeRepo" class="primary">✨ Analyze repo</button></div><div id="v3RepoReport" class="v3-repo-report muted">Analyze a public repository to understand its purpose, stack, structure and how to run it.</div>`;gh.querySelector('#ghResults')?.before(box);$v('v3AnalyzeRepo').onclick=analyzeRepo}
async function analyzeRepo(){
 let raw=$v('v3Repo')?.value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\/$/,'').split('/').slice(0,2).join('/')||'';
 const out=$v('v3RepoReport');if(!out)return;
 if(!/^[\w.-]+\/[\w.-]+$/.test(raw)){out.textContent='Enter owner/repository or a GitHub repository URL.';return}
 out.textContent='Reading repository metadata…';
 const get=async(path,optional=false)=>{
   const r=await fetch('https://api.github.com/repos/'+raw+path,{headers:{Accept:'application/vnd.github+json'}});
   if(optional&&r.status===404)return null;
   if(!r.ok)throw Error('GitHub API returned HTTP '+r.status+' for '+(path||'repository'));
   return r.json();
 };
 const decode64=s=>{
   const bin=atob(String(s||'').replace(/\s/g,''));
   const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
   return new TextDecoder('utf-8').decode(bytes);
 };
 try{
   const [meta,contents,langs,readme]=await Promise.all([
     get(''),get('/contents'),get('/languages'),get('/readme',true)
   ]);
   let readmeText='';
   if(readme?.content){try{readmeText=decode64(readme.content).slice(0,12000)}catch{}}
   const context=`Repository: ${meta.full_name||raw}
Description: ${meta.description||'No description'}
Stars: ${meta.stargazers_count||0}
Language: ${meta.language||'Unknown'}
Languages: ${Object.keys(langs||{}).join(', ')||'Unknown'}
Root files: ${Array.isArray(contents)?contents.map(x=>x.name).join(', '):'Unavailable'}
README:
${readmeText||'No README returned.'}`;
   if(window.PocketLocalAI?.isConnected?.()){
     out.textContent=await window.PocketLocalAI.generate([
       {role:'system',content:'You are a senior software engineer. Analyze only the supplied public GitHub repository data. Be practical and do not invent files.'},
       {role:'user',content:'Explain this repository with sections: What it does, Tech stack, Important files/folders, How to run it, Risks or missing information, and 5 useful next actions.\n\n'+context}
     ]);
   }else{
     out.textContent=context+'\n\nConnect Local AI for an AI explanation of this repository.';
   }
 }catch(err){
   out.textContent='Repository analysis failed: '+(err?.message||err);
 }
}
function setupStudy(){const home=document.querySelector('.quick-grid [data-quick="study"]');if(home)home.onclick=()=>{document.querySelector('[data-go="chat"]')?.click();setTimeout(()=>{$v('v3Study')?.classList.add('active');$v('prompt').placeholder='Ask what you want to learn…';$v('prompt').value='Teach me this step by step, then quiz me: ';$v('prompt').focus()},50)}}
function animePolish(){document.querySelectorAll('[data-mascot]').forEach(m=>m.addEventListener('click',()=>{m.classList.remove('v3-pop');void m.offsetWidth;m.classList.add('v3-pop')}));document.body.classList.add('pocket-v3')}
function init(){setupChatUI();setupDocumentIntelligence();setupResearchLibrary();setupGitHubIntelligence();setupStudy();animePolish();}
init();