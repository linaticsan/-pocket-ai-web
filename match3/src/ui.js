import{GameState}from"./core.js";

const glyph={red:"◆",blue:"●",green:"⬟",yellow:"✦",purple:"⬢",orange:"▲"};
const prefersReducedMotion=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export class BoardView{
  constructor(engine,root){
    this.engine=engine;this.root=root;this.selected=null;this.busy=false;
    this.fx=document.querySelector("[data-fx-layer]");
    this.combo=document.querySelector("[data-combo]");
    this.bindEvents();this.render();
  }
  bindEvents(){
    this.engine.events.on("StateChanged",()=>this.renderHUD());
    this.engine.events.on("SwapStarted",e=>this.animateSwapHint(e));
    this.engine.events.on("SwapRejected",()=>this.invalidSwap());
    this.engine.events.on("PieceDestroyed",e=>this.pieceBurst(e));
    this.engine.events.on("SpecialCreated",e=>this.specialFlash(e));
    this.engine.events.on("BlockerDamaged",e=>this.blockerSpark(e));
    this.engine.events.on("CascadeStarted",e=>this.showCascade(e.cascade));
    this.engine.events.on("Reshuffled",()=>{this.render();this.boardWave()});
    this.engine.events.on("BoardStable",()=>{this.render();this.boardSettle()});
    this.engine.events.on("LevelWon",()=>{this.render();this.celebrate(true)});
    this.engine.events.on("LevelLost",()=>{this.render();this.celebrate(false)});
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
      el.style.setProperty("--delay",`${(c.row+c.column)*14}ms`);
      if(!c.enabled){el.classList.add("disabled");el.disabled=true;this.root.append(el);continue}
      if(c.blocker)el.classList.add("blocker",`blocker-${c.blocker.type}`);
      if(c.piece){
        const p=document.createElement("span");
        p.className=`piece piece-${c.piece.color||"color"} special-${c.piece.special||"none"}`;
        p.dataset.color=c.piece.color||"color";p.textContent=this.cellLabel(c);el.append(p);
      }
      if(c.blocker){const layer=document.createElement("i");layer.className="blocker-layer";layer.textContent=c.blocker.hitPoints>1?c.blocker.hitPoints:"";el.append(layer)}
      if(this.selected&&this.selected.row===c.row&&this.selected.column===c.column)el.classList.add("selected");
      el.addEventListener("click",()=>this.click(c));this.root.append(el);
    }
    this.renderHUD();
  }
  getCellEl(cell){return this.root.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.column}"]`)}
  centerOf(cell){
    const el=this.getCellEl(cell);if(!el)return null;
    const r=el.getBoundingClientRect(),host=this.fx?.getBoundingClientRect();
    if(!host)return null;
    return{x:r.left+r.width/2-host.left,y:r.top+r.height/2-host.top,size:Math.min(r.width,r.height)};
  }
  spawnParticle(x,y,color,angle,distance,size=6){
    if(!this.fx||prefersReducedMotion())return;
    const p=document.createElement("i");p.className="fx-particle";p.style.setProperty("--x",x+"px");p.style.setProperty("--y",y+"px");
    p.style.setProperty("--dx",Math.cos(angle)*distance+"px");p.style.setProperty("--dy",Math.sin(angle)*distance+"px");
    p.style.setProperty("--p",color);p.style.width=size+"px";p.style.height=size+"px";this.fx.append(p);
    p.animate([{transform:"translate(-50%,-50%) scale(.2)",opacity:0},{transform:"translate(-50%,-50%) scale(1)",opacity:1,offset:.2},{transform:"translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)",opacity:0}],{duration:520+Math.random()*220,easing:"cubic-bezier(.16,.8,.3,1)"}).finished.finally(()=>p.remove());
  }
  colorValue(color){
    return{red:"#ff6680",blue:"#55c8ff",green:"#69edb5",yellow:"#ffe66d",purple:"#c487ff",orange:"#ffad69",color:"#ffffff"}[color]||"#ffffff";
  }
  pieceBurst({cell,piece,cascade=0}){
    const pos=this.centerOf(cell);if(!pos)return;
    const color=this.colorValue(piece?.color||"color");
    if(!prefersReducedMotion()){
      for(let i=0;i<8+Math.min(8,cascade*2);i++)this.spawnParticle(pos.x,pos.y,color,Math.PI*2*i/(8+Math.min(8,cascade*2))+Math.random()*.28,pos.size*(.45+Math.random()*.7),3+Math.random()*5);
    }
    const ring=document.createElement("i");ring.className="fx-ring";ring.style.left=pos.x+"px";ring.style.top=pos.y+"px";ring.style.setProperty("--ring",color);this.fx?.append(ring);
    ring.animate([{transform:"translate(-50%,-50%) scale(.2)",opacity:.95},{transform:"translate(-50%,-50%) scale(1.45)",opacity:0}],{duration:360,easing:"ease-out"}).finished.finally(()=>ring.remove());
  }
  specialFlash({cell,special}){
    const el=this.getCellEl(cell);if(!el||prefersReducedMotion())return;
    el.animate([{filter:"brightness(1)"},{filter:"brightness(2.4)",transform:"scale(1.14)"},{filter:"brightness(1)",transform:"scale(1)"}],{duration:440,easing:"cubic-bezier(.2,.9,.2,1)"});
    const pos=this.centerOf(cell);if(pos)for(let i=0;i<14;i++)this.spawnParticle(pos.x,pos.y,"#ffffff",Math.PI*2*i/14,pos.size*(.7+Math.random()),4+Math.random()*4);
  }
  blockerSpark({cell}){
    const pos=this.centerOf(cell);if(!pos)return;
    for(let i=0;i<5;i++)this.spawnParticle(pos.x,pos.y,"#d8f7ff",Math.random()*Math.PI*2,pos.size*(.2+Math.random()*.45),2+Math.random()*3);
  }
  showCascade(cascade){
    if(!this.combo)return;
    const labels=["","Cascade!","Double Bloom!","Triple Bloom!","Luma Rush!","Starlight Chain!"];
    this.combo.textContent=labels[Math.min(cascade,labels.length-1)]||`Bloom ×${cascade}`;
    this.combo.classList.remove("show");void this.combo.offsetWidth;this.combo.classList.add("show");
    document.body.dataset.cascade=String(Math.min(cascade,5));
  }
  animateSwapHint({a,b}){
    if(prefersReducedMotion())return;
    const ea=this.getCellEl(a),eb=this.getCellEl(b);if(!ea||!eb)return;
    const ra=ea.getBoundingClientRect(),rb=eb.getBoundingClientRect();
    const dx=rb.left-ra.left,dy=rb.top-ra.top;
    ea.querySelector(".piece")?.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${dx*.22}px,${dy*.22}px) scale(1.08)`},{transform:"translate(0,0) scale(1)"}],{duration:210,easing:"ease-out"});
    eb.querySelector(".piece")?.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${-dx*.22}px,${-dy*.22}px) scale(1.08)`},{transform:"translate(0,0) scale(1)"}],{duration:210,easing:"ease-out"});
  }
  invalidSwap(){
    this.root.classList.remove("invalid");void this.root.offsetWidth;this.root.classList.add("invalid");
  }
  boardSettle(){
    if(prefersReducedMotion())return;
    [...this.root.querySelectorAll(".piece")].forEach((p,i)=>p.animate([{transform:"translateY(-8px) scale(.96)",opacity:.6},{transform:"translateY(2px) scale(1.04)",opacity:1},{transform:"translateY(0) scale(1)"}],{duration:300,delay:Math.min(i*5,120),easing:"cubic-bezier(.2,.8,.3,1)"}));
  }
  boardWave(){
    if(prefersReducedMotion())return;
    [...this.root.querySelectorAll(".cell")].forEach((c,i)=>c.animate([{transform:"scale(.82)",opacity:.45},{transform:"scale(1.06)",opacity:1},{transform:"scale(1)"}],{duration:320,delay:(i%this.engine.board.width)*24,easing:"ease-out"}));
  }
  celebrate(win){
    const shell=document.querySelector(".game-card");if(!shell)return;
    shell.classList.add(win?"win-glow":"lose-glow");
    if(win&&!prefersReducedMotion()&&this.fx){
      const r=this.fx.getBoundingClientRect();
      for(let i=0;i<42;i++)setTimeout(()=>this.spawnParticle(Math.random()*r.width,r.height*.15+Math.random()*r.height*.35,this.colorValue(["red","blue","green","yellow","purple","orange"][i%6]),Math.PI/2+Math.random()*Math.PI,r.height*(.08+Math.random()*.18),4+Math.random()*6),i*18);
    }
  }
  async click(c){
    if(this.engine.state!==GameState.PLAYER_INPUT)return;
    if(!this.selected){this.selected={row:c.row,column:c.column};this.render();return}
    const a=this.selected,b={row:c.row,column:c.column};this.selected=null;
    if(a.row===b.row&&a.column===b.column){this.render();return}
    await this.engine.swap(a,b);this.render();
  }
  renderHUD(){
    const snap=this.engine.snapshot();
    const moves=document.querySelector("[data-moves]"),score=document.querySelector("[data-score]");
    if(moves&&moves.textContent!==String(snap.movesRemaining))this.bump(moves);
    if(score&&score.textContent!==String(Math.floor(snap.score)))this.bump(score);
    moves.textContent=snap.movesRemaining;score.textContent=Math.floor(snap.score);
    document.querySelector("[data-state]").textContent=snap.state;
    const list=document.querySelector("[data-objectives]");list.innerHTML="";
    for(const o of snap.objectives){
      const li=document.createElement("li");li.className="objective-item";
      const label=o.type==="collect"?`Collect ${o.color}`:o.type==="remove_blocker"?`Clear ${o.blocker}`:"Reach score";
      const value=o.type==="score"?`${Math.floor(o.progress)} / ${o.count}`:`${o.progress} / ${o.count}`;
      const pct=Math.max(0,Math.min(100,(o.progress/o.count)*100));
      li.innerHTML=`<div><span>${label}</span><strong>${value}</strong></div><i><b style="width:${pct}%"></b></i>`;list.append(li);
    }
    const result=document.querySelector("[data-result]");
    result.hidden=![GameState.WIN,GameState.LOSE].includes(snap.state);
    result.innerHTML=snap.state===GameState.WIN?"<strong>Level complete!</strong><span>The grove is glowing again.</span>":"<strong>Out of moves</strong><span>Try a different path.</span>";
  }
  bump(el){if(!el||prefersReducedMotion())return;el.animate([{transform:"scale(1)"},{transform:"scale(1.18)"},{transform:"scale(1)"}],{duration:240,easing:"ease-out"})}
}

export function wireDebug(engine){
  const panel=document.querySelector("[data-debug]");if(!panel)return;
  const update=()=>{const s=engine.snapshot();panel.textContent=JSON.stringify({seed:s.seed,state:s.state,cascade:s.cascade,legalMoves:s.legalMoves.length,moves:s.movesRemaining,objectives:s.objectives},null,2)};
  engine.events.on("StateChanged",update);engine.events.on("BoardStable",update);update();
  document.querySelector("[data-reshuffle]")?.addEventListener("click",()=>{engine.reshuffle(true);engine.setState(GameState.PLAYER_INPUT)});
}
