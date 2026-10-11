function normalizeGearEnhancements(raw){
  const valid=(k,max)=>Number.isInteger(raw?.[k])&&raw[k]>=0&&raw[k]<=max?raw[k]:0;
  return {temper:valid('temper',10),addedSockets:valid('addedSockets',3)};
}
function temperedGearStats(item){
  const out={...item?.stats},rank=normalizeGearEnhancements(item).temper;
  for(const k of ['atk','def','maxHp','maxMana','manaRegen','dmgMul','crit','cdmg','spd'])
    if(Number.isFinite(out[k])&&out[k]>0)out[k]*=1+rank*.02;
  return out;
}
function artificerItem(id){
  if(typeof id!=='string')return null;
  return Object.values(G.gear||{}).find(i=>i?.id===id)||(G.gearInventory||[]).find(i=>i?.id===id)||null;
}
function artificerGold(){
  const reserve=G.purchaseRules?.reserve;
  return Math.max(0,G.gold-(Number.isFinite(reserve)&&reserve>0?reserve:0));
}
function temperPreview(id,max=false){
  const item=artificerItem(id),from=normalizeGearEnhancements(item).temper;
  const cap=Math.min(10,2+2*Math.max(0,Number.isInteger(G.unlocked)?G.unlocked:0));
  const base=item?gearSellPrice(item)*5:0,price=r=>Math.floor(base*1.8**r);
  const available=!!item&&from<cap&&Number.isFinite(base)&&base>0,nextCost=available?price(from):0;
  let ranks=available?1:0,cost=nextCost;
  if(max===true){
    ranks=0;cost=0;
    while(available&&from+ranks<cap){const next=price(from+ranks);if(cost+next>artificerGold())break;cost+=next;ranks++;}
  }
  return {ranks,cost,from,to:from+ranks,cap,nextCost,available,affordable:ranks>0&&cost<=artificerGold()};
}
function temperGear(id,max=false){
  const item=artificerItem(id),p=temperPreview(id,max);
  if(!item||!p.affordable||artificerItem(id)!==item||p.cost>artificerGold())return 0;
  G.gold-=p.cost;item.temper=p.to;recomputeStats();
  logLine(`Tempered ${gearLabel(item)} to +${p.to} for ${fmtG(p.cost)}.`,'sys');
  return p.ranks;
}
function socketExpansionPreview(id){
  const item=artificerItem(id),count=item?.sockets?.length||0,addedSockets=normalizeGearEnhancements(item).addedSockets;
  const room=!!item&&Array.isArray(item.sockets)&&count<8&&addedSockets<3&&addedSockets<=count;
  const cost=room?Math.floor(gearSellPrice(item)*50*2**(count-addedSockets)*4**addedSockets):0;
  const available=room&&Number.isFinite(cost)&&cost>0;
  return {cost:available?cost:0,available,affordable:available&&cost<=artificerGold(),count,addedSockets,cap:8};
}
function addGearSocket(id){
  const item=artificerItem(id),p=socketExpansionPreview(id);
  if(!item||!p.affordable||artificerItem(id)!==item||p.cost>artificerGold())return false;
  G.gold-=p.cost;item.sockets.push(null);item.addedSockets=p.addedSockets+1;recomputeStats();
  logLine(`Added a socket to ${gearLabel(item)} for ${fmtG(p.cost)}.`,'sys');return true;
}
