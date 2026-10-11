const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');

function lootGame(){
  const g=game();
  g.run(`G.gold=0;G.log=[];G.gearInventory=[];G.gemInventory={};G.materials.dust=0;
    G.gear=Object.fromEntries(GEAR_SLOTS.map(s=>[s,null]));
    G.autoSell=normalizeAutoSell({enabled:true,tiers:[0,1],rarities:['common','uncommon']});
    resetAutoSellSummary();
    function loot(tier=0,rarity='common',sockets=[],unique=false){
      const item=genGear('hat',tier,rarity,{legendary:unique});item.sockets=sockets;return item;
    }`);
  return g;
}

test('auto-sale normalization is disabled by default and never broadens corrupt selections',()=>{
  const g=game();
  for(const raw of ['undefined','null','false','[]','{}',"{enabled:'true'}"]){
    assert.deepEqual(g.json(`normalizeAutoSell(${raw})`),{enabled:false,tiers:[],rarities:[]});
  }
  assert.deepEqual(g.json(`normalizeAutoSell({enabled:true,tiers:[0,0,1,5,'2',-1,6,1.5,null],rarities:['common','common','rare','Rare',null]})`),
    {enabled:true,tiers:[0,1,5],rarities:['common','rare']});
  assert.deepEqual(g.json(`normalizeAutoSell({enabled:true,tiers:'all',rarities:'all'})`),{enabled:true,tiers:[],rarities:[]});
  g.run(`const raw={enabled:true,tiers:[0],rarities:['common']};const normalized=normalizeAutoSell(raw);normalized.tiers.push(1);normalized.rarities.push('rare');`);
  assert.deepEqual(g.json('raw'),{enabled:true,tiers:[0],rarities:['common']});
});

test('automatic rules use the exact tier and rarity intersection across every slot',()=>{
  const g=lootGame();
  g.run(`G.autoSell=normalizeAutoSell({enabled:true,tiers:[1,3],rarities:['uncommon','epic']});`);
  for(let tier=0;tier<=5;tier++)for(const rarity of ['common','uncommon','rare','epic','legendary']){
    assert.equal(g.run(`autoSellEligible(loot(${tier},'${rarity}'))`),[1,3].includes(tier)&&['uncommon','epic'].includes(rarity),`T${tier} ${rarity}`);
  }
  g.run(`const staff=loot(3,'epic');staff.slot='staff';`);
  assert.equal(g.run('autoSellEligible(staff)'),true);
  for(const rule of ["{enabled:false,tiers:[1],rarities:['uncommon']}","{enabled:true,tiers:[],rarities:['uncommon']}","{enabled:true,tiers:[1],rarities:[]}"]){
    g.run('G.autoSell='+rule+';');assert.equal(g.run("autoSellEligible(loot(1,'uncommon'))"),false);
  }
});

test('equipped IDs and crafted uniques stay protected including ordinary legendary selections',()=>{
  const g=lootGame();
  g.run(`G.autoSell=normalizeAutoSell({enabled:true,tiers:[0,1,2,3,4,5],rarities:RARITY_ORDER});
    const unique=loot(0,'common',[],true),equipped=loot(),ordinary=loot(2,'legendary');
    G.gear.hat={...equipped};`);
  assert.equal(g.run('autoSellEligible(unique)'),false);
  assert.equal(g.run('autoSellEligible(equipped)'),false);
  assert.equal(g.run('autoSellEligible(ordinary)'),true);
  assert.equal(g.run('storeGear(unique,true)'),true);
  assert.equal(g.run('storeGear(ordinary,true)'),false);
  assert.deepEqual(g.json('G.gearInventory.map(i=>i.id)'),[g.run('unique.id')]);
  assert.equal(g.run('G.gear.hat.id'),g.run('equipped.id'));
  assert.equal(g.run('G.gold'),2000);
});

