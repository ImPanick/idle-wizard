// Gold-funded spell practice: fixed paths, bounded ranks, no bought cast credit.
const REFINEMENT_POWER_IDS='emberfamiliar claysentinel hexledger briarpatch bloom wildharvest unison counterpoint clockworkchorus finalcadence contradiction cometprocession'.split(' ');
function refinementPaths(sp){
  if(!sp)return [];
  const paths=[];
  if(sp.dmg>0||sp.heal>0||sp.buff&&['atk','def','maxHp','maxMana','dmgMul','spd','crit','cdmg','manaRegen'].includes(sp.buff.stat)||REFINEMENT_POWER_IDS.includes(sp.id))paths.push('potency');
  if(sp.cost>0)paths.push('efficiency');
  return paths;
}
function normalizeRefinements(raw,state){
  const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  for(const sp of SPELLS){
    const r=raw[sp.id];
    if(!state?.knownSpells?.includes(sp.id)||!r||!refinementPaths(sp).includes(r.path)||!Number.isInteger(r.rank)||r.rank<1||r.rank>10)continue;
    out[sp.id]={path:r.path,rank:r.rank};
  }
  return out;
}
function refinedSpell(sp,state=G){
  if(!sp||sp._refined)return sp;
  const r=state.refinements?.[sp.id];
  if(!r||!Number.isInteger(r.rank)||r.rank<1||r.rank>10||!refinementPaths(sp).includes(r.path)||!spellUsable(sp,state))return sp;
  const power=r.path==='potency'?1+.02*r.rank:1,result={...sp,_refined:true,_refinementPower:power};
  if(r.path==='efficiency')result.cost=sp.cost>0?Math.max(1,sp.cost*(1-.015*r.rank)):0;
  else{
    if(sp.dmg)result.dmg=sp.dmg*power;
    if(sp.heal)result.heal=sp.heal*power;
    if(sp.dot)result.dot={...sp.dot,dps:sp.dot.dps*power};
    if(sp.buff)result.buff={...sp.buff,amt:sp.buff.amt*power};
  }
  return result;
}
function refinementPreview(id,path,max=false){
  const sp=SPELLS.find(s=>s.id===id),r=G.refinements?.[id],from=r?.rank||0,cap=Math.min(10,2+2*G.unlocked);
  const available=!!sp&&spellUsable(sp)&&refinementPaths(sp).includes(path)&&(!from||r.path===path)&&from<cap;
  const p={ranks:0,cost:0,from,to:from,cap,available,affordable:false,path};if(!available)return p;
  const reserve=Number.isFinite(G.purchaseRules?.reserve)?Math.max(0,G.purchaseRules.reserve):0,budget=Math.max(0,G.gold-reserve);
  for(let rank=from;rank<cap;rank++){
    const cost=Math.round(Math.max(100,sp.learnCost*.5)*Math.pow(2.2,rank));
    if(max&&p.cost+cost>budget)break;
    p.ranks++;p.cost+=cost;p.to=rank+1;if(!max)break;
  }
  p.affordable=p.ranks>0&&p.cost<=budget;return p;
}
function purchaseRefinement(id,path,max=false){
  const p=refinementPreview(id,path,max);if(!p.available||!p.affordable)return 0;
  G.refinements??={};G.refinements[id]={path,rank:p.to};G.gold-=p.cost;
  logLine(`Refined ${SPELLS.find(s=>s.id===id).name}: ${path} ${p.from} -> ${p.to} | ${fmtG(p.cost)}.`,'sys');return p.ranks;
}
