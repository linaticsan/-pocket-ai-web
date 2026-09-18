const API_STORE='pocket-api-hub-v1';
const $a=id=>document.getElementById(id);
const read=()=>{try{return JSON.parse(localStorage.getItem(API_STORE)||'{}')||{}}catch{return{}}};
const write=v=>{try{localStorage.setItem(API_STORE,JSON.stringify(v))}catch{}};
const providers={
  gemini:{name:'Google Gemini',model:'gemini-2.5-flash',kind:'gemini'},
  groq:{name:'Groq',model:'llama-3.3-70b-versatile',kind:'openai',url:'https://api.groq.com/openai/v1/chat/completions'},
  openrouter:{name:'OpenRouter',model:'openrouter/free',kind:'openai',url:'https://openrouter.ai/api/v1/chat/completions'}
};
function configs(){const s=read();return Object.entries(providers).map(([id,p])=>({id,...p,...(s[id]||{})})).filter(x=>x.key)}
function hasKeys(){return configs().length>0}
function looksCode(messages){const t=messages.map(x=>x.content||'').join(' ').toLowerCase();return /\b(code|coding|python|javascript|typescript|html|css|react|bug|debug|error|function|class|github|api|sql|docker|linux)\b/.test(t)}
function order(messages,forced='auto'){
  const all=configs();if(forced!=='auto')return all.filter(x=>x.id===forced);
  const ids=looksCode(messages)?['groq','openrouter','gemini']:['gemini','groq','openrouter'];
  return ids.map(id=>all.find(x=>x.id===id)).filter(Boolean)
}
async function callOne(p,messages){
  if(p.kind==='gemini'){
    const system=messages.find(x=>x.role==='system')?.content||'You are Pocket AI, a helpful assistant.';
    const contents=messages.filter(x=>x.role!=='system').map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:String(x.content||'')}]}));
    const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(p.model||providers.gemini.model)+':generateContent';
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':p.key},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:4096}})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d?.error?.message||('Gemini '+r.status));
    return d?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||''
  }
  const headers={'Content-Type':'application/json','Authorization':'Bearer '+p.key};
  if(p.id==='openrouter'){headers['HTTP-Referer']=location.origin+location.pathname;headers['X-Title']='Pocket AI'}
  const r=await fetch(p.url,{method:'POST',headers,body:JSON.stringify({model:p.model||providers[p.id].model,messages,max_tokens:4096,temperature:.6})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d?.error?.message||d?.message||(p.name+' '+r.status));
  return d?.choices?.[0]?.message?.content||''
}
async function generate(messages,opts={}){
  const forced=opts.provider||'auto', list=order(messages,forced);if(!list.length)throw Error('No API key is saved on this device.');
  const errors=[];for(const p of list){try{const text=await callOne(p,messages);if(text)return{text,provider:p.id,label:p.name,model:p.model}}catch(e){errors.push(p.name+': '+(e?.message||e))}}
  throw Error(errors.join(' • ')||'All saved API providers failed.')
}
function saveFromDialog(){
  const s=read();for(const id of Object.keys(providers)){const key=$a('apiKey_'+id)?.value.trim()||'',model=$a('apiModel_'+id)?.value.trim()||providers[id].model;if(key)s[id]={key,model};else delete s[id]}
  write(s);renderStatus();$a('apiStatus').textContent='Saved on this device. Pocket AI can now choose a provider automatically.'
}
function forgetAll(){if(!confirm('Forget all saved AI API keys on this device?'))return;localStorage.removeItem(API_STORE);for(const id of Object.keys(providers)){if($a('apiKey_'+id))$a('apiKey_'+id).value=''}renderStatus()}
function renderStatus(){const n=configs();const el=$a('apiSaved');if(el)el.textContent=n.length?n.map(x=>x.name).join(' • ')+' saved':'No cloud API keys saved — Local AI remains available.'}
function setupDialog(){
  const d=$a('aiDialog');if(!d)return;
  const s=read();d.classList.add('api-hub-dialog');
  d.innerHTML='<form method="dialog"><button class="close" value="cancel" aria-label="Close">×</button></form><p class="eyebrow">AI CONNECTIONS</p><h2>API Hub</h2><p class="muted">Add your own optional API keys once. They stay in this browser until you remove them. Auto mode can choose a suitable saved provider and fall back to another if one fails.</p><div class="api-security">🔐 <strong>Personal-device storage</strong><span>Keys are stored in this browser, not in the public Pocket AI source code. Do not save keys on a shared device.</span></div><div class="api-provider-grid">'+Object.entries(providers).map(([id,p])=>'<section class="api-provider"><div><strong>'+p.name+'</strong><small>'+ (id==='openrouter'?'Free router available':id==='groq'?'Fast coding/general API':'General, study & document AI') +'</small></div><label>API key<input id="apiKey_'+id+'" type="password" autocomplete="off" placeholder="Paste once on this device"></label><label>Model<input id="apiModel_'+id+'" value="'+((s[id]?.model)||p.model)+'"></label></section>').join('')+'</div><div class="row api-actions"><button id="apiSave" class="primary" type="button">Save API connections</button><button id="apiForget" type="button">Forget all keys</button></div><p id="apiSaved" class="muted"></p><p id="apiStatus" class="fineprint">Local AI is still the private/offline option. Cloud API use sends the prompt to the provider you selected.</p><div class="api-shared-note"><strong>For a shared Pocket AI key:</strong> a secret key must live on a protected backend/serverless function. Putting it in this GitHub Pages code would expose it to every visitor.</div>';
  for(const id of Object.keys(providers))if(s[id]?.key)$a('apiKey_'+id).value=s[id].key;
  $a('apiSave').onclick=saveFromDialog;$a('apiForget').onclick=forgetAll;renderStatus()
}
setupDialog();
window.PocketAPI={hasKeys,generate,configs,open:()=>{setupDialog();$a('aiDialog')?.showModal()}};
