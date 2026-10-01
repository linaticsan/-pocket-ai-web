export class AnalyticsService{
  constructor(provider=new LocalAnalyticsProvider()){this.provider=provider}
  track(event,payload={}){return this.provider.track({event,timestamp:Date.now(),...payload})}
}
export class LocalAnalyticsProvider{
  constructor(key="luma-analytics"){this.key=key}
  track(entry){const rows=JSON.parse(localStorage.getItem(this.key)||"[]");rows.push(entry);if(rows.length>500)rows.splice(0,rows.length-500);localStorage.setItem(this.key,JSON.stringify(rows));return entry}
  read(){return JSON.parse(localStorage.getItem(this.key)||"[]")}
  clear(){localStorage.removeItem(this.key)}
}
export class PlayerProgressStore{
  constructor(key="luma-progress-v1"){this.key=key}
  load(){return{currentUnlockedLevel:1,stars:{},bestScore:{},boosterInventory:{},settings:{sound:true},achievements:[],...JSON.parse(localStorage.getItem(this.key)||"{}")}}
  save(patch){const next={...this.load(),...patch};localStorage.setItem(this.key,JSON.stringify(next));return next}
  completeLevel(levelId,{score=0,stars=1}={}){
    const p=this.load(),id=String(levelId);
    p.currentUnlockedLevel=Math.max(p.currentUnlockedLevel,Number(levelId)+1);
    p.stars[id]=Math.max(p.stars[id]||0,stars);p.bestScore[id]=Math.max(p.bestScore[id]||0,Math.floor(score));
    return this.save(p);
  }
}
export class LocalProgressAPI{
  constructor(store=new PlayerProgressStore()){this.store=store}
  async getProfile(){return this.store.load()}
  async saveProfile(patch){return this.store.save(patch)}
}
export class LocalConfigAPI{
  async getLevel(url){const r=await fetch(url);if(!r.ok)throw new Error("Config load failed");return r.json()}
}
export class LocalEventsAPI{
  constructor(analytics=new AnalyticsService()){this.analytics=analytics}
  async send(event,payload){return this.analytics.track(event,payload)}
}
