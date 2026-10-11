const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
function game(){
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},addEventListener(){},appendChild(){},remove(){},querySelectorAll(){return [];},querySelector(){return node('child');},focus(){},select(){}});return nodes.get(id);};
  const math=Object.create(Math);math.random=()=>0.5;
  const sandbox={Math:math,Date,console,TextEncoder,TextDecoder,URL,performance:{now:()=>0},btoa:v=>Buffer.from(v,'binary').toString('base64'),atob:v=>Buffer.from(v,'base64').toString('binary'),setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},confirm:()=>true,alert(){},navigator:{},window:{addEventListener(){},innerWidth:1440,innerHeight:900},document:{body:node('body'),getElementById:node,createElement:()=>node('created'),addEventListener(){},querySelectorAll(){return [];}}};
  vm.createContext(sandbox);
  let source=fs.readFileSync(path.join(__dirname,'..','ascii-idle-wizard.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ninit\(\);\s*$/,'\n');
  if(!source.includes('const SCHOOL_REGISTRY='))source+='\n'+fs.readFileSync(path.join(__dirname,'..','dev','spell-expansion.inc.js'),'utf8');
  vm.runInContext(source,sandbox,{timeout:5000});
  const run=code=>vm.runInContext(code,sandbox,{timeout:10000});
  run(`gameRandom=()=>0.5;renderHot=()=>{};renderCold=()=>{};renderAll=()=>{};G.awakenCount=5;G.expeditions={discoveries:{nature:true}};G.knownSpells=SPELLS.map(s=>s.id);recomputeStats();G.hero.maxHp=1000;G.hero.hp=1000;G.hero.maxMana=10000;G.hero.mana=10000;G.autoExplore=false;G.map=emptyGrid(ZONES[0].palette);G.hero.pos={x:1,y:1};G.mobs=[];G.chests=[];G.enemy=null;
    function mob(x=5,y=5,hp=100000,def=0){const e=makeEnemy({name:'Target',hp,atk:20,def,spd:1,gold:0,xp:0,el:null},x,y,false);e.hp=e.maxHp=e.ref.hp=hp;G.mobs.push(e);return e;}
    function cast(id,target){return castSpell(SPELLS.find(s=>s.id===id),target);}`);
  return {run};
}
test('80 spells preserve existing Arcane prices and have twelve distinct printable school glyphs',()=>{
  const {run}=game();assert.equal(run('SPELLS.length'),80);assert.equal(run('EXPANSION_SPELLS.length'),28);
  assert.equal(run('new Set(ELEMENTS.map(id=>EL_INFO[id].glyph)).size'),12);
  assert.equal(run('ELEMENTS.every(id=>/^[ -~]$/.test(EL_INFO[id].glyph))'),true);
  assert.deepEqual(JSON.parse(run('JSON.stringify(SPELLS.filter(s=>s.element===\'arcane\'&&!s.expansion).map(s=>s.learnCost))')),[8000,32000,90000,160000,280000,800000]);
});
test('school gates enforce learning, equipping and direct casting; Cosmic reveals exactly at fifth Awakening',()=>{
  const {run}=game();run(`const target=mob();G.awakenCount=0;G.gold=1e9;G.knownSpells=['spark','manabolt','cometprocession'];const before=G.hero.mana;cast('manabolt',target);equipSpell('manabolt',0);learnSpell('dicefire');`);
  assert.equal(run('G.hero.mana'),run('before'));assert.equal(run('G.equippedSpells[0]'),'spark');assert.equal(run("G.knownSpells.includes('dicefire')"),false);
  run('G.awakenCount=4');assert.equal(run("visibleSchools().includes('cosmic')"),false);assert.equal(run("spellUsable('cometprocession')"),false);
  run('G.awakenCount=5');assert.equal(run("spellUsable('cometprocession')"),true);
  assert.equal(run("schoolUnlocked('nature',{awakenCount:5,expeditions:{discoveries:{}}})"),false);
});
test('Seeds mature without refresh at their cap, then Bloom spends them and cleanses',()=>{
  const {run}=game();run(`const target=mob();cast('seedshot',target);tickMagic(1);cast('seedshot',target);cast('seedshot',target);const clocks=[...target.magic.seeds];cast('seedshot',target);`);
  assert.deepEqual(JSON.parse(run('JSON.stringify(target.magic.seeds)')),JSON.parse(run('JSON.stringify(clocks)')));
  run(`tickMagic(4);G.hero.hp=500;G.hero.ailments=[{id:'burn',remaining:10,dps:1}];cast('bloom',target);`);
  assert.equal(run('target.magic.seeds.length'),0);assert.equal(run('G.hero.ailments.length'),0);assert.ok(run('G.hero.hp')>500);
  assert.equal(run("spellCastUseful(SPELLS.find(s=>s.id==='bloom'),target)"),false);
});
test('Seed spreading and harvest obey target limits and never damage foes without Seeds',()=>{
  const {run}=game();run(`const target=mob(),near=mob(6,5),empty=mob(5,7),outside=mob(10,5);plantSeed(target);cast('sporecall',target);tickMagic(4);empty.magic.seeds=[];const emptyHp=empty.hp;cast('wildharvest',target);`);
  assert.equal(run('outside.magic.seeds.length'),0);assert.equal(run('empty.hp'),run('emptyHp'));assert.ok(run('near.hp')<100000);assert.equal(run('near.magic.seeds.length'),0);
});
test('Resonance records only original non-Resonance casts, keeps three notes, and spends them once',()=>{
  const {run}=game();run(`const target=mob();cast('spark',target);cast('spark',target);cast('spark',target);cast('spark',target);const before=target.hp;cast('unison',target);`);
  assert.equal(run('G.magic.notes.length'),0);assert.ok(run('target.hp')<run('before'));
  run(`G.hero.mana=10;G.magic.notes=[{el:'water',spent:0,damage:0}];`);
  assert.equal(run("spellCastUseful(SPELLS.find(s=>s.id==='quietmeasure'),target)"),false);
  run(`G.magic.notes=[{el:'fire',spent:20,damage:10},{el:'water',spent:40,damage:0}];cast('quietmeasure',target);`);
  assert.equal(run('G.hero.mana'),31);assert.equal(run('G.magic.notes.length'),0);
});
test('Clockwork Chorus has only three impacts and cannot summon another Chorus',()=>{
  const {run}=game();run(`const target=mob();G.enemy=target;G.magic.notes=[{el:'fire',spent:4,damage:5},{el:'water',spent:8,damage:5},{el:'earth',spent:14,damage:5}];cast('clockworkchorus',target);const before=target.hp;cast('spark',target);cast('spark',target);cast('spark',target);`);
  assert.equal(run('!!G.magic.summons.chorus'),false);assert.ok(run('before-target.hp')>100);assert.equal(run('G.magic.notes.length'),3);
});
test('Suspension extends a buff once and never restores a spent Earthward guard',()=>{
  const {run}=game();run(`const target=mob();cast('earthward',target);G.buffs[0]._guardReady=false;G.magic.notes=[{el:'fire',spent:4,damage:10}];`);
  assert.equal(run("spellCastUseful(SPELLS.find(s=>s.id==='suspension'),target)"),false);
  run(`cast('flamewall',target);G.hero.mana=10000;G.magic.notes=[{el:'fire',spent:4,damage:10}];const duration=G.buffs.find(b=>b._spellId==='flamewall').dur;cast('suspension',target);`);
  assert.equal(run("G.buffs.find(b=>b._spellId==='flamewall').dur"),run('duration+3'));
  assert.equal(run("G.buffs.find(b=>b._spellId==='earthward')._guardReady"),false);
});
test('Chaos sequence survives normalization; Deck attempts are bounded and Contradiction consumes conditions',()=>{
  const {run}=game();run(`const target=mob();G.magic.chaos.preference=chaosNext()==='soaked'?'burning':'soaked';const first=chaosNext();const snapshot=JSON.parse(JSON.stringify(G.magic));G.magic=normalizeMagic(snapshot);`);
  assert.equal(run('chaosNext()'),run('first'));
  run(`G.magic.chaos.attempts=2;`);assert.equal(run("spellCastUseful(SPELLS.find(s=>s.id==='stackthedeck'),target)"),false);
  run(`cast('dicefire',target);target.dotTimers=[];target.statuses={soaked:4,chilled:4};const before=target.hp;cast('contradiction',target);`);
  assert.equal(run('conditionKinds(target).length'),0);assert.ok(run('target.hp')<run('before'));assert.equal(run('G.magic.chaos.attempts'),0);
});
test('interception is finite, Hex Ledger settles from actual damage, Seal blocks only one ailment',()=>{
  const {run}=game();run(`const target=mob();cast('claysentinel',target);interceptMagicHit(target,100);interceptMagicHit(target,100);interceptMagicHit(target,100);`);
  assert.equal(run('!!G.magic.summons.clay'),false);
  run(`cast('hexledger',target);interceptMagicHit(target,100);const debt=target.magic.ledger.debt;const before=target.hp;cast('shadowbolt',target);`);
  assert.equal(run('debt'),35);assert.equal(run('target.magic.ledger'),null);assert.ok(run('before-target.hp')>35);
  run(`cast('luminousseal',target);`);assert.equal(run('blockMagicAilment()'),true);assert.equal(run('blockMagicAilment()'),false);
});
test('Spellforge never refreshes charges while useful and consumes exactly three original hits',()=>{
  const {run}=game();run(`const target=mob();cast('spellforge',target);const paid=G.hero.mana;cast('spellforge',target);`);
  assert.equal(run('G.hero.mana'),run('paid'));run(`cast('spark',target);cast('spark',target);cast('spark',target);`);assert.equal(run('G.magic.forge'),null);
});
test('Cosmic links split one direct budget and comet impacts create no extra notes',()=>{
  const {run}=game();run(`const target=mob(),near=mob(6,5),other=mob(5,6);cast('constellation',target);const before=[target.hp,near.hp,other.hp];cast('manabolt',target);const losses=[target,near,other].map((e,i)=>before[i]-e.hp);`);
  assert.equal(run('losses.every(v=>v===losses[0])'),true);
  run(`G.enemy=target;cast('cometprocession',target);const notes=G.magic.notes.length,paid=G.hero.mana;cast('cometprocession',target);tickMagic(4);`);
  assert.equal(run('G.hero.mana'),run('paid'));assert.equal(run('G.magic.notes.length'),run('notes'));assert.equal(run('G.magic.comets'),null);
});
test('Borrowed Moment accelerates only once per cooldown cycle and pays a recovery premium',()=>{
  const {run}=game();run(`const target=mob();G.equippedSpells=['manabolt','borrowedmoment'];G.spellCd.manabolt=6;cast('borrowedmoment',target);const accelerated=G.spellCd.manabolt,own=G.spellCd.borrowedmoment;`);
  assert.equal(run('accelerated'),2);assert.ok(run('own')>=19);
  assert.equal(run("spellCastUseful(SPELLS.find(s=>s.id==='borrowedmoment'),target)"),false);
});
test('Redshift debt ages by actual elapsed time, resolves once, and is never discarded by expiry',()=>{
  const {run}=game();run(`const target=mob();cast('redshift',target);G.hero.hp=1000;const immediate=interceptMagicHit(target,100);G.hero.hp-=immediate;ageMagic(9*3600);const after=G.hero.hp;ageMagic(9*3600);`);
  assert.equal(run('immediate'),65);assert.equal(run('after'),900);assert.equal(run('G.hero.hp'),900);assert.equal(run('G.magic.deferred.length'),0);
});
test('priority fairness eventually casts a useful lower slot and presets preserve cooldowns',()=>{
  const {run}=game();run(`const target=mob();G.equippedSpells=['gust','boulder'];for(let i=0;i<8;i++){G.spellCd={};castOrSwing(target);}const casts=G.spellMastery.boulder||0;G.spellCd.boulder=3;saveSpellPreset('safe');G.equippedSpells=['spark'];applySpellPreset('safe');`);
  assert.ok(run('casts')>0);assert.equal(run('G.spellCd.boulder'),3);assert.equal(run('G.equippedSpells[1]'),'boulder');
});
test('all new spells contribute sustainable profiles and Ritual shares the mana budget',()=>{
  const {run}=game();run(`G.equippedSpells=['seedshot','wildharvest','cometprocession','spellforge','counterpoint'];G.baseStats.manaRegen=12;const enemy={hp:100000,atk:50,def:10,spd:1};const first=getExpeditionProfile(enemy);G.ritual.active=true;G.ritual.intensity=1;const reserved=getExpeditionProfile(enemy);`);
  assert.ok(run('first.dps')>0);assert.ok(run('first.manaPerSec')<=12+1e-8);assert.ok(run('reserved.manaPerSec')<=12+1e-8);assert.ok(run('reserved.dps')<=run('first.dps'));
  assert.equal(run('Number.isFinite(first.healPerSec)&&first.mitigation>=0&&first.mitigation<=0.8'),true);
});
test('Ashglass spends Spark burn immediately, and Brine swaps Chilled for Soaked',()=>{
  const {run}=game();run(`const original=mob(),glass=mob(7,5);cast('spark',original);const direct=original.maxHp-original.hp;expeditionInscription=()=> 'ashglass';cast('spark',glass);`);
  assert.equal(run('glass.dotTimers.length'),0);assert.equal(run('glass.maxHp-glass.hp'),run('direct+Math.floor(direct*0.25)'));
  run(`expeditionInscription=()=> 'brine';cast('iceshard',glass);`);
  assert.equal(run('glass.statuses.chilled'),undefined);assert.equal(run('glass.statuses.soaked'),6);
});
test('Borrowed Alphabet uses the last eligible school, preserves neutral school ownership, and persists its memory',()=>{
  const {run}=game();run(`const target=mob();G.awakenCount=1;expeditionInscription=()=> 'alphabet';cast('iceshard',target);const borrowed=inscribedSpell(SPELLS.find(s=>s.id==='manabolt'));cast('manabolt',target);const restored=normalizeMagic(JSON.parse(JSON.stringify(G.magic)));`);
  assert.equal(run('borrowed.element'),'arcane');assert.equal(run('borrowed.dmg'),44);assert.equal(run('borrowed.condition.id'),'chilled');assert.equal(run('restored.lastSchool'),'water');
});
test('Redaction harvests four seconds and gives up all Soul Drain healing',()=>{
  const {run}=game();run(`const target=mob();G.hero.hp=10;target.dotTimers=[{spellId:'curse',element:'shadow',dps:10,remaining:6}];expeditionInscription=()=> 'redaction';effectTagSum=id=>id==='bonusLeech'?0.1:0;cast('souldrain',target);`);
  assert.equal(run('G.hero.hp'),10);assert.equal(run('target.dotTimers[0].remaining'),2);
});
test('Weighted Die exposes a steady three-condition cycle with lower Dicefire direct power',()=>{
  const {run}=game();run(`expeditionInscription=()=> 'weighted';G.magic.chaos.index=0;const sequence=[];for(let i=0;i<3;i++){sequence.push(chaosNext());G.magic.chaos.index++;}const modified=inscribedSpell(SPELLS.find(s=>s.id==='dicefire'));`);
  assert.deepEqual(JSON.parse(run('JSON.stringify(sequence)')),['burning','chilled','soaked']);assert.equal(run('modified.dmg'),75*0.85);
});
test('Orbital inscription trades Stardust Veil offense for sustained defense',()=>{
  const {run}=game();run(`const target=mob();expeditionInscription=()=> 'orbital';cast('stardustveil',target);const buff=G.buffs.find(b=>b._spellId==='stardustveil');`);
  assert.equal(run('buff.stat'),'def');assert.equal(run('buff.dur'),20);assert.ok(run('G.baseStats.def')>30);
});
test('profile gates multi-target rules at bosses, honors seals, and ignores dormant buffs',()=>{
  const {run}=game();run(`G.equippedSpells=['seedshot','spark','cometprocession'];setSpellRule('cometprocession','multi');const enemy={hp:100000,atk:50,def:0,spd:1,isBoss:true};const singleton=getExpeditionProfile(enemy);const sealed=getExpeditionProfile({...enemy,sealedCategory:'damage'});G.awakenCount=0;G.buffs=[{_spellId:'stardustveil',stat:'dmgMul',amt:0.5,dur:12}];recomputeStats();const baseline=getExpeditionProfile(enemy);G.buffs=[];recomputeStats();const plain=getExpeditionProfile(enemy);`);
  assert.equal(run('singleton.castRates.cometprocession'),0);assert.equal(run('sealed.spells.some(sp=>sp.id===\'spark\'||sp.id===\'seedshot\')'),false);assert.equal(run('baseline.dps'),run('plain.dps'));
});
test('paid Comets survive save normalization and long absence until a valid target receives one volley',()=>{
  const {run}=game();run(`const target=mob();cast('cometprocession',target);G.equippedSpells=['spark'];const paid=G.magic.comets.budget;G.magic=normalizeMagic(JSON.parse(JSON.stringify(G.magic)));ageMagic(9*3600);const ready=G.magic.comets.remaining;G.enemy=target;tickMagic();const after=target.hp;tickMagic();`);
  assert.equal(run('ready'),0);assert.equal(run('target.maxHp-after'),Math.floor(run('paid')));assert.equal(run('target.hp'),run('after'));assert.equal(run('G.magic.comets'),null);
});
test('large legal spell budgets and marked enemy damage survive normalization without truncation',()=>{
  const {run}=game();run(`G.magic.comets={remaining:4,budget:1e20};G.magic.summons.clay={remaining:14,hp:1e18,hits:3};G.magic.notes=[{el:'fire',spent:4,damage:1e18}];const restored=normalizeMagic(JSON.parse(JSON.stringify(G.magic)));const enemy=normalizeEnemyMagic({seeds:[0,1,4],ledger:{remaining:12,debt:1e18,cap:1e20}});`);
  assert.equal(run('restored.comets.budget'),1e20);assert.equal(run('restored.summons.clay.hp'),1e18);assert.equal(run('restored.notes[0].damage'),1e18);assert.equal(run('enemy.ledger.debt'),1e18);
});
test('sustained profiles reject unsafe HP trades and retain trades supported by real healing',()=>{
  const {run}=game();run(`const enemy={hp:1e8,atk:0,def:0,spd:0.1};G.equippedSpells=['transfusion','realitytear'];G.baseStats.manaRegen=1;G.hero.mana=0;G.hero.maxHp=570;G.hero.hp=1;const unsafe=getExpeditionProfile(enemy);G.hero.hp=570;const unsustainable=getExpeditionProfile(enemy);G.equippedSpells=['bloodpact','realitytear'];G.hero.hp=1;const unsafePact=getExpeditionProfile(enemy);G.hero.hp=570;const drainingPact=getExpeditionProfile(enemy);G.equippedSpells=['transfusion','realitytear','greaterheal'];G.baseStats.manaRegen=100;const supported=getExpeditionProfile(enemy);`);
  assert.equal(run('unsafe.castRates.transfusion||0'),0);assert.equal(run('unsustainable.castRates.transfusion||0'),0);
  assert.equal(run('unsafePact.castRates.bloodpact||0'),0);assert.equal(run('drainingPact.castRates.bloodpact||0'),0);
  assert.ok(run('supported.castRates.transfusion')>0);assert.ok(run('supported.healPerSec')>=run('supported.incoming'));
});
test('profile threshold rules honor current resources and chronological encounter activation',()=>{
  const {run}=game();run(`const enemy={hp:1e8,atk:100,def:0,spd:1};G.equippedSpells=['cometprocession'];G.baseStats.manaRegen=100;setSpellRule('cometprocession','hp',0.1);const healthy=getExpeditionProfile(enemy);G.hero.hp=50;const injured=getExpeditionProfile(enemy);const waiting=getExpeditionProfile({...enemy,conditionState:{cometprocession:false}});G.hero.hp=1000;const latched=getExpeditionProfile({...enemy,conditionState:{cometprocession:true}});setSpellRule('cometprocession','mana',0.2);G.hero.mana=10000;const rich=getExpeditionProfile(enemy);G.hero.mana=0;const low=getExpeditionProfile(enemy);`);
  assert.equal(run('healthy.castRates.cometprocession'),0);assert.ok(run('injured.castRates.cometprocession')>0);
  assert.equal(run('waiting.castRates.cometprocession'),0);assert.ok(run('latched.castRates.cometprocession')>0);
  assert.equal(run('rich.castRates.cometprocession'),0);assert.ok(run('low.castRates.cometprocession')>0);
});
test('Orbital Veil sustained defense lowers forecast incoming damage',()=>{
  const {run}=game();run(`expeditionInscription=()=> 'orbital';const enemy={hp:1e8,atk:100,def:0,spd:1};G.baseStats.manaRegen=100;G.equippedSpells=[];const plain=getExpeditionProfile(enemy);G.equippedSpells=['stardustveil'];const orbital=getExpeditionProfile(enemy);`);
  assert.ok(run('orbital.castRates.stardustveil')>0);assert.ok(run('orbital.incoming')<run('plain.incoming'));
});
test('Tempest speed expands the affordable action budget and stops when its rule is waiting',()=>{
  const {run}=game();run(`const enemy={hp:1e8,atk:1,def:0,spd:0.1};G.baseStats.manaRegen=100;G.equippedSpells=['tempest','gust','boulder','spark','iceshard'];const fast=getExpeditionProfile(enemy);setSpellRule('tempest','hp',0.1);const waiting=getExpeditionProfile(enemy);const activated=getExpeditionProfile({...enemy,conditionState:{tempest:true}});`);
  assert.ok(run('fast.attackRate')>run('waiting.attackRate'));assert.ok(run('fast.castRates.gust')>run('waiting.castRates.gust'));
  assert.equal(run('waiting.spells.some(sp=>sp.id===\'tempest\')'),false);assert.ok(run('activated.attackRate')>run('waiting.attackRate'));
  assert.equal(run('Number.isFinite(fast.dps)&&fast.manaPerSec<=100&&fast.spells.reduce((sum,sp)=>sum+sp.rate,0)<=fast.attackRate+1e-6'),true);
});
test('encounter loadout and rules snapshots exclude current edits and inactive school dependencies',()=>{
  const {run}=game();run(`const enemy={hp:1e8,atk:20,def:0,spd:1,loadout:['spark','iceshard','seedshot','clockworkchorus'],rules:{seedshot:{condition:'hp',threshold:0.1}},conditionState:{seedshot:false}};G.baseStats.manaRegen=100;G.equippedSpells=['cometprocession'];G.magic.rules={spark:{condition:'mana',threshold:0.1}};const snapshot=getExpeditionProfile(enemy);const active=getExpeditionProfile({...enemy,conditionState:{seedshot:true}});G.awakenCount=0;const dormant=getExpeditionProfile({...enemy,loadout:['manabolt','cometprocession','spark','spark']});`);
  assert.equal(run('snapshot.spells.some(sp=>sp.id===\'cometprocession\'||sp.id===\'seedshot\')'),false);
  assert.ok(run('snapshot.castRates.spark')>0);assert.equal(run('snapshot.castRates.clockworkchorus'),0);assert.ok(run('active.castRates.clockworkchorus')>0);
  assert.deepEqual(JSON.parse(run('JSON.stringify(dormant.spells.map(sp=>sp.id))')),['spark']);
});
test('encounter inscription snapshots preserve explicit none and prior Ashglass after an equipment change',()=>{
  const {run}=game();run(`const enemy={hp:1e8,atk:20,def:0,spd:1};G.baseStats.manaRegen=100;expeditionInscription=()=> 'brine';G.equippedSpells=['iceshard'];const currentBrine=getExpeditionProfile(enemy);const savedNone=getExpeditionProfile({...enemy,inscription:null});G.equippedSpells=['spark'];const savedGlass=getExpeditionProfile({...enemy,inscription:'ashglass'});const currentSpark=getExpeditionProfile(enemy);`);
  assert.equal(run('currentBrine.conditions.includes(\'soaked\')'),true);assert.equal(run('savedNone.conditions.includes(\'chilled\')'),true);assert.equal(run('savedNone.conditions.includes(\'soaked\')'),false);
  assert.equal(run('savedGlass.conditions.includes(\'burning\')'),false);assert.equal(run('currentSpark.conditions.includes(\'burning\')'),true);
});
