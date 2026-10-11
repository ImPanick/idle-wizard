const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

function forge(){
  const g=game();
  g.run(`G.gearInventory=[];G.gear=Object.fromEntries(GEAR_SLOTS.map(s=>[s,null]));
    G.gemInventory={};G.gold=1000000;G.unlocked=0;G.purchaseRules={reserve:0};
    function owned(sockets=[],equipped=false){
      const item=genGear('staff',0,'common');item.sockets=sockets;
      if(equipped)G.gear.staff=item;else G.gearInventory.push(item);return item;
    }
    const item=owned();`);
  return g;
}

test('enhancement metadata defaults to zero and accepts only bounded integers',()=>{
  const g=forge();
  for(const raw of ['undefined','null','{}','false','[]','42',"{temper:'3',addedSockets:'2'}",
    '{temper:-1,addedSockets:-1}','{temper:11,addedSockets:4}','{temper:2.5,addedSockets:1.5}',
    '{temper:NaN,addedSockets:Infinity}'])
    assert.deepEqual(g.json(`normalizeGearEnhancements(${raw})`),{temper:0,addedSockets:0},raw);
  assert.deepEqual(g.json('normalizeGearEnhancements({temper:10,addedSockets:3})'),{temper:10,addedSockets:3});
  g.run('const raw={temper:3,addedSockets:2};const normalized=normalizeGearEnhancements(raw);normalized.temper=9;');
  assert.deepEqual(g.json('raw'),{temper:3,addedSockets:2});
});

test('tempering scales original positive combat bonuses and leaves economy and other fields alone',()=>{
  const g=forge();
  g.run(`item.temper=10;item.stats={atk:100,def:20,maxHp:1000,maxMana:200,manaRegen:2,
    dmgMul:.5,crit:.1,cdmg:.25,spd:.05,goldFind:.8,xpMul:.6,affinity:.7,chestBonus:2,
    healMul:1.2,zero:0,negative:-5};const original=JSON.stringify(item.stats);`);
  const effective=g.json('temperedGearStats(item)');
  for(const [k,value] of Object.entries({atk:120,def:24,maxHp:1200,maxMana:240,manaRegen:2.4,
    dmgMul:.6,crit:.12,cdmg:.3,spd:.06,goldFind:.8,xpMul:.6,affinity:.7,chestBonus:2,healMul:1.2,zero:0,negative:-5}))close(effective[k],value);
  assert.equal(g.run('JSON.stringify(item.stats)'),g.run('original'));
  g.run('const cloned=temperedGearStats(item);cloned.atk=999;');assert.equal(g.run('item.stats.atk'),100);
  assert.deepEqual(g.json('temperedGearStats(null)'),{});
});

test('repeated stat recomputation never compounds tempering or amplifies nonpositive stats',()=>{
  const g=forge();g.run('item.stats={atk:100,def:0,spd:-.1,goldFind:1};item.temper=5;');
  for(let i=0;i<50;i++){
    close(g.run('temperedGearStats(item).atk'),110);assert.equal(g.run('temperedGearStats(item).spd'),-.1);
  }
  g.run('item.temper=10;');close(g.run('temperedGearStats(item).atk'),120);
  assert.deepEqual(g.json('item.stats'),{atk:100,def:0,spd:-.1,goldFind:1});
});

test('current owned item lookup supports equipped and inventory gear and rejects stale IDs',()=>{
  const g=forge();g.run('const equipped=owned([],true);const external=genGear("hat",0,"common");');
  assert.equal(g.run('artificerItem(item.id)===item'),true);assert.equal(g.run('artificerItem(equipped.id)===equipped'),true);
  assert.equal(g.run('artificerItem(external.id)'),null);
  for(const id of ['undefined','null','42',"'g999999'",'{}']){
    assert.equal(g.run(`temperGear(${id})`),0);assert.equal(g.run(`addGearSocket(${id})`),false);
  }
  g.run('G.gearInventory=[];const before=JSON.stringify(G);');
  assert.equal(g.run('temperGear(item.id,true)'),0);assert.equal(g.run('addGearSocket(item.id)'),false);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
});

