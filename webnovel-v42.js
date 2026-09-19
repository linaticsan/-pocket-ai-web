// Pocket AI V42 — rights-aware Web Novel Hub
(() => {
const by=id=>document.getElementById(id);
const SOURCES=[
 {id:'wuxiaworld',name:'Wuxiaworld',icon:'⚔️',url:'https://www.wuxiaworld.com/',note:'Licensed translations • free access varies',mode:'official'},
 {id:'novelnow',name:'NovelNow',icon:'📖',url:'https://www.novelnow.com/',note:'Official web reader • availability varies',mode:'official'},
 {id:'meganovel',name:'MegaNovel',icon:'✨',url:'https://www.meganovel.com/',note:'Official web reader • free and premium titles',mode:'official'},
 {id:'tapas',name:'Tapas',icon:'🎨',url:'https://tapas.io/',note:'Official comics & novels • many free episodes',mode:'official'},
 {id:'royalroad',name:'Royal Road',icon:'🏰',url:'https://www.royalroad.com/',note:'Author-published web fiction',mode:'official'},
 {id:'scribblehub',name:'Scribble Hub',icon:'✍️',url:'https://www.scribblehub.com/',note:'Author-published web fiction',mode:'official'}
];
const KEY='pocket-webnovel-links-v42';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function loadLinks(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saveLinks(a){localStorage.setItem(KEY,JSON.stringify(a.slice(0,80)))}
function card(s){return '<article class="wn42-source"><div class="wn42-icon">'+s.icon+'</div><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.note)+'</small></div><button data-wn-open="'+s.id+'">Open</button></article>'}
function addHub(){
 const lib=by('library');if(!lib||by('webNovelHub'))return false;
 const free=by('freeLibrary'),anchor=free||by('libStorage')||lib.lastElementChild;
 const box=document.createElement('section');box.id='webNovelHub';box.className='wn42';
 box.innerHTML='<div class="wn42-head"><div><p class="eyebrow">WEB NOVELS</p><h2>Web Novel Hub</h2><p class="muted">Keep your novel sites together. Pocket AI opens copyrighted web novels on their official reader instead of copying or bypassing chapter locks.</p></div><span class="privacy-pill">🌐 Source-safe</span></div><div class="wn42-tabs"><button class="active" data-wn-tab="sources">Discover</button><button data-wn-tab="saved">Reading list</button><button data-wn-tab="custom">Add link</button></div><div id="wn42Sources" class="wn42-panel"><div class="wn42-grid">'+SOURCES.map(card).join('')+'</div><div class="wn42-open-note"><strong>Want books that open fully inside Pocket AI?</strong><span>Use the Free Book Library below/above for public-domain books. Web-novel sites keep their own reader, accounts, chapter locks and creator rights.</span></div></div><div id="wn42Saved" class="wn42-panel" hidden></div><div id="wn42Custom" class="wn42-panel" hidden><form id="wn42Form"><label>Novel or chapter link<input id="wn42Url" type="url" inputmode="url" placeholder="https://…" required></label><label>Title (optional)<input id="wn42Title" maxlength="120" placeholder="My web novel"></label><button class="primary">＋ Save to reading list</button></form><p class="fineprint">Pocket AI stores only the link and title on this device. It does not scrape or copy the chapter.</p></div>';
 anchor?.insertAdjacentElement('afterend',box);
 box.addEventListener('click',onClick);by('wn42Form').onsubmit=onSave;renderSaved();return true;
}
function setTab(name){
 document.querySelectorAll('.wn42-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.wnTab===name));
 ['Sources','Saved','Custom'].forEach(x=>{const el=by('wn42'+x);if(el)el.hidden=x.toLowerCase()!==name});
 if(name==='saved')renderSaved();
}
function openUrl(url){try{const u=new URL(url);if(!/^https?:$/.test(u.protocol))return;window.open(u.href,'_blank','noopener,noreferrer')}catch{}}
function onClick(e){
 const tab=e.target.closest('[data-wn-tab]');if(tab){setTab(tab.dataset.wnTab);return}
 const op=e.target.closest('[data-wn-open]');if(op){const s=SOURCES.find(x=>x.id===op.dataset.wnOpen);if(s)openUrl(s.url);return}
 const saved=e.target.closest('[data-wn-saved]');if(saved){const a=loadLinks(),x=a[+saved.dataset.wnSaved];if(x)openUrl(x.url);return}
 const del=e.target.closest('[data-wn-del]');if(del){const a=loadLinks();a.splice(+del.dataset.wnDel,1);saveLinks(a);renderSaved()}
}
function onSave(e){e.preventDefault();const raw=by('wn42Url').value.trim(),title=by('wn42Title').value.trim();try{const u=new URL(raw);if(!/^https?:$/.test(u.protocol))throw Error();const a=loadLinks();a.unshift({url:u.href,title:title||u.hostname,added:Date.now()});saveLinks(a);e.target.reset();setTab('saved')}catch{by('wn42Url').setCustomValidity('Enter a valid http or https link');by('wn42Url').reportValidity();setTimeout(()=>by('wn42Url').setCustomValidity(''),500)}}
function renderSaved(){const host=by('wn42Saved');if(!host)return;const a=loadLinks();host.innerHTML=a.length?'<div class="wn42-reading">'+a.map((x,i)=>'<article><button class="wn42-read" data-wn-saved="'+i+'"><span>🔖</span><div><strong>'+esc(x.title)+'</strong><small>'+esc(new URL(x.url).hostname)+'</small></div></button><button class="wn42-del" data-wn-del="'+i+'" aria-label="Remove">×</button></article>').join('')+'</div>':'<div class="lib-empty"><strong>No web novels saved yet.</strong><p>Add a novel/chapter link and Pocket AI will remember it on this device.</p></div>'}
function boot(){let n=0;const t=setInterval(()=>{if(addHub()||++n>30)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.PocketWebNovels={sources:SOURCES,addHub};
})();