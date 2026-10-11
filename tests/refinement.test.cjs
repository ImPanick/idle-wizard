const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');
function practice(){
  const g=game();g.run(`G.refinements={};G.purchaseRules={reserve:0,refinement:null,tempering:null};
    G.awakenCount=5;G.unlocked=9;G.hero.lvl=100;G.gold=1e12;G.expeditions.discoveries.nature=true;
    G.knownSpells=SPELLS.map(s=>s.id);G.autoExplore=false;recomputeStats();
    G.hero.hp=G.hero.maxHp;G.hero.mana=G.hero.maxMana;
    function spell(id){return SPELLS.find(s=>s.id===id);}
    function target(){const e=makeEnemy({name:'Practice target',hp:1e9,atk:10,def:0,spd:1,gold:0,xp:0,el:null},5,5,false);G.mobs=[e];G.enemy=e;return e;}`);return g;
}
function near(a,b){assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} ~= ${b}`);}

test('normalization keeps known dormant practices but rejects invalid paths, ranks and unknown spells',()=>{
  const g=practice();
  g.run(`G.awakenCount=0;G.unlocked=0;const raw={spark:{path:'potency',rank:10},manabolt:{path:'efficiency',rank:7},
    quietmeasure:{path:'potency',rank:1},wellspring:{path:'efficiency',rank:1},unknown:{path:'potency',rank:1},
    cinder:{path:'potency',rank:11},firebolt:{path:'potency',rank:1.5},fireball:{path:'reroll',rank:1}};
    const normalized=normalizeRefinements(raw,G);normalized.spark.rank=2;`);
  assert.deepEqual(g.json('normalizeRefinements(raw,G)'),{spark:{path:'potency',rank:10},manabolt:{path:'efficiency',rank:7}});
  assert.equal(g.run('raw.spark.rank'),10);
  for(const invalid of ['undefined','null','[]','false'])assert.deepEqual(g.json(`normalizeRefinements(${invalid},G)`),{});
  assert.deepEqual(g.json("normalizeRefinements({spark:{path:'potency',rank:1}},{knownSpells:[]})"),{});
});

test('paths do not sell ineffective upgrades or amplify resource conversion utilities',()=>{
  const g=practice();
  for(const id of ['transfusion','quietmeasure'])assert.deepEqual(g.json(`refinementPaths(spell('${id}'))`),[]);
  for(const id of ['draft','sporecall','constellation','borrowedmoment','redshift','spellforge']){
    assert.deepEqual(g.json(`refinementPaths(spell('${id}'))`),['efficiency']);
    assert.equal(g.run(`purchaseRefinement('${id}','potency')`),0);
  }
  for(const id of ['bloom','counterpoint','wildharvest','claysentinel','cometprocession'])assert.deepEqual(g.json(`refinementPaths(spell('${id}'))`),['potency','efficiency']);
  assert.deepEqual(g.json("refinementPaths(spell('wellspring'))"),['potency']);
});

test('preview and Buy Max honor exact escalating costs, progression caps and the reserved balance',()=>{
  const g=practice();
  g.run('G.unlocked=0;G.gold=600;G.purchaseRules.reserve=200;const before=JSON.stringify(G);');
  assert.deepEqual(g.json("refinementPreview('spark','potency',true)"),{ranks:2,cost:320,from:0,to:2,cap:2,available:true,affordable:true,path:'potency'});
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  assert.equal(g.run("purchaseRefinement('spark','potency',true)"),2);assert.equal(g.run('G.gold'),280);
  assert.equal(g.run("purchaseRefinement('spark','potency',true)"),0);
  g.run('G.unlocked=1;G.gold=10000;');
  assert.equal(g.run("refinementPreview('spark','potency',true).cap"),4);
  assert.equal(g.run("purchaseRefinement('spark','potency',true)"),2);
  assert.equal(g.run('G.refinements.spark.rank'),4);
  g.run('G.unlocked=9;G.gold=1e12;');assert.equal(g.run("purchaseRefinement('spark','potency',true)"),6);
  assert.equal(g.run('G.refinements.spark.rank'),10);
});

test('unaffordable, locked-school, unlearned and alternate-path purchases spend nothing',()=>{
  const g=practice();g.run('G.gold=100;G.purchaseRules.reserve=1;');
  assert.equal(g.run("refinementPreview('spark','potency').cost"),100);
  assert.equal(g.run("refinementPreview('spark','potency').affordable"),false);
  assert.equal(g.run("purchaseRefinement('spark','potency')"),0);assert.equal(g.run('G.gold'),100);
  g.run("G.gold=10000;purchaseRefinement('spark','efficiency');const balance=G.gold;G.awakenCount=0;G.knownSpells=G.knownSpells.filter(id=>id!=='cinder');");
  for(const [id,path] of [['spark','potency'],['manabolt','potency'],['cinder','efficiency'],['missing','efficiency']])assert.equal(g.run(`purchaseRefinement('${id}','${path}',true)`),0);
  assert.equal(g.run('G.gold'),g.run('balance'));
  assert.deepEqual(g.json('G.refinements.spark'),{path:'efficiency',rank:1});
});

test('potency copies native damage, healing, buffs and DoT once without boosting ratios or timers',()=>{
  const g=practice();g.run(`const authored=JSON.stringify(SPELLS);
    for(const id of ['spark','mend','curse','earthward'])G.refinements[id]={path:'potency',rank:10};
    const first=refinedSpell(spell('spark')),second=refinedSpell(first);`);
  near(g.run('first.dmg'),9.6);assert.equal(g.run('first===second'),true);
  near(g.run("refinedSpell(spell('mend')).heal"),30);
  near(g.run("refinedSpell(spell('curse')).dot.dps"),16.8);
  near(g.run("refinedSpell(spell('earthward')).buff.amt"),14.4);
  assert.equal(g.run("refinedSpell(spell('earthward')).buff.dur"),10);
  assert.equal(g.run("refinedSpell(spell('earthward')).guard"),.4);
  assert.equal(g.run('first.burn.ratio'),.25);assert.equal(g.run('JSON.stringify(SPELLS)'),g.run('authored'));
});

test('efficiency benefits low-cost spells without creating free casts or doubling discounts',()=>{
  const g=practice();g.run(`G.refinements.spark={path:'efficiency',rank:10};const refined=refinedSpell(spell('spark'));`);
  near(g.run('refined.cost'),3.4);near(g.run('refinedSpell(refined).cost'),3.4);
  assert.equal(g.run("refinedSpell({...spell('spark'),cost:.5}).cost"),1);
  assert.equal(g.run("refinedSpell({...spell('spark'),cost:0}).cost"),0);
  assert.equal(g.run("spell('spark').cost"),4);
});

test('original live casts and Resonance record the actual discounted amount paid',()=>{
  const g=practice();g.run(`G.hero.mana=100;G.refinements.spark={path:'efficiency',rank:10};
    const e=target();castSpell(spell('spark'),e);const remaining=G.hero.mana,paid=G.magic.notes[0].spent;
    G.hero.mana=0;castSpell(spell('quietmeasure'),e);`);
  near(g.run('remaining'),96.6);near(g.run('paid'),3.4);near(g.run('G.hero.mana'),3.4*.35);
  assert.equal(g.run('G.magic.notes.length'),0);
});

test('original casting accepts mana sufficient for the refined cost before selecting the spell',()=>{
  const g=practice();g.run(`G.refinements.spark={path:'efficiency',rank:10};G.hero.mana=3.5;
    const e=target(),affordable=canAffordCast(spell('spark'));castSpell(spell('spark'),e);`);
  assert.equal(g.run('affordable'),true);near(g.run('G.hero.mana'),.1);
  near(g.run('G.magic.notes[0].spent'),3.4);
});

test('potency improves percentage-based native healing once when the authored flat heal is smaller',()=>{
  const g=practice();g.run(`G.hero.maxHp=10000;G.elements.water=0;
    const ordinary=spellHealAmount(spell('mend'));G.refinements.mend={path:'potency',rank:10};
    const improved=spellHealAmount(refinedSpell(spell('mend')));`);
  assert.equal(g.run('ordinary'),800);assert.equal(g.run('improved'),960);
});

test('expansion live casts use the same discounted cost as their sustainable profile',()=>{
  const g=practice();g.run(`G.equippedSpells=['dicefire',null,null,null,null,null,null,null];
    G.refinements.dicefire={path:'efficiency',rank:10};const e=target();G.hero.mana=100;
    const expected=refinedSpell(spell('dicefire')).cost;castSpell(spell('dicefire'),e);
    const profile=getExpeditionProfile({hp:1e9,atk:1,def:0,spd:1,el:null,isBoss:false});`);
  near(g.run('100-G.hero.mana'),20.4);
  near(g.run('profile.manaPerSec/profile.castRates.dicefire'),g.run('expected'));
});

test('Wellspring potency increases the live buff and sustainable regeneration by the same finite amount',()=>{
  const g=practice();g.run(`G.equippedSpells=['wellspring',null,null,null,null,null,null,null];
    const enemy={hp:1e9,atk:1,def:0,spd:1,el:null,isBoss:false},ordinary=getExpeditionProfile(enemy);
    G.refinements.wellspring={path:'potency',rank:10};const improved=getExpeditionProfile(enemy),baseRegen=G.baseStats.manaRegen;
    castSpell(spell('wellspring'),target());`);
  near(g.run('improved.manaRegen-ordinary.manaRegen'),g.run("Math.min(1,8*improved.castRates.wellspring)"));
  near(g.run("G.buffs.find(b=>b._spellId==='wellspring').amt"),6);
  near(g.run('G.baseStats.manaRegen-baseRegen'),6);
  near(g.run('improved.manaRegen-baseRegen'),g.run("G.buffs.find(b=>b._spellId==='wellspring').amt*Math.min(1,8*improved.castRates.wellspring)"));
});

test('potent Dicefire and Seedshot hit once at the intended magnitude, including repeated inscriptions',()=>{
  const g=practice();g.run(`G.refinements.dicefire={path:'potency',rank:10};G.refinements.seedshot={path:'potency',rank:10};
    const e=target(),expected=Math.floor(spellPower(refinedSpell(spell('dicefire'))));
    const before=e.hp;castSpell(spell('dicefire'),e);const dealt=before-e.hp;
    const weighted=inscribedSpell(spell('dicefire'),'weighted'),twice=inscribedSpell(weighted,'weighted');
    const plain=inscribedSpell(weighted,null);`);
  assert.equal(g.run('dealt'),g.run('expected'));
  near(g.run('weighted.dmg'),75*1.2*.85);assert.equal(g.run('weighted===twice'),true);
  near(g.run('plain.dmg'),90);
  near(g.run("spellPower(refinedSpell(spell('seedshot')),18)/spellPower(spell('seedshot'),18)"),1.2);
});

test('potency supports finite summon damage, Seed healing and bounded protective budgets',()=>{
  const g=practice();g.run(`for(const id of ['emberfamiliar','bloom','counterpoint'])G.refinements[id]={path:'potency',rank:10};
    const e=target();castSpell(spell('emberfamiliar'),e);const pulse=G.magic.summons.ember.power;
    enemyMagic(e).seeds=[0];G.hero.hp=G.hero.maxHp/2;const hp=G.hero.hp;castSpell(spell('bloom'),e);
    const healed=G.hero.hp-hp;G.magic.notes=[{el:'fire',spent:1,damage:1},{el:'water',spent:1,damage:1},{el:'earth',spent:1,damage:1}];
    castSpell(spell('counterpoint'),e);`);
  near(g.run('pulse'),g.run("spellPower(refinedSpell(spell('emberfamiliar')),7)"));
  near(g.run('healed'),g.run('G.hero.maxHp*.06*1.2'));
  near(g.run('G.magic.barrier.budget'),g.run('G.hero.maxHp*.18*1.2'));
  assert.equal(g.run('G.magic.summons.ember.remaining'),12);
});

test('purchases preserve active encounter snapshots and do not credit casts or affinity',()=>{
  const g=practice();g.run(`G.equippedSpells=['spark',null,null,null,null,null,null,null];recordExpeditionBoss('ember');startExpedition('orchard');beginExpeditionFight();
    const snapshot=JSON.stringify(G.expeditions.active),mastery=JSON.stringify(G.spellMastery),affinity=JSON.stringify(G.elementXp);
    const before=getExpeditionProfile({hp:1e9,atk:1,def:0,spd:1,el:null,isBoss:false});purchaseRefinement('spark','potency',true);
    const after=getExpeditionProfile({hp:1e9,atk:1,def:0,spd:1,el:null,isBoss:false});`);
  assert.equal(g.run('JSON.stringify(G.expeditions.active)'),g.run('snapshot'));
  assert.equal(g.run('JSON.stringify(G.spellMastery)'),g.run('mastery'));
  assert.equal(g.run('JSON.stringify(G.elementXp)'),g.run('affinity'));
  assert.ok(g.run('after.dps>before.dps'));
});

test('manual saves preserve refined native buffs and Orbital defense without broadening their amount limits',()=>{
  for(const orbital of [false,true]){
    const g=practice();g.run(`G.refinements.earthward={path:'potency',rank:10};
      G.refinements.stardustveil={path:'potency',rank:10};
      G.expeditions.inscriptions.orbital=${orbital};equipExpeditionInscription(${orbital?"'orbital'":"null"});
      const e=target();castSpell(spell('earthward'),e);castSpell(spell('stardustveil'),e);
      const originalBuffs=JSON.stringify(G.buffs),code=exportSave(),restored=importSave(code);`);
    assert.equal(g.run('restored'),true,g.run('lastSaveError'));
    assert.deepEqual(g.json('G.buffs'),JSON.parse(g.run('originalBuffs')));
    assert.equal(g.run("G.buffs.find(b=>b._spellId==='stardustveil').stat"),orbital?'def':'dmgMul');
    assert.deepEqual(g.json('G.refinements'),{earthward:{path:'potency',rank:10},stardustveil:{path:'potency',rank:10}});
  }
  const g=practice();g.run(`G.refinements.earthward={path:'potency',rank:10};
    const e=target();castSpell(spell('earthward'),e);const forged=decodeSave(exportSave());forged.buffs[0].amt=1000;`);
  assert.throws(()=>g.run('buildImportedState(forged)'),/buff amount/);
});

test('Bound Tomes retain practices across Awakening while unbound practices and both automatic targets reset',()=>{
  for(const keep of [false,true]){
    const g=practice();g.run(`G.awakening.a_keep_spells=${keep};G.hero.lvl=AWAKEN_LEVEL;G.unlocked=AWAKEN_ZONE;
      G.refinements.spark={path:'potency',rank:10};G.refinements.manabolt={path:'efficiency',rank:7};
      G.purchaseRules={reserve:500,refinement:{id:'spark',path:'potency'},tempering:'g1'};awaken();
      const restored=buildImportedState(decodeSave(exportSave())).state;`);
    assert.deepEqual(g.json('G.refinements'),keep?{spark:{path:'potency',rank:10},manabolt:{path:'efficiency',rank:7}}:{});
    assert.deepEqual(g.json('restored.refinements'),g.json('G.refinements'));
    assert.deepEqual(g.json('G.purchaseRules'),{reserve:500,refinement:null,tempering:null});
    if(keep){near(g.run("refinedSpell(spell('spark')).dmg"),9.6);assert.equal(g.run("refinementPreview('spark','potency').available"),false);}
  }
});

test('automatic spell practice keeps the reserved balance and never settles the clock recursively',()=>{
  const g=practice();g.run(`G.unlocked=0;G.gold=150;G.purchaseRules={reserve:50,refinement:{id:'spark',path:'efficiency'},tempering:null};
    const settle=settleClockForAction;settleClockForAction=()=>{throw Error('recursive clock settlement');};runPurchaseRules();
    const firstRank=G.refinements.spark.rank,firstGold=G.gold;G.gold+=220;runPurchaseRules();
    settleClockForAction=settle;
    const saved=buildImportedState(decodeSave(exportSave())).state;`);
  assert.equal(g.run('firstRank'),1);assert.equal(g.run('firstGold'),50);
  assert.equal(g.run('G.refinements.spark.rank'),2);assert.equal(g.run('G.gold'),50);
  assert.deepEqual(g.json('saved.purchaseRules'),{reserve:50,refinement:{id:'spark',path:'efficiency'},tempering:null});
});
