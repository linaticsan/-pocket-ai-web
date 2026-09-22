/* Pocket AI V115 — desktop shell reliability */
(()=>{const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function sync(){
 const active=q('.view.active:not([hidden])')?.id||'home';
 qa('[data-pa-side]').forEach(b=>b.classList.toggle('active',b.dataset.paSide===active||(b.dataset.paSide==='study'&&active==='chat'&&q('#v3Study')?.classList.contains('active'))));
}
document.addEventListener('click',e=>{if(e.target.closest('[data-go],[data-pa-side]'))setTimeout(sync,30)},true);
window.addEventListener('pocket-features-ready',sync);setTimeout(sync,800);
})();