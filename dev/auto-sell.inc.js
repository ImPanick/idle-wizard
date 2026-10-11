// Optional loot rules. Selection is an exact tier AND rarity intersection.
function normalizeAutoSell(raw){
  const valid=!!raw&&typeof raw==='object'&&!Array.isArray(raw);
  return {enabled:valid&&raw.enabled===true,
    tiers:valid&&Array.isArray(raw.tiers)?[...new Set(raw.tiers.filter(t=>Number.isInteger(t)&&t>=0&&t<=5))]:[],
    rarities:valid&&Array.isArray(raw.rarities)?[...new Set(raw.rarities.filter(r=>RARITY_ORDER.includes(r)))]:[]};
}
function autoSellEligible(item,state=G){
  const rule=state.autoSell;
  if(!item||item.legendary||rule?.enabled!==true||!Array.isArray(rule.tiers)||!Array.isArray(rule.rarities)
    ||!Number.isInteger(item.tier)||item.tier<0||item.tier>5||!RARITY_ORDER.includes(item.rarity)
    ||!rule.tiers.includes(item.tier)||!rule.rarities.includes(item.rarity))return false;
  return !Object.values(state.gear||{}).some(g=>g&&(g===item||item.id!=null&&g.id===item.id));
}
let _autoSellPending={count:0,gold:0,gems:0},_autoSellState=null;
function resetAutoSellSummary(){_autoSellPending={count:0,gold:0,gems:0};_autoSellState=G;}
function autoSellLoot(item){
  if(!autoSellEligible(item))return false;
  if(_autoSellState!==G)resetAutoSellSummary();
  const gold=gearSellPrice(item),gems=refundGearGems(item);
  earnGold(gold);_autoSellPending.count++;_autoSellPending.gold+=gold;_autoSellPending.gems+=gems;
  return true;
}
function flushAutoSellSummary(){
  if(_autoSellState!==G)resetAutoSellSummary();
  const result=_autoSellPending;resetAutoSellSummary();
  if(result.count)logLine(`Auto-sold ${result.count} gear for ${fmtG(result.gold)} | ${result.gems} socketed gems returned.`,'sys');
  return result;
}
