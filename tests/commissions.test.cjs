const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');
const source=fs.readFileSync(path.join(__dirname,'..','dev','commissions.inc.js'),'utf8');
function guild(){
  const context=vm.createContext({Math,console});
  vm.runInContext(`const G={gold:0,unlocked:9,materials:{dust:0,herb:0,crystal:0,gem:0}};
    const logs=[];function logLine(text){logs.push(text);}function fmt(n){return String(Math.floor(n));}function fmtG(n){return fmt(n)+' g';}`+source,context);
  const run=code=>vm.runInContext(code,context,{timeout:10000});run('G.commissions=normalizeCommissions();');
  return {run,json:code=>JSON.parse(run('JSON.stringify('+code+')'))};
}
const emptyReport={orders:0,dust:0,herb:0,crystal:0,gem:0};

test('commission defaults are off and missing old saves receive an empty independent queue',()=>{
  const g=guild();assert.deepEqual(g.json('normalizeCommissions(undefined)'),
    {queue:[],nextId:1,rule:{enabled:false,recipe:'dust',reserve:0,budget:0,spent:0}});
  g.run('const a=normalizeCommissions(),b=normalizeCommissions();a.queue.push({});a.rule.reserve=90;');
  assert.deepEqual(g.json('b'),g.json('G.commissions'));
});

test('manual commissions intersect unlocks, affordability and three finite queue slots',()=>{
  const g=guild();g.run('G.gold=500000;G.unlocked=0;const before=JSON.stringify(G);');
  for(const id of ['herb','crystal','gem','invalid','constructor','__proto__']){
    assert.deepEqual(g.json(`commissionPreview('${id}',true)`),{count:0,cost:0},id);
    assert.deepEqual(g.json(`buyCommission('${id}',true)`),{count:0,cost:0},id);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),id);
  }
  assert.deepEqual(g.json("commissionPreview('dust',true)"),{count:3,cost:1500});
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  assert.deepEqual(g.json("buyCommission('dust',true)"),{count:3,cost:1500});
  assert.equal(g.run('G.gold'),498500);assert.equal(g.run('G.commissions.queue.length'),3);
  assert.deepEqual(g.json('G.commissions.queue.map(o=>o.timeLeft)'),[300,300,300]);
  assert.deepEqual(g.json('G.materials'),{dust:0,herb:0,crystal:0,gem:0});
  assert.deepEqual(g.json("buyCommission('dust')"),{count:0,cost:0});
});

test('insufficient funds and nonboolean maximum purchase requests are safe no-ops',()=>{
  const g=guild();g.run('G.gold=499;const before=JSON.stringify(G);');
  assert.deepEqual(g.json("buyCommission('dust',true)"),{count:0,cost:0});
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  g.run('G.gold=2000;const funded=JSON.stringify(G);');
  for(const maximum of ["'true'",'1','null','{}']){
    assert.deepEqual(g.json(`buyCommission('dust',${maximum})`),{count:0,cost:0});
    assert.equal(g.run('JSON.stringify(G)'),g.run('funded'));
  }
  assert.deepEqual(g.json("buyCommission('dust')"),{count:1,cost:500});
});

test('mixed orders complete sequentially, once, with exact time and no claim step',()=>{
  const g=guild();g.run(`G.gold=500000;buyCommission('dust');buyCommission('herb');buyCommission('crystal');logs.length=0;`);
  assert.deepEqual(g.json('advanceCommissions(299.5)'),emptyReport);
  assert.deepEqual(g.json('G.commissions.queue.map(o=>o.timeLeft)'),[.5,600,900]);
  assert.deepEqual(g.json('advanceCommissions(.5)'),{orders:1,dust:80,herb:0,crystal:0,gem:0});
  assert.deepEqual(g.json('G.commissions.queue.map(o=>o.timeLeft)'),[600,900]);
  assert.deepEqual(g.json('advanceCommissions(1500)'),{orders:2,dust:0,herb:30,crystal:40,gem:0});
  assert.deepEqual(g.json('G.materials'),{dust:80,herb:30,crystal:40,gem:0});
  assert.equal(g.run('G.commissions.queue.length'),0);assert.equal(g.run('G.gold'),488300);
  g.run('const before=JSON.stringify(G);');assert.deepEqual(g.json('advanceCommissions(32400)'),emptyReport);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));assert.equal(g.run('logs.length'),2);
});

