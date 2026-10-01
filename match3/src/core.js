/* Luma Grove Match-3 core. Model-only: no DOM or sprite dependencies. */
export const GameState=Object.freeze({
  IDLE:"IDLE",PLAYER_INPUT:"PLAYER_INPUT",SWAPPING:"SWAPPING",MATCH_CHECK:"MATCH_CHECK",
  RESOLVING:"RESOLVING",GRAVITY:"GRAVITY",SPAWNING:"SPAWNING",CASCADE_CHECK:"CASCADE_CHECK",
  OBJECTIVE_CHECK:"OBJECTIVE_CHECK",WIN:"WIN",LOSE:"LOSE",RESHUFFLE:"RESHUFFLE"
});

export class EventBus{
  constructor(){this.listeners=new Map()}
  on(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);return()=>this.listeners.get(type)?.delete(fn)}
  emit(type,payload={}){for(const fn of this.listeners.get(type)||[])fn(payload)}
}

export class SeededRandom{
  constructor(seed=1){this.seed=(Number(seed)>>>0)||1}
  next(){let t=this.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
  int(max){return Math.floor(this.next()*max)}
  pick(list){return list[this.int(list.length)]}
  weighted(weights){
    const entries=Object.entries(weights).filter(([,v])=>v>0);const total=entries.reduce((s,[,v])=>s+v,0);
    let n=this.next()*total;for(const [k,v] of entries){n-=v;if(n<=0)return k}return entries.at(-1)?.[0]
  }
}

const key=(r,c)=>`${r},${c}`;
const dirs={down:[1,0],up:[-1,0],left:[0,-1],right:[0,1]};
export const adjacent=(a,b)=>Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1;

export class Cell{
  constructor(row,column,data={}){
    this.row=row;this.column=column;this.enabled=data.enabled!==false;this.piece=data.piece?{...data.piece}:null;
    this.blocker=data.blocker?{hitPoints:1,removable:true,blocksMovement:false,blocksMatching:false,reactsToAdjacentMatch:true,reactsToExplosion:true,...data.blocker}:null;
    this.generator=data.generator?{...data.generator}:null;this.portal=data.portal?{...data.portal}:null;
    this.objectiveObject=data.objectiveObject?{...data.objectiveObject}:null;this.locked=Boolean(data.locked);
  }
}

export class Board{
  constructor(width,height,cells=[]){
    this.width=width;this.height=height;this.cells=Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>new Cell(r,c,{enabled:true})));
    for(const raw of cells){if(this.inBounds(raw.row,raw.column))this.cells[raw.row][raw.column]=new Cell(raw.row,raw.column,raw)}
  }
  inBounds(r,c){return r>=0&&c>=0&&r<this.height&&c<this.width}
  get(r,c){return this.inBounds(r,c)?this.cells[r][c]:null}
  all(){return this.cells.flat()}
  playable(){return this.all().filter(c=>c.enabled)}
  swap(a,b){const x=this.get(a.row,a.column),y=this.get(b.row,b.column);[x.piece,y.piece]=[y.piece,x.piece]}
  clone(){return new Board(this.width,this.height,this.all().map(c=>JSON.parse(JSON.stringify(c))))}
}