test('only loot insertion opts into automatic rules; crafting and existing inventory stay untouched',()=>{
  const g=lootGame();
  g.run(`const existing=loot(),crafted=loot(),newDrop=loot();G.gearInventory.push(existing);
    const stored=storeGear(crafted);const sold=storeGear(newDrop,true);`);
  assert.equal(g.run('stored'),true);assert.equal(g.run('sold'),false);
  assert.deepEqual(g.json('G.gearInventory.map(i=>i.id)'),[g.run('existing.id'),g.run('crafted.id')]);
  assert.equal(g.run('G.gold'),20);
  g.run(`const noFlag=loot();storeGear(noFlag,'true');G.autoSell.enabled=false;const disabled=loot();storeGear(disabled,true);`);
  assert.equal(g.run('G.gearInventory.length'),4);assert.equal(g.run('G.gold'),20);
});

test('auto-selling precedes capacity salvage and returns every occupied socket',()=>{
  const g=lootGame();
  g.run(`G.gearInventory=Array.from({length:GEAR_CAPACITY},(_,n)=>({id:'old'+n}));
    G.gemInventory.gem_fire_2=3;const item=loot(1,'uncommon',[{type:'fire',level:2},null,{type:'fire',level:2},{type:'power',level:5}]);
    const stored=storeGear(item,true);`);
  assert.equal(g.run('stored'),false);assert.equal(g.run('G.gearInventory.length'),5000);
  assert.equal(g.run('G.gold'),100);assert.equal(g.run('G.materials.dust'),0);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:5,gem_power_5:1});
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:1,gold:100,gems:3});
});

test('large loot batches produce one summary and cannot report the same batch twice',()=>{
  const g=lootGame();
  g.run(`for(let n=0;n<5000;n++)storeGear(loot(),true);`);
  assert.equal(g.run('G.log.length'),0);assert.equal(g.run('G.gearInventory.length'),0);
  assert.equal(g.run('G.gold'),100000);assert.equal(g.run('G.rates.goldDelta60.length'),1);
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:5000,gold:100000,gems:0});
  assert.equal(g.run('G.log.length'),1);assert.match(g.run('G.log[0].text'),/Auto-sold 5000 gear/);
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:0,gold:0,gems:0});
  assert.equal(g.run('G.log.length'),1);
  g.run('storeGear(loot(),true);resetAutoSellSummary();');
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:0,gold:0,gems:0});
});

test('visible and hidden loot delivery yield identical gold, gems, rules and capacity',()=>{
  function deliver(hidden){
    const g=lootGame();
    g.run(`document.hidden=${hidden};G.gearInventory=Array.from({length:GEAR_CAPACITY},(_,n)=>({id:'old'+n}));
      for(let n=0;n<400;n++)storeGear(loot(n%2,n%2?'uncommon':'common',[{type:'water',level:1},null,{type:'fire',level:2}]),true);
      storeGear(loot(2,'rare'),true);`);
    return g.json('({gold:G.gold,gems:G.gemInventory,dust:G.materials.dust,count:G.gearInventory.length,rules:G.autoSell,summary:flushAutoSellSummary()})');
  }
  const visible=deliver(false),hidden=deliver(true);
  assert.deepEqual(hidden,visible);
  assert.deepEqual(visible,{gold:24000,gems:{gem_water_1:400,gem_fire_2:400},dust:90,count:5000,
    rules:{enabled:true,tiers:[0,1],rarities:['common','uncommon']},summary:{count:400,gold:24000,gems:800}});
});

test('boss, Trial boss, ordinary, chest and Trial milestone loot all honor the rule',()=>{
  const g=lootGame();
  g.run(`G.autoSell=normalizeAutoSell({enabled:true,tiers:[0,1,2,3,4,5],rarities:RARITY_ORDER});
    rollGearDrop({isBoss:true});G.trial.inTrial=true;G.trial.floor=1;rollGearDrop({isBoss:true});G.trial.inTrial=false;
    gameRandom=()=>0;rollGearDrop({isBoss:false});openChest({tier:'common',opened:false});
    const before=flushAutoSellSummary();
    const milestone=TRIAL_MILESTONES.find(m=>m.grant?.gear?.length);checkTrialMilestone(milestone.floor);
    const after=flushAutoSellSummary();`);
  assert.equal(g.run('G.gearInventory.length'),0);
  assert.equal(g.run('before.count'),4);
  assert.equal(g.run('after.count'),g.run('TRIAL_MILESTONES.filter(m=>m.floor<=milestone.floor).reduce((n,m)=>n+(m.grant?.gear?.length||0),0)'));
  assert.doesNotMatch(g.json('G.log.map(l=>l.text)').join('\n'),/Trial drop:|Boss drop:|\[(Common|Uncommon|Rare|Epic|Legendary)\]/);
});

