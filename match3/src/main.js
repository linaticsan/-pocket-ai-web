import{GameEngine,LevelLoader}from"./core.js";import{BoardView,wireDebug}from"./ui.js";

const params=new URLSearchParams(location.search);const id=(params.get("level")||"00001").padStart(5,"0");
const seed=params.get("seed")?Number(params.get("seed")):undefined;
const status=document.querySelector("[data-load-status]");
try{
  const level=await LevelLoader.load(`./levels/level-${id}.json`);
  document.title=`${level.name} · Luma Grove`;document.querySelector("[data-level-name]").textContent=level.name;
  const engine=new GameEngine(level,seed===undefined?{}:{seed});window.lumaEngine=engine;
  new BoardView(engine,document.querySelector("[data-board]"));wireDebug(engine);
  status.textContent=`Level ${level.id} · seed ${engine.seed}`;
  document.querySelector("[data-restart]").addEventListener("click",()=>location.reload());
  document.querySelector("[data-next]").addEventListener("click",()=>{const n=String(Number(level.id)+1).padStart(5,"0");location.href=`?level=${n}`});
}catch(err){console.error(err);status.textContent=err.message;document.querySelector("[data-board]").innerHTML=`<p class="error">${err.message}</p>`}
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn);