export class MatchDetector{
  static runs(board){
    const out=[];
    for(let r=0;r<board.height;r++){
      let start=0;
      while(start<board.width){
        const first=board.get(r,start),color=this.matchColor(first);let end=start+1;
        while(color&&end<board.width&&this.matchColor(board.get(r,end))===color)end++;
        if(color&&end-start>=3)out.push({axis:"h",color,cells:Array.from({length:end-start},(_,i)=>board.get(r,start+i))});
        start=Math.max(end,start+1);
      }
    }
    for(let c=0;c<board.width;c++){
      let start=0;
      while(start<board.height){
        const first=board.get(start,c),color=this.matchColor(first);let end=start+1;
        while(color&&end<board.height&&this.matchColor(board.get(end,c))===color)end++;
        if(color&&end-start>=3)out.push({axis:"v",color,cells:Array.from({length:end-start},(_,i)=>board.get(start+i,c))});
        start=Math.max(end,start+1);
      }
    }
    return out;
  }
  static matchColor(cell){return cell?.enabled&&!cell.blocker?.blocksMatching&&cell.piece?.color&&cell.piece.special!=="color"?cell.piece.color:null}
  static groups(board){
    const runs=this.runs(board);const groups=[];
    for(const run of runs){
      const overlaps=groups.filter(g=>g.color===run.color&&run.cells.some(c=>g.keys.has(key(c.row,c.column))));
      if(!overlaps.length)groups.push({color:run.color,runs:[run],keys:new Set(run.cells.map(c=>key(c.row,c.column)))});
      else{
        const base=overlaps[0];base.runs.push(run);run.cells.forEach(c=>base.keys.add(key(c.row,c.column)));
        for(const other of overlaps.slice(1)){other.runs.forEach(x=>base.runs.push(x));other.keys.forEach(k=>base.keys.add(k));groups.splice(groups.indexOf(other),1)}
      }
    }
    return groups.map(g=>({...g,cells:[...g.keys].map(k=>{const [r,c]=k.split(",").map(Number);return board.get(r,c)})}));
  }
  static hasMatch(board){return this.runs(board).length>0}
}

export class SpecialComboResolver{
  static resolve(a,b,board){
    const A=a.piece?.special,B=b.piece?.special;if(!A&&!B)return null;
    const all=board.playable();
    const row=c=>board.cells[c.row].filter(x=>x.enabled);
    const col=c=>board.cells.map(rr=>rr[c.column]).filter(x=>x?.enabled);
    const area=(c,rad=1)=>all.filter(x=>Math.abs(x.row-c.row)<=rad&&Math.abs(x.column-c.column)<=rad);
    const unique=cells=>[...new Map(cells.map(x=>[key(x.row,x.column),x])).values()];
    if(A==="color"||B==="color"){
      const colorCell=A==="color"?a:b,other=colorCell===a?b:a;
      if(other.piece?.special==="color")return all;
      const color=other.piece?.color;if(!color)return all;
      const targets=all.filter(x=>x.piece?.color===color);
      if(other.piece?.special==="row"||other.piece?.special==="column"){
        targets.forEach((x,i)=>x.piece={...x.piece,special:i%2?"row":"column"});return targets;
      }
      if(other.piece?.special==="area"){targets.forEach(x=>x.piece={...x.piece,special:"area"});return targets}
      return targets;
    }
    if((A==="row"||A==="column")&&(B==="row"||B==="column"))return unique([...row(a),...col(a),...row(b),...col(b)]);
    if((A==="area"&&(B==="row"||B==="column"))||(B==="area"&&(A==="row"||A==="column"))){
      const bomb=A==="area"?a:b;return unique([...area(bomb,1),...row(bomb),...col(bomb)]);
    }
    if(A==="area"&&B==="area")return area(b,2);
    return null;
  }
}

export class LevelValidator{
  static validate(level){
    const errors=[];const {width,height}=level;
    if(!Number.isInteger(width)||width<3||width>20)errors.push("width must be an integer from 3 to 20");
    if(!Number.isInteger(height)||height<3||height>20)errors.push("height must be an integer from 3 to 20");
    if(!Number.isInteger(level.moves)||level.moves<=0)errors.push("moves must be a positive integer");
    if(!Array.isArray(level.colors)||level.colors.length<3)errors.push("at least 3 active colors are required");
    const seen=new Set();
    for(const cell of level.board||[]){
      if(!Number.isInteger(cell.row)||!Number.isInteger(cell.column)||cell.row<0||cell.column<0||cell.row>=height||cell.column>=width)errors.push(`invalid cell coordinate ${cell.row},${cell.column}`);
      const k=key(cell.row,cell.column);if(seen.has(k))errors.push(`duplicate cell definition at ${k}`);seen.add(k);
    }
    const enabledCount=width*height-(level.board||[]).filter(c=>c.enabled===false).length;
    if(enabledCount<3)errors.push("level must contain at least 3 playable cells");
    const portalIds=new Set((level.portals||[]).map(p=>p.id));
    for(const p of level.portals||[])if(!p.id||!p.from||!p.to)errors.push("each portal needs id, from and to");
    if(portalIds.size!==(level.portals||[]).length)errors.push("portal ids must be unique");
    for(const o of level.objectives||[])if(!["collect","remove_blocker","score"].includes(o.type))errors.push(`unsupported objective type: ${o.type}`);
    return {valid:errors.length===0,errors};
  }
}