test('a nine-hour batch matches chronological minute steps without per-order log spam',()=>{
  const batch=guild(),steps=guild();
  for(const g of [batch,steps])g.run(`G.gold=100000;setCommissionRule({enabled:true,recipe:'dust',reserve:1000,budget:60000});logs.length=0;`);
  assert.deepEqual(batch.json('advanceCommissions(32400)'),{orders:108,dust:8640,herb:0,crystal:0,gem:0});
  steps.run('for(let i=0;i<540;i++)advanceCommissions(60);');
  assert.deepEqual(batch.json('G'),steps.json('G'));
  assert.equal(batch.run('logs.length'),1);assert.equal(batch.run('G.commissions.rule.spent'),55500);
  assert.equal(batch.run('G.commissions.queue.length'),3);
});

test('auto repeat pays only inside its total budget and leaves the requested gold reserve',()=>{
  const g=guild();g.run(`G.gold=7000;setCommissionRule({enabled:true,recipe:'dust',reserve:2000,budget:4000});`);
  assert.deepEqual(g.json('advanceCommissions(32400)'),{orders:8,dust:640,herb:0,crystal:0,gem:0});
  assert.equal(g.run('G.gold'),3000);assert.equal(g.run('G.commissions.rule.spent'),4000);
  assert.equal(g.run('G.commissions.queue.length'),0);
  g.run('const before=JSON.stringify(G);');g.run('advanceCommissions(32400);');
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  const reserve=guild();reserve.run(`G.gold=1600;setCommissionRule({enabled:true,recipe:'dust',reserve:1000,budget:10000});advanceCommissions(32400);`);
  assert.equal(reserve.run('G.gold'),1100);assert.equal(reserve.run('G.materials.dust'),80);
  assert.equal(reserve.run('G.commissions.rule.spent'),500);
});

test('disabled and locked auto plans retain preferences while preventing new purchases',()=>{
  const g=guild();g.run(`G.gold=1000000;G.unlocked=4;setCommissionRule({enabled:true,recipe:'gem',reserve:100,budget:500000});`);
  assert.deepEqual(g.json('advanceCommissions(1000)'),emptyReport);
  assert.equal(g.run('G.gold'),1000000);assert.equal(g.run('G.commissions.rule.recipe'),'gem');
  g.run(`G.unlocked=5;advanceCommissions(0);setCommissionRule({enabled:false});`);
  assert.equal(g.run('G.commissions.queue.length'),3);assert.equal(g.run('G.commissions.rule.spent'),300000);
  assert.deepEqual(g.json('advanceCommissions(5400)'),{orders:3,dust:0,herb:0,crystal:0,gem:9});
  assert.equal(g.run('G.commissions.queue.length'),0);assert.equal(g.run('G.commissions.rule.spent'),300000);
});

test('enabling and editing preferences cannot reset spending; only an explicit new budget does',()=>{
  const g=guild();g.run(`G.gold=10000;setCommissionRule({enabled:true,recipe:'dust',reserve:0,budget:2000});advanceCommissions(0);`);
  assert.equal(g.run('G.commissions.rule.spent'),1500);
  for(const rule of ["{enabled:false}","{enabled:true}","{recipe:'herb'}","{reserve:200}"]){
    assert.equal(g.run(`setCommissionRule(${rule})`),true);assert.equal(g.run('G.commissions.rule.spent'),1500);
  }
  assert.equal(g.run('setCommissionRule({budget:3000})'),true);
  assert.equal(g.run('G.commissions.rule.spent'),0);
});

