/* Deterministic expedition, reward and checkpoint contracts. No dependencies. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
const source=fs.readFileSync(path.join(__dirname,'..','dev','expeditions.inc.js'),'utf8');
function game(){
 const ctx=vm.createContext({Math,Date,console});
 vm.runInContext(`
  const G={gold:0,hero:{lvl:24,xp:0,hp:1000,maxHp:1000,mana:200,maxMana:200,alive:true},materials:{dust:0,crystal:0,herb:0,gem:0},treasureMaps:0,awakenCount:5,unlocked:0,crusade:{active:null},trial:{inTrial:false},inDungeon:false,baseStats:{maxHp:1000,def:200,manaRegen:5,goldFind:1,xpMul:1},equippedSpells:[]};
  const ZONES=Array.from({length:10},(_,i)=>({boss:{name:['Wisp Drake','Shade Drake','Ember Drake','Tide Drake','Storm Drake','Hollow Wyrm','Aether Drake','Chrono Wyrm','Stellar Behemoth','The Slumbering Elder'][i],hp:2200*(i+1),atk:64*(i+1),def:14*(i+1),spd:1,el:'fire',gold:1400*(i+1),xp:800*(i+1)}}));
  const SPELLS=[];
  function awakenDifficulty(){return {enemyHp:1,enemyAtk:1,enemyDef:1,reward:1};}
  let profileCalls=0;
  function getExpeditionProfile(){profileCalls++;return {dps:100,healPerSec:100,mitigation:.3,manaPerSec:3,conditions:[]};}
  function checkLevelUp(){}
 `+source,ctx);
 const run=code=>vm.runInContext(code,ctx,{timeout:10000});
 run('initExpeditions();EXPEDITION_BOSSES.forEach(recordExpeditionBoss);');
 return {run,snapshot:()=>JSON.parse(run('JSON.stringify({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions})'))};
}
function close(a,b,at='state'){
 if(typeof a==='number'&&typeof b==='number'){assert.ok(Math.abs(a-b)<1e-6,`${at}: ${a} vs ${b}`);return;}
 if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),at);for(const key of Object.keys(a))close(a[key],b[key],at+'.'+key);return;}
 assert.deepEqual(a,b,at);
}
function thresholdGame(){
 const g=game();g.run(`SPELLS.push({id:'cometprocession',type:'damage'},{id:'wellspring',type:'buff'});G.equippedSpells=['cometprocession','wellspring'];G.magic={rules:{cometprocession:{condition:'hp',threshold:.8},wellspring:{condition:'mana',threshold:.8}}};
 getExpeditionProfile=enemy=>{profileCalls++;const comet=enemy.conditionState?.cometprocession===true,spring=enemy.conditionState?.wellspring===true;return {dps:comet?20:1,incoming:20,healPerSec:comet?35:0,manaPerSec:9,manaRegen:spring?12:5,spells:[...(comet?[{id:'cometprocession',rate:.2}]:[]),...(spring?[{id:'wellspring',rate:.2}]:[])],castRates:{cometprocession:comet?.2:0,wellspring:spring?.2:0},affinityPerSec:{cosmic:comet?1:0}};};startExpedition('orchard','restore');advanceExpedition(150);`);
 return g;
}
test('HP and mana rules cast only after their saved threshold and latch after recovery',()=>{
 const g=thresholdGame(),enemyMaxHp=g.run('G.expeditions.active.enemyMaxHp');assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),false);assert.equal(g.run('G.expeditions.active.profile.castRates.cometprocession'),0);
 g.run('advanceExpedition(9.999);');assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),false);assert.equal(g.run('G.spellMastery?.cometprocession||0'),0);
 g.run('advanceExpedition(.001);');assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),true);assert.equal(g.run('G.expeditions.active.conditionState.wellspring'),true);assert.ok(g.run('G.expeditions.active.profile.castRates.cometprocession')>0);assert.equal(g.run('G.spellMastery?.cometprocession||0'),0);assert.equal(g.run('G.expeditions.active.enemyMaxHp'),enemyMaxHp,'threshold does not refill the health bar');
 g.run('advanceExpedition(5);');assert.ok(g.run('G.hero.hp/G.hero.maxHp')>.8);assert.ok(g.run('G.hero.mana/G.hero.maxMana')>.8);assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),true);assert.equal(g.run('G.expeditions.active.conditionState.wellspring'),true);
});
test('damaged encounter entry activates HP rule and edits wait for the next encounter',()=>{
 const g=thresholdGame();g.run('G.hero.hp=500;beginExpeditionFight();');assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),true);
 g.run("G.magic.rules.cometprocession={condition:'hp',threshold:.1};G.equippedSpells=['wellspring'];advanceExpedition(1);");assert.equal(g.run('G.expeditions.active.rules.cometprocession.threshold'),.8);assert.equal(g.run("G.expeditions.active.loadout.includes('cometprocession')"),true);
});
test('conditional checkpoints and a nine-hour jump reproduce small steps without cast chatter',()=>{
 const live=thresholdGame(),away=thresholdGame(),imported=thresholdGame();live.run('advanceExpedition(7);');away.run('advanceExpedition(7);');
 const save=away.snapshot();imported.run(`Object.assign(G,${JSON.stringify(save)});G.expeditions=normalizeExpeditions(G.expeditions,G);`);
 live.run('for(let i=0;i<129600;i++)advanceExpedition(.25);');away.run('advanceExpedition(32400);');imported.run('advanceExpedition(32400);');close(live.snapshot(),away.snapshot());close(away.snapshot(),imported.snapshot());
 assert.deepEqual(JSON.parse(live.run('JSON.stringify(G.spellMastery)')),JSON.parse(away.run('JSON.stringify(G.spellMastery)')));assert.deepEqual(JSON.parse(away.run('JSON.stringify(G.spellMastery)')),JSON.parse(imported.run('JSON.stringify(G.spellMastery)')));assert.ok(away.run('profileCalls')<1000,'each encounter has a finite number of latches');
});
test('a threshold cannot extend Leviathan sealing or discard already dealt boss damage',()=>{
 const g=thresholdGame();g.run(`G.expeditions.discoveries.observatory=true;G.expeditions.discoveries.atlas=true;G.magic.rules.cometprocession.threshold=.98;getExpeditionProfile=enemy=>({dps:enemy.conditionState?.cometprocession?1:100,incoming:20,healPerSec:0,manaPerSec:0,manaRegen:5});startExpedition('leviathan','recover');G.expeditions.active.phase=3;beginExpeditionFight();const bossHp=ZONES[7].boss.hp*.7;advanceExpedition(8);`);
 assert.equal(g.run('G.expeditions.active.bossStep'),1);assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),true);assert.equal(g.run('G.expeditions.active.deadlineMs'),0);assert.ok(g.run('G.expeditions.active.firstBossHp')<800);assert.equal(g.run('G.expeditions.active.enemyMaxHp'),g.run('bossHp-G.expeditions.active.firstBossHp'));
});
test('an imported encounter cannot retain an inscription from a dormant Awakening',()=>{
 const g=game();g.run("G.expeditions.inscriptions.redaction=true;equipExpeditionInscription('redaction');startExpedition('orchard','restore');advanceExpedition(150);const saved=JSON.parse(JSON.stringify(G.expeditions));const dormant=normalizeExpeditions(saved,{awakenCount:0});");assert.equal(g.run('dormant.active'),null);assert.equal(g.run('dormant.inscriptions.redaction'),true);
});
test('all six regions have three encounters, a boss and printable ASCII portraits',()=>{
 const {run}=game();assert.equal(run('EXPEDITION_REGIONS.length'),6);
 assert.equal(run('EXPEDITION_REGIONS.every(r=>r.encounters.length===3&&r.boss.name&&/^[\\x09\\x0a\\x0d\\x20-\\x7e]*$/.test(r.portrait))'),true);
});
test('migration records only provable boss victories and original legacy reward',()=>{
 const {run}=game();run('const old=normalizeExpeditions(null,{unlocked:3,awakenCount:5,crusade:{active:{startedAt:1000,duration_s:30,reward:{gold:900,xp:50,dust:12}}}});');
 assert.deepEqual(JSON.parse(run('JSON.stringify(Object.keys(old.bossVictories))')),['wisp','shade','ember']);
 assert.equal(run('old.bossVictories.hollow'),undefined);assert.equal(run('old.legacyClaim.deadline'),31000);
});
test('region and school gates remain separate and permanent across journeys',()=>{
 const {run}=game();run("G.awakenCount=0;G.expeditions.bossVictories={ember:true,tide:true,hollow:true,aether:true,stellar:true};");
 assert.equal(run("regionUnlocked('orchard')"),true);assert.equal(run("regionUnlocked('atlas')"),false);
 run('G.awakenCount=5;delete G.expeditions.bossVictories.stellar;');assert.equal(run("regionUnlocked('orrery')"),false);
 run("G.awakenCount=4;G.expeditions.discoveries.observatory=true;G.expeditions.discoveries.atlas=true;");assert.equal(run("regionUnlocked('leviathan')"),true);
 run("G.expeditions.discoveries.nature=true;resetExpeditionJourney();");assert.equal(run('G.expeditions.discoveries.nature'),true);
});
test('assignment refuses Trials and dungeons and applies policy at encounter boundary',()=>{
 const {run}=game();run('G.trial.inTrial=true;');assert.equal(run("startExpedition('orchard')"),false);
 run('G.trial.inTrial=false;G.inDungeon=true;');assert.equal(run("startExpedition('orchard')"),false);
 run('G.inDungeon=false;');assert.equal(run("startExpedition('orchard','restore')"),true);
 run("setExpeditionPolicy('burn');advanceExpedition(1);");assert.equal(run('G.expeditions.active.policy'),'restore');
 run('advanceExpedition(300);');assert.equal(run('G.expeditions.active.policy'),'burn');
});
test('nine-hour jump reproduces quarter-second advances for every region',()=>{
 for(const id of ['orchard','observatory','atlas','leviathan','foundry','orrery']){
  const live=game(),away=game();for(const g of [live,away])g.run(`G.expeditions.discoveries.observatory=true;G.expeditions.discoveries.atlas=true;startExpedition('${id}');`);
  live.run('for(let i=0;i<129600;i++)advanceExpedition(.25);');away.run('advanceExpedition(32400);');
  close(live.snapshot(),away.snapshot(),id);assert.ok(away.run(`G.expeditions.records.${id}.circuits`)>0,id+' completes automatically');
 }
});
test('imported mid-encounter checkpoint resumes exact RNG, damage and rewards',()=>{
 const uninterrupted=game(),resumed=game();uninterrupted.run("startExpedition('foundry','overload');advanceExpedition(95);");
 const save=uninterrupted.snapshot();resumed.run(`Object.assign(G,${JSON.stringify(save)});G.expeditions=normalizeExpeditions(G.expeditions,G);`);
 uninterrupted.run('advanceExpedition(10000);');resumed.run('advanceExpedition(10000);');close(uninterrupted.snapshot(),resumed.snapshot());
});
test('overpowered twelve-hour repeat stays bounded and keeps all elapsed time',()=>{
 const {run}=game();run("getExpeditionProfile=()=>{profileCalls++;return {dps:1e12,healPerSec:100,mitigation:.8,manaPerSec:0};};startExpedition('orchard','burn');const report=advanceExpedition(43200);");
 assert.equal(run('report.unusedSeconds'),0);assert.equal(run('report.usedSeconds'),43200);assert.ok(run('profileCalls')<600);assert.ok(run('report.circuits')>100);
});
test('insufficient survival retreats safely and returns unused credited time',()=>{
 const {run}=game();run("G.hero.hp=G.hero.maxHp=10;G.baseStats.maxHp=10;G.baseStats.def=0;getExpeditionProfile=()=>({dps:1,healPerSec:0,mitigation:0,manaPerSec:0});startExpedition('orchard','burn');const report=advanceExpedition(3600);");
 assert.equal(run('expeditionActive()'),false);assert.equal(run('report.failures'),2);assert.ok(run('report.unusedSeconds')>3000);assert.ok(run('G.hero.hp')>0);
 assert.ok(Math.abs(run('report.usedSeconds+report.unusedSeconds')-3600)<1e-6);
});
test('first Orchard clear discovers Nature, then repeats collect without claims',()=>{
 const {run}=game();run("G.awakenCount=0;startExpedition('orchard','restore');advanceExpedition(1800);");
 assert.equal(run('G.expeditions.discoveries.nature'),true);assert.equal(run('G.expeditions.inscriptions.ashglass'),true);assert.ok(run('G.expeditions.records.orchard.circuits')>=2);assert.ok(run('G.materials.herb')>0);
 const record=run('G.expeditions.records.orchard.circuits');run('resetExpeditionJourney();');assert.equal(run('G.expeditions.records.orchard.circuits'),record);
});
test('non-repeating assignment finishes once and returns its remaining interval',()=>{
 const {run}=game();run("startExpedition('orchard','restore',false);const report=advanceExpedition(3600);");assert.equal(run('report.circuits'),1);assert.equal(run('expeditionActive()'),false);assert.ok(run('report.unusedSeconds')>0);
});
test('events wait indefinitely, cannot charge twice, and never block repetition',()=>{
 const {run}=game();run("startExpedition('orchard');advanceExpedition(1800);G.materials.dust=1000;const before=G.materials.crystal;");
 assert.equal(run("resolveExpeditionEvent('market','crystal')"),true);assert.equal(run('G.materials.crystal-before'),8);assert.equal(run("resolveExpeditionEvent('market','crystal')"),false);
 run('advanceExpedition(10000);');assert.ok(run('G.expeditions.records.orchard.circuits')>10);assert.equal(run('G.expeditions.events.apprentice.resolved'),false);
 assert.equal(run("resolveExpeditionEvent('apprentice','scout')"),true);assert.equal(run('G.expeditions.apprentice'),'scout');
});
test('legacy Crusade promise pays once at its original deadline',()=>{
 const {run}=game();run('G.expeditions=normalizeExpeditions(null,{unlocked:0,crusade:{active:{startedAt:1000,duration_s:30,reward:{gold:900,xp:50,dust:12}}}});');
 assert.equal(run('advanceLegacyCrusade(30999)'),false);assert.equal(run('advanceLegacyCrusade(31000)'),true);assert.equal(run('advanceLegacyCrusade(99999)'),false);assert.equal(run('G.gold'),900);assert.equal(run('G.materials.dust'),12);
});
test('one equipped inscription replaces the old one and unknown ownership fails',()=>{
 const {run}=game();assert.equal(run("equipExpeditionInscription('ashglass')"),false);run("G.expeditions.inscriptions={ashglass:true,brine:true};");assert.equal(run("equipExpeditionInscription('ashglass')"),true);run("equipExpeditionInscription('brine');");assert.equal(run('expeditionInscription()'),'brine');run('equipExpeditionInscription(null);');assert.equal(run('expeditionInscription()'),null);
});
