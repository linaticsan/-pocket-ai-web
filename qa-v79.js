// Pocket AI V79 — non-destructive boot QA
(() => {
  const requiredIds=['home','chat','library','files','local','github','surface','bottomNav','settingsDialog','commandDialog','chatForm','prompt'];
  const requiredGlobals=['PocketV39','PocketTheme','PocketLocalAI'];
  function run(){
    const results=[];
    for(const id of requiredIds)results.push({name:'#'+id,ok:!!document.getElementById(id)});
    for(const name of requiredGlobals)results.push({name:'window.'+name,ok:!!window[name]});
    const nav=[...document.querySelectorAll('#bottomNav [data-go]')].map(x=>x.dataset.go);
    for(const id of ['home','chat','library','files'])results.push({name:'nav:'+id,ok:nav.includes(id)});
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id),dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
    results.push({name:'duplicate ids',ok:dup.length===0,detail:[...new Set(dup)]});
    const visible=[...document.querySelectorAll('.view.active:not([hidden])')];
    results.push({name:'single active view',ok:visible.length<=1,detail:visible.map(x=>x.id)});
    const failed=results.filter(x=>!x.ok);
    document.documentElement.dataset.qa=failed.length?'failed':'passed';
    if(failed.length)console.warn('Pocket AI QA failed',failed); else console.info('Pocket AI QA passed',results);
    return {ok:failed.length===0,results};
  }
  window.PocketQA={run};
  setTimeout(run,2600);
})();