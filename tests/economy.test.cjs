const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function economy(){
  const g=game();
  g.run(`G.autoExplore=false;G.gold=0;G.commissions=normalizeCommissions();
    G.purchaseRules={reserve:0,refinement:null,tempering:null};`);
  return g;
}
function snapshot(g){return g.json('({gold:G.gold,refinements:G.refinements,queue:G.commissions.queue,spent:G.commissions.rule.spent,dust:G.materials.dust})');}
function compare(a,b){
  close(a.gold,b.gold);assert.deepEqual(a.refinements,b.refinements);assert.equal(a.spent,b.spent);assert.equal(a.dust,b.dust);
  assert.equal(a.queue.length,b.queue.length);
  a.queue.forEach((order,i)=>{assert.equal(order.id,b.queue[i].id);assert.equal(order.recipe,b.queue[i].recipe);close(order.timeLeft,b.queue[i].timeLeft);});
}

test('positive income funds a commission at its actual affordability boundary',()=>{
  const g=economy();g.run("setCommissionRule({enabled:true,recipe:'dust',reserve:100,budget:500});advanceEconomyTime(599,1);");
  assert.equal(g.run('G.commissions.queue.length'),0);assert.equal(g.run('G.gold'),599);
  g.run('advanceEconomyTime(1,1);');assert.equal(g.run('G.gold'),100);assert.equal(g.run('G.commissions.queue[0].timeLeft'),300);
  g.run('advanceEconomyTime(299,1);');assert.equal(g.run('G.materials.dust'),0);close(g.run('G.commissions.queue[0].timeLeft'),1);
  g.run('advanceEconomyTime(1,1);');assert.equal(g.run('G.materials.dust'),80);assert.equal(g.run('G.commissions.queue.length'),0);
  assert.equal(g.run('G.commissions.rule.spent'),500);
});

test('one positive-income batch and short intervals agree on queue progress and total budget',()=>{
  const large=economy(),small=economy();
  for(const g of [large,small])g.run("setCommissionRule({enabled:true,recipe:'dust',budget:1000});");
  large.run('advanceEconomyTime(1200,1);');small.run('for(let i=0;i<1200;i++)advanceEconomyTime(1,1);');
  compare(snapshot(large),snapshot(small));assert.equal(large.run('G.commissions.rule.spent'),1000);
  assert.equal(large.run('G.materials.dust'),80);close(large.run('G.commissions.queue[0].timeLeft'),100);
});

test('automatic refinements funded before a commission keep the same order in a large batch',()=>{
  const large=economy(),small=economy();
  for(const g of [large,small])g.run(`G.purchaseRules.refinement={id:'spark',path:'potency'};
    setCommissionRule({enabled:true,recipe:'dust',budget:1000});`);
  large.run('advanceEconomyTime(1200,1);');small.run('for(let i=0;i<1200;i++)advanceEconomyTime(1,1);');
  compare(snapshot(large),snapshot(small));assert.equal(large.run('G.refinements.spark.rank'),2);
  assert.equal(large.run('G.gold'),380);assert.equal(large.run('G.commissions.rule.spent'),500);
});

test('a shared upgrade reserve covers both automatic spell and gear purchases',()=>{
  const g=economy();g.run(`const item=genGear('staff',0,'common');G.gearInventory.push(item);G.gold=1700;
    G.purchaseRules={reserve:1000,refinement:{id:'spark',path:'potency'},tempering:item.id};runPurchaseRules();`);
  assert.equal(g.run('G.refinements.spark.rank'),2);assert.equal(g.run('item.temper'),2);assert.equal(g.run('G.gold'),1100);
  g.run('runPurchaseRules();');assert.equal(g.run('G.gold'),1100);assert.equal(g.run('G.purchaseRules.reserve'),1000);
});

