const form=document.getElementById('chatForm');
form?.addEventListener('submit',()=>{const privacy=localStorage.getItem('pocket-privacy')||'balanced',router=document.getElementById('v3Router'),badge=document.getElementById('v3RouteBadge');if((privacy==='private'||privacy==='offline')&&router?.value==='auto'){router.value='local';if(badge)badge.textContent='🔒 Local only';}},true);
