import{GameEngine,LegalMoveDetector}from"./core.js";

export async function simulateLevel(level,attempts=100){
  let wins=0,losses=0,totalMoves=0,totalReshuffles=0,totalSpecials=0;
  for(let i=0;i<attempts;i++){
    const engine=new GameEngine(level,{seed:(level.seed||1)+i});
    engine.events.on("Reshuffled",()=>totalReshuffles++);
    engine.events.on("SpecialCreated",()=>totalSpecials++);
    let safety=level.moves*3+20;
    while(engine.state!=="WIN"&&engine.state!=="LOSE"&&safety-->0){
      const legal=LegalMoveDetector.getLegalMoves(engine.board);
      if(!legal.length){engine.reshuffle(true);continue}
      let best=legal[0],bestScore=-Infinity;
      for(const move of legal){
        const [a,b]=move,ca=engine.board.get(a.row,a.column),cb=engine.board.get(b.row,b.column);
        let s=0;
        if(ca.piece?.special||cb.piece?.special)s+=100;
        const centerR=(level.height-1)/2,centerC=(level.width-1)/2;
        s-=Math.abs(b.row-centerR)+Math.abs(b.column-centerC);
        if(s>bestScore){bestScore=s;best=move}
      }
      await engine.swap(...best);
    }
    totalMoves+=level.moves-engine.movesRemaining;
    if(engine.state==="WIN")wins++;else losses++;
  }
  const winRate=wins/attempts;
  return{attempts,wins,losses,winRate,averageMovesUsed:totalMoves/attempts,reshufflesPerAttempt:totalReshuffles/attempts,averageSpecialPiecesCreated:totalSpecials/attempts,difficulty:estimateDifficulty(level,winRate)};
}

export function estimateDifficulty(level,winRate){
  let structural=0;
  structural+=(level.colors.length-4)*0.6;
  structural+=(level.objectives?.length||1)*0.35;
  structural+=(level.board||[]).filter(c=>c.blocker).reduce((s,c)=>s+(c.blocker.hitPoints||1)*0.08,0);
  structural+=(level.board||[]).filter(c=>c.enabled===false).length*0.02;
  structural+=(level.portals?.length||0)*0.2;
  const sim=1-Math.max(0,Math.min(1,winRate));
  const index=sim*7+structural;
  return{index:Number(index.toFixed(2)),label:index<2.5?"easy":index<5?"medium":index<7.5?"hard":"very hard"};
}
