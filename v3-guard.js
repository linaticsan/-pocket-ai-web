const form=document.getElementById('chatForm');
form?.addEventListener('submit',()=>{const privacy=localStorage.getItem('pocket-privacy')||'balanced',router=document.getElementById('v3Router'),badge=document.getElementById('v3RouteBadge');if((privacy==='private'||privacy==='offline')&&router?.value==='auto'){router.value='local';if(badge)badge.textContent='🔒 Local only';}},true);

// V3 creates a blank chat while booting. Keep only the newest empty placeholder so reloads never stack "New chat" rows.
function cleanDuplicateBlankChats(){try{const key='pocket-v3-chats',raw=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(raw))return;let kept=false;const clean=raw.filter(c=>{const blank=(c?.title||'New chat')==='New chat'&&(!Array.isArray(c?.messages)||c.messages.length===0);if(!blank)return true;if(!kept){kept=true;return true}return false});if(clean.length!==raw.length)localStorage.setItem(key,JSON.stringify(clean));const list=document.getElementById('v3ChatList');if(list){let seen=false;[...list.querySelectorAll('.v3-chat-item')].forEach(item=>{const blank=item.querySelector('span')?.textContent?.trim()==='New chat';if(blank){if(seen)item.remove();else seen=true}})}}catch(err){console.warn('Pocket AI chat cleanup skipped',err)}}
cleanDuplicateBlankChats();

// Size the chat from its actual on-screen position instead of guessing header heights.
// This keeps the composer inside the visible viewport at different browser zoom levels,
// desktop window sizes and mobile safe-area sizes while only the message list scrolls.
function fitV3ChatViewport(){const chat=document.getElementById('chat');if(!chat||chat.hidden)return;const top=chat.getBoundingClientRect().top;const vh=window.visualViewport?.height||window.innerHeight;const bottomGap=innerWidth<=780?8:14;const available=Math.floor(vh-top-bottomGap);if(available>280)chat.style.setProperty('--pocket-chat-height',available+'px');}
let fitFrame=0;function queueV3Fit(){cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fitV3ChatViewport)}
queueV3Fit();setTimeout(queueV3Fit,80);setTimeout(queueV3Fit,450);
addEventListener('resize',queueV3Fit,{passive:true});addEventListener('orientationchange',queueV3Fit,{passive:true});window.visualViewport?.addEventListener('resize',queueV3Fit,{passive:true});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="chat"]'))setTimeout(queueV3Fit,0);});
