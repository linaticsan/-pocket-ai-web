/* Pocket AI V132 — shared outline icon component only */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg';
const paths={
 home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
 chat:'<path d="M4 5h16v11H9l-5 4V5Z"/>',
 code:'<path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 5-4 14"/>',
 files:'<path d="M3.5 6.5h6l2 2h9v10.5h-17Z"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
 study:'<path d="m3 9 9-4 9 4-9 4Z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/><path d="M21 9v6"/>',
 projects:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.4 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.4-1a8 8 0 0 0 1.8 1l.4 3.1h4.8l.4-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2.1-1.5c.1-.3.1-.7.1-1Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 attach:'<path d="m8.5 12.5 6.8-6.8a3.2 3.2 0 0 1 4.5 4.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.2-8.2"/><path d="m7.8 15.9 8.4-8.4"/>',
 send:'<path d="m3 4 18 8-18 8 4-8Z"/><path d="M7 12h14"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 file:'<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5"/>',
 arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
 cpu:'<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/><rect x="10" y="10" width="4" height="4" rx=".5"/>'
};
function icon(name,size='utility',state=''){const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.classList.add('pa-icon','pa-icon-'+size);if(state)s.classList.add('is-'+state);s.innerHTML=paths[name]||paths.file;return s}
function ensureIcon(host,name,size='utility',state=''){
 if(!host)return;
 const existing=host.querySelector(':scope > .pa-icon');
 if(existing&&host.dataset.paIconName===name&&host.dataset.paIconSize===size&&host.dataset.paIconState===state)return existing;
 if(existing)existing.remove();
 host.dataset.paIconName=name;host.dataset.paIconSize=size;host.dataset.paIconState=state;
 const svg=icon(name,size,state);host.prepend(svg);return svg;
}
function replaceGlyph(el,name,size='utility',state=''){
 if(!el||el.querySelector(':scope > .pa-icon'))return;
 const svg=icon(name,size,state);
 const text=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
 if(text){const span=document.createElement('span');span.className='pa-legacy-icon';span.textContent=text.textContent;text.replaceWith(span);el.prepend(svg)}
 else{const first=el.firstElementChild;if(first&&!first.matches('span,strong,small'))first.classList.add('pa-legacy-icon');el.prepend(svg)}
 el.dataset.paIconized='true';
}
function run(){
 const map={home:'home',chat:'chat',coding:'code',files:'files',surface:'search',study:'study',projects:'projects',settings:'settings',local:'cpu'};
 document.querySelectorAll('#paDesktopSidebar [data-pa-side]').forEach(b=>{const n=map[b.dataset.paSide];if(n){b.dataset.paIconized='1';if(!b.querySelector(':scope>.pa-icon'))b.prepend(icon(n,'nav',b.classList.contains('active')?'active':''))}});
 const nc=document.querySelector('#paDesktopSidebar .pa-new-chat');if(nc){nc.dataset.paIconized='1';if(!nc.querySelector(':scope>.pa-icon'))nc.prepend(icon('plus','utility','important'))}
 const quick={chat:'chat',coding:'code',files:'files',research:'search'};
 document.querySelectorAll('#home [data-quick]').forEach(b=>{const host=b.querySelector('.quick-icon')||b.querySelector(':scope>span');ensureIcon(host,quick[b.dataset.quick]||'file','action')});
 document.querySelectorAll('#home .recent-row').forEach(b=>{const host=b.querySelector('.recent-icon');const kind=b.querySelector('.recent-copy small')?.textContent;ensureIcon(host,kind==='Research'?'search':kind==='Chat'?'chat':'file','action')});
 document.querySelectorAll('#home .project-card').forEach(b=>ensureIcon(b.querySelector(':scope>.emoji'),'projects','action'));
 replaceGlyph(document.querySelector('#settingsOpen'),'settings','utility');
 replaceGlyph(document.querySelector('#home .home-attach'),'attach','utility');
 replaceGlyph(document.querySelector('#homeComposer>.primary'),'send','utility','important');
 document.querySelectorAll('.close').forEach(b=>replaceGlyph(b,'close','utility'));
 document.querySelectorAll('[data-more]').forEach(b=>replaceGlyph(b,'more','utility'));
}
window.PocketIcon={icon,run};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
let iconRunQueued=false;
function scheduleIconRun(){
 if(iconRunQueued)return;
 iconRunQueued=true;
 const schedule=typeof requestAnimationFrame==='function'?requestAnimationFrame:cb=>setTimeout(cb,0);
 schedule(()=>{iconRunQueued=false;run()});
}
document.addEventListener('click',scheduleIconRun,true);
new MutationObserver(records=>{
 if(records.some(record=>record.addedNodes.length>0))scheduleIconRun();
}).observe(document.body,{childList:true,subtree:true});
})();