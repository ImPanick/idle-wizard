const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');
const bands=[
 ['orchard',9,0,1,5,4,['greaterheal','earthward','iceshard','wellspring','fireball'],['bloom','seedshot','earthward','wellspring','fireball']],
 ['observatory',16,0,2,8,6,['greaterheal','earthward','iceshard','wellspring','fireball'],['bloom','seedshot','tidalwave','chainlightning','wellspring']],
 ['atlas',36,1,3,12,8,['greaterheal','earthward','iceshard','wellspring','realitytear','singularity'],['bloom','seedshot','earthward','wellspring','realitytear','wildharvest']],
 ['foundry',50,3,4,16,10,['greaterheal','earthward','iceshard','wellspring','realitytear','singularity','manabolt'],['greaterheal','wellspring','earthward','dicefire','contradiction','jestersdouble','realitytear']],
 ['leviathan',70,4,5,20,12,['greaterheal','earthward','iceshard','wellspring','realitytear','singularity','manabolt'],['greaterheal','quietmeasure','earthward','counterpoint','fireball','realitytear','clockworkchorus']],
 ['orrery',95,5,5,25,15,['greaterheal','earthward','iceshard','wellspring','realitytear','singularity','manabolt'],['greaterheal','earthward','wellspring','cometprocession','realitytear','iceshard','borrowedmoment']]
];
// Ordinary world-tier rare gear, a developed but unmaxed Manor and modest
// affinities. No crafted legendary stats, full mastery or endgame research.
function prepared(band,spells){
 const [id,lvl,awake,tier,manor,affinity]=band,g=game();g.run(`G.awakenCount=${awake};G.hero.lvl=${lvl};G.unlocked=9;G.gold=10000000;EXPEDITION_BOSSES.forEach(recordExpeditionBoss);G.expeditions.discoveries.nature=true;G.expeditions.discoveries.observatory=true;G.expeditions.discoveries.atlas=true;
 GEAR_SLOTS.forEach(slot=>G.gear[slot]=genGear(slot,${tier},'rare'));G.buildings.garden=${manor};G.buildings.sanctum=${manor};G.buildings.spellfoci=${manor};for(const el of visibleSchools())G.elements[el]=${affinity};
 G.knownSpells=${JSON.stringify(spells)};G.equippedSpells=${JSON.stringify(spells)};recomputeStats();G.hero.hp=G.hero.maxHp;G.hero.mana=G.hero.maxMana;startExpedition('${id}','balanced',false);`);return g;
}
test('all six entry bands clear with ordinary gear and two sustainable builds',()=>{
 for(const band of bands)for(const [kind,spells] of [['existing',band[6]],['mechanical',band[7]]]){
  const g=prepared(band,spells);g.run('const result=advanceExpedition(43200);');
  assert.equal(g.run('result.circuits'),1,band[0]+' / '+kind+' should clear');
  assert.equal(g.run('result.failures'),0,band[0]+' / '+kind+' should survive');
  assert.ok(g.run('result.usedSeconds')<1200,band[0]+' / '+kind+' reasonable circuit duration');
  assert.ok(g.run('G.hero.alive&&G.hero.hp>0&&G.hero.mana>=0'),band[0]+' / '+kind);
  assert.ok(g.run('Object.values(G.spellMastery).some(n=>n>0)'),band[0]+' / '+kind+' earns original cast progress');
 }
});
test('Cosmic circuit permits each standing policy without timed input',()=>{
 for(const policy of ['anchor','align','balanced']){const band=bands[5],g=prepared(band,band[7]);g.run(`stopExpedition();startExpedition('orrery','${policy}',false);const result=advanceExpedition(43200);`);assert.equal(g.run('result.circuits'),1,policy);assert.equal(g.run('result.failures'),0,policy);}
});
test('real Comet obeys the HP threshold at full health and activates once after damage',()=>{
 const g=prepared(bands[5],bands[5][7]);g.run(`setSpellRule('cometprocession','hp',.8);advanceExpedition(G.expeditions.active.remainingMs/1000);const initialEnemyMax=G.expeditions.active.enemyMaxHp;const blocked=getExpeditionProfile({...G.expeditions.active.encounter,loadout:G.expeditions.active.loadout,rules:G.expeditions.active.rules,conditionState:G.expeditions.active.conditionState});`);
 assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),false);assert.equal(g.run('blocked.castRates.cometprocession'),0);assert.equal(g.run('G.spellMastery.cometprocession||0'),0);
 g.run(`const a=G.expeditions.active,p=a.profile;const crossing=expeditionConditionBoundary(a,p.healPerSec-p.incoming,p.manaRegen-p.manaPerSec);advanceExpedition(crossing/1000);`);
 assert.equal(g.run('G.expeditions.active.conditionState.cometprocession'),true);assert.ok(g.run('G.expeditions.active.profile.castRates.cometprocession')>0);assert.equal(g.run('G.expeditions.active.enemyMaxHp'),g.run('initialEnemyMax'));
 const damaged=prepared(bands[5],bands[5][7]);damaged.run(`setSpellRule('cometprocession','hp',.8);G.hero.hp=G.hero.maxHp*.5;beginExpeditionFight();`);assert.equal(damaged.run('G.expeditions.active.conditionState.cometprocession'),true);assert.ok(damaged.run('G.expeditions.active.profile.castRates.cometprocession')>0);
});
test('imported low-awakening Orchard cannot retain a dormant Cosmic combat snapshot',()=>{
 const g=prepared(bands[5],bands[5][7]);g.run(`stopExpedition();startExpedition('orchard','restore');advanceExpedition(150);const save=decodeSave(exportSave());save.awakenCount=0;const imported=buildImportedState(save);`);assert.equal(g.run('imported.state.expeditions.active'),null);assert.equal(g.run("imported.state.knownSpells.includes('cometprocession')"),true);
});
test('reusable market recipes enforce funds, one acquisition and total automatic budget',()=>{
 const g=game();g.run("discoverExpeditionEvent('market');resolveExpeditionEvent('market','listen');G.materials.dust=1000;const before=G.materials.crystal;");
 assert.equal(g.run("expeditionMarketTrade('crystal',2)"),true);assert.equal(g.run('G.materials.dust'),760);assert.equal(g.run('G.materials.crystal-before'),16);assert.equal(g.run("expeditionMarketTrade('crystal',100)"),false);
 const band=bands[0],runner=prepared(band,band[6]);runner.run("discoverExpeditionEvent('market');resolveExpeditionEvent('market','listen');G.materials.dust=10000;setExpeditionMarketPolicy('crystal',240);setExpeditionRepeat(true);advanceExpedition(10000);");assert.equal(runner.run('G.expeditions.market.spent'),240);assert.ok(runner.run('G.expeditions.records.orchard.circuits')>2);
});
test('a saved Chalk Door branch pays only after its seeded detour finishes',()=>{
 const g=prepared(bands[2],bands[2][6]);g.run("discoverExpeditionEvent('door');const trait=G.expeditions.events.door.branchTrait;const before=G.materials.dust;resolveExpeditionEvent('door','enter');");
 assert.equal(g.run('G.materials.dust'),g.run('before'));assert.equal(g.run('G.expeditions.journal.door_fragment'),undefined);
 g.run('advanceExpedition(1000);');assert.equal(g.run('G.expeditions.journal.door_fragment'),true);assert.equal(g.run('G.expeditions.doorBranch'),null);assert.ok(g.run("G.expeditions.highlights.some(t=>t.includes('Chalk Door /'))"));
});
