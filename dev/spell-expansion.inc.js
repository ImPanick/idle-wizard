// SPELL DISCIPLINES. This source is embedded in the single-file release.
const SCHOOL_REGISTRY={
  fire:{gate:0,color:'#f69b70',abbr:'F'},water:{gate:0,color:'#79c5e4',abbr:'W'},
  earth:{gate:0,color:'#c4ac7a',abbr:'E'},air:{gate:0,color:'#a2c9d0',abbr:'A'},
  light:{gate:0,color:'#eee3a5',abbr:'L'},shadow:{gate:0,color:'#b59ad4',abbr:'S'},
  blood:{gate:0,color:'#e77c90',abbr:'B'},arcane:{gate:1,color:'#c3a6f0',abbr:'Ar'},
  nature:{gate:0,color:'#a0ce83',abbr:'N',discovery:'nature'},
  resonance:{gate:2,color:'#e3bc82',abbr:'R'},chaos:{gate:3,color:'#e8a4cf',abbr:'Ch'},
  cosmic:{gate:5,color:'#a6b4ff',abbr:'Co'}
};
Object.assign(EL_INFO,{
  nature:{name:'Nature',glyph:'♣',desc:'Grow Seeds; harvest life or damage.'},
  resonance:{name:'Resonance',glyph:'♫',desc:'Spend the last three casting notes.'},
  chaos:{name:'Chaos',glyph:'⚄',desc:'Read and manipulate a saved outcome sequence.'},
  cosmic:{name:'Cosmic',glyph:'☄',desc:'Finite orbits and delayed consequences.'}
});
for(const id of Object.keys(SCHOOL_REGISTRY)){
  if(!ELEMENTS.includes(id))ELEMENTS.push(id);
  EL_INFO[id].color=SCHOOL_REGISTRY[id].color;
  EL_INFO[id].abbr=SCHOOL_REGISTRY[id].abbr;
  EL_MATCHUP[id]??={strong:null,weak:null};
  G.elements[id]??=0;G.elementXp[id]??=0;
}
function schoolUnlocked(id,state=G){
  const school=SCHOOL_REGISTRY[id];
  return !!school&&(state.awakenCount||0)>=school.gate
    &&(!school.discovery||!!state.expeditions?.discoveries?.[school.discovery]);
}
function visibleSchools(state=G){return ELEMENTS.filter(id=>schoolUnlocked(id,state));}
function spellUsable(value,state=G){
  const sp=typeof value==='string'?SPELLS.find(s=>s.id===value):value;
  return !!sp&&schoolUnlocked(sp.element,state)&&state.knownSpells.includes(sp.id);
}
function activeEquippedSpells(){return G.equippedSpells.slice(0,maxSpellSlots()).map(id=>SPELLS.find(s=>s.id===id)).filter(sp=>spellUsable(sp)).map(sp=>refinedSpell(sp));}
const EXPANSION_SPELLS=[
  ['emberfamiliar','Ember Familiar','fire',18,0,24,1200,'One ember sprite feeds burns for 12s. Its pulses cannot trigger reactions.','summon'],
  ['purifyingcurrent','Purifying Current','water',14,0,9,1500,'Cleanse one damaging ailment; Soak the target only when cleansing succeeds.','utility'],
  ['claysentinel','Clay Sentinel','earth',26,0,24,2200,'A finite guardian intercepts up to three attacks for 14s.','summon'],
  ['draft','Draft','air',12,0,8,900,'Draw two nearby ordinary foes one walkable tile toward the target.','utility'],
  ['luminousseal','Luminous Seal','light',18,0,20,2000,'Block the next inflicted ailment for 12s; attack damage still lands.','utility'],
  ['hexledger','Hex Ledger','shadow',20,0,14,3200,'Record part of a marked foe\'s actual damage. An original Shadow hit settles it.','utility'],
  ['transfusion','Transfusion','blood',0,0,14,3800,'Trade 12% maximum HP for 20% maximum mana when safely low on mana.','utility'],
  ['spellforge','Spellforge','arcane',65,0,25,120000,'Forge three charges: each original direct spell hit gains 30% damage for 15s.','utility'],
  ['seedshot','Seedshot','nature',9,18,2,900,'Plant one Seed, maturing in 4s. At most three Seeds per foe.','damage'],
  ['briarpatch','Briar Patch','nature',22,0,12,1800,'A finite patch retaliates against the target\'s next three attacks for 12s.','utility'],
  ['bloom','Bloom','nature',12,0,5,1400,'Consume mature Seeds to heal 6% maximum HP each; two also cleanse one ailment.','utility'],
  ['sporecall','Sporecall','nature',20,0,8,2600,'Spend one Seed to plant fresh Seeds on up to two reachable nearby foes.','utility'],
  ['orchardsprite','Orchard Sprite','nature',24,0,24,4800,'One sprite doubles Seed maturation on the current target for 12s.','summon'],
  ['wildharvest','Wild Harvest','nature',34,0,10,7200,'Harvest mature Seeds on up to three foes for damage; spends their healing reserve.','utility'],
  ['unison','Unison','resonance',20,0,5,22000,'Spend at least two matching notes on an armor-piercing strike.','utility'],
  ['counterpoint','Counterpoint','resonance',22,0,12,28000,'Spend at least two different notes on a small finite protective barrier.','utility'],
  ['quietmeasure','Quiet Measure','resonance',0,0,10,36000,'Return 35% of mana paid in the score. Zero-cost notes create no mana.','utility'],
  ['suspension','Suspension','resonance',18,0,12,52000,'Spend one note to extend one ordinary buff by 3s, once per activation.','utility'],
  ['clockworkchorus','Clockwork Chorus','resonance',40,0,24,90000,'Spend three distinct notes for a construct with three finite casting impacts.','summon'],
  ['finalcadence','Final Cadence','resonance',50,0,15,160000,'Spend three notes on one damage budget shared among up to three foes.','utility'],
  ['dicefire','Dicefire','chaos',24,75,4,65000,'Strike and apply the next displayed Burning, Chilled, or Soaked outcome.','damage'],
  ['stackthedeck','Stack the Deck','chaos',12,0,6,90000,'Advance the sequence once toward your preference; at most two attempts between Dicefires.','utility'],
  ['contradiction','Contradiction','chaos',42,0,10,190000,'Consume two different target conditions for a bounded burst.','utility'],
  ['jestersdouble',"Jester's Double",'chaos',35,0,26,280000,'One decoy takes a single attack, then disappears. Lasts up to 10s.','summon'],
  ['constellation','Constellation','cosmic',70,0,18,400000,'Link three reachable foes for 10s. Direct hits split one pre-defense budget.','utility'],
  ['cometprocession','Comet Procession','cosmic',140,0,18,900000,'Pay for three comets; after 4s one fixed volley budget is divided among three foes.','summon'],
  ['borrowedmoment','Borrowed Moment','cosmic',45,0,14,650000,'Advance one useful affordable non-Cosmic cooldown by up to 4s; repay 125% in recovery.','utility'],
  ['redshift','Redshift','cosmic',75,0,24,750000,'For 8s defer 35% of incoming hit damage for 4s. The obligation always resolves.','utility']
].map(([id,name,element,cost,dmg,cd,learnCost,desc,type])=>({id,name,element,cost,dmg,cd,learnCost,desc,type,expansion:true,glyph:EL_INFO[element].glyph}));
SPELLS.push(...EXPANSION_SPELLS);
function normalizeMagic(raw={}){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const num=(v,max=1e12)=>Number.isFinite(v)&&v>=0?Math.min(v,max):0;
  const timer=o=>o&&typeof o==='object'?{remaining:num(o.remaining,120)}:null;
  const m={notes:[],lastSchool:null,chaos:{seed:713,index:0,preference:'soaked',attempts:0},summons:{},rules:{},presets:{},wait:{},accelerated:{},autoPreset:'off',lastPreset:null,forge:null,barrier:null,seal:null,comets:null,link:null,redshift:null,deferred:[]};
  if(['fire','water','earth','air','light','shadow','blood','nature'].includes(r.lastSchool))m.lastSchool=r.lastSchool;
  if(Array.isArray(r.notes))m.notes=r.notes.slice(-3).filter(n=>n&&SCHOOL_REGISTRY[n.el]&&n.el!=='resonance').map(n=>({el:n.el,spent:num(n.spent,200),damage:num(n.damage,1e100)}));
  if(r.chaos&&typeof r.chaos==='object')m.chaos={seed:Math.floor(num(r.chaos.seed,0x7fffffff))||713,index:Math.floor(num(r.chaos.index,1e9)),preference:['burning','chilled','soaked'].includes(r.chaos.preference)?r.chaos.preference:'soaked',attempts:Math.floor(num(r.chaos.attempts,2))};
  for(const [id,o] of Object.entries(r.summons||{}))if(['ember','clay','sprite','chorus','decoy'].includes(id)&&timer(o))m.summons[id]={...timer(o),power:num(o.power,1e100),pulse:num(o.pulse,2),hp:num(o.hp,1e100),hits:Math.floor(num(o.hits,3))};
  for(const key of ['forge','barrier','seal','comets','redshift'])if(timer(r[key]))m[key]={...timer(r[key]),charges:Math.floor(num(r[key].charges,3)),budget:num(r[key].budget,1e100)};
  if(timer(r.link))m.link={...timer(r.link),targets:Array.isArray(r.link.targets)?r.link.targets.slice(0,3).filter(p=>Number.isInteger(p?.x)&&Number.isInteger(p?.y)).map(p=>({x:p.x,y:p.y})):[]};
  if(Array.isArray(r.deferred))m.deferred=r.deferred.slice(0,32).filter(o=>timer(o)&&num(o.amount,1e100)>0).map(o=>({...timer(o),amount:num(o.amount,1e100)}));
  for(const [id,o] of Object.entries(r.rules||{}))if(SPELLS.some(sp=>sp.id===id)&&o&&['useful','hp','mana','multi'].includes(o.condition))m.rules[id]={condition:o.condition,threshold:Math.max(0.1,Math.min(0.95,num(o.threshold,1)||0.6))};
  for(const key of ['clearing','boss','safe'])if(r.presets?.[key]){
    const p=r.presets[key];m.presets[key]={spells:Array.isArray(p.spells)?p.spells.slice(0,8).map(id=>SPELLS.some(s=>s.id===id)?id:null):[],rules:{}};
    for(const [id,o] of Object.entries(p.rules||{}))if(m.rules[id]||SPELLS.some(sp=>sp.id===id))if(o&&['useful','hp','mana','multi'].includes(o.condition))m.presets[key].rules[id]={condition:o.condition,threshold:Math.max(0.1,Math.min(0.95,num(o.threshold,1)||0.6))};
  }
  m.autoPreset=r.autoPreset==='boss-safe'?'boss-safe':'off';
  for(const [id,cd] of Object.entries(r.accelerated||{}))if(SPELLS.some(sp=>sp.id===id))m.accelerated[id]=num(cd,120);
  return m;
}
G.magic=normalizeMagic();
function enemyMagic(e){return e.magic??={seeds:[],briar:null,ledger:null};}
function normalizeEnemyMagic(raw={}){
  const n=v=>Number.isFinite(v)&&v>=0?Math.min(v,1e100):0;
  return {seeds:Array.isArray(raw?.seeds)?raw.seeds.slice(0,3).map(v=>Math.min(4,n(v))):[],briar:raw?.briar?{remaining:Math.min(12,n(raw.briar.remaining)),hits:Math.min(3,Math.floor(n(raw.briar.hits))),power:n(raw.briar.power)}:null,ledger:raw?.ledger?{remaining:Math.min(12,n(raw.ledger.remaining)),debt:n(raw.ledger.debt),cap:n(raw.ledger.cap)}:null};
}
function packEnemyMagic(e){return normalizeEnemyMagic(e.magic);}
function unpackEnemyMagic(enemy,raw){const value=normalizeEnemyMagic(arguments.length===1?enemy:raw);if(arguments.length>1)enemy.magic=value;return value;}
function plantSeed(e){const seeds=enemyMagic(e).seeds;if(e.hp>0&&seeds.length<3)seeds.push(4);}
function matureSeeds(e){return enemyMagic(e).seeds.filter(t=>t<=0).length;}
function consumeSeeds(e,matureOnly=true){const m=enemyMagic(e),count=matureOnly?matureSeeds(e):m.seeds.length;m.seeds=matureOnly?m.seeds.filter(t=>t>0):[];return count;}
function spellPower(sp,base,stats=G.baseStats){
  const lvl=G.elements[sp.element]||0,gear=elementBonusFromGear();
  return (base===undefined?sp.dmg:base*(sp.expansion?sp._refinementPower||1:1))*(1+0.1*lvl)*stats.dmgMul*(1+(gear[sp.element]||0)+(gear._all||0))*masteryBonus(sp.id)*(1+0.05*G.hero.lvl)*(1+effectTagSum('elementLevelDmg')*lvl);
}
function creditExpansionAffinity(sp,damage){if(damage>0){G.elementXp[sp.element]+=Math.ceil(damage*0.04*G.baseStats.elXpMul);while(G.elementXp[sp.element]>=xpForElement(G.elements[sp.element])){G.elementXp[sp.element]-=xpForElement(G.elements[sp.element]);G.elements[sp.element]++;}}}
function spellSecondaryHit(sp,e,power,trueDamage=false,credit=false){const damage=dealDamage(e,Math.floor(trueDamage?power:Math.max(1,power*elMul(sp.element,e.ref.el)-enemyDefense(e)/2)));if(credit)creditExpansionAffinity(sp,damage);return damage;}
function damagingAilment(){return G.hero.ailments.find(a=>a.dps>0);}
function cleanseOne(damagingOnly=false){
  const a=damagingOnly?damagingAilment():G.hero.ailments[0];if(!a)return false;
  G.hero.ailments=G.hero.ailments.filter(x=>x!==a);if(a.statMod)recomputeStats();return true;
}
function currentInscription(){return typeof expeditionInscription==='function'?expeditionInscription():null;}
function inscribedSpell(sp,inscription=currentInscription()){
  if(Object.hasOwn(sp,'_inscribed')){if(sp._inscribed===inscription)return sp;sp=SPELLS.find(s=>s.id===sp.id)||sp;}
  sp={...refinedSpell(sp),_inscribed:inscription};
  if(inscription==='ashglass'&&sp.id==='spark')return {...sp,burn:null,instantBurn:0.25};
  if(inscription==='brine'&&sp.id==='iceshard')return {...sp,condition:{id:'soaked',dur:6}};
  if(inscription==='redaction'&&sp.id==='souldrain')return {...sp,harvest:4,leech:0,noLeech:true};
  if(inscription==='weighted'&&sp.id==='dicefire')return {...sp,dmg:sp.dmg*0.85};
  if(inscription==='orbital'&&sp.id==='stardustveil')return {...sp,buff:{stat:'def',amt:(30+G.hero.maxHp*0.04)*(sp._refinementPower||1),dur:20,_inscription:'orbital'}};
  if(inscription==='alphabet'&&sp.id==='manabolt'&&G.magic.lastSchool){
    const extra={fire:{burn:{ratio:0.25,dur:3}},water:{condition:{id:'chilled',dur:4}},earth:{condition:{id:'fractured',dur:6}},air:{lightning:true,reactionElement:'air'},light:{critBonus:0.15},shadow:{dot:{dps:5,dur:4}},blood:{leech:0.15},nature:{seedOnHit:true}}[G.magic.lastSchool];
    return {...sp,dmg:sp.dmg*0.8,...extra};
  }
  return sp;
}
function chaosNext(){const c=G.magic.chaos;if(currentInscription()==='weighted')return ['burning','chilled','soaked'][c.index%3];let value=(c.seed+Math.imul(c.index+1,1103515245))>>>0;value^=value>>>13;return ['burning','chilled','soaked'][value%3];}
function setChaosPreference(value){if(['burning','chilled','soaked'].includes(value))G.magic.chaos.preference=value;}
function conditionKinds(e){return enemyConditions(e).filter(c=>['burning','chilled','soaked','fractured'].includes(c.id));}
function noteGroups(){const groups={};for(const n of G.magic.notes)(groups[n.el]??=[]).push(n);return Object.values(groups);}
function suspensionBuff(){return G.buffs.find(b=>b.dur>0&&!b._suspended&&b._spellId!=='suspension'&&!b._guardReady&&b._spellId!=='earthward');}
function movableEnemies(target){return nearbyEnemies(target,3,2).filter(e=>!e.isBoss&&!e.ref.tags?.includes('anchored')).filter(e=>draftTile(e,target));}
function draftTile(e,target){
  const dx=Math.sign(target.x-e.x),dy=Math.sign(target.y-e.y);
  return [[e.x+dx,e.y],[e.x,e.y+dy]].find(([x,y])=>(x!==e.x||y!==e.y)&&isWalkable(x,y)&&!(x===G.hero.pos.x&&y===G.hero.pos.y)&&!G.mobs.some(m=>m.hp>0&&m!==e&&m.x===x&&m.y===y));
}
function accelerationTarget(target,availableMana=G.hero.mana){
  return activeEquippedSpells().filter(sp=>sp.element!=='cosmic'&&(G.spellCd[sp.id]||0)>0&&!G.magic.accelerated[sp.id]&&sp.cost<=availableMana&&spellCastUseful(sp,target,{ignoreRule:false,ignoreCooldown:true})).sort((a,b)=>(G.spellCd[b.id]||0)-(G.spellCd[a.id]||0))[0];
}
function spellCastUseful(sp,target,{ignoreRule=false}={}){
  if(!schoolUnlocked(sp.element)||!G.hero.alive)return false;
  if(!ignoreRule){
    const rule=G.magic.rules[sp.id];if(rule?.condition==='hp'&&G.hero.hp/G.hero.maxHp>=rule.threshold)return false;
    if(rule?.condition==='mana'&&G.hero.mana/G.hero.maxMana>=rule.threshold)return false;
    if(rule?.condition==='multi'&&(!target||!nearbyEnemies(target,3,1).length))return false;
  }
  if(sp.type==='heal')return G.hero.hp/G.hero.maxHp<=0.7;
  if(sp.type==='buff'&&G.buffs.some(b=>b._spellId===sp.id&&b.dur>0))return false;
  if(!sp.expansion)return true;
  const m=G.magic,n=m.notes,em=target?enemyMagic(target):null;
  switch(sp.id){
    case 'emberfamiliar':return !m.summons.ember;
    case 'purifyingcurrent':return !!damagingAilment();
    case 'claysentinel':return !m.summons.clay;
    case 'draft':return !!target&&movableEnemies(target).length>0;
    case 'luminousseal':return !m.seal;
    case 'hexledger':return !!target&&target.hp>0&&!em.ledger;
    case 'transfusion':return G.hero.hp/G.hero.maxHp>=0.8&&G.hero.mana/G.hero.maxMana<=0.35&&G.hero.hp-G.hero.maxHp*0.12>=G.hero.maxHp*0.65;
    case 'spellforge':return !m.forge;
    case 'seedshot':return !!target&&em.seeds.length<3;
    case 'briarpatch':return !!target&&!em.briar;
    case 'bloom':return !!target&&matureSeeds(target)>0&&(G.hero.hp/G.hero.maxHp<0.9||(matureSeeds(target)>=2&&G.hero.ailments.length>0));
    case 'sporecall':return !!target&&em.seeds.length>0&&nearbyEnemies(target,3,2).some(e=>enemyMagic(e).seeds.length<3);
    case 'orchardsprite':return !!target&&em.seeds.some(t=>t>0)&&!m.summons.sprite;
    case 'wildharvest':return !!target&&[target,...nearbyEnemies(target,3,2)].some(e=>matureSeeds(e)>0);
    case 'unison':return noteGroups().some(g=>g.length>=2);
    case 'counterpoint':return !m.barrier&&new Set(n.map(x=>x.el)).size>=2;
    case 'quietmeasure':return G.hero.mana/G.hero.maxMana<=0.6&&n.reduce((sum,x)=>sum+x.spent,0)>0;
    case 'suspension':return n.length>0&&!!suspensionBuff();
    case 'clockworkchorus':return !m.summons.chorus&&n.length===3&&new Set(n.map(x=>x.el)).size===3;
    case 'finalcadence':return n.length===3;
    case 'dicefire':return !!target;
    case 'stackthedeck':return m.chaos.attempts<2&&chaosNext()!==m.chaos.preference;
    case 'contradiction':return !!target&&conditionKinds(target).length>=2;
    case 'jestersdouble':return !m.summons.decoy;
    case 'constellation':return !!target&&!m.link&&nearbyEnemies(target,3,2).length>0;
    case 'cometprocession':return !m.comets;
    case 'borrowedmoment':return !!accelerationTarget(target,G.hero.mana-sp.cost);
    case 'redshift':return !m.redshift&&m.deferred.length<24;
  }
  return true;
}
function spellRuleOptions(){return [{id:'useful',label:'When useful'},{id:'hp',label:'HP below threshold'},{id:'mana',label:'Mana below threshold'},{id:'multi',label:'At least 2 targets'}];}
function setSpellRule(id,condition='useful',threshold=0.6){if(SPELLS.some(sp=>sp.id===id)&&['useful','hp','mana','multi'].includes(condition))G.magic.rules[id]={condition,threshold:clamp(Number(threshold)||0.6,0.1,0.95)};}
function spellWaitReason(sp,target=G.enemy){
  if(!spellUsable(sp))return 'Unavailable';if((G.spellCd[sp.id]||0)>0)return 'Cooling down';
  if(G.hero.mana<sp.cost)return 'Needs mana';
  const rule=G.magic.rules[sp.id];if(rule?.condition==='hp'&&G.hero.hp/G.hero.maxHp>=rule.threshold)return `Waiting for HP below ${Math.round(rule.threshold*100)}%`;
  if(rule?.condition==='mana'&&G.hero.mana/G.hero.maxMana>=rule.threshold)return `Waiting for mana below ${Math.round(rule.threshold*100)}%`;
  if(rule?.condition==='multi'&&(!target||!nearbyEnemies(target,3,1).length))return 'Waiting for at least two targets';
  const reasons={bloom:'Waiting for mature Seeds or missing HP',wildharvest:'Waiting for mature Seeds',sporecall:'Waiting for Seeds and nearby foes',seedshot:'Seed cap reached',unison:'Needs matching notes',counterpoint:'Needs different notes or spent barrier',quietmeasure:'Needs paid notes and missing mana',suspension:'Needs a note and an eligible buff',clockworkchorus:'Needs three distinct notes',finalcadence:'Needs three notes',contradiction:'Needs two different conditions',borrowedmoment:'Waiting for useful cooldown',stackthedeck:'Preference ready or attempt cap reached',transfusion:'Needs healthy HP and low mana'};
  return spellCastUseful(sp,target)?'Ready':reasons[sp.id]||'Waiting until useful';
}
function saveSpellPreset(key){if(['clearing','boss','safe'].includes(key))G.magic.presets[key]={spells:[...G.equippedSpells],rules:JSON.parse(JSON.stringify(G.magic.rules))};}
function applySpellPreset(key){
  const preset=G.magic.presets[key];if(!preset)return false;
  const seen=new Set();G.equippedSpells=Array.from({length:8},(_,i)=>{const id=preset.spells[i];if(i>=maxSpellSlots()||!spellUsable(id)||seen.has(id))return null;seen.add(id);return id;});
  G.magic.rules=JSON.parse(JSON.stringify(preset.rules));G.magic.wait={};G.magic.lastPreset=key;recomputeStats();return true;
}
function setAutoSpellPreset(mode){G.magic.autoPreset=mode==='boss-safe'?'boss-safe':'off';}
function useEncounterPreset(enemy){if(G.magic.autoPreset==='boss-safe')applySpellPreset(G.hero.hp/G.hero.maxHp<0.5?'safe':enemy.isBoss?'boss':'clearing');}
function recordSpellNote(sp,spent,damage){
  const m=G.magic;
  if(['fire','water','earth','air','light','shadow','blood','nature'].includes(sp.element))m.lastSchool=sp.element;
  delete m.accelerated[sp.id];
  if(sp.element!=='resonance'&&schoolUnlocked('resonance')){m.notes.push({el:sp.element,spent:Math.min(200,Math.max(0,spent)),damage:Math.min(1e100,Math.max(0,damage))});m.notes=m.notes.slice(-3);}
  const chorus=m.summons.chorus;
  if(chorus&&sp.id!=='clockworkchorus'&&G.enemy?.hp>0){spellSecondaryHit(SPELLS.find(s=>s.id==='clockworkchorus'),G.enemy,chorus.power,true,true);if(--chorus.hits<=0)delete m.summons.chorus;}
}
function expansionOriginalHit(sp,target,power,hitAmount){
  const m=G.magic;
  if(m.forge&&m.forge.charges>0){power*=1.3;if(--m.forge.charges<=0)m.forge=null;}
  let dealt=0;
  const linked=m.link?.remaining>0?m.link.targets.map(p=>G.mobs.find(e=>e.hp>0&&e.x===p.x&&e.y===p.y)).filter(e=>e&&(e===target||clearSpellPath(target,e))):[];
  if(linked.includes(target)&&linked.length>=2){for(const e of linked)dealt+=dealDamage(e,hitAmount(e,1/linked.length,power));}
  else dealt=dealDamage(target,hitAmount(target,1,power));
  if(sp.instantBurn)dealt+=dealDamage(target,Math.floor(dealt*sp.instantBurn));
  if(sp.seedOnHit)plantSeed(target);
  if(sp.element==='shadow'&&enemyMagic(target).ledger){dealt+=dealDamage(target,enemyMagic(target).ledger.debt);enemyMagic(target).ledger=null;}
  return dealt;
}
function castExpansionSpell(sp,target){
  sp=refinedSpell(sp);
  if(!spellCastUseful(sp,target)||!canAffordCast(sp))return false;
  const m=G.magic,em=target?enemyMagic(target):null;
  G.hero.mana-=sp.cost;G.spellCd[sp.id]=sp.cd*Math.max(0.1,1-effectTagSum('cdMul'));bumpMastery(sp.id);
  let damage=0,notes=m.notes;
  const power=base=>spellPower(sp,base);
  switch(sp.id){
    case 'emberfamiliar':m.summons.ember={remaining:12,power:power(7),pulse:1};break;
    case 'purifyingcurrent':if(cleanseOne(true)&&target?.hp>0){target.statuses??={};target.statuses.soaked=6;}break;
    case 'claysentinel':m.summons.clay={remaining:14,hp:G.hero.maxHp*0.25+power(30),hits:3};break;
    case 'draft':for(const e of movableEnemies(target)){const tile=draftTile(e,target);if(tile)[e.x,e.y]=tile;}break;
    case 'luminousseal':m.seal={remaining:12};break;
    case 'hexledger':em.ledger={remaining:12,debt:0,cap:power(120)};break;
    case 'transfusion':G.hero.hp-=G.hero.maxHp*0.12;G.hero.mana=Math.min(G.hero.maxMana,G.hero.mana+G.hero.maxMana*0.2);break;
    case 'spellforge':m.forge={remaining:15,charges:3};break;
    case 'seedshot':damage=expansionOriginalHit(sp,target,power(18),(e,ratio=1,amount=power(18))=>Math.floor(Math.max(1,amount*ratio-enemyDefense(e)/2)));plantSeed(target);break;
    case 'briarpatch':em.briar={remaining:12,hits:3,power:power(24)};break;
    case 'bloom':{const count=consumeSeeds(target);G.hero.hp=Math.min(G.hero.maxHp,G.hero.hp+G.hero.maxHp*0.06*count*masteryBonus(sp.id)*(1+effectTagSum('healMul'))*(sp._refinementPower||1));if(count>=2)cleanseOne();break;}
    case 'sporecall':em.seeds.shift();for(const e of nearbyEnemies(target,3,2))plantSeed(e);break;
    case 'orchardsprite':m.summons.sprite={remaining:12};break;
    case 'wildharvest':for(const e of [target,...nearbyEnemies(target,3,2)]){const count=consumeSeeds(e);if(count)damage+=spellSecondaryHit(sp,e,power(38)*count);}break;
    case 'unison':{const group=noteGroups().find(g=>g.length>=2);m.notes=notes.filter(n=>!group.includes(n));damage=spellSecondaryHit(sp,target,power(24*group.length)+group.reduce((s,n)=>s+n.damage,0)*0.25,true);break;}
    case 'counterpoint':{const distinct=[];for(const n of notes)if(!distinct.some(x=>x.el===n.el))distinct.push(n);m.notes=notes.filter(n=>!distinct.includes(n));m.barrier={remaining:10,budget:G.hero.maxHp*Math.min(0.24,0.06*distinct.length*(sp._refinementPower||1))*masteryBonus(sp.id)};break;}
    case 'quietmeasure':{const paid=notes.reduce((sum,n)=>sum+n.spent,0);G.hero.mana=Math.min(G.hero.maxMana,G.hero.mana+paid*0.35);m.notes=[];break;}
    case 'suspension':{const buff=suspensionBuff();buff.dur+=3;buff._suspended=true;m.notes.shift();break;}
    case 'clockworkchorus':m.summons.chorus={remaining:15,hits:3,power:power(35)+notes.reduce((sum,n)=>sum+n.damage,0)*0.15};m.notes=[];break;
    case 'finalcadence':{const victims=[target,...nearbyEnemies(target,3,2)],budget=power(100)+notes.reduce((sum,n)=>sum+n.damage,0)*0.3;m.notes=[];for(const e of victims)damage+=spellSecondaryHit(sp,e,budget/victims.length,true);break;}
    case 'dicefire':{damage=expansionOriginalHit(sp,target,power(),(e,ratio=1,amount=power())=>Math.floor(Math.max(1,amount*ratio-enemyDefense(e)/2)));const next=chaosNext();m.chaos.index++;m.chaos.attempts=0;if(next==='burning')refreshEnemyDot(target,{spellId:sp.id,element:'fire',dps:damage*0.25/4,remaining:4});else if(target.hp>0){target.statuses??={};target.statuses[next]=5;}break;}
    case 'stackthedeck':m.chaos.index++;m.chaos.attempts++;break;
    case 'contradiction':{const conditions=conditionKinds(target).slice(0,2);for(const c of conditions){if(c.id==='burning')target.dotTimers=target.dotTimers.filter(d=>!isBurn(d));else delete target.statuses[c.id];}damage=spellSecondaryHit(sp,target,power(180),true);break;}
    case 'jestersdouble':m.summons.decoy={remaining:10,hits:1};break;
    case 'constellation':m.link={remaining:10,targets:[target,...nearbyEnemies(target,3,2)].map(e=>({x:e.x,y:e.y}))};break;
    case 'cometprocession':m.comets={remaining:4,budget:power(850)};break;
    case 'borrowedmoment':{const chosen=accelerationTarget(target,G.hero.mana);if(chosen){const advance=Math.min(4,G.spellCd[chosen.id]);G.spellCd[chosen.id]-=advance;G.spellCd[sp.id]+=advance*1.25;m.accelerated[chosen.id]=1;}break;}
    case 'redshift':m.redshift={remaining:8};break;
  }
  creditExpansionAffinity(sp,damage);
  recordSpellNote(sp,sp.cost,damage);
  logLine(`${sp.glyph} ${sp.name}${damage?`: ${fmt(damage)} damage`:': prepared'}.`,'cast');
  return true;
}
function interceptMagicHit(enemy,amount){
  const m=G.magic,em=enemyMagic(enemy);let damage=amount;
  if(m.summons.decoy){delete m.summons.decoy;damage=0;}
  else if(m.summons.clay){const clay=m.summons.clay,absorbed=Math.min(damage,clay.hp);clay.hp-=absorbed;damage-=absorbed;if(--clay.hits<=0||clay.hp<=0)delete m.summons.clay;}
  if(m.barrier){const absorbed=Math.min(damage,m.barrier.budget);m.barrier.budget-=absorbed;damage-=absorbed;if(m.barrier.budget<=0)m.barrier=null;}
  if(em.briar){spellSecondaryHit(SPELLS.find(sp=>sp.id==='briarpatch'),enemy,em.briar.power,false,true);if(--em.briar.hits<=0)em.briar=null;}
  if(m.redshift&&damage>0&&m.deferred.length<32){const delayed=damage*0.35;damage-=delayed;m.deferred.push({remaining:4,amount:delayed});}
  if(em.ledger)em.ledger.debt=Math.min(em.ledger.cap,em.ledger.debt+Math.min(G.hero.hp,damage)*0.35);
  return damage;
}
function blockMagicAilment(){if(G.magic.seal){G.magic.seal=null;logLine('+ Luminous Seal blocks the ailment.','cast');return true;}return false;}
function tickMagic(seconds=TICK_S,{resolve=true}={}){
  const m=G.magic;let owed=0;
  m.deferred=m.deferred.filter(debt=>{debt.remaining-=seconds;if(debt.remaining>0)return true;owed+=debt.amount;return false;});
  if(owed>0){G.hero.hp-=owed;if(G.hero.hp<=0&&G.hero.alive)onHeroDead();}
  if(!G.hero.alive)return;
  for(const [id,summon] of Object.entries(m.summons)){
    summon.remaining-=seconds;
    if(id==='ember'&&resolve&&G.enemy?.hp>0){summon.pulse-=seconds;let steps=0;while(summon.pulse<=0&&steps++<4){summon.pulse+=1;refreshEnemyDot(G.enemy,{spellId:'emberfamiliar',element:'fire',dps:summon.power,remaining:2});}}
    if(summon.remaining<=0)delete m.summons[id];
  }
  for(const key of ['forge','barrier','seal','link','redshift'])if(m[key]){m[key].remaining-=seconds;if(m[key].remaining<=0)m[key]=null;}
  if(m.comets){m.comets.remaining=Math.max(0,m.comets.remaining-seconds);if(m.comets.remaining===0&&resolve&&G.enemy?.hp>0){const budget=m.comets.budget;m.comets=null;const victims=[G.enemy,...nearbyEnemies(G.enemy,3,2)];for(const e of victims)spellSecondaryHit(SPELLS.find(sp=>sp.id==='cometprocession'),e,budget/victims.length,false,true);logLine('o The comet procession converges.','cast');}}
  for(const e of [...new Set([...G.mobs,...(G.enemy?[G.enemy]:[])])]){
    const em=enemyMagic(e),speed=G.enemy===e&&m.summons.sprite?2:1;em.seeds=em.seeds.map(t=>Math.max(0,t-seconds*speed));
    for(const key of ['briar','ledger'])if(em[key]){em[key].remaining-=seconds;if(em[key].remaining<=0)em[key]=null;}
  }
  if(resolve)settleDefeatedEnemies([...G.mobs,...(G.enemy?[G.enemy]:[])]);
}
function onMagicEnemyDead(enemy){if(G.magic.link){G.magic.link.targets=G.magic.link.targets.filter(p=>p.x!==enemy.x||p.y!==enemy.y);if(G.magic.link.targets.length<2)G.magic.link=null;}enemy.magic=normalizeEnemyMagic();}
function ageMagic(elapsed){tickMagic(elapsed,{resolve:false});}
function resetMagicTransient(){const m=G.magic;G.magic={...normalizeMagic(),chaos:{...m.chaos,attempts:0},rules:m.rules,presets:m.presets,autoPreset:m.autoPreset};for(const e of G.mobs)e.magic=normalizeEnemyMagic();}