export class ObjectiveManager{
  constructor(defs=[]){this.items=defs.map((o,i)=>({...o,id:o.id||`objective-${i}`,progress:0}))}
  record(type,payload={}){
    for(const o of this.items){
      if(o.type==="collect"&&type==="PieceDestroyed"&&payload.piece?.color===o.color)o.progress++;
      if(o.type==="remove_blocker"&&type==="BlockerRemoved"&&payload.blocker?.type===o.blocker)o.progress++;
      if(o.type==="score"&&type==="ScoreChanged")o.progress=payload.score||0;
    }
  }
  complete(){return this.items.every(o=>o.progress>=o.count)}
  snapshot(){return this.items.map(o=>({...o,remaining:Math.max(0,o.count-o.progress)}))}
}

export class LegalMoveDetector{
  static getLegalMoves(board){
    const moves=[];const candidates=[[0,1],[1,0]];
    for(const cell of board.playable()){
      if(!cell.piece||cell.locked)continue;
      for(const [dr,dc] of candidates){
        const other=board.get(cell.row+dr,cell.column+dc);if(!other?.enabled||!other.piece||other.locked)continue;
        if(cell.piece.special||other.piece.special){moves.push([{row:cell.row,column:cell.column},{row:other.row,column:other.column}]);continue}
        board.swap(cell,other);const ok=MatchDetector.hasMatch(board);board.swap(cell,other);
        if(ok)moves.push([{row:cell.row,column:cell.column},{row:other.row,column:other.column}]);
      }
    }
    return moves;
  }
}

export class GravitySystem{
  static vector(direction){return dirs[direction]||dirs.down}
  static order(board,direction){
    const cells=board.playable().slice();
    if(direction==="down")cells.sort((a,b)=>b.row-a.row);
    if(direction==="up")cells.sort((a,b)=>a.row-b.row);
    if(direction==="right")cells.sort((a,b)=>b.column-a.column);
    if(direction==="left")cells.sort((a,b)=>a.column-b.column);
    return cells;
  }
  static apply(board,direction="down",portals=[]){
    let moved=false;const [dr,dc]=this.vector(direction);const portalMap=new Map(portals.map(p=>[key(p.from.row,p.from.column),p.to]));
    let changed=true,guard=0;
    while(changed&&guard++<board.width*board.height){
      changed=false;
      for(const cell of this.order(board,direction)){
        if(!cell.piece||cell.blocker?.blocksMovement)continue;
        const toPortal=portalMap.get(key(cell.row,cell.column));
        if(toPortal){
          const dest=board.get(toPortal.row,toPortal.column);
          if(dest?.enabled&&!dest.piece&&!dest.blocker?.blocksMovement){dest.piece=cell.piece;cell.piece=null;changed=moved=true;continue}
        }
        const next=board.get(cell.row+dr,cell.column+dc);
        if(next?.enabled&&!next.piece&&!next.blocker?.blocksMovement){next.piece=cell.piece;cell.piece=null;changed=moved=true}
      }
    }
    return moved;
  }
}

export class SpawnSystem{
  static fill(board,level,rng,{avoidMatches=false}={}){
    const [dr,dc]=GravitySystem.vector(level.gravity||"down");
    const generators=(level.generators||[]).map(g=>({...g,cell:board.get(g.row,g.column)})).filter(g=>g.cell?.enabled);
    const defaultEdge=board.playable().filter(c=>!board.get(c.row-dr,c.column-dc)?.enabled);
    const sources=generators.length?generators.map(g=>g.cell):defaultEdge;
    let spawned=0,guard=0;
    while(guard++<board.width*board.height*4){
      let progress=false;
      for(const cell of sources){
        if(cell.piece||cell.blocker?.blocksMovement)continue;
        const gen=generators.find(g=>g.cell===cell);
        const allowed=gen?.allowedTypes||level.colors;
        const weights=gen?.spawnWeights;
        let color=weights?rng.weighted(weights):rng.pick(allowed);let tries=0;
        do{cell.piece={color,special:null};tries++;if(!avoidMatches||!MatchDetector.hasMatch(board))break;cell.piece=null;color=weights?rng.weighted(weights):rng.pick(allowed)}while(tries<20);
        if(!cell.piece)cell.piece={color:rng.pick(allowed),special:null};
        spawned++;progress=true;GravitySystem.apply(board,level.gravity||"down",level.portals||[]);
      }
      if(!progress)break;
      if(board.playable().every(c=>c.piece||c.blocker?.blocksMovement))break;
    }
    return spawned;
  }
}

