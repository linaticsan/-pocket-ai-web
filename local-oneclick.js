const LOCAL_MODEL='SmolLM2-360M-Instruct-q4f32_1-MLC';
const LOCAL_INSTALLED='pocket-local-webllm-installed';
const LOCAL_ENABLED='pocket-local-webllm-enabled';
let localEngine=null,webllm=null,localBusy=false,progressTimer=null,lastProgressAt=0;
let localChatHistory=[{role:'system',content:'You are Pocket Local AI. Be helpful, concise, and truthful. Your inference runs locally in the user browser. Continue the conversation naturally and use earlier messages when relevant.'}];
const el=id=>document.getElementById(id);
function deviceName(){const ua=navigator.userAgent||'';if(/iPhone/i.test(ua))return'iPhone';if(/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return'iPad';if(/Android/i.test(ua))return'Android';if(/Windows/i.test(ua))return'Windows PC';if(/Macintosh|Mac OS X/i.test(ua))return'Mac';if(/Linux/i.test(ua))return'Linux PC';return'This device';}
function saved(k){try{return localStorage.getItem(k)||''}catch{return''}}
function store(k,v){try{localStorage.setItem(k,v)}catch{}}
function setStatus(text,state='idle'){if(el('localStatus'))el('localStatus').textContent=text;if(el('localStatusCard'))el('localStatusCard').dataset.state=state;}
function setProgress(value,text){const p=el('localProgress');if(!p)return;p.hidden=false;p.value=Math.max(0,Math.min(1,Number(value)||0));el('localProgressText').textContent=text||'Preparing Local AI…';lastProgressAt=Date.now();}
function controls(connected){
 const installed=saved(LOCAL_INSTALLED)==='1';
 const setup=el('localSetup'),connect=el('localConnect'),disconnect=el('localDisconnect'),send=el('localSend'),prompt=el('localPrompt');
 if(setup)setup.hidden=installed;
 if(connect)connect.hidden=connected||!installed;
 if(disconnect)disconnect.hidden=!connected;
 if(send)send.disabled=!connected;
 if(prompt)prompt.disabled=!connected;
}
function busyUI(on){
 localBusy=on;
 const setup=el('localSetup'),connect=el('localConnect');
 if(setup)setup.disabled=on;
 if(connect){
   connect.disabled=on;
   connect.textContent=on&&!connect.hidden?'⏳ Connecting…':'⚡ Connect Local AI';
 }
}
async function loadLibrary(){if(webllm)return webllm;setStatus('Loading the Local AI engine…','working');webllm=await import('https://esm.run/@mlc-ai/web-llm@0.2.85');return webllm;}
async function webgpuReady(){if(!navigator.gpu)return false;try{return!!(await navigator.gpu.requestAdapter())}catch{return false}}
function appConfig(lib){return{...lib.prebuiltAppConfig,cacheBackend:'cache'};}
async function cacheState(lib){try{return await lib.hasModelInCache(LOCAL_MODEL,appConfig(lib))}catch{return false}}
function startWatchdog(){clearInterval(progressTimer);lastProgressAt=Date.now();progressTimer=setInterval(()=>{if(!localBusy){clearInterval(progressTimer);return}const wait=Math.round((Date.now()-lastProgressAt)/1000);if(wait>=25){setStatus('Local AI is still loading. If this stays here for more than a minute, refresh once and press Connect again.','working');el('localProgressText').textContent='Waiting for the saved model/cache • '+wait+'s';}},5000);}
function stopWatchdog(){clearInterval(progressTimer);progressTimer=null;}
async function connectLocal(firstSetup=false){if(localBusy||localEngine)return;busyUI(true);startWatchdog();try{if(!(await webgpuReady()))throw Error('WebGPU is not available in this browser. Update Chrome/Edge/Safari and try again.');const lib=await loadLibrary();const cfg=appConfig(lib);const cached=await cacheState(lib);if(saved(LOCAL_INSTALLED)==='1'&&!cached){store(LOCAL_INSTALLED,'0');store(LOCAL_ENABLED,'0');firstSetup=true;controls(false);}setStatus(cached?'Loading your saved Local AI model…':'Downloading the Local AI model for this device…','working');setProgress(0,cached?'Checking saved model files…':'Starting first-time download…');localEngine=await lib.CreateMLCEngine(LOCAL_MODEL,{appConfig:cfg,initProgressCallback:r=>{const txt=r?.text||'Preparing Local AI…';setProgress(r?.progress,txt==='Start to fetch params'?(cached?'Opening saved model files…':'Fetching model files…'):txt);},logLevel:'WARN'},{context_window_size:2048});store(LOCAL_INSTALLED,'1');store(LOCAL_ENABLED,'1');el('localProgress').value=1;el('localProgressText').textContent='Ready — model is saved in this browser.';setStatus('Connected • Private • On-device • '+deviceName(),'connected');controls(true);el('localAnswer').textContent='Local AI is ready. Type a message below — the box will clear automatically after every send.';el('localPrompt').focus();}catch(err){localEngine=null;const msg=err?.message||String(err);setStatus('Local AI could not connect: '+msg,'error');el('localProgressText').textContent='Connection stopped. Press Connect to retry.';controls(false);}finally{stopWatchdog();busyUI(false);}}
async function disconnectLocal(){if(localBusy)return;busyUI(true);try{if(localEngine)await localEngine.unload();}catch{}finally{localEngine=null;store(LOCAL_ENABLED,'0');setStatus('Disconnected. The downloaded model stays saved for fast reconnection.','idle');el('localProgress').hidden=true;el('localProgressText').textContent='';controls(false);busyUI(false);}}
async function generateLocal(messages){if(!localEngine)throw Error('Local AI is not connected.');const safe=messages.slice(-12).map(m=>({role:m.role,content:String(m.content||'').slice(0,7000)}));const r=await localEngine.chat.completions.create({messages:safe,temperature:.7,max_tokens:700});return r?.choices?.[0]?.message?.content||'Local AI returned no text.';}
async function sendLocal(){const box=el('localPrompt');const prompt=box.value.trim();if(!prompt)return;if(!localEngine){await connectLocal(false);if(!localEngine)return;}localChatHistory.push({role:'user',content:prompt});box.value='';box.focus();el('localSend').disabled=true;el('localAnswer').textContent='Thinking privately on this device…';try{const recent=[localChatHistory[0],...localChatHistory.slice(1).slice(-10)];const answer=await generateLocal(recent);localChatHistory.push({role:'assistant',content:answer});el('localAnswer').textContent=answer;}catch(err){localChatHistory.pop();el('localAnswer').textContent='Local AI error: '+(err?.message||err);box.value=prompt;}finally{el('localSend').disabled=false;box.focus();}}
function clearLocalHistory(){localChatHistory=[localChatHistory[0]];if(el('localAnswer'))el('localAnswer').textContent='Local conversation cleared. Your downloaded model is unchanged.';}
window.PocketLocalAI={isConnected:()=>!!localEngine,generate:generateLocal,connect:()=>connectLocal(false),disconnect:disconnectLocal,clearHistory:clearLocalHistory,model:LOCAL_MODEL};
async function initLocal(){el('localDevice').textContent=deviceName();const supported=await webgpuReady();el('localCompatibility').textContent=supported?'WebGPU available ✓':'WebGPU unavailable';if(!supported){setStatus('This browser cannot run the built-in Local AI yet. Use current Chrome/Edge/Safari or the Advanced server connection below.','error');el('localSetup').disabled=true;el('localConnect').disabled=true;return}controls(false);try{const lib=await loadLibrary();const cached=await cacheState(lib);if(cached){store(LOCAL_INSTALLED,'1');if(saved(LOCAL_ENABLED)==='1'){setStatus('Reconnecting your saved Local AI…','working');await connectLocal(false);}else setStatus('Local AI model found in this browser. Press Connect to load it into memory.','idle');}else{store(LOCAL_INSTALLED,'0');store(LOCAL_ENABLED,'0');setStatus('Ready for first-time setup. Setup downloads the model once and saves it in this browser.','idle');controls(false);}}catch{setStatus('Local AI engine is ready to retry. Press Setup or Connect.','idle');}}
el('localSetup')?.addEventListener('click',()=>connectLocal(true));
el('localConnect')?.addEventListener('click',()=>connectLocal(false));
el('localDisconnect')?.addEventListener('click',disconnectLocal);
el('localSend')?.addEventListener('click',sendLocal);
el('localPrompt')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendLocal();}});
document.querySelectorAll('[data-go="local"]').forEach(b=>b.addEventListener('click',()=>{setTimeout(()=>window.scrollTo({top:0,left:0,behavior:'auto'}),40);}));
if(el('localDevice'))initLocal();