test('tempering previews are pure and expose the growing price and zone rank cap',()=>{
  const g=forge();g.run('const before=JSON.stringify(G);');
  assert.deepEqual(g.json('temperPreview(item.id)'),{ranks:1,cost:100,from:0,to:1,cap:2,nextCost:100,available:true,affordable:true});
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  g.run('item.temper=1;');assert.equal(g.run('temperPreview(item.id).cost'),180);
  for(let unlocked=0;unlocked<=5;unlocked++){
    g.run(`G.unlocked=${unlocked};item.temper=0;`);assert.equal(g.run('temperPreview(item.id).cap'),Math.min(10,2+2*unlocked));
  }
  g.run('G.unlocked=0;item.temper=10;');assert.equal(g.run('temperPreview(item.id).available'),false);
  assert.equal(g.run('temperGear(item.id,true)'),0);assert.equal(g.run('item.temper'),10);
});

test('single-rank purchases respect the reserve and never change base stats or resale value',()=>{
  const g=forge();g.run('G.gold=599;G.purchaseRules.reserve=500;const original=JSON.stringify(item.stats);const price=gearSellPrice(item);');
  assert.equal(g.run('temperPreview(item.id).affordable'),false);assert.equal(g.run('temperGear(item.id)'),0);
  assert.equal(g.run('G.gold'),599);assert.equal(g.run('item.temper'),undefined);
  g.run('G.gold=600;');assert.equal(g.run('temperGear(item.id)'),1);
  assert.equal(g.run('G.gold'),500);assert.equal(g.run('item.temper'),1);
  g.run('G.gold=680;');assert.equal(g.run('temperGear(item.id)'),1);assert.equal(g.run('item.temper'),2);
  assert.equal(g.run('G.gold'),500);const before=g.run('JSON.stringify(G)');assert.equal(g.run('temperGear(item.id)'),0);
  assert.equal(g.run('JSON.stringify(G)'),before);assert.equal(g.run('JSON.stringify(item.stats)'),g.run('original'));
  assert.equal(g.run('gearSellPrice(item)'),g.run('price'));
});

test('max temper buys the same affordable ranks at the same price as successive single purchases',()=>{
  const max=forge(),single=forge();
  for(const g of [max,single])g.run('G.unlocked=5;G.gold=100000;G.purchaseRules.reserve=65000;');
  const preview=max.json('temperPreview(item.id,true)');assert.ok(preview.ranks>0&&preview.ranks<10);
  assert.equal(max.run('temperGear(item.id,true)'),preview.ranks);
  single.run('for(let i=0;i<10;i++)if(!temperGear(item.id))break;');
  assert.equal(max.run('item.temper'),single.run('item.temper'));assert.equal(max.run('G.gold'),single.run('G.gold'));
  assert.equal(max.run('G.gold'),100000-preview.cost);assert.ok(max.run('G.gold')>=65000);
  assert.equal(max.run('temperPreview(item.id,true).ranks'),0);assert.equal(max.run('temperGear(item.id,true)'),0);
});

test('undefined reserve is zero and one max purchase never exceeds rank ten',()=>{
  const g=forge();g.run('G.purchaseRules=undefined;G.unlocked=5;G.gold=1e12;');
  assert.equal(g.run('temperGear(item.id,true)'),10);assert.equal(g.run('item.temper'),10);
  const before=g.run('JSON.stringify(G)');assert.equal(g.run('temperGear(item.id,true)'),0);
  assert.equal(g.run('JSON.stringify(G)'),before);
});

test('socket pricing starts at 1000 gold and quadruples for each purchased slot',()=>{
  const g=forge();g.run('const original=JSON.stringify(item.stats);const originalPrice=gearSellPrice(item);');
  for(const cost of [1000,4000,16000]){
    assert.equal(g.run('socketExpansionPreview(item.id).cost'),cost);const before=g.run('G.gold');
    assert.equal(g.run('addGearSocket(item.id)'),true);assert.equal(g.run('G.gold'),before-cost);
  }
  assert.equal(g.run('item.sockets.length'),3);assert.equal(g.run('item.addedSockets'),3);
  assert.equal(g.run('socketExpansionPreview(item.id).available'),false);assert.equal(g.run('addGearSocket(item.id)'),false);
  assert.equal(g.run('JSON.stringify(item.stats)'),g.run('original'));assert.equal(g.run('gearSellPrice(item)'),g.run('originalPrice'));
});