test('available commission funds take priority before the selected automatic upgrades',()=>{
  const g=economy();g.run(`G.gold=600;G.purchaseRules.refinement={id:'spark',path:'potency'};
    setCommissionRule({enabled:true,recipe:'dust',budget:500});advanceEconomyTime(1);`);
  assert.equal(g.run('G.commissions.rule.spent'),500);assert.equal(g.run('G.refinements.spark.rank'),1);
  assert.equal(g.run('G.gold'),0);assert.equal(g.run('G.commissions.queue[0].timeLeft'),299);
});

test('negative net income reserves the entire forecast ritual liability while orders finish',()=>{
  const g=economy();g.run(`G.hero.lvl=9;G.gold=2700;G.ritual.active=true;G.ritual.intensity=1;
    setCommissionRule({enabled:true,recipe:'dust',budget:2500});const result=applyIdle(1200);`);
  assert.equal(g.run('result.ritualSeconds'),1200);assert.equal(g.run('result.xp'),480);
  assert.equal(g.run('G.commissions.rule.spent'),2000);assert.equal(g.run('G.gold'),460);
  assert.equal(g.run('G.gold+G.commissions.rule.spent+result.ritualSeconds*ritualCfg().goldCost'),2700);
  assert.equal(g.run('G.purchaseRules.reserve'),0);assert.equal(g.run('G.commissions.rule.reserve'),0);
});

test('temporary ritual liability also protects the shared upgrade reserve',()=>{
  const g=economy();g.run(`G.gold=400;G.purchaseRules={reserve:50,refinement:{id:'spark',path:'potency'},tempering:null};
    setCommissionRule({reserve:25});advanceEconomyTime(600,-.2);`);
  assert.equal(g.run('G.refinements.spark.rank'),1);close(g.run('G.gold'),180);
  assert.equal(g.run('G.purchaseRules.reserve'),50);assert.equal(g.run('G.commissions.rule.reserve'),25);
  assert.equal(g.run('G.gold+100+120'),400);
});

test('temporary gold holds restore player preferences even if a resolver throws',()=>{
  const g=economy();g.run(`G.purchaseRules.reserve=42;G.commissions.rule.reserve=37;
    advanceCommissions=()=>{throw Error('fixture failure');};`);
  assert.throws(()=>g.run('advanceEconomyTime(600,-.2)'),/fixture failure/);
  assert.equal(g.run('G.purchaseRules.reserve'),42);assert.equal(g.run('G.commissions.rule.reserve'),37);
});

test('save export and import preserve selected purchase targets, reserves and prepaid progress',()=>{
  const g=economy();g.run(`const item=genGear('staff',0,'common');G.gearInventory.push(item);
    G.gold=10000;G.refinements.spark={path:'potency',rank:2};
    G.purchaseRules={reserve:2000,refinement:{id:'spark',path:'potency'},tempering:item.id};
    setCommissionRule({enabled:true,recipe:'dust',reserve:3000,budget:1500});advanceCommissions(117.25);
    const before=JSON.stringify({rules:G.purchaseRules,ref:G.refinements,commissions:G.commissions});const saved=exportSave();
    G.purchaseRules={reserve:0,refinement:null,tempering:null};G.refinements={};G.commissions=null;`);
  assert.equal(g.run('importSave(saved)'),true,g.run('lastSaveError'));
  assert.equal(g.run('JSON.stringify({rules:G.purchaseRules,ref:G.refinements,commissions:G.commissions})'),g.run('before'));
});

test('old saves and explicit null economy defaults disable automatic spending',()=>{
  const g=economy();g.run(`const data=decodeSave(exportSave());delete data.refinements;delete data.purchaseRules;data.commissions=null;
    const saved=utf8ToB64(JSON.stringify(data));`);
  assert.equal(g.run('importSave(saved)'),true,g.run('lastSaveError'));
  assert.deepEqual(g.json('G.refinements'),{});
  assert.deepEqual(g.json('G.purchaseRules'),{reserve:0,refinement:null,tempering:null});
  assert.deepEqual(g.json('G.commissions'),{queue:[],nextId:1,rule:{enabled:false,recipe:'dust',reserve:0,budget:0,spent:0}});
});