export class LevelLoader{
  static async load(url){const res=await fetch(url,{cache:"no-store"});if(!res.ok)throw new Error(`Failed to load level: ${res.status}`);const level=await res.json();this.fromObject(level);return level}
  static fromObject(level){const v=LevelValidator.validate(level);if(!v.valid)throw new Error("Invalid level:\n"+v.errors.join("\n"));return level}
}

export class GameEngine{
  constructor(level,{seed=level.seed??Date.now()}={}){
    LevelLoader.fromObject(level);this.level=structuredClone(level);this.seed=seed;this.rng=new SeededRandom(seed);this.events=new EventBus();
    this.board=new Board(level.width,level.height,level.board||[]);this.state=GameState.IDLE;this.movesRemaining=level.moves;
    this.score=0;this.cascade=0;this.objectives=new ObjectiveManager(level.objectives||[]);this.history=[];this.initialize();
  }
  setState(state){this.state=state;this.events.emit("StateChanged",{state})}
  initialize(){
    this.setState(GameState.SPAWNING);SpawnSystem.fill(this.board,this.level,this.rng,{avoidMatches:true});
    let guard=0;while(MatchDetector.hasMatch(this.board)&&guard++<25)this.reshuffle(false);
    if(!LegalMoveDetector.getLegalMoves(this.board).length)this.reshuffle(false);
    this.setState(GameState.PLAYER_INPUT);this.events.emit("BoardStable",this.snapshot())
  }
  snapshot(){return{state:this.state,movesRemaining:this.movesRemaining,score:this.score,cascade:this.cascade,objectives:this.objectives.snapshot(),seed:this.seed,legalMoves:LegalMoveDetector.getLegalMoves(this.board)}}
  isInputAllowed(){return this.state===GameState.PLAYER_INPUT}
  async swap(a,b){
    if(!this.isInputAllowed())return{ok:false,reason:"busy"};
    const ca=this.board.get(a.row,a.column),cb=this.board.get(b.row,b.column);
    if(!ca?.enabled||!cb?.enabled||!ca.piece||!cb.piece||ca.locked||cb.locked||!adjacent(ca,cb))return{ok:false,reason:"illegal"};
    this.setState(GameState.SWAPPING);this.events.emit("SwapStarted",{a,b});
    const combo=SpecialComboResolver.resolve(ca,cb,this.board);this.board.swap(ca,cb);
    if(!combo&&!MatchDetector.hasMatch(this.board)){this.board.swap(ca,cb);this.events.emit("SwapRejected",{a,b});this.setState(GameState.PLAYER_INPUT);return{ok:false,reason:"no_match"}}
    this.movesRemaining--;this.history.push([a,b]);this.events.emit("MoveMade",{a,b,movesRemaining:this.movesRemaining});
    if(combo)await this.destroyCells(combo,{cause:"special_combo"});
    await this.resolveCascades({preferred:cb});
    return{ok:true};
  }
  specialForGroup(group){
    const longest=Math.max(...group.runs.map(r=>r.cells.length));const axes=new Set(group.runs.map(r=>r.axis));
    if(longest>=5)return"color";if(axes.size>1)return"area";if(longest===4)return group.runs.find(r=>r.cells.length===4)?.axis==="h"?"row":"column";return null;
  }
  async resolveCascades({preferred=null}={}){
    this.cascade=0;let guard=0;
    while(guard++<100){
      this.setState(GameState.MATCH_CHECK);const groups=MatchDetector.groups(this.board);if(!groups.length)break;
      this.cascade++;this.setState(GameState.RESOLVING);this.events.emit("CascadeStarted",{cascade:this.cascade,groups});
      for(const group of groups){
        const special=this.specialForGroup(group);let createAt=null;
        if(special){createAt=group.cells.includes(preferred)?preferred:group.cells[Math.floor(group.cells.length/2)]}
        const targets=group.cells.filter(c=>c!==createAt);await this.destroyCells(targets,{cause:"match",cascade:this.cascade});
        if(createAt){createAt.piece={color:special==="color"?null:group.color,special};this.events.emit("SpecialCreated",{cell:createAt,special})}
      }
      this.setState(GameState.GRAVITY);GravitySystem.apply(this.board,this.level.gravity||"down",this.level.portals||[]);
      this.setState(GameState.SPAWNING);SpawnSystem.fill(this.board,this.level,this.rng);
      preferred=null;
    }
    this.setState(GameState.OBJECTIVE_CHECK);this.events.emit("ObjectivesUpdated",{objectives:this.objectives.snapshot()});
    if(this.objectives.complete()){this.setState(GameState.WIN);this.events.emit("LevelWon",this.snapshot());return}
    if(this.movesRemaining<=0){this.setState(GameState.LOSE);this.events.emit("LevelLost",this.snapshot());return}
    if(!LegalMoveDetector.getLegalMoves(this.board).length)this.reshuffle(true);
    this.setState(GameState.PLAYER_INPUT);this.events.emit("BoardStable",this.snapshot())
  }
  async destroyCells(cells,{cause="match",cascade=0}={}){
    const queue=[...new Map(cells.filter(Boolean).map(c=>[key(c.row,c.column),c])).values()];const destroyed=new Set();
    while(queue.length){
      const cell=queue.shift(),k=key(cell.row,cell.column);if(destroyed.has(k)||!cell.enabled)continue;
      destroyed.add(k);const piece=cell.piece;
      if(piece){
        if(piece.special==="row")queue.push(...this.board.cells[cell.row]);
        if(piece.special==="column")queue.push(...this.board.cells.map(r=>r[cell.column]));
        if(piece.special==="area")queue.push(...this.board.playable().filter(x=>Math.abs(x.row-cell.row)<=1&&Math.abs(x.column-cell.column)<=1));
        if(piece.special==="color"){const color=this.level.colors[this.rng.int(this.level.colors.length)];queue.push(...this.board.playable().filter(x=>x.piece?.color===color))}
        this.objectives.record("PieceDestroyed",{piece});this.events.emit("PieceDestroyed",{cell,piece,cause,cascade});cell.piece=null;this.score+=10*(1+Math.max(0,cascade-1)*0.25);
      }
      this.damageBlocker(cell,cause==="match"?2:1);
      if(cause==="match"){
        for(const n of [[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>this.board.get(cell.row+dr,cell.column+dc)).filter(Boolean))if(n.blocker?.reactsToAdjacentMatch)this.damageBlocker(n,1);
      }
    }
    this.objectives.record("ScoreChanged",{score:this.score});this.events.emit("ScoreChanged",{score:this.score})
  }
  damageBlocker(cell,amount=1){
    const b=cell.blocker;if(!b||!b.removable)return;b.hitPoints-=amount;this.events.emit("BlockerDamaged",{cell,blocker:{...b}});
    if(b.hitPoints<=0){const copy={...b};cell.blocker=null;this.objectives.record("BlockerRemoved",{blocker:copy});this.events.emit("BlockerRemoved",{cell,blocker:copy})}
  }
  reshuffle(emit=true){
    this.setState(GameState.RESHUFFLE);const movable=this.board.playable().filter(c=>c.piece&&!c.locked&&!c.blocker?.blocksMovement);const pieces=movable.map(c=>c.piece);
    let attempts=0;
    do{for(let i=pieces.length-1;i>0;i--){const j=this.rng.int(i+1);[pieces[i],pieces[j]]=[pieces[j],pieces[i]]}movable.forEach((c,i)=>c.piece=pieces[i]);attempts++}
    while((MatchDetector.hasMatch(this.board)||!LegalMoveDetector.getLegalMoves(this.board).length)&&attempts<250);
    if(emit)this.events.emit("Reshuffled",{attempts});return attempts<250;
  }
  replay(){return{level:this.level.id,seed:this.seed,moves:structuredClone(this.history)}}
}