test('adding one empty slot preserves occupied socket identities, order, gems, and reserve',()=>{
  const g=forge();g.run(`const first={type:'fire',level:4},second={type:'water',level:1};item.sockets=[first,second];
    G.gemInventory={gem_power_5:7};G.purchaseRules.reserve=500;G.gold=4499;const before=JSON.stringify(G);`);
  assert.equal(g.run('socketExpansionPreview(item.id).cost'),4000);assert.equal(g.run('addGearSocket(item.id)'),false);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  g.run('G.gold=4500;');assert.equal(g.run('addGearSocket(item.id)'),true);assert.equal(g.run('G.gold'),500);
  assert.equal(g.run('item.sockets.length'),3);assert.equal(g.run('item.sockets[0]===first&&item.sockets[1]===second'),true);
  assert.equal(g.run('item.sockets[2]'),null);assert.deepEqual(g.json('G.gemInventory'),{gem_power_5:7});
  assert.equal(g.run('socketExpansionPreview(item.id).cost'),16000);assert.equal(g.run('addGearSocket(item.id)'),false);
});

test('legacy gear can retain eight sockets but cannot exceed eight or three purchased additions',()=>{
  const g=forge();g.run('G.gold=1e15;item.sockets=Array(6).fill(null);');
  assert.equal(g.run('addGearSocket(item.id)'),true);assert.equal(g.run('addGearSocket(item.id)'),true);
  assert.equal(g.run('item.sockets.length'),8);assert.equal(g.run('item.addedSockets'),2);
  const before=g.run('JSON.stringify(G)');assert.equal(g.run('addGearSocket(item.id)'),false);assert.equal(g.run('JSON.stringify(G)'),before);
  g.run(`delete item.addedSockets;item.sockets=Array.from({length:8},(_,i)=>({type:'fire',level:i%5+1}));const legacy=JSON.stringify(item);`);
  assert.equal(g.run('addGearSocket(item.id)'),false);assert.equal(g.run('JSON.stringify(item)'),g.run('legacy'));
  g.run('item.sockets=[];item.addedSockets=2;');assert.equal(g.run('socketExpansionPreview(item.id).available'),false);
});

test('every crafted legendary recipe can be tempered and expanded without altering its special effects',()=>{
  const g=forge();g.run(`G.unlocked=5;G.gold=1e15;G.gearInventory=LEGENDARY_RECIPES.map(r=>({
    id:'g'+GEAR_ID_COUNTER++,slot:r.slot,tier:r.tier,rarity:'legendary',name:r.name,stats:{...r.stats},
    sockets:Array(r.sockets).fill(null),legendary:true,legendaryAffinity:r.affinity,
    legendaryAffinityAmt:r.affinityAmt,legendaryEffectTags:[...(r.effectTags||[])]}));`);
  const recipes=g.json('LEGENDARY_RECIPES');
  for(let i=0;i<recipes.length;i++){
    const recipe=recipes[i];g.run(`const target${i}=G.gearInventory[${i}];const original${i}=JSON.stringify(target${i});const price${i}=gearSellPrice(target${i});`);
    assert.equal(g.run(`temperGear(target${i}.id,true)`),10,recipe.id);
    for(let j=0;j<3;j++)assert.equal(g.run(`addGearSocket(target${i}.id)`),true,recipe.id);
    assert.equal(g.run(`target${i}.sockets.length`),recipe.sockets+3);assert.equal(g.run(`target${i}.addedSockets`),3);
    assert.equal(g.run(`addGearSocket(target${i}.id)`),false,recipe.id);
    assert.equal(g.run(`gearSellPrice(target${i})`),g.run(`price${i}`));
    const target=g.json(`target${i}`),original=JSON.parse(g.run(`original${i}`));
    assert.deepEqual(target.stats,original.stats);assert.deepEqual(target.legendaryEffectTags,original.legendaryEffectTags);
    assert.equal(target.legendaryAffinity,original.legendaryAffinity);assert.equal(target.legendaryAffinityAmt,original.legendaryAffinityAmt);
    const stats=g.json(`temperedGearStats(target${i})`);
    for(const [key,value] of Object.entries(recipe.stats))close(stats[key],['atk','def','maxHp','maxMana','manaRegen','dmgMul','crit','cdmg','spd'].includes(key)?value*1.2:value);
  }
});

