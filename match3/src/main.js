import{GameEngine,LevelLoader}from"./core.js";import{BoardView,wireDebug}from"./ui.js";

const params=new URLSearchParams(location.search);
const draft=params.get("draft")==="1";
const id=(params.get("level")||"00001").padStart(5,"0");
const seed=params.get("seed")?Number(params.get("seed")):undefined;
const status=document.querySelector("[data-load-status]");
try{
  let level;
  if(draft){
    const raw=localStorage.getItem("luma-draft-level");
    if(!raw)throw new Error("No editor draft was found.");
    level=JSON.parse(raw);LevelLoader.fromObject(level);
  }else{
    level=await LevelLoader.load(`./levels/level-${id}.json`);
  }
  document.title=`${level.name} · Luma Grove`;
  document.querySelector("[data-level-name]").textContent=level.name+(draft?" · Draft":"");
  const engine=new GameEngine(level,seed===undefined?{}:{seed});window.lumaEngine=engine;
  new BoardView(engine,document.querySelector("[data-board]"));wireDebug(engine);
  status.textContent=`${draft?"Editor draft":`Level ${level.id}`} · seed ${engine.seed}`;
  document.querySelector("[data-restart]").addEventListener("click",()=>location.reload());
  const next=document.querySelector("[data-next]");
  if(draft){
    next.textContent="Back to Editor";next.addEventListener("click",()=>location.href="./editor.html");
  }else{
    next.addEventListener("click",()=>{const n=String(Number(level.id)+1).padStart(5,"0");location.href=`?level=${n}`});
  }
}catch(err){
  console.error(err);status.textContent=err.message;
  document.querySelector("[data-board]").innerHTML=`<p class="error">${String(err.message).replaceAll("<","&lt;")}</p>`;
}
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn);
