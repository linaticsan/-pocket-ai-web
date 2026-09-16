// Pocket AI V3 — document intelligence UX layer.
// Additive only: keeps the existing V3 attachment parser/router intact.
(() => {
  const ui=document.createElement('style');ui.textContent=`.v3-doc-actionbar{margin:0 16px 10px;padding:12px 14px;border:1px solid color-mix(in srgb,var(--purple,#8b5cf6) 20%,var(--line));border-radius:18px;background:linear-gradient(135deg,color-mix(in srgb,var(--purple,#8b5cf6) 7%,var(--panel)),color-mix(in srgb,var(--pink,#e548a4) 5%,var(--panel)));box-shadow:0 8px 28px rgba(82,55,130,.06)}.v3-doc-actionbar[hidden]{display:none!important}.v3-doc-head,.v3-doc-head>div,.v3-doc-actions{display:flex;align-items:center}.v3-doc-head{justify-content:space-between;gap:12px;margin-bottom:10px}.v3-doc-head>div{gap:7px;min-width:0;flex-wrap:wrap}.v3-doc-head small{color:var(--muted);font-size:11px}.v3-doc-spark{display:grid;place-items:center;width:24px;height:24px;border-radius:9px;background:linear-gradient(135deg,var(--purple,#8b5cf6),var(--pink,#e548a4));color:white}.v3-doc-private{font-size:11px;color:var(--muted);white-space:nowrap}.v3-doc-actions{gap:7px;flex-wrap:wrap}.v3-doc-actions button{padding:7px 11px;border-radius:999px;font-size:12px;background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--line)}.v3-doc-actions button:hover{border-color:color-mix(in srgb,var(--purple,#8b5cf6) 55%,var(--line));transform:translateY(-1px)}.v3-file-chip{display:grid!important;grid-template-columns:auto 1fr auto!important;gap:2px 8px!important;text-align:left!important;align-items:center!important;padding:9px 12px!important}.v3-file-chip>span{font-weight:700;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v3-file-chip small,.v3-file-kind{font-size:10px!important;color:var(--muted)!important;font-style:normal!important}.v3-file-kind{grid-column:2}.v3-file-chip small{grid-column:2}.v3-text h2,.v3-text h3,.v3-text h4{margin:16px 0 7px;line-height:1.25}.v3-text h2{font-size:1.28em}.v3-text h3{font-size:1.14em}.v3-text h4{font-size:1.04em}.v3-text ul,.v3-text ol{margin:7px 0 12px;padding-left:23px}.v3-text li{margin:4px 0}.v3-text pre{overflow:auto;padding:12px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--ink) 5%,var(--panel))}@media(max-width:780px){.v3-doc-actionbar{margin:0 8px 8px;padding:10px}.v3-doc-head{align-items:flex-start}.v3-doc-private{display:none}.v3-doc-actions{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}.v3-doc-actions button{flex:0 0 auto}}`;document.head.appendChild(ui);
  const q=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const size=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`;
  const typeOf=name=>{const e=(name.split('.').pop()||'FILE').toUpperCase();return e==='PPTX'?'PowerPoint':e==='DOCX'?'Word':e==='PDF'?'PDF':e;};
  let selected=[];

  function ensureUI(){
    const composer=document.querySelector('.v3-composer');
    const attachments=q('v3Attachments');
    if(!composer||!attachments)return false;
    if(!q('v3DocActionBar')){
      const bar=document.createElement('section');
      bar.id='v3DocActionBar';bar.className='v3-doc-actionbar';bar.hidden=true;
      bar.innerHTML=`<div class="v3-doc-head"><div><span class="v3-doc-spark">✦</span><strong>Document Intelligence</strong><small id="v3DocMeta">Ready to analyze</small></div><span class="v3-doc-private" id="v3DocPrivacy">✨ Auto routing</span></div><div class="v3-doc-actions"><button type="button" data-doc-prompt="Summarize the attached document clearly. Start with a short overview, then give the most important points.">Summarize</button><button type="button" data-doc-prompt="Extract the key points from the attached document. Prioritize facts, definitions, dates, formulas, vocabulary, and anything important to remember.">Key points</button><button type="button" data-doc-prompt="Explain the attached document in very simple language, step by step, with examples where useful.">Explain simply</button><button type="button" data-doc-prompt="Create a study quiz from the attached document. Ask the questions first, then put the answers in a separate answer section.">Make quiz</button><button type="button" data-doc-prompt="Translate the important content of the attached document. Preserve names, numbers, headings and technical terms. Ask me which language only if it is not clear from the conversation.">Translate</button></div>`;
      attachments.after(bar);
      bar.addEventListener('click',e=>{const b=e.target.closest('[data-doc-prompt]');if(!b)return;const p=q('prompt');if(!p)return;p.value=b.dataset.docPrompt;p.focus();p.dispatchEvent(new Event('input',{bubbles:true}));});
    }
    return true;
  }

  function refresh(){
    if(!ensureUI())return;
    const box=q('v3Attachments'),bar=q('v3DocActionBar');
    const chips=[...box.querySelectorAll('.v3-file-chip')];
    bar.hidden=!chips.length;
    if(!chips.length){selected=[];return;}
    const names=chips.map(c=>c.querySelector('span')?.textContent?.trim()).filter(Boolean);
    selected=selected.filter(f=>names.includes(f.name));
    const ready=chips.filter(c=>/Ready/i.test(c.textContent)).length;
    const reading=chips.filter(c=>/Reading/i.test(c.textContent)).length;
    const failed=chips.length-ready-reading;
    const total=selected.reduce((n,f)=>n+f.size,0);
    q('v3DocMeta').textContent=`${chips.length} file${chips.length===1?'':'s'} • ${ready} ready${reading?` • ${reading} reading`:''}${failed?` • ${failed} needs attention`:''}${total?` • ${size(total)}`:''}`;
    const privacy=localStorage.getItem('pocket-privacy')||'balanced',route=q('v3Router')?.value||'auto';
    q('v3DocPrivacy').textContent=route==='local'||privacy==='offline'||privacy==='private'?'🔒 Local preferred':route==='cloud'?'☁️ Cloud selected':'✨ Auto routing';
    chips.forEach(chip=>{
      if(chip.querySelector('.v3-file-kind'))return;
      const name=chip.querySelector('span')?.textContent?.trim()||'';
      const f=selected.find(x=>x.name===name);
      const kind=document.createElement('em');kind.className='v3-file-kind';kind.textContent=f?`${typeOf(name)} • ${size(f.size)}`:typeOf(name);chip.insertBefore(kind,chip.querySelector('small'));
    });
  }

  function hook(){
    if(!ensureUI())return setTimeout(hook,120);
    const input=q('v3Attach'),box=q('v3Attachments'),router=q('v3Router');
    input?.addEventListener('change',e=>{selected=[...selected,...e.target.files].slice(-5);setTimeout(refresh,0);setTimeout(refresh,250);setTimeout(refresh,900);},true);
    router?.addEventListener('change',refresh);
    new MutationObserver(()=>requestAnimationFrame(refresh)).observe(box,{childList:true,subtree:true,characterData:true});
    refresh();
  }

  function markdownLite(raw){
    let s=esc(raw).replace(/\\([#*\-])/g,'$1');
    const code=[];s=s.replace(/```(?:[\w+-]+)?\n?([\s\S]*?)```/g,(_,c)=>`@@CODE${code.push(c)-1}@@`);
    s=s.replace(/^### (.+)$/gm,'<h4>$1</h4>').replace(/^## (.+)$/gm,'<h3>$1</h3>').replace(/^# (.+)$/gm,'<h2>$1</h2>');
    s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`\n]+)`/g,'<code>$1</code>');
    const lines=s.split('\n');let out='',ul=false,ol=false;
    const close=()=>{if(ul){out+='</ul>';ul=false}if(ol){out+='</ol>';ol=false}};
    for(const line of lines){
      const u=line.match(/^\s*[-*] (.+)$/),o=line.match(/^\s*\d+[.)] (.+)$/);
      if(u){if(ol){out+='</ol>';ol=false}if(!ul){out+='<ul>';ul=true}out+=`<li>${u[1]}</li>`;continue}
      if(o){if(ul){out+='</ul>';ul=false}if(!ol){out+='<ol>';ol=true}out+=`<li>${o[1]}</li>`;continue}
      close();out+=line.trim()?`${line}<br>`:'<br>';
    }
    close();
    out=out.replace(/@@CODE(\d+)@@/g,(_,i)=>`<pre><code>${code[Number(i)]||''}</code></pre>`);
    return out;
  }
  function polishMessages(){
    document.querySelectorAll('.v3-msg.assistant .v3-text').forEach(node=>{
      const raw=node.textContent||'';if(!raw||node.dataset.prettySource===raw)return;
      node.innerHTML=markdownLite(raw);node.dataset.prettySource=node.textContent||raw;
    });
  }
  new MutationObserver(()=>requestAnimationFrame(polishMessages)).observe(document.body,{childList:true,subtree:true,characterData:true});
  hook();polishMessages();
})();