test('invalid saved upgrade reserves fail atomically and unknown targets are cleared',()=>{
  const g=economy();g.run(`G.gold=1234;const data=decodeSave(exportSave());const before=JSON.stringify(G);
    data.purchaseRules={reserve:-1,refinement:null,tempering:null};const saved=utf8ToB64(JSON.stringify(data));`);
  assert.equal(g.run('importSave(saved)'),false);assert.match(g.run('lastSaveError'),/reserve/);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  assert.deepEqual(g.json("normalizePurchaseRules({reserve:75,refinement:{id:'missing',path:'potency'},tempering:'missing'})"),
    {reserve:75,refinement:null,tempering:null});
});

test('Awakening refunds unfinished prepaid work after resetting gold and disables repeat spending',()=>{
  const g=economy();g.run(`G.hero.lvl=24;G.unlocked=3;G.gold=5000;buyCommission('dust',true);advanceCommissions(100);
    setCommissionRule({enabled:true,recipe:'herb',reserve:50,budget:1500});G.commissions.rule.spent=1500;
    G.purchaseRules={reserve:100,refinement:{id:'spark',path:'potency'},tempering:null};awaken();`);
  assert.equal(g.run('G.awakenCount'),1);assert.equal(g.run('G.gold'),1500);assert.equal(g.run('G.commissions.queue.length'),0);
  assert.deepEqual(g.json('G.commissions.rule'),{enabled:false,recipe:'herb',reserve:50,budget:1500,spent:1500});
  assert.deepEqual(g.json('G.purchaseRules'),{reserve:100,refinement:null,tempering:null});
  g.run('advanceEconomyTime(3600);');assert.equal(g.run('G.gold'),1500);assert.equal(g.run('G.materials.dust'),0);
});

test('a world catch-up advances a prepaid timer once without the project helper aging it twice',()=>{
  const g=economy();g.run("G.gold=500;buyCommission('dust');applyIdle(125);");
  assert.equal(g.run('G.commissions.queue[0].timeLeft'),175);assert.equal(g.run('G.materials.dust'),0);
});

test('expedition travel uses the same single elapsed interval for commission timers',()=>{
  const g=economy();g.run("G.gold=500;buyCommission('dust');recordExpeditionBoss('ember');startExpedition('orchard','restore');applyIdle(125);");
  assert.equal(g.run('G.expeditions.active.elapsed'),125);assert.equal(g.run('G.commissions.queue[0].timeLeft'),175);
  assert.equal(g.run('G.materials.dust'),0);
});

test('long expedition travel buys an affordable upgrade at the same time as short intervals',()=>{
  const large=economy(),small=economy();
  for(const g of [large,small])g.run(`G.buildings.vault=1;recomputeStats();
    G.purchaseRules.refinement={id:'spark',path:'potency'};setCommissionRule({enabled:true,recipe:'dust',budget:500});
    recordExpeditionBoss('ember');startExpedition('orchard','restore');`);
  large.run('advanceExpedition(125);');small.run('for(let i=0;i<500;i++)advanceExpedition(.25);');
  compare(snapshot(large),snapshot(small));assert.equal(large.run('G.refinements.spark.rank'),1);
  assert.equal(large.run('G.gold'),25);assert.equal(large.run('G.expeditions.active.elapsed'),125);
});

test('speed multiplies expedition elapsed time once for both active and away progression',()=>{
  const active=economy(),away=economy();
  for(const g of [active,away])g.run("G.gold=500;buyCommission('dust');recordExpeditionBoss('ember');startExpedition('orchard','restore');setGameSpeed(8);resetGameClock();");
  active.advance(1000);active.run('gameTick();');away.run('applyAway(1);');
  assert.equal(active.run('G.expeditions.active.elapsed'),8);assert.equal(away.run('G.expeditions.active.elapsed'),8);
  assert.equal(active.run('G.commissions.queue[0].timeLeft'),292);assert.equal(away.run('G.commissions.queue[0].timeLeft'),292);
});
