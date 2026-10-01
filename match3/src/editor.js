import{LevelValidator}from"./core.js";import{simulateLevel}from"./simulation.js";

const $=s=>document.querySelector(s);
const boardEl=$("[data-editor-board]");
const state={
  id:90001,name:"Untitled Grove",width:8,height:8,moves:25,colors:["red","blue","green","yellow","purple"],gravity:"down",
  objectives:[{type:"collect",color:"blue",count:15}],board:[],portals:[],generators:[],difficultyMetadata:{targetDifficulty:"medium"}
};
let tool="erase",undo=[],redo=[];

function snap(){undo.push(JSON.stringify(state));if(undo.length>100)undo.shift();redo=[]}
function restore(json){Object.assign(state,JSON.parse(json));syncInputs();render()}
function cellDef(r,c,create=true){let x=state.board.find(v=>v.row===r&&v.column===c);if(!x&&create){x={row:r,column:c};state.board.push(x)}return x}
function cleanCell(x){if(x&&x.enabled!==false&&!x.blocker&&!x.piece&&!x.locked){state.board=state.board.filter(v=>v!==x)}}
function paint(r,c){
  snap();let x=cellDef(r,c);
  if(tool==="disabled"){x.enabled=x.enabled===false?true:false}
  else if(tool==="ice"){x.enabled=true;x.blocker={type:"ice",hitPoints:1,removable:true,blocksMovement:false,blocksMatching:false,reactsToAdjacentMatch:true,reactsToExplosion:true}}
  else if(tool==="crate"){x.enabled=true;x.blocker={type:"crate",hitPoints:2,removable:true,blocksMovement:true,blocksMatching:true,reactsToAdjacentMatch:true,reactsToExplosion:true}}
  else if(tool==="locked"){x.enabled=true;x.locked=!x.locked}
  else if(tool.startsWith("piece:")){x.enabled=true;x.piece={color:tool.split(":")[1],special:null}}
  else if(tool==="erase"){state.board=state.board.filter(v=>!(v.row===r&&v.column===c))}
  cleanCell(x);render();
}
function render(){
  boardEl.style.setProperty("--cols",state.width);boardEl.innerHTML="";
  for(let r=0;r<state.height;r++)for(let c=0;c<state.width;c++){
    const x=cellDef(r,c,false)||{},b=document.createElement("button");b.type="button";b.className="editor-cell";
    if(x.enabled===false)b.classList.add("disabled");if(x.blocker)b.classList.add("has-blocker");if(x.locked)b.classList.add("locked");
    b.innerHTML=`<span>${x.piece?.color?.[0]?.toUpperCase()||""}</span><small>${x.blocker?x.blocker.type+(x.blocker.hitPoints>1?" "+x.blocker.hitPoints:""):x.enabled===false?"OFF":x.locked?"LOCK":""}</small>`;
    let down=false;b.addEventListener("pointerdown",e=>{down=true;b.setPointerCapture?.(e.pointerId);paint(r,c)});b.addEventListener("pointerenter",()=>{if(down)paint(r,c)});b.addEventListener("pointerup",()=>down=false);
    boardEl.append(b);
  }
  const val=LevelValidator.validate(state);$("[data-validation]").textContent=val.valid?"Valid level":val.errors.join("\n");
  $("[data-json]").value=JSON.stringify(state,null,2);
}
function syncInputs(){
  for(const k of["name","width","height","moves"])$("[name="+k+"]").value=state[k];
  $("[name=gravity]").value=state.gravity;$("[name=colors]").value=state.colors.length;
}
function readInputs(){
  snap();state.name=$("[name=name]").value||"Untitled Grove";state.width=Number($("[name=width]").value);state.height=Number($("[name=height]").value);state.moves=Number($("[name=moves]").value);
  state.gravity=$("[name=gravity]").value;state.colors=["red","blue","green","yellow","purple","orange"].slice(0,Number($("[name=colors]").value));
  state.board=state.board.filter(x=>x.row<state.height&&x.column<state.width);render();
}
document.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>{tool=b.dataset.tool;document.querySelectorAll("[data-tool]").forEach(x=>x.classList.toggle("active",x===b))}));
document.querySelectorAll("[data-prop]").forEach(i=>i.addEventListener("change",readInputs));
$("[data-undo]").addEventListener("click",()=>{if(!undo.length)return;redo.push(JSON.stringify(state));restore(undo.pop())});
$("[data-redo]").addEventListener("click",()=>{if(!redo.length)return;undo.push(JSON.stringify(state));restore(redo.pop())});
$("[data-clear]").addEventListener("click",()=>{snap();state.board=[];render()});
$("[data-validate]").addEventListener("click",()=>render());
$("[data-copy]").addEventListener("click",async()=>{await navigator.clipboard.writeText(JSON.stringify(state,null,2));$("[data-copy]").textContent="Copied";setTimeout(()=>$("[data-copy]").textContent="Copy JSON",900)});
$("[data-playtest]").addEventListener("click",()=>{const v=LevelValidator.validate(state);if(!v.valid){render();return}localStorage.setItem("luma-draft-level",JSON.stringify(state));location.href="./index.html?draft=1"});
$("[data-simulate]").addEventListener("click",async()=>{const out=$("[data-sim-result]");out.textContent="Simulating 100 attempts…";try{const v=LevelValidator.validate(state);if(!v.valid)throw new Error(v.errors.join("\n"));const result=await simulateLevel(structuredClone(state),100);out.textContent=JSON.stringify(result,null,2)}catch(e){out.textContent=e.message}});
syncInputs();render();