// Sustained profiles use the same finite budgets as live spells. They are a
// forecast for World, and the shared chronological resolver for expeditions.
function getExpeditionProfile(enemy={},speedPass=0,actionRate=null){
  const s={...G.baseStats},seen=new Set(),rules=enemy.rules&&typeof enemy.rules==='object'&&!Array.isArray(enemy.rules)?enemy.rules:G.magic.rules;
  const loadout=Array.isArray(enemy.loadout)?enemy.loadout.slice(0,8).filter(id=>{
    if(typeof id!=='string'||!spellUsable(id)||seen.has(id))return false;
    seen.add(id);return true;
  }).map(id=>SPELLS.find(sp=>sp.id===id)):activeEquippedSpells();
  const eligible=loadout.filter(sp=>sp.type!==enemy.sealedCategory&&(!enemy.disableHpTrades||(sp.id!=='transfusion'&&!sp.hpCost))).map(sp=>Object.hasOwn(enemy,'inscription')?inscribedSpell(sp,enemy.inscription):inscribedSpell(sp)),blocked=[];
  const spells=eligible.filter(sp=>{
    const rule=rules[sp.id];let allowed=!(enemy.isBoss&&rule?.condition==='multi');
    if(rule?.condition==='hp'||rule?.condition==='mana')allowed&&=enemy.conditionState?enemy.conditionState[sp.id]===true:(rule.condition==='hp'?G.hero.hp/G.hero.maxHp:G.hero.mana/G.hero.maxMana)<rule.threshold;
    if(!allowed)blocked.push(sp.id);return allowed;
  }),ids=new Set(spells.map(sp=>sp.id));
  // A temporary paid buff must not become permanent expedition output.
  for(const buff of G.buffs)if(buff.dur>0&&buff.stat&&!buff.stat.startsWith('immune:')&&(!buff._spellId||schoolUnlocked(SPELLS.find(sp=>sp.id===buff._spellId)?.element))){
    if(['dmgMul','goldFind','xpMul','elXpMul','ritualMul'].includes(buff.stat))s[buff.stat]/=1+buff.amt;
    else s[buff.stat]=(s[buff.stat]||0)-buff.amt;
  }
  const power=(sp,base)=>spellPower(sp,base,s),affinityPerSec={};
  const cap=(value,targets=1)=>Math.min(value,(enemy.hp||1e12)*targets);
  const maxHp=G.hero.maxHp,def=Math.max(0,enemy.def||0);let attackRate=actionRate??Math.max(0.1,s.spd);
  let rawIncoming=Math.max(1,(enemy.atk||10)-s.def/2)*Math.max(0.1,enemy.spd||1);
  const ritual=G.ritual.active&&typeof ritualEquippedElements==='function'&&ritualEquippedElements().length?ritualCfg().manaCost:0;
  let manaRegen=Math.max(0,s.manaRegen),healing=0,dps=0,prevented=0,refund=0;
  const rates=new Map(blocked.map(id=>[id,0]));let total=0;
  for(const sp of spells){
    const rate=Math.min(attackRate,1/Math.max(0.5,sp.cd*Math.max(0.1,1-effectTagSum('cdMul'))));rates.set(sp.id,rate);total+=rate;
  }
  if(total>attackRate)for(const [id,rate] of rates)rates.set(id,rate*attackRate/total);
  const rate=id=>rates.get(id)||0;
  const wellspring=spells.find(sp=>sp.id==='wellspring');
  if(wellspring)manaRegen+=wellspring.buff.amt*Math.min(1,wellspring.buff.dur*rate('wellspring'));
  const targetLife=(enemy.hp||100)/(Math.max(1,s.atk-def/2)*attackRate*s.dmgMul);
  const seedRate=(rate('seedshot')+spells.filter(sp=>sp.seedOnHit).reduce((sum,sp)=>sum+rate(sp.id),0))*Math.min(1,targetLife/4),notesRate=spells.filter(sp=>sp.element!=='resonance').reduce((n,sp)=>n+rate(sp.id),0);
  const distinct=new Set(spells.filter(sp=>sp.element!=='resonance').map(sp=>sp.element)).size;
  const resonance=spells.filter(sp=>sp.element==='resonance');
  for(const sp of resonance){let ceiling=notesRate/(sp.id==='suspension'?1:3);if(sp.id==='unison'&&distinct===spells.length)ceiling*=0.35;if(['counterpoint','clockworkchorus'].includes(sp.id)&&distinct<2)ceiling=0;if(sp.id==='clockworkchorus'&&distinct<3)ceiling=0;rates.set(sp.id,Math.min(rate(sp.id),ceiling/Math.max(1,resonance.length)));}
  if(ids.has('bloom'))rates.set('bloom',Math.min(rate('bloom'),seedRate/Math.max(1,ids.has('wildharvest')?2:1)));
  if(ids.has('wildharvest'))rates.set('wildharvest',Math.min(rate('wildharvest'),seedRate/Math.max(1,ids.has('bloom')?2:1)));
  if(ids.has('sporecall'))rates.set('sporecall',enemy.isBoss?0:Math.min(rate('sporecall'),seedRate*0.5));
  if(ids.has('contradiction')&&!ids.has('dicefire')&&!spells.some(sp=>sp.condition||sp.burn||sp.dot))rates.set('contradiction',0);
  rates.set('draft',0);rates.set('purifyingcurrent',Math.min(rate('purifyingcurrent'),enemy.el?1/30:0));
  if(ids.has('transfusion')&&rawIncoming<maxHp*0.04)refund+=rate('transfusion')*G.hero.maxMana*0.2;else rates.set('transfusion',0);
  if(ids.has('quietmeasure'))refund+=rate('quietmeasure')*spells.filter(sp=>sp.element!=='resonance').reduce((sum,sp)=>sum+sp.cost*rate(sp.id),0)/Math.max(0.01,notesRate)*3*0.35;
  let spending=spells.reduce((sum,sp)=>sum+sp.cost*rate(sp.id),0);
  const availability=Math.max(0,manaRegen-ritual)+refund;
  const paidScale=spending>0?Math.min(1,availability/spending):1;
  for(const sp of spells)if(sp.cost)rates.set(sp.id,rate(sp.id)*paidScale);
  spending=spells.reduce((sum,sp)=>sum+sp.cost*rate(sp.id),0);
  // Refunds cannot exceed the mana actually invested in the notes.
  const measureRefund=ids.has('quietmeasure')?spells.filter(sp=>sp.element!=='resonance').reduce((sum,sp)=>sum+sp.cost*rate(sp.id),0)*0.35:0;
  refund=(rate('transfusion')*G.hero.maxMana*0.2)+measureRefund;
  const netSpend=Math.max(0,spending-refund);
  if(netSpend>Math.max(0,manaRegen-ritual)&&netSpend>0){const factor=Math.max(0,manaRegen-ritual)/netSpend;for(const sp of spells)if(sp.cost)rates.set(sp.id,rate(sp.id)*factor);spending*=factor;refund*=factor;}
  const conditions=new Set();let originalDps=0,originalNonCosmicDps=0,originalCasts=0;
  for(const sp of spells)if(sp.buff&&sp.id!=='wellspring'){
    const amount=sp.buff.amt*Math.min(1,sp.buff.dur*rate(sp.id));
    if(sp.buff.stat==='dmgMul')s.dmgMul*=1+amount;else s[sp.buff.stat]=(s[sp.buff.stat]||0)+amount;
  }
  // Speed uptime depends on affordable cast rates, which also share this
  // action budget. Resolve that feedback in at most six bounded passes.
  const sustainedRate=Math.max(0.1,s.spd);
  if(speedPass<6&&Math.abs(sustainedRate-attackRate)>1e-6)return getExpeditionProfile(enemy,speedPass+1,sustainedRate);
  attackRate=sustainedRate;
  rawIncoming=Math.max(1,(enemy.atk||10)-s.def/2)*Math.max(0.1,enemy.spd||1);
  for(const sp of spells){
    const casts=rate(sp.id),base=power(sp),hit=cap(Math.max(1,base*elMul(sp.element,enemy.el)-(sp.truedmg?0:def/2))),beforeDamage=dps;
    if(!casts)continue;
    if(sp.type==='damage'){
      const expected=hit*(1+Math.min(1,(s.crit||0)+(sp.critBonus||0))*Math.max(0,s.cdmg-1));dps+=expected*casts;
      originalDps+=expected*casts;originalCasts+=casts;if(sp.element!=='cosmic')originalNonCosmicDps+=expected*casts;
      if(sp.instantBurn)dps+=Math.min((enemy.hp||1e12)-hit,expected*sp.instantBurn)*casts;
      if(sp.dot)dps+=power(sp,sp.dot.dps)*elMul(sp.element,enemy.el)*Math.min(1,sp.dot.dur*casts);
      if(sp.burn){dps+=expected*sp.burn.ratio*casts;conditions.add('burning');}
      if(sp.condition)conditions.add(sp.condition.id);
      if(sp.stun)prevented+=rawIncoming*Math.min(0.25,sp.stun*casts*0.4);
      const extra=enemy.isBoss?0:(sp.splash?sp.splash.ratio*Math.min(2,sp.splash.limit):sp.chain?sp.chain.reduce((n,v)=>n+v,0):0);dps+=expected*casts*extra;
      if(!sp.noLeech&&(sp.leech||sp.element==='blood'))healing+=expected*casts*((sp.leech||0)+(sp.element==='blood'?0.2:0));
      if(sp.harvest)dps+=spells.filter(x=>x.dot||x.burn).reduce((n,x)=>n+power(x,x.dot?.dps||x.dmg*(x.burn?.ratio||0)/3),0)*sp.harvest*casts;
    }
    if(sp.type==='heal')healing+=spellHealAmount(sp)*casts;
    if(sp.hpCost)healing-=maxHp*sp.hpCost*casts;
    if(sp.guard)prevented+=rawIncoming*Math.min(1,sp.buff.dur*casts)*sp.guard*0.5;
    switch(sp.id){
      case 'emberfamiliar':dps+=power(sp,7)*Math.min(1,12*casts);conditions.add('burning');break;
      case 'claysentinel':prevented+=Math.min(rawIncoming,(maxHp*0.25+power(sp,30))*casts);break;
      case 'hexledger':dps+=cap(Math.min(power(sp,120),rawIncoming*12*0.35))*casts*(spells.some(x=>x.element==='shadow'&&x.type==='damage')?1:0);break;
      case 'transfusion':healing-=maxHp*0.12*casts;break;
      case 'briarpatch':dps+=cap(power(sp,24))*3*casts;break;
      case 'bloom':healing+=maxHp*0.06*Math.min(3,seedRate/Math.max(0.01,casts))*casts*(sp._refinementPower||1);break;
      case 'wildharvest':dps+=cap(power(sp,38)*Math.min(3,seedRate/Math.max(0.01,casts)))*casts;break;
      case 'unison':dps+=cap(power(sp,60))*casts;break;
      case 'counterpoint':prevented+=maxHp*Math.min(0.24,0.06*distinct*(sp._refinementPower||1))*casts;break;
      case 'clockworkchorus':dps+=cap(power(sp,35))*3*casts;break;
      case 'finalcadence':dps+=cap(power(sp,100),enemy.isBoss?1:3)*casts;break;
      case 'dicefire':conditions.add('soaked');conditions.add('chilled');dps+=hit*0.25*casts/3;break;
      case 'contradiction':dps+=cap(power(sp,180))*casts;break;
      case 'jestersdouble':prevented+=rawIncoming/Math.max(0.1,enemy.spd||1)*casts;break;
      case 'cometprocession':dps+=cap(Math.max(1,power(sp,850)-def/2),enemy.isBoss?1:3)*casts;break;
      // Redshift is healing time, not permanent damage reduction.
    }
    affinityPerSec[sp.element]=(affinityPerSec[sp.element]||0)+Math.max(0,dps-beforeDamage)*0.04*s.elXpMul;
  }
  if(conditions.has('soaked')&&spells.some(sp=>sp.lightning))dps+=spells.filter(sp=>sp.lightning).reduce((n,sp)=>n+power(sp)*rate(sp.id)*0.35*(enemy.isBoss?1:2),0);
  if(conditions.has('chilled')&&spells.some(sp=>sp.element==='earth'&&sp.dmg>0))dps+=spells.filter(sp=>sp.element==='earth'&&sp.dmg>0).reduce((n,sp)=>n+power(sp)*rate(sp.id)*0.5,0);
  if(conditions.has('burning')&&!enemy.isBoss&&spells.some(sp=>sp.element==='air'))dps*=1.08;
  if(conditions.has('chilled'))prevented+=rawIncoming*0.2;
  if(ids.has('spellforge'))dps+=originalDps*0.3*Math.min(1,rate('spellforge')*3/Math.max(0.01,originalCasts));
  if(ids.has('borrowedmoment'))dps+=originalNonCosmicDps*Math.min(0.16,rate('borrowedmoment')*2);
  const used=spells.reduce((n,sp)=>n+rate(sp.id),0);
  dps+=Math.max(0,attackRate-used)*Math.max(1,s.atk-def/2)*s.dmgMul*(1+s.crit*Math.max(0,s.cdmg-1));
  const mitigation=Math.min(0.8,prevented/Math.max(1,rawIncoming)),manaSpend=Math.max(0,spending-refund);
  // A sustained HP trade must satisfy its live safety floor and replenish its
  // cost after incoming damage. Rebuild once so its mana or damage bonus cannot
  // subsidize the replacement profile after the trade is removed.
  const hpTrades=spells.filter(sp=>(sp.id==='transfusion'||sp.hpCost)&&rate(sp.id)>0);
  if(!enemy.disableHpTrades&&hpTrades.length&&(hpTrades.some(sp=>sp.id==='transfusion'?G.hero.hp<maxHp*0.8:G.hero.hp-maxHp*sp.hpCost<maxHp*0.5)||healing<rawIncoming*(1-mitigation)))return getExpeditionProfile({...enemy,disableHpTrades:true});
  return {dps:Math.max(0.1,dps),healPerSec:healing,healing,mitigation,manaPerSec:manaSpend,manaSpend,manaRegen,attackRate,conditions:[...conditions],incoming:rawIncoming*(1-mitigation),maxHp,categories:[...new Set(spells.map(sp=>sp.element))],spells:spells.map(sp=>({id:sp.id,rate:rate(sp.id)})),castRates:Object.fromEntries(rates),affinityPerSec};
}
function expansionIdleCombat(baseline={},casts,stats,avg,difficulty){
  if(!avg)return getExpeditionProfile(baseline);
  if(!activeEquippedSpells().some(sp=>sp.expansion))return baseline;
  const enemy={hp:baseline.enemyHp,atk:avg.atk*difficulty.enemyAtk*ENEMY_ATK_SCALE,def:avg.def*difficulty.enemyDef,spd:avg.spd};
  const profile=getExpeditionProfile(enemy);
  // World's existing support accounting already charges Blood Pact's HP.
  const pact=profile.spells.find(sp=>sp.id==='bloodpact');
  return {...baseline,...profile,enemyHp:baseline.enemyHp,healing:profile.healing+(pact?profile.maxHp*0.25*pact.rate:0)};
}