test('automatic rules survive a manual save and absent old fields safely default to off',()=>{
  const g=lootGame();
  g.run(`G.autoSell=normalizeAutoSell({enabled:true,tiers:[0,2,5],rarities:['common','rare']});
    const saved=decodeSave(exportSave());const old={...saved};delete old.autoSell;`);
  assert.deepEqual(g.json('saved.autoSell'),{enabled:true,tiers:[0,2,5],rarities:['common','rare']});
  assert.deepEqual(g.json('buildImportedState(saved).state.autoSell'),g.json('saved.autoSell'));
  assert.deepEqual(g.json('buildImportedState(old).state.autoSell'),{enabled:false,tiers:[],rarities:[]});
  g.run(`saved.autoSell={enabled:'true',tiers:[0,'1',99],rarities:['common','all']};`);
  assert.deepEqual(g.json('buildImportedState(saved).state.autoSell'),{enabled:false,tiers:[0],rarities:['common']});
});

test('summaries flush once on a visible render and wait through every suspension state',()=>{
  const g=lootGame(),html=fs.readFileSync(path.join(__dirname,'..','ascii-idle-wizard.html'),'utf8');
  // Restore the real render boundary; the shared harness normally suppresses it.
  g.run(html.match(/function renderHot\(\)\{[\s\S]*?\n\}/)[0]);
  g.run(`renderTop=()=>{};renderLog=()=>{};renderTargetIntel=()=>{};renderSpellHotbar=()=>{};
    activeTab='equipment';for(let n=0;n<3;n++)storeGear(loot(),true);`);
  for(const state of ['document.hidden=true;','document.hidden=false;_pageHidden=true;','_pageHidden=false;_loopSuspended=true;']){
    g.run(state+'renderHot();');assert.equal(g.run('G.log.length'),0,state);
  }
  g.run('_loopSuspended=false;renderHot();renderHot();');
  assert.equal(g.run('G.log.length'),1);assert.match(g.run('G.log[0].text'),/Auto-sold 3 gear/);
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:0,gold:0,gems:0});
});

test('successful import clears obsolete pending sales while a failed import preserves them',()=>{
  const g=lootGame();
  g.run(`storeGear(loot(),true);const saved=exportSave();storeGear(loot(),true);`);
  assert.equal(g.run('G.gold'),40);
  assert.equal(g.run('importSave(saved)'),true);assert.equal(g.run('G.gold'),20);
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:0,gold:0,gems:0});
  g.run('storeGear(loot(),true);');
  assert.equal(g.run("importSave('this is not a save')"),false);
  assert.equal(g.run('G.gold'),40);
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:1,gold:20,gems:0});
});

test('Awakening preserves enabled or disabled rules and clears the prior journey summary',()=>{
  for(const enabled of [true,false]){
    const g=lootGame();
    g.run(`storeGear(loot(),true);G.autoSell.enabled=${enabled};const rules=JSON.stringify(G.autoSell);
      G.hero.lvl=AWAKEN_LEVEL;G.unlocked=AWAKEN_ZONE;awaken();`);
    assert.equal(g.run('G.awakenCount'),1);assert.equal(g.run('G.gold'),0);
    assert.equal(g.run('JSON.stringify(G.autoSell)'),g.run('rules'));
    assert.deepEqual(g.json('flushAutoSellSummary()'),{count:0,gold:0,gems:0});
    g.run('storeGear(loot(),true);');
    assert.equal(g.run('G.gold'),enabled?20:0);
    assert.equal(g.run('G.gearInventory.length'),enabled?0:1);
  }
});

test('canceling Awakening leaves already earned sales and the pending summary intact',()=>{
  const g=lootGame();
  g.run(`storeGear(loot(),true);G.hero.lvl=AWAKEN_LEVEL;G.unlocked=AWAKEN_ZONE;
    confirm=()=>false;awaken();`);
  assert.equal(g.run('G.awakenCount'),0);assert.equal(g.run('G.gold'),20);
  assert.deepEqual(g.json('flushAutoSellSummary()'),{count:1,gold:20,gems:0});
});
