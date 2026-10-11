/* Player-selected speed: real elapsed time, manual saves, and one away recap. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { game } = require('./game-harness.cjs');

const speeds = [1, 2, 4, 8, 16, 32, 64, 128, 256];

function passive(speed = 1) {
  const g = game();
  g.run(`G.autoExplore=false;G.buildings.vault=1;G.golems.dust=1;
    recomputeStats();setGameSpeed(${speed});resetGameClock();`);
  return g;
}

function observeDialogs(g) {
  // The shared mechanics harness has no DOM tree. Add only the tree/focus
  // behavior required to verify the actual recap's lifetime and Continue.
  g.run(`document.body.children=[];let dialogFocuses=0;
    document.createElement=()=>({children:[],style:{},setAttribute(){},addEventListener(){},
      appendChild(child){this.children.push(child);return child;},
      remove(){document.body.children=document.body.children.filter(n=>n!==this);},
      focus(){dialogFocuses++;document.activeElement=this;}});
    document.body.appendChild=n=>{document.body.children.push(n);return n;};`);
}

test('all player speeds credit the corresponding passive time while visible', () => {
  for (const speed of speeds) {
    const g = passive(speed);
    for (let quarter = 0; quarter < 4; quarter++) {
      g.advance(250);
      g.run('gameTick();');
    }
    assert.equal(g.run('G.gold'), speed, `${speed}x gold`);
    assert.equal(g.run('G.materials.dust'), speed / 2, `${speed}x Dust Golem`);
    assert.equal(g.run('_pendingOfflineGains'), null, `${speed}x is active play`);
    assert.equal(g.run('_tickAccumulator'), 0, `${speed}x keeps pace`);
  }
});

test('256x continues to keep pace without active-time recap windows', () => {
  const g = passive(256);
  observeDialogs(g);
  for (let quarter = 0; quarter < 40; quarter++) {
    g.advance(250);
    g.run('gameTick();');
  }
  assert.equal(g.run('G.gold'), 2560);
  assert.equal(g.run('G.materials.dust'), 1280);
  assert.equal(g.run('_tickAccumulator'), 0);
  assert.equal(g.run('document.body.children.length'), 0);
});

test('changing speed settles earlier time using its earlier speed', () => {
  const g = passive(2);
  g.advance(125);
  g.run('setGameSpeed(4);');
  assert.equal(g.run('G.gold'), .25);
  g.advance(125);
  g.run('gameTick();setGameSpeed(1);');
  assert.equal(g.run('G.gold'), .75);
  g.advance(500);
  g.run('gameTick();');
  assert.equal(g.run('G.gold'), 1.25);
  assert.equal(g.run('_pendingOfflineGains'), null);
});

test('accelerated time advances research, brewing, buffs and spell cooldowns', () => {
  const g = passive(16);
  g.run(`G.hero.lvl=24;G.gold=10000;recomputeStats();
    G.researchActive={id:'r_atk1',timeLeft:8};
    G.alchemy.brewSlots=[{id:'p_boost_xp',timeLeft:12}];
    G.buffs=[{stat:'atk',amt:1,dur:8}];G.spellCd.spark=10;`);
  for (let quarter = 0; quarter < 4; quarter++) {
    g.advance(250);
    g.run('gameTick();');
  }
  assert.equal(g.run('G.researchCompleted.r_atk1'), true);
  assert.equal(g.run('G.researchActive'), null);
  assert.equal(g.run("Object.values(G.alchemy.potions.p_boost_xp).reduce((sum,n)=>sum+n,0)"), 1);
  assert.equal(g.run('G.alchemy.brewSlots.length'), 0);
  assert.equal(g.run('G.buffs.length'), 0);
  assert.equal(g.run('G.spellCd.spark'), 0);
});

test('manual export settles visible accelerated time and retains every supported speed', () => {
  for (const speed of speeds) {
    const g = passive(speed);
    g.advance(1000);
    g.run('const code=exportSave();const decoded=decodeSave(code);');
    assert.equal(g.run('decoded.speed'), speed);
    assert.equal(g.run('decoded.gold'), speed);
    g.run('G.speed=1;G.gold=0;');
    assert.equal(g.run('importSave(code)'), true);
    assert.equal(g.run('G.speed'), speed);
    assert.equal(g.run('G.gold'), speed);
    assert.equal(g.run('_pendingOfflineGains'), null);
  }
});

test('older saves default to normal speed and unsupported saved values remain importable', () => {
  const g = passive(64);
  g.run('const old=decodeSave(exportSave());delete old.speed;');
  assert.equal(g.run('buildImportedState(old).state.speed'), 1);
  for (const value of [0, -1, 3, 512, '256', null, {}, [256]]) {
    g.run(`old.speed=${JSON.stringify(value)};`);
    assert.equal(g.run('buildImportedState(old).state.speed'), 1, JSON.stringify(value));
  }
});

test('save-import catch-up uses the saved speed instead of the current journey speed', () => {
  const g = passive(8);
  g.run('const code=exportSave();setGameSpeed(1);');
  g.advance(120000);
  assert.equal(g.run('importSave(code)'), true);
  assert.equal(g.run('G.speed'), 8);
  assert.equal(g.run('G.gold'), 960);
  assert.equal(g.run('G.materials.dust'), 480);
  g.run('gameTick();gameTick();');
  assert.equal(g.run('G.gold'), 960);
});

test('a sixteen-hour import retains the bounded twelve game-hour reward cap at 256x', () => {
  const g = passive(256);
  g.run('const code=exportSave();');
  g.advance(16 * 3600000);
  assert.equal(g.run('importSave(code)'), true);
  assert.equal(g.run('G.gold'), 12 * 3600);
  assert.equal(g.run('G.materials.dust'), 12 * 3600 / 2);
  assert.equal(g.run('_pendingOfflineGains.seconds'), 12 * 3600);
});

test('nine hidden hours at 256x do no work until return and produce one stable recap', () => {
  const g = passive(256);
  observeDialogs(g);
  g.run('document.hidden=true;suspendGameLoop();');
  for (let minute = 0; minute < 540; minute++) {
    g.advance(60000);
    g.run('gameTick();');
  }
  assert.equal(g.run('G.gold'), 0);
  assert.equal(g.run('G.tick'), 0);
  assert.equal(g.run('document.body.children.length'), 0);
  g.run('document.hidden=false;resumeGameLoop();const recap=_offlineGainsDialog;const focus=document.activeElement;');
  assert.equal(g.run('G.gold'), 12 * 3600);
  assert.equal(g.run('document.body.children.length'), 1);
  assert.equal(g.run('dialogFocuses'), 1);
  g.run('resumeGameLoop();gameTick();');
  assert.equal(g.run('G.gold'), 12 * 3600);
  assert.equal(g.run('_offlineGainsDialog===recap'), true);
  g.run('document.hidden=true;suspendGameLoop();');
  g.advance(120000);
  g.run('document.hidden=false;resumeGameLoop();');
  assert.equal(g.run('G.gold'), 12 * 3600 + 120 * 256);
  assert.equal(g.run('document.body.children.length'), 1);
  assert.equal(g.run('_offlineGainsDialog===recap&&document.activeElement===focus'), true);
  assert.equal(g.run('dialogFocuses'), 1);
  g.run('focus.onclick();');
  assert.equal(g.run('document.body.children.length'), 0);
  assert.equal(g.run('_pendingOfflineGains'), null);
});

test('unsupported speed changes preserve the current player selection', () => {
  const g = passive(8);
  assert.deepEqual(g.json('GAME_SPEEDS'), speeds);
  assert.equal(g.run('Object.isFrozen(GAME_SPEEDS)'), true);
  for (const value of [0, -1, 3, 512, null, {}, [256]]) {
    assert.equal(g.run(`setGameSpeed(${JSON.stringify(value)})`), false);
    assert.equal(g.run('G.speed'), 8);
  }
});

test('twenty real seconds at 256x remain active time with bounded catch-up work', () => {
  const g = passive(256);
  observeDialogs(g);
  g.run('let steps=0;const simulate=simulationTick;simulationTick=()=>{steps++;simulate();};');
  g.advance(20000);
  g.run('gameTick();');
  assert.ok(g.run('steps') <= 1024, 'one callback must not replay every overdue frame');
  for (let callback = 0; callback < 20; callback++) g.run('gameTick();');
  assert.equal(g.run('G.gold'), 20 * 256);
  assert.equal(g.run('_tickAccumulator'), 0);
  assert.equal(g.run('document.body.children.length'), 0);
  assert.equal(g.run('_pendingOfflineGains'), null);
});

test('a twenty-second import at 256x credits time without claiming the player was away for hours', () => {
  const g = passive(256);
  g.run('const code=exportSave();');
  g.advance(20000);
  assert.equal(g.run('importSave(code)'), true);
  assert.equal(g.run('G.gold'), 20 * 256);
  assert.equal(g.run('G.materials.dust'), 10 * 256);
  assert.equal(g.run('_pendingOfflineGains'), null);
});

test('manual save carries unfinished accelerated catch-up without losing or duplicating time', () => {
  const g = passive(256);
  g.advance(20000);
  g.run('gameTick();const code=exportSave();const saved=decodeSave(code);');
  assert.ok(g.run('saved.clockDebt') > 0, 'export remains bounded during a long active stall');
  assert.equal(g.run('saved.gold+saved.clockDebt'), 20 * 256);
  assert.equal(g.run('importSave(code)'), true);
  assert.equal(g.run('G.gold'), 20 * 256);
  assert.equal(g.run('G.materials.dust'), 10 * 256);
  assert.equal(g.run('_tickAccumulator'), 0);
  assert.equal(g.run('_pendingOfflineGains'), null);
  g.run('gameTick();gameTick();');
  assert.equal(g.run('G.gold'), 20 * 256);
});

test('a fractional pending tick survives same-time export and import exactly once', () => {
  const g = passive(1);
  g.advance(125);
  g.run('const code=exportSave();');
  assert.equal(g.run('_tickAccumulator'), .125);
  assert.equal(g.run('G.gold'), 0);
  assert.equal(g.run('importSave(code)'), true);
  assert.equal(g.run('_tickAccumulator'), .125);
  assert.equal(g.run('G.gold'), 0);
  g.advance(125);
  g.run('gameTick();gameTick();');
  assert.equal(g.run('G.gold'), .25);
  assert.equal(g.run('G.materials.dust'), .125);
  assert.equal(g.run('_tickAccumulator'), 0);
  assert.equal(g.run('_pendingOfflineGains'), null);
});

test('accelerated rate buckets retain income, damage and kill counts without event growth', () => {
  const g = passive(256);
  g.run(`G.rates._windowStart=Date.now();
    for(let i=0;i<1000;i++){earnGold(2);dealDamage({hp:10},3);addRate('killTimes60');}
    const rates=currentRates();`);
  assert.equal(g.run('G.rates.goldDelta60.length'), 1);
  assert.equal(g.run('G.rates.dmgDealt60.length'), 1);
  assert.equal(g.run('G.rates.killTimes60.length'), 1);
  assert.equal(g.run('rates.goldPerSec'), 2000);
  assert.equal(g.run('rates.dps'), 3000);
  assert.equal(g.run('rates.killsPerMin'), 60000);
  for (let quarter = 0; quarter < 280; quarter++) {
    g.advance(250);
    g.run(`for(let i=0;i<20;i++){
      earnGold(2);dealDamage({hp:10},3);addRate('killTimes60');addRate('xpDelta60',4);
    }recordRates();`);
  }
  for (const key of ['goldDelta60', 'xpDelta60', 'killTimes60', 'dmgDealt60']) {
    assert.ok(g.run(`G.rates.${key}.length`) <= 241, key);
  }
  g.run('const finalRates=currentRates();');
  assert.equal(g.run('finalRates.goldPerSec'), 160);
  assert.equal(g.run('finalRates.xpPerSec'), 320);
  assert.equal(g.run('finalRates.dps'), 240);
  assert.equal(g.run('finalRates.killsPerMin'), 4800);
});

test('a migrated Crusade reward follows accelerated time and cannot pay twice', () => {
  const g = passive(256);
  g.run(`G.expeditions.legacyClaim={deadline:Date.now()+30000,reward:{gold:123,xp:0}};`);
  g.advance(125);
  g.run('gameTick();');
  assert.equal(g.run('G.expeditions.legacyClaim'), null);
  assert.equal(g.run('G.gold'), 123 + 32);
  g.run('gameTick();advanceLegacyCrusade();');
  assert.equal(g.run('G.gold'), 123 + 32);
});

test('the next Trial guardian follows its accelerated game-time transition', () => {
  const g = passive(256);
  g.run('G.hero.lvl=16;recomputeStats();enterTrial();onEnemyDead(G.mobs[0]);');
  assert.equal(g.run('G.trial.floor'), 2);
  assert.equal(g.run('G.mobs.length'), 0);
  g.advance(1);
  g.run('gameTick();');
  assert.equal(g.run('G.mobs.length'), 0, 'do not erase the short transition completely');
  g.advance(2);
  g.run('gameTick();');
  assert.equal(g.run('G.mobs.length'), 1);
  assert.match(g.run('G.mobs[0].ref.name'), /F2$/);
  assert.equal(g.run('_pendingTrialTransition'), null);
});

test('an old accelerated Trial transition cannot replace a new run guardian', () => {
  const g = passive(256);
  g.run(`G.hero.lvl=16;recomputeStats();enterTrial();onEnemyDead(G.mobs[0]);
    const oldAdvance=_pendingTrialTransition;exitTrial();enterTrial();const newGuardian=G.mobs[0];
    oldAdvance();`);
  g.advance(3);
  g.run('gameTick();oldAdvance();');
  assert.equal(g.run('G.mobs.length'), 1);
  assert.equal(g.run('G.mobs[0]===newGuardian'), true);
  assert.equal(g.run('G.trial.floor'), 2);
});

test('a fast Trial timeout cannot bypass its game-time delay after reducing speed', () => {
  const g = passive(256);
  g.run(`let originalTrialTimer;setTimeout=callback=>{originalTrialTimer=callback;};
    G.hero.lvl=16;recomputeStats();enterTrial();onEnemyDead(G.mobs[0]);setGameSpeed(1);`);
  g.advance(3);
  g.run('originalTrialTimer();');
  assert.equal(g.run('G.mobs.length'), 0);
  g.advance(247);
  g.run('gameTick();');
  assert.equal(g.run('G.mobs.length'), 0);
  g.advance(250);
  g.run('gameTick();');
  assert.equal(g.run('G.mobs.length'), 0);
  g.advance(250);
  g.run('gameTick();');
  assert.equal(g.run('G.mobs.length'), 1);
  assert.match(g.run('G.mobs[0].ref.name'), /F2$/);
});

test('256x leaves click protection in real seconds so controls stay stable', () => {
  const g = passive(256);
  g.run(`let coldRenders=0;renderCold=()=>coldRenders++;
    _markInteract({target:{closest:()=>true}});`);
  g.advance(250);
  g.run('gameTick();');
  assert.equal(g.run('_renderPause'), 3);
  assert.equal(g.run('coldRenders'), 0);
  for (let quarter = 0; quarter < 3; quarter++) {
    g.advance(250);
    g.run('gameTick();');
  }
  assert.equal(g.run('_renderPause'), 0);
  assert.equal(g.run('coldRenders'), 1);
});

function expedition(speed) {
  const g = passive(speed);
  g.run(`G.hero.lvl=150;G.awakenCount=5;G.unlocked=9;G.gold=10000000;
    EXPEDITION_BOSSES.forEach(recordExpeditionBoss);
    GEAR_SLOTS.forEach(slot=>G.gear[slot]=genGear(slot,5,'rare'));
    G.buildings.garden=50;G.buildings.sanctum=50;G.buildings.spellfoci=50;
    for(const el of visibleSchools())G.elements[el]=25;
    G.knownSpells=['greaterheal','earthward','iceshard','wellspring','realitytear','singularity'];
    G.equippedSpells=[...G.knownSpells];recomputeStats();
    G.hero.hp=G.hero.maxHp;G.hero.mana=G.hero.maxMana;startExpedition('orchard','balanced',true);
    resetGameClock();`);
  return g;
}

function close(a, b, label = 'state') {
  if (typeof a === 'number' && typeof b === 'number') {
    assert.ok(Math.abs(a - b) < 1e-5 + 1e-12 * Math.max(1, Math.abs(a)), `${label}: ${a} vs ${b}`);
  } else if (a && typeof a === 'object') {
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), label);
    for (const key of Object.keys(a)) close(a[key], b[key], `${label}.${key}`);
  } else assert.deepEqual(a, b, label);
}

test('visible 256x expedition progress matches exactly the corresponding simulated time', () => {
  const live = expedition(256), direct = expedition(1);
  for (let quarter = 0; quarter < 4; quarter++) {
    live.advance(250);
    live.run('gameTick();');
  }
  direct.run('advanceExpedition(256);');
  const fields = '({hero:G.hero,gold:G.gold,materials:G.materials,expeditions:G.expeditions,mastery:G.spellMastery})';
  close(live.json(fields), direct.json(fields));
});

test('maximum-speed twelve-hour expedition return accounts for its bounded time in one report', () => {
  const g = expedition(256);
  observeDialogs(g);
  g.run('document.hidden=true;suspendGameLoop();');
  g.advance(12 * 3600000);
  g.run('document.hidden=false;resumeGameLoop();');
  assert.equal(g.run('_pendingOfflineGains.seconds'), 43200);
  assert.equal(g.run('G.expeditions.records.orchard.seconds'), 43200);
  assert.ok(g.run('G.expeditions.records.orchard.circuits') > 1);
  assert.equal(g.run('G.expeditions.records.orchard.failures'), 0);
  assert.equal(g.run('document.body.children.length'), 1);
  assert.equal(g.run('_tickAccumulator'), 0);
});

test('Awakening preserves the player speed while discarding old time debt', () => {
  const g = passive(128);
  g.run('G.hero.lvl=24;G.unlocked=3;recomputeStats();');
  g.advance(500);
  g.run('awaken();gameTick();');
  assert.equal(g.run('G.awakenCount'), 1);
  assert.equal(g.run('G.speed'), 128);
  assert.equal(g.run('_tickAccumulator'), 0);
  assert.equal(g.run('_pendingOfflineGains'), null);
});
