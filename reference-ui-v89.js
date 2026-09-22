/* Pocket AI reference UI controller — v89 */
(()=>{'use strict';
document.documentElement.classList.add('reference-ui-active');
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const themes=[
 ['light','Default','🟣'],['sakura','Sakura','🌸'],['mint','Mint','🌿'],['sky','Sky','☁️'],['lavender','Lavender','💜'],
 ['sunset','Sunset','🌅'],['forest','Forest','🌲'],['ocean','Ocean','🌊'],['midnight','Midnight','🌙']
];
const themeColors={light:'#f7f4ff',sakura:'#fff5fa',mint:'#f0fff8',sky:'#f1faff',lavender:'#f8f3ff',sunset:'#fff8ef',forest:'#071f1b',ocean:'#061b36',midnight:'#080d25'};
function setTheme(name){
 if(!themes.some(t=>t[0]===name))name='light';
 document.documentElement.dataset.theme=name;
 document.documentElement.dataset.themeChoice=name;
 try{localStorage.setItem('pocket-theme',name)}catch{}
 $('meta[name="theme-color"]')?.setAttribute('content',themeColors[name]||themeColors.light);
 $$('.theme-grid [data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===name));
}
function buildThemes(){
 const grid=$('.theme-grid');if(!grid)return;
 grid.replaceChildren(...themes.map(([id,label,icon])=>{const b=document.createElement('button');b.type='button';b.dataset.themeChoice=id;b.innerHTML='<span class="theme-name">'+icon+' '+label+'</span><small>'+({light:'Clean & friendly',sakura:'Soft pink bloom',mint:'Calm and fresh',sky:'Light and airy',lavender:'Gentle focus',sunset:'Warm and bright',forest:'Deep natural calm',ocean:'Cool blue focus',midnight:'Night-friendly'}[id])+'</small>';b.onclick=()=>setTheme(id);return b}));
 let saved='light';try{saved=localStorage.getItem('pocket-theme')||'light'}catch{};if(saved==='green')saved='mint';if(saved==='dark'||saved==='oled')saved='midnight';setTheme(saved);
}
function greeting(){
 const h=new Date().getHours(),title=h<12?'Good morning! 🌷':h<18?'Good afternoon! ☀️':'Good evening! 🌙';
 const el=$('#homeGreeting');if(el)el.textContent=title;
 const sub=$('.home-hero .muted');if(sub)sub.textContent=h<12?'What will you explore today?':'Let’s explore something new.';
}
function tuneQuickCards(){
 const wanted=[['chat','💬','Chat','Ask anything'],['research','🔎','Research','Find & explore'],['files','📁','Files','Upload & work'],['coding','🧑‍💻','Code','Build & create']];
 const grid=$('.quick-grid');if(!grid)return;
 wanted.forEach(([key,icon,title,sub],i)=>{let b=grid.querySelector('[data-quick="'+key+'"]');if(!b)return;b.style.order=i;b.innerHTML='<span>'+icon+'</span><strong>'+title+'</strong><small>'+sub+'</small>'});
 if(!grid.nextElementSibling?.classList.contains('pa-inspiration')){const p=document.createElement('div');p.className='pa-inspiration';p.textContent='“A little progress each day adds up to big results.”';grid.after(p)}
}
function makeMoreSheet(){
 if($('#paMoreSheet'))return;
 const sheet=document.createElement('div');sheet.id='paMoreSheet';sheet.className='pa-more-sheet';sheet.setAttribute('aria-hidden','true');
 sheet.innerHTML='<section class="pa-more-panel" role="dialog" aria-modal="true" aria-label="More tools"><div class="pa-sheet-handle"></div><h2>More</h2><div class="pa-more-grid">'+
 [['local','🧠','Local AI','Use models on your device'],['github','🐙','GitHub','Explore repositories'],['surface','🔎','Research','Explore open sources'],['settings','⚙️','Settings & Appearance','Themes, animation, privacy'],['command','✨','All tools','Open command palette']].map(x=>'<button type="button" data-sheet-go="'+x[0]+'"><i>'+x[1]+'</i><span><strong>'+x[2]+'</strong><small>'+x[3]+'</small></span></button>').join('')+
 '</div></section>';
 document.body.append(sheet);
 const close=()=>{sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true')};
 const open=()=>{sheet.classList.add('open');sheet.setAttribute('aria-hidden','false')};
 sheet.addEventListener('click',e=>{if(e.target===sheet)close();const b=e.target.closest('[data-sheet-go]');if(!b)return;const go=b.dataset.sheetGo;close();if(go==='settings')$('#settingsDialog')?.showModal();else if(go==='command')$('#commandDialog')?.showModal();else document.querySelector('[data-go="'+go+'"]')?.click()});
 $$('[data-more]').forEach(b=>b.onclick=open);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}
function patchNavigation(){
 const map={home:'⌂',chat:'💬',library:'▣',files:'□'};
 $$('#bottomNav [data-go]').forEach(b=>{const span=b.querySelector('span');const id=b.dataset.go;if(span)b.innerHTML=(map[id]||'•')+'<span>'+span.textContent+'</span>'});
}
function enforceReferenceShell(){
 document.documentElement.classList.add('reference-ui-active');
 document.getElementById('homeV59')?.remove();
 document.getElementById('homeV45')?.remove();
 const link=document.querySelector('link[href*="reference-ui-v89.css"]');
 if(link&&link!==document.head.lastElementChild)document.head.appendChild(link);
 tuneQuickCards();
}
function boot(){
 greeting();buildThemes();tuneQuickCards();makeMoreSheet();patchNavigation();enforceReferenceShell();
 const settings=$('#settingsOpen');if(settings)settings.onclick=()=>$('#settingsDialog')?.showModal();
 window.addEventListener('pocket-core-ready',enforceReferenceShell);
 window.addEventListener('pocket-features-ready',enforceReferenceShell);
 setTimeout(enforceReferenceShell,350);
 setTimeout(enforceReferenceShell,1400);
 const mq=matchMedia('(prefers-color-scheme:dark)');mq.addEventListener?.('change',()=>{try{if(localStorage.getItem('pocket-theme')==='system')setTheme(mq.matches?'midnight':'light')}catch{}});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();