const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');
function advanced(g){g.run(`G.awakenCount=5;G.hero.lvl=150;G.unlocked=9;G.gold=1e9;G.materials={dust:100000,crystal:100000,gem:10000,herb:100000};EXPEDITION_BOSSES.forEach(recordExpeditionBoss);G.expeditions.discoveries.nature=true;G.expeditions.discoveries.observatory=true;G.expeditions.discoveries.atlas=true;G.knownSpells=SPELLS.map(s=>s.id);G.equippedSpells=['spark','seedshot','bloom','wellspring',null,null,null,null];recomputeStats();G.hero.hp=G.hero.maxHp;G.hero.mana=G.hero.maxMana;`);}
function close(a,b,at='state'){
  if(typeof a==='number'&&typeof b==='number'){if(Number.isInteger(a)&&Number.isInteger(b))assert.equal(a,b,at);else assert.ok(Math.abs(a-b)<1e-5+1e-12*Math.max(1,Math.abs(a)),at+': '+a+' vs '+b);return;}
  if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),at);for(const k of Object.keys(a))close(a[k],b[k],at+'.'+k);return;}assert.deepEqual(a,b,at);
}
test('locked enemy labels stay hidden in old checkpoints and Trial previews',()=>{
  const g=game();g.run(`G.hero.lvl=100;recomputeStats();const hiddenRef={name:'Test sentinel',glyph:'T',hp:100,atk:1,def:1,spd:1,el:'arcane',gold:1,xp:1,tags:[]};G.enemy=makeEnemy(hiddenRef,3,3,true);G.trial.floor=10;trialBossRef=()=>hiddenRef;renderTrial();spawnTrialBoss();`);
  assert.doesNotMatch(g.run('mobTooltip(G.mobs[0])'),/Arcane/);
  assert.doesNotMatch(g.node('trial-status').innerHTML,/Arcane/);
  assert.doesNotMatch(g.run('G.log[G.log.length-1].text'),/Arcane/);
  g.run(`G.awakenCount=1;renderTrial();spawnTrialBoss();`);
  assert.match(g.run('mobTooltip(G.mobs[0])'),/Arcane/);
  assert.match(g.node('trial-status').innerHTML,/Arcane/);
  assert.match(g.run('G.log[G.log.length-1].text'),/Arcane/);
});
test('v29 round trip retains world clocks, Seeds, paid comets, score and RNG',()=>{
  const g=game();advanced(g);
  g.run(`genMap();G.enemy=G.mobs[0];G.enemy.hp-=1;G.enemy.magic={seeds:[0,2,4],briar:{remaining:8,hits:2,power:25},ledger:null};G.enemy.statuses={soaked:3};G.magic.notes=[{el:'fire',spent:4,damage:10}];G.magic.comets={remaining:3,budget:700,charges:3};G.magic.deferred=[{remaining:3,amount:10}];G.spellCd.spark=1.25;const beforeCheckpoint=worldCheckpoint();const beforeRng=G.rng;const code=exportSave();const decoded=decodeSave(code);G.magic=normalizeMagic();importSave(code);`);
  assert.equal(g.run('decoded.v'),29);assert.equal(g.run('G.rng'),g.run('beforeRng'));
  close(g.json('worldCheckpoint()'),g.json('beforeCheckpoint'));
  assert.equal(g.run('G.magic.comets.budget'),700);assert.equal(g.run('G.magic.deferred[0].amount'),10);assert.equal(g.run('G.magic.notes.length'),1);
});
test('older saves migrate without inferring unrecorded boss victories',()=>{
  const g=game();g.run(`const old=decodeSave(exportSave());old.v=28;old.unlocked=3;delete old.expeditions;delete old.magic;delete old.world;const migrated=buildImportedState(old);`);
  assert.deepEqual(g.json('Object.keys(migrated.state.expeditions.bossVictories)'),['wisp','shade','ember']);
  assert.equal(g.run('migrated.world'),null);assert.equal(g.run('migrated.state.magic.deferred.length'),0);
});
test('dormant imported schools cannot cast or execute a locked expedition',()=>{
  const g=game();advanced(g);g.run(`startExpedition('orrery');const saved=decodeSave(exportSave());saved.awakenCount=0;const imported=buildImportedState(saved);`);
  assert.equal(g.run('imported.state.expeditions.active'),null);assert.equal(g.run("schoolUnlocked('cosmic',imported.state)"),false);
  assert.equal(g.run("imported.state.knownSpells.includes('cometprocession')"),true);
});
test('assignment resources channel a ritual chronologically when mana runs out',()=>{
  const g=game();g.run(`G.hero.lvl=9;G.gold=10000;G.ritual.active=true;G.ritual.intensity=2;recomputeStats();G.hero.mana=30;const cfg=ritualCfg();const initial=10;G.hero.mana=initial+1*30;advanceAssignmentResources(30,{initialMana:initial,regeneration:1,combatManaPerSec:0});`);
  const cost=g.run('cfg.manaCost');assert.ok(cost>1);
  assert.equal(g.run('G.ritual.active'),false);assert.ok(Math.abs(g.run('G.hero.mana')-(40-cost*10/(cost-1)))<1e-6);
});
test('integrated expeditions reproduce small steps across real spell and resource systems',()=>{
  for(const id of ['orchard','observatory','atlas','leviathan','foundry','orrery']){
    const live=game(),away=game();for(const g of [live,away]){advanced(g);g.run(`G.golems.dust=2;startExpedition('${id}');`);}
    live.run('for(let i=0;i<7200;i++)advanceExpedition(.25);');away.run('advanceExpedition(1800);');
    close(live.json('({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,mastery:G.spellMastery,elements:G.elements,elementXp:G.elementXp})'),away.json('({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,mastery:G.spellMastery,elements:G.elements,elementXp:G.elementXp})'),id);
  }
});
test('an imported expedition resumes a partly completed encounter without reward duplication',()=>{
  const continuous=game(),resumed=game();advanced(continuous);advanced(resumed);
  continuous.run(`startExpedition('orchard','restore');advanceExpedition(160);const code=exportSave();`);
  resumed.node('unused');resumed.run('importSave('+JSON.stringify(continuous.run('code'))+');');
  continuous.run('advanceExpedition(3600);');resumed.run('advanceExpedition(3600);');
  close(continuous.json('({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,mastery:G.spellMastery})'),resumed.json('({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,mastery:G.spellMastery})'));
});
test('full inventory converts ordinary rewards and refuses paid unique production',()=>{
  const g=game();g.run(`G.gearInventory=Array.from({length:GEAR_CAPACITY},()=>({id:'existing'}));const before=G.materials.dust;storeGear({tier:0,rarity:'common',name:'Test Staff'});G.gold=100000;const cash=G.gold;rollSummon('arcane');`);
  assert.equal(g.run('G.gearInventory.length'),5000);assert.equal(g.run('G.materials.dust-before'),10);
  assert.equal(g.run('G.gold'),g.run('cash'));assert.equal(g.run('G.familiars.length'),0);
});
test('Ritual level transitions occur at the same instant during live and away expeditions',()=>{
  const live=game(),away=game();for(const g of [live,away]){advanced(g);g.run(`G.hero.xp=xpForLevel(G.hero.lvl)-5;G.ritual.active=true;G.researchActive={id:'r_xp1',timeLeft:20};G.alchemy.brewSlots=[{id:'p_heal_g',timeLeft:15}];startExpedition('orchard');`);}
  live.run('for(let i=0;i<2400;i++)advanceExpedition(.25);');away.run('advanceExpedition(600);');
  close(live.json('({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,ritual:G.ritual,research:G.researchCompleted,alchemy:G.alchemy})'),away.json('({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,ritual:G.ritual,research:G.researchCompleted,alchemy:G.alchemy})'));
});
test('Orbital Veil and a spent Suspension preserve their real buff on import',()=>{
  const g=game();advanced(g);
  g.run(`G.expeditions.inscriptions.orbital=true;equipExpeditionInscription('orbital');G.spellMastery.stardustveil=20000;G.enemy=G.mobs[0];G.hero.mana=10000;castSpell(SPELLS.find(s=>s.id==='stardustveil'),G.enemy);G.magic.notes=[{el:'fire',spent:4,damage:10}];castSpell(SPELLS.find(s=>s.id==='suspension'),G.enemy);const before=JSON.stringify(G.buffs);const code=exportSave();importSave(code);`);
  assert.deepEqual(g.json('G.buffs'),JSON.parse(g.run('before')));assert.equal(g.run('G.buffs[0].stat'),'def');assert.equal(g.run('G.buffs[0]._suspended'),true);
});
test('delayed damage settles beyond the reward cap and prevents premature Awakening',()=>{
  const g=game();g.run(`G.hero.lvl=24;G.unlocked=3;G.autoExplore=false;recomputeStats();G.hero.hp=G.hero.maxHp;G.magic.deferred=[{remaining:3,amount:10}];awaken();const blocked=G.awakenCount;const report=applyIdle(16*3600);`);
  assert.equal(g.run('blocked'),0);assert.equal(g.run('G.magic.deferred.length'),0);assert.equal(g.run('report.seconds'),43200);
});