test('a five-socket T5 unique costs 500M, 2B and 8B for its final slots',()=>{
  const g=forge();g.run('item.tier=5;item.rarity="legendary";item.legendary=true;item.sockets=Array(5).fill(null);G.gold=1e15;');
  assert.equal(g.run('gearSellPrice(item)'),312500);
  for(const cost of [500000000,2000000000,8000000000]){
    assert.equal(g.run('socketExpansionPreview(item.id).cost'),cost);assert.equal(g.run('addGearSocket(item.id)'),true);
  }
  assert.equal(g.run('item.sockets.length'),8);
});

test('equipped gear supports purchases while its current item remains owned',()=>{
  const g=forge();g.run('const equipped=owned([],true);');
  assert.equal(g.run('temperGear(equipped.id)'),1);assert.equal(g.run('G.gear.staff.temper'),1);
  assert.equal(g.run('addGearSocket(equipped.id)'),true);assert.equal(g.run('G.gear.staff.sockets.length'),1);
  g.run('G.gear.staff=null;const before=JSON.stringify(G);');
  assert.equal(g.run('temperGear(equipped.id,true)'),0);assert.equal(g.run('addGearSocket(equipped.id)'),false);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
});

test('selling enhanced gear returns every gem and cannot refund enhancement costs through resale',()=>{
  const g=forge();g.run(`item.sockets=[{type:'fire',level:2},{type:'fire',level:2}];G.gemInventory={gem_fire_2:4};
    const originalPrice=gearSellPrice(item),beforeGold=G.gold;temperGear(item.id,true);addGearSocket(item.id);const afterPurchases=G.gold;sellGear(item.id);`);
  assert.equal(g.run('G.gold'),g.run('afterPurchases+originalPrice'));assert.ok(g.run('G.gold')<g.run('beforeGold'));
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:6});assert.equal(g.run('G.gearInventory.length'),0);
  assert.equal(g.run('temperGear(item.id)'),0);assert.equal(g.run('addGearSocket(item.id)'),false);
});

test('enhancement metadata and all eight sockets survive UTF-8 save export/import',()=>{
  const g=forge();g.run(`G.unlocked=5;G.gold=1e15;item.sockets=Array(5).fill(null);item.sockets[0]={type:'fire',level:5};
    temperGear(item.id,true);addGearSocket(item.id);addGearSocket(item.id);addGearSocket(item.id);
    const original=JSON.stringify({temper:item.temper,addedSockets:item.addedSockets,stats:item.stats,sockets:item.sockets}),saved=exportSave();`);
  assert.equal(g.run('importSave(saved)'),true);
  assert.deepEqual(g.json('((({temper,addedSockets,stats,sockets})=>({temper,addedSockets,stats,sockets}))(G.gearInventory[0]))'),JSON.parse(g.run('original')));
});

test('effective combat stats use tempering once while retaining the unmodified original item stats',()=>{
  const g=forge();g.run(`G.gear.staff=item;G.gearInventory=[];item.stats={atk:100,dmgMul:.5,crit:.1,goldFind:.5};
    recomputeStats();const before={...G.baseStats};item.temper=10;recomputeStats();const after={...G.baseStats};`);
  close(g.run('after.atk-before.atk'),20);close(g.run('after.crit-before.crit'),.02);
  close(g.run('after.dmgMul/before.dmgMul'),1.6/1.5);close(g.run('after.goldFind'),g.run('before.goldFind'));
  assert.deepEqual(g.json('item.stats'),{atk:100,dmgMul:.5,crit:.1,goldFind:.5});
  g.run('recomputeStats();');close(g.run('G.baseStats.dmgMul'),g.run('after.dmgMul'));
});
