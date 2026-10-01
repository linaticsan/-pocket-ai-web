import{GameEngine,LevelLoader}from"./core.js";
import{BoardView,wireDebug}from"./ui.js";
import{AnalyticsService,PlayerProgressStore}from"./services.js";

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
  const analytics=new AnalyticsService(),progress=new PlayerProgressStore();
  new BoardView(engine,document.querySelector("[data-board]"));wireDebug(engine);
  status.textContent=`${draft?"Editor draft":`Level ${level.id}`} · seed ${engine.seed}`;
  if(!draft)analytics.track("level_started",{levelId:level.id,seed:engine.seed});
  engine.events.on("MoveMade",e=>!draft&&analytics.track("move_made",{levelId:level.id,movesRemaining:e.movesRemaining}));
  engine.events.on("SpecialCreated",e=>!draft&&analytics.track("special_created",{levelId:level.id,special:e.special}));
  engine.events.on("Reshuffled",()=>!draft&&analytics.track("reshuffle_triggered",{levelId:level.id}));
  engine.events.on("LevelWon",s=>{if(!draft){progress.completeLevel(level.id,{score:s.score,stars:s.movesRemaining>Math.ceil(level.moves*.45)?3:s.movesRemaining>0?2:1});analytics.track("level_completed",{levelId:level.id,score:Math.floor(s.score),movesRemaining:s.movesRemaining})}});
  engine.events.on("LevelLost",s=>!draft&&analytics.track("level_failed",{levelId:level.id,movesRemaining:s.movesRemaining,objectivesRemaining:s.objectives}));
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
