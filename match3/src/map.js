import{PlayerProgressStore}from"./services.js";
const root=document.querySelector("[data-map]"),status=document.querySelector("[data-map-status]");
const manifest=await fetch("./levels/index.json").then(r=>r.json());const progress=new PlayerProgressStore().load();
const current=Math.min(progress.currentUnlockedLevel,manifest.totalLevels);const RADIUS=30;
function worldFor(id){return manifest.worlds.find(w=>id>=w.from&&id<=w.to)||{name:`World ${Math.ceil(id/50)}`}}
function render(center=current){
  const start=Math.max(1,center-RADIUS),end=Math.min(manifest.totalLevels,center+RADIUS);root.innerHTML="";
  for(let id=start;id<=end;id++){
    const available=manifest.availableLevels.includes(id),unlocked=id<=progress.currentUnlockedLevel;
    const node=document.createElement(available&&unlocked?"a":"div");node.className="level-node";
    if(id<progress.currentUnlockedLevel)node.classList.add("completed");else if(id===progress.currentUnlockedLevel)node.classList.add("current");else node.classList.add("locked");
    if(available&&unlocked)node.href=`./index.html?level=${String(id).padStart(5,"0")}`;
    const stars=progress.stars[String(id)]||0;
    node.innerHTML=`<strong>${id}</strong><span>${"★".repeat(stars)}${"☆".repeat(Math.max(0,3-stars))}</span><small>${worldFor(id).name}</small>`;
    root.append(node);
  }
  status.textContent=`Rendering ${start}–${end} of ${manifest.totalLevels} levels · unlocked through ${progress.currentUnlockedLevel}`;
}
render();
document.querySelector("[data-jump]").addEventListener("change",e=>render(Math.max(1,Math.min(manifest.totalLevels,Number(e.target.value)||current))));