test('invalid rule updates do not weaken reserves or discard the current budget',()=>{
  const g=guild();g.run('setCommissionRule({reserve:500,budget:3000});const before=JSON.stringify(G);');
  for(const rule of ['null','[]',"{enabled:'true'}","{recipe:'bad'}","{reserve:-1}","{reserve:'0'}","{budget:Infinity}"]){
    assert.equal(g.run(`setCommissionRule(${rule})`),false,rule);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),rule);
  }
});

test('affordability boundaries prevent future gold from retroactively aging a new order',()=>{
  const g=guild();g.run(`setCommissionRule({enabled:true,recipe:'dust',reserve:0,budget:500});advanceCommissions(0);`);
  assert.equal(g.run('commissionBoundarySeconds(1)'),500);
  g.run('G.gold+=500;advanceCommissions(500,false);');
  assert.equal(g.run('G.materials.dust'),0);assert.equal(g.run('G.gold'),0);
  assert.equal(g.run('G.commissions.queue[0].timeLeft'),300);
  assert.equal(g.run('commissionBoundarySeconds(1)'),300);
  g.run('advanceCommissions(299.75,false);');assert.equal(g.run('G.materials.dust'),0);
  g.run('advanceCommissions(.25,false);');assert.equal(g.run('G.materials.dust'),80);
});

test('completion boundaries can refill the queue without aging the newly prepaid order',()=>{
  const g=guild();g.run(`G.gold=500;setCommissionRule({enabled:true,recipe:'dust',reserve:0,budget:1000});advanceCommissions(0);`);
  assert.equal(g.run('commissionBoundarySeconds(2)'),250);
  g.run('G.gold+=500;advanceCommissions(250,false);');
  assert.deepEqual(g.json('G.commissions.queue.map(o=>o.timeLeft)'),[50,300]);
  g.run('advanceCommissions(50,false);');assert.deepEqual(g.json('G.commissions.queue.map(o=>o.timeLeft)'),[300]);
  assert.equal(g.run('G.materials.dust'),80);
});

test('normalization derives paid prices and yields from trusted recipes and validates queue checkpoints',()=>{
  const g=guild();
  assert.deepEqual(g.json(`normalizeCommissions({queue:[{id:3,recipe:'dust',timeLeft:25,paid:999999999,amount:1e100,seconds:1}],nextId:4})`),
    {queue:[{id:3,recipe:'dust',timeLeft:25}],nextId:4,rule:{enabled:false,recipe:'dust',reserve:0,budget:0,spent:0}});
  const invalid=['false','[]',"{queue:'all'}","{queue:[null]}","{queue:[{id:1,recipe:'bad',timeLeft:1}]}",
    "{queue:[{id:1,recipe:'dust',timeLeft:301}]}","{queue:[{id:1,recipe:'dust',timeLeft:0}]}",
    "{queue:[{id:1.5,recipe:'dust',timeLeft:1}]}","{queue:[{id:1,recipe:'dust',timeLeft:'20'}]}",
    "{queue:[{id:1,recipe:'dust',timeLeft:20},{id:1,recipe:'dust',timeLeft:20}]}",
    "{queue:[{id:2,recipe:'dust',timeLeft:20}],nextId:2}","{nextId:-1}","{rule:{spent:600,budget:500}}",
    "{queue:[{id:1,recipe:'dust',timeLeft:1},{id:2,recipe:'dust',timeLeft:1},{id:3,recipe:'dust',timeLeft:1},{id:4,recipe:'dust',timeLeft:1}]}"];
  for(const raw of invalid)assert.throws(()=>g.run(`normalizeCommissions(${raw})`),/Invalid Guild commissions/,raw);
  assert.throws(()=>g.run("normalizeCommissions({queue:[{id:1,recipe:'gem',timeLeft:1}]},{unlocked:4})"),/Invalid Guild commissions/);
  assert.equal(g.run("normalizeCommissions({rule:{enabled:true,recipe:'invalid',budget:500}}).rule.enabled"),false);
});

