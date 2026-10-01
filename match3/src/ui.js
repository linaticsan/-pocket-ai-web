import{GameState}from"./core.js";

const glyph={red:"◆",blue:"●",green:"⬟",yellow:"✦",purple:"⬢",orange:"▲"};
export class BoardView{
  constructor(engine,root){this.engine=engine;this.root=root;this.selected=null;this.busy=false;this.bindEvents();this.render()}
  bindEvents(){
    this.engine.events.on("StateChanged",()=>this.renderHUD());
    for(const e of["PieceDestroyed","SpecialCreated","BlockerDamaged","BlockerRemoved","Reshuffled","BoardStable","LevelWon","LevelLost"])this.engine.events.on(e,()=>this.render());
  }
  cellLabel(c){
    if(c.piece?.special==="color")return"✺";
    if(c.piece?.special==="row")return"↔";
    if(c.piece?.special==="column")return"↕";
    if(c.piece?.special==="area")return"✹";
    return glyph[c.piece?.color]||"";
  }
  render(){
    const b=this.engine.board;this.root.style.setProperty("--cols",b.width);this.root.innerHTML="";
    for(const c of b.all()){
      const el=document.createElement("button");el.type="button";el.className="cell";el.dataset.row=c.row;el.dataset.col=c.column;
      if(!c.enabled){el.classList.add("disabled");el.disabled=true;this.root.append(el);continue}
      if(c.blocker)el.classList.add("blocker",`blocker-${c.blocker.type}`);
      if(c.piece){const p=document.createElement("span");p.className=`piece piece-${c.piece.color||"color"} special-${c.piece.special||"none"}`;p.textContent=this.cellLabel(c);el.append(p)}
      if(c.blocker){const b=document.createElement("i");b.className="blocker-layer";b.textContent=c.blocker.hitPoints>1?c.blocker.hitPoints:"";el.append(b)}
      if(this.selected&&this.selected.row===c.row&&this.selected.column===c.column)el.classList.add("selected");
      el.addEventListener("click",()=>this.click(c));this.root.append(el);
    }
    this.renderHUD();
  }
  async click(c){
    if(this.engine.state!==GameState.PLAYER_INPUT)return;
    if(!this.selected){this.selected={row:c.row,column:c.column};this.render();return}
    const a=this.selected,b={row:c.row,column:c.column};this.selected=null;
    if(a.row===b.row&&a.column===b.column){this.render();return}
    const result=await this.engine.swap(a,b);this.render();
    if(!result.ok&&result.reason==="no_match"){this.root.classList.add("invalid");setTimeout(()=>this.root.classList.remove("invalid"),220)}
  }
  renderHUD(){
    const snap=this.engine.snapshot();
    document.querySelector("[data-moves]").textContent=snap.movesRemaining;
    document.querySelector("[data-score]").textContent=Math.floor(snap.score);
    document.querySelector("[data-state]").textContent=snap.state;
    const list=document.querySelector("[data-objectives]");list.innerHTML="";
    for(const o of snap.objectives){const li=document.createElement("li");li.textContent=o.type==="collect"?`Collect ${o.color}: ${o.progress}/${o.count}`:o.type==="remove_blocker"?`Clear ${o.blocker}: ${o.progress}/${o.count}`:`Score: ${Math.floor(o.progress)}/${o.count}`;list.append(li)}
    const result=document.querySelector("[data-result]");
    result.hidden=![GameState.WIN,GameState.LOSE].includes(snap.state);result.textContent=snap.state===GameState.WIN?"Level complete!":"Out of moves";
  }
}

export function wireDebug(engine){
  const panel=document.querySelector("[data-debug]");if(!panel)return;
  const update=()=>{const s=engine.snapshot();panel.textContent=JSON.stringify({seed:s.seed,state:s.state,cascade:s.cascade,legalMoves:s.legalMoves.length,moves:s.movesRemaining,objectives:s.objectives},null,2)};
  engine.events.on("StateChanged",update);engine.events.on("BoardStable",update);update();
  document.querySelector("[data-reshuffle]")?.addEventListener("click",()=>{engine.reshuffle(true);engine.setState(GameState.PLAYER_INPUT)});
}
