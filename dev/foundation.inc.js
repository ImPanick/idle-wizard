// Shared clocks, inventory capacity, and resumable world checkpoints.
const GEAR_CAPACITY=5000, SAVE_CODE_LIMIT=32*1024*1024;
function inventoryRoom(){
  if(G.gearInventory.length<GEAR_CAPACITY)return true;
  logLine('Inventory full (5000). Salvage or combine items to make room.','sys');return false;
}
function storeGear(item,allowAutoSell=false){
  if(allowAutoSell===true&&autoSellLoot(item))return false;
  if(G.gearInventory.length<GEAR_CAPACITY){G.gearInventory.push(item);return true;}
  if(item.legendary)return false;
  const dust=10*(item.tier+1)*(RARITY_ORDER.indexOf(item.rarity)+1);
  G.materials.dust+=dust;
  logLine(`Inventory full: ${item.name} salvaged for ${dust} dust.`,'loot');return false;
}
function gameRandom(){
  G.rng=(Math.imul((G.rng??123456789)>>>0,1664525)+1013904223)>>>0;
  return G.rng/4294967296;
}
function settleClockForAction(){
  if(document.hidden||_pageHidden||_loopSuspended)return;
  gameTick();
}
function gameSpeed(){return GAME_SPEEDS.includes(G.speed)?G.speed:1;}
function shiftLegacyClock(seconds){
  const c=G.expeditions?.legacyClaim;
  if(c)c.deadline=Math.max(0,c.deadline-seconds*(gameSpeed()-1)*1000);
}
function accrueGameTime(seconds){shiftLegacyClock(seconds);_tickAccumulator+=seconds*gameSpeed();}
function applyAway(seconds,debt=0){
  shiftLegacyClock(seconds);
  const summary=applyIdle(seconds*gameSpeed()+debt);
  if(summary){summary.wallSeconds=seconds;summary.speed=gameSpeed();}
  return summary;
}
function setGameSpeed(value){
  if(!GAME_SPEEDS.includes(value))return false;
  settleClockForAction();G.speed=value;renderGameSpeed();return true;
}
function renderGameSpeed(){
  const speed=gameSpeed(),select=$('speed-select'),help=$('speed-help'),button=$('btn-settings');
  if(select)select.value=String(speed);
  if(button)button.textContent=`[::] Settings | ${speed}x`;
  if(help)help.textContent=`1 real second = ${speed} game second${speed===1?'':'s'}. Timers show game time. Away progress is capped at 12 game hours per absence. Export to keep your journey and speed.`;
}
function advanceAssignmentResources(seconds,flow={}){
  if(seconds<=0)return;
  advanceCommissions(0);
  const goldRate=G.baseStats.goldPerSec||0,initialGold=G.gold;
  if(goldRate)G.gold+=goldRate*seconds;
  for(const g of GOLEM_TYPES)G.materials[g.yields]+=g.rate*(G.golems[g.id]||0)*seconds;
  if(G.ritual.active&&isRitualUnlocked()&&G.hero.alive){
    const r=ritualCfg();
    const manaRate=(flow.regeneration||0)-(flow.combatManaPerSec||0);
    const initialMana=flow.initialMana??G.hero.mana;
    const goldTime=r.goldCost>goldRate?initialGold/(r.goldCost-goldRate):seconds;
    const manaTime=r.manaCost>manaRate?initialMana/(r.manaCost-manaRate):seconds;
    const time=Math.max(0,Math.min(seconds,goldTime,manaTime));
    G.gold=Math.max(0,G.gold-r.goldCost*time);G.hero.mana=Math.max(0,G.hero.mana-r.manaCost*time);
    const xp=ritualXpPerSec()*time;G.hero.xp+=xp;
    const els=ritualEquippedElements();
    for(const el of els){
      G.elementXp[el]+=xp*RITUAL_EL_FORK*(G.baseStats.elXpMul||1)/els.length;
      while(G.elementXp[el]>=xpForElement(G.elements[el])&&G.elements[el]<1000){G.elementXp[el]-=xpForElement(G.elements[el]);G.elements[el]++;}
    }
    if(time+1e-7<seconds){G.ritual.active=false;logLine('Ritual ended: resources reserved for the journey.','sys');}
  }
  advanceIdleProjects(seconds);
  checkLevelUp({allowDungeon:false});
}
function assignmentAilmentDps(){return (G.hero.ailments||[]).reduce((sum,a)=>sum+(a.remaining>0?(a.dps||0):0),0);}
function nextAssignmentResourceBoundary(profile){
  advanceCommissions(0);
  runPurchaseRules();
  let next=Infinity;
  if(G.ritual.active&&isRitualUnlocked()&&G.hero.alive){
    const r=ritualCfg(),goldDrain=r.goldCost-(G.baseStats.goldPerSec||0),manaDrain=r.manaCost-(profile.manaRegen-profile.manaPerSec);
    if(goldDrain>0)next=Math.min(next,G.gold/goldDrain);
    if(manaDrain>0)next=Math.min(next,G.hero.mana/manaDrain);
    const rate=ritualXpPerSec();if(rate>0&&G.hero.lvl<10000)next=Math.min(next,Math.max(0,xpForLevel(G.hero.lvl)-G.hero.xp)/rate);
  }
  const speed=G.baseStats.researchSpeed||1;
  if(G.researchActive)next=Math.min(next,G.researchActive.timeLeft/speed);
  const goldRate=(G.baseStats.goldPerSec||0)-(G.ritual.active?ritualCfg().goldCost:0);
  next=Math.min(next,commissionBoundarySeconds(goldRate));
  next=Math.min(next,purchaseRuleBoundarySeconds(goldRate));
  if(!G.researchActive&&isAutoResearch()&&goldRate>0){
    const project=RESEARCH_PROJECTS.filter(r=>!G.researchCompleted[r.id]&&r.cost>G.gold).sort((a,b)=>a.cost-b.cost)[0];
    if(project)next=Math.min(next,(project.cost-G.gold)/goldRate);
  }
  return Number.isFinite(next)?Math.max(1,Math.ceil(next*1000-1e-8)):Infinity;
}
function creditAssignmentSpellProgress(profile,seconds,actualDamageHp){
  const e=initExpeditions();e.castRemainders??={};G.spellMastery??={};
  for(const cast of profile.spells||[]){
    if(!SPELLS.some(sp=>sp.id===cast.id))continue;
    const count=(e.castRemainders[cast.id]||0)+cast.rate*seconds,whole=Math.floor(count+1e-9);
    e.castRemainders[cast.id]=Math.max(0,count-whole);
    G.spellMastery[cast.id]=Math.min(1e12,(G.spellMastery[cast.id]||0)+whole);
  }
  const scale=Number.isFinite(actualDamageHp)?Math.min(1,Math.max(0,actualDamageHp)/Math.max(.1,profile.dps*seconds)):1;
  for(const [el,rate] of Object.entries(profile.affinityPerSec||{})){
    if(!schoolUnlocked(el)||!Number.isFinite(rate)||rate<0)continue;
    G.elementXp[el]+=rate*seconds*scale;
    while(G.elements[el]<1000&&G.elementXp[el]>=xpForElement(G.elements[el])){G.elementXp[el]-=xpForElement(G.elements[el]);G.elements[el]++;}
  }
}
function ageAssignmentEffects(seconds){
  if(seconds<=0)return;
  const buffCount=G.buffs.length,ailmentCount=(G.hero.ailments||[]).length;
  for(const id in G.spellCd)G.spellCd[id]=Math.max(0,G.spellCd[id]-seconds);
  G.buffs=G.buffs.map(b=>({...b,dur:b.dur-seconds})).filter(b=>b.dur>0);
  G.hero.ailments=(G.hero.ailments||[]).map(a=>({...a,remaining:a.remaining-seconds})).filter(a=>a.remaining>0);
  if(typeof ageMagic==='function')ageMagic(seconds,0);
  if(G.buffs.length!==buffCount||(G.hero.ailments||[]).length!==ailmentCount)recomputeStats();
}
function applyExpeditionIdle(elapsed,seconds){
  const before={gold:G.gold,xp:totalLifetimeXp(),materials:{...G.materials}};
  advanceLegacyCrusade(Date.now());
  const result=advanceExpedition(seconds);
  let rest=result?.unusedSeconds||0,world=null;
  if(rest>0&&!expeditionActive())world=applyIdle(rest);
  if(elapsed>seconds)ageAssignmentEffects(elapsed-seconds);
  const materials={};for(const k of ['dust','crystal','gem','herb'])materials[k]=Math.max(0,G.materials[k]-before.materials[k]);
  const summary={seconds,gold:Math.max(0,G.gold-before.gold),xp:Math.max(0,totalLifetimeXp()-before.xp),kills:world?.kills||0,materials,
    expeditionCircuits:result?.circuits||0,expeditionFailures:result?.failures||0,
    estimateNote:`Expeditions: ${result?.circuits||0} circuits completed, ${result?.failures||0} retreats. Check Journal for discoveries.`};
  return summary;
}
function worldCheckpoint(){
  if(!G.map||G.inDungeon||G.trial.inTrial)return null;
  const refs=ZONES[G.zoneIdx].enemies;
  const mobs=G.mobs.slice(0,8).map(e=>({
    ref:e.isBoss?-1:refs.findIndex(r=>r.name===e.ref.name),x:e.x,y:e.y,isBoss:!!e.isBoss,
    hp:e.hp,atkCd:e.atkCd||0,slowed:e.slowed||0,
    dotTimers:e.dotTimers||[],statuses:e.statuses||{},magic:typeof packEnemyMagic==='function'?packEnemyMagic(e):null,
  }));
  if(mobs.some(e=>e.ref<0&&!e.isBoss))return null;
  return {map:G.map.map(row=>row.join('')),pos:{...G.hero.pos},mobs,
    chests:G.chests.map(c=>({x:c.x,y:c.y,tier:c.tier,opened:!!c.opened,openedTtl:c.openedTtl||0})),enemy:G.enemy?G.mobs.indexOf(G.enemy):-1,
    bossActive:G.bossActive,heroAtkCd:G.heroAtkCd||0,enemyAtkCd:G.enemyAtkCd||0};
}
function normalizeWorld(raw,state){
  if(!raw)return null;
  if(typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid world checkpoint.');
  const palette=ZONES[state.zoneIdx].palette,chars=new Set(Object.values(palette));
  const n=(x,lo,hi)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)throw Error('Invalid world checkpoint value.');return x;};
  const tile=p=>{if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y))throw Error('Invalid world position.');return {x:n(p.x,1,MAP_W-2),y:n(p.y,1,MAP_H-2)};};
  if(!Array.isArray(raw.map)||raw.map.length!==MAP_H||raw.map.some(row=>typeof row!=='string'||row.length!==MAP_W||[...row].some(ch=>!chars.has(ch))))throw Error('Invalid world map.');
  const map=raw.map.map(row=>row.split('')),pos=tile(raw.pos);
  if(map[pos.y][pos.x]===palette.wall)throw Error('World position is blocked.');
  if(!Array.isArray(raw.mobs)||raw.mobs.length>8||!Array.isArray(raw.chests)||raw.chests.length>40)throw Error('Invalid world contents.');
  const mobs=raw.mobs.map(e=>{
    const p=tile(e);
    if(map[p.y][p.x]===palette.wall||!Number.isInteger(e.ref)||e.ref< -1||e.ref>=ZONES[state.zoneIdx].enemies.length||((e.ref===-1)!==(e.isBoss===true)))throw Error('Invalid world enemy.');
    const dotTimers=(e.dotTimers||[]);
    if(!Array.isArray(dotTimers)||dotTimers.length>80)throw Error('Invalid enemy effects.');
    const dots=dotTimers.map(d=>{
      if(!SPELLS.some(s=>s.id===d.spellId)||!ELEMENTS.includes(d.element))throw Error('Invalid enemy effect.');
      return {spellId:d.spellId,element:d.element,dps:n(d.dps,0,1e100),remaining:n(d.remaining,0,600)};
    });
    const statuses={};for(const id of ['chilled','soaked','fractured'])if(e.statuses?.[id])statuses[id]=n(e.statuses[id],0,600);
    return {...p,ref:e.ref,isBoss:e.isBoss===true,hp:n(e.hp,0,1e100),atkCd:n(e.atkCd||0,0,600),slowed:n(e.slowed||0,0,600),dotTimers:dots,statuses,magic:e.magic||null};
  });
  const chests=raw.chests.map(c=>{
    const p=tile(c);if(!Object.hasOwn(CHEST_TIERS,c.tier)||map[p.y][p.x]===palette.wall)throw Error('Invalid world chest.');
    return {...p,tier:c.tier,opened:c.opened===true,openedTtl:n(c.openedTtl||0,0,60)};
  });
  const enemy=n(raw.enemy??-1,-1,mobs.length-1);if(!Number.isInteger(enemy))throw Error('Invalid active enemy.');
  return {map,pos,mobs,chests,enemy,bossActive:raw.bossActive===true,heroAtkCd:n(raw.heroAtkCd||0,0,600),enemyAtkCd:n(raw.enemyAtkCd||0,0,600)};
}
function restoreWorld(saved){
  if(!saved){genMap();return;}
  G.map=saved.map;G.hero.pos=saved.pos;G.chests=saved.chests;G.loot=[];
  G.mobs=saved.mobs.map(raw=>{
    const ref=raw.isBoss?ZONES[G.zoneIdx].boss:ZONES[G.zoneIdx].enemies[raw.ref];
    const e=makeEnemy(ref,raw.x,raw.y,raw.isBoss);
    e.hp=Math.min(e.maxHp,raw.hp);e.atkCd=raw.atkCd;e.slowed=raw.slowed;e.dotTimers=raw.dotTimers;e.statuses=raw.statuses;
    if(typeof unpackEnemyMagic==='function')e.magic=unpackEnemyMagic(raw.magic);
    return e;
  });
  G.enemy=saved.enemy>=0?G.mobs[saved.enemy]:null;G.bossActive=saved.bossActive;
  G.heroAtkCd=saved.heroAtkCd;G.enemyAtkCd=saved.enemyAtkCd;
}