test('Awakening refunds only unfinished prepaid orders once and keeps spent budgets exhausted',()=>{
  const g=guild();g.run(`G.gold=200000;buyCommission('dust');buyCommission('herb');buyCommission('gem');
    setCommissionRule({recipe:'dust',reserve:200,budget:1500});G.commissions.rule.spent=1500;G.commissions.rule.enabled=true;
    advanceCommissions(300);G.gold=0;const refund=resetCommissionsForAwakening();`);
  assert.equal(g.run('refund'),101200);assert.equal(g.run('G.gold'),101200);
  assert.deepEqual(g.json('G.commissions.rule'),{enabled:false,recipe:'dust',reserve:200,budget:1500,spent:1500});
  assert.equal(g.run('G.commissions.queue.length'),0);assert.equal(g.run('G.materials.dust'),80);
  assert.equal(g.run('resetCommissionsForAwakening()'),0);assert.equal(g.run('G.gold'),101200);
  g.run('setCommissionRule({enabled:true});advanceCommissions(3600);');assert.equal(g.run('G.gold'),101200);
});

test('invalid elapsed time is inert and one enormous request is bounded to the twelve-hour catch-up window',()=>{
  const g=guild();g.run(`G.gold=1e100;setCommissionRule({enabled:true,recipe:'dust',reserve:0,budget:1e100});const before=JSON.stringify(G);`);
  for(const elapsed of ['-1','Infinity','NaN',"'300'"]){
    assert.deepEqual(g.json(`advanceCommissions(${elapsed})`),emptyReport);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  }
  const result=g.json('advanceCommissions(1e100)');assert.equal(result.orders,144);assert.equal(result.dust,11520);
  assert.equal(g.run('G.commissions.queue.length'),3);
});

test('integration: manual saves preserve partially completed queue, IDs and the exhausted repeat budget',()=>{
  const g=game();g.run(`G.unlocked=5;G.gold=200000;G.commissions=normalizeCommissions();
    setCommissionRule({enabled:true,recipe:'dust',reserve:1000,budget:1500});advanceCommissions(127.5);
    const before=JSON.stringify(G.commissions);const saved=exportSave();G.commissions=normalizeCommissions();`);
  assert.equal(g.run('importSave(saved)'),true,g.run('lastSaveError'));
  assert.equal(g.run('JSON.stringify(G.commissions)'),g.run('before'));
  g.run('advanceCommissions(1000);');assert.equal(g.run('G.materials.dust'),240);
  assert.equal(g.run('G.commissions.rule.spent'),1500);assert.equal(g.run('G.commissions.queue.length'),0);
});

test('integration: commissions advance once at 256x and once through nine-hour world catch-up',()=>{
  const active=game();active.run(`G.autoExplore=false;G.gold=500;G.commissions=normalizeCommissions();buyCommission('dust');setGameSpeed(256);resetGameClock();`);
  active.advance(1000);active.run('gameTick();');assert.equal(active.run('G.commissions.queue[0].timeLeft'),44);
  active.advance(1000);active.run('gameTick();');assert.equal(active.run('G.materials.dust'),80);assert.equal(active.run('G.commissions.queue.length'),0);
  const idle=game();idle.run(`G.autoExplore=false;G.unlocked=5;G.gold=300000;G.commissions=normalizeCommissions();buyCommission('gem',true);applyIdle(32400);`);
  assert.equal(idle.run('G.materials.gem'),9);assert.equal(idle.run('G.commissions.queue.length'),0);
});

test('integration: commissioned crafting gems cannot be sold as loose socket gems for gold',()=>{
  const g=game();g.run(`G.autoExplore=false;G.unlocked=5;G.gold=100000;G.commissions=normalizeCommissions();buyCommission('gem');advanceCommissions(1800);`);
  assert.equal(g.run('G.materials.gem'),3);assert.deepEqual(g.json('G.gemInventory'),{});
  assert.deepEqual(g.json("disposeGems({type:'all',level:'all',keep:0},'sell')"),{count:0,gold:0,dust:0,crystal:0});
  assert.equal(g.run('G.gold'),0);assert.equal(g.run('G.materials.gem'),3);
});
