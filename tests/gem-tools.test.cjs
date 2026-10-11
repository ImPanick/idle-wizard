const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');

function gemsGame(){
  const g=game();
  g.run(`G.gold=0;G.materials={dust:0,crystal:0,gem:0,herb:0};G.gemInventory={};G.log=[];G.rates.goldDelta60=[];
    const allGems={type:'all',level:'all',keep:2};`);
  return g;
}
const emptyPreview={entries:[],count:0,gold:0,dust:0,crystal:0};
const emptyResult={count:0,gold:0,dust:0,crystal:0};

test('spare gem preview intersects exact type and level while preserving each stack reserve',()=>{
  const g=gemsGame();
  g.run(`G.gemInventory={gem_fire_1:7,gem_fire_2:4,gem_water_1:5,gem_power_5:1};const before=JSON.stringify(G);`);
  assert.deepEqual(g.json("gemDisposalPreview({type:'fire',level:1,keep:2},'sell')"),
    {entries:[{id:'gem_fire_1',count:5}],count:5,gold:125,dust:0,crystal:0});
  assert.deepEqual(g.json("gemDisposalPreview({type:'fire',level:'all',keep:2},'sell')"),
    {entries:[{id:'gem_fire_1',count:5},{id:'gem_fire_2',count:2}],count:7,gold:225,dust:0,crystal:0});
  assert.deepEqual(g.json("gemDisposalPreview({type:'all',level:1,keep:2},'sell').entries"),
    [{id:'gem_fire_1',count:5},{id:'gem_water_1',count:3}]);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
});

test('missing, malformed, and invalid filters or disposal modes are atomic no-ops',()=>{
  const g=gemsGame();g.run('G.gemInventory={gem_fire_1:5};const before=JSON.stringify(G);');
  const invalid=['undefined','null','{}','[]',"{type:'all',level:'all'}","{type:'invalid',level:1,keep:0}",
    "{type:'all',level:'1',keep:0}","{type:'all',level:0,keep:0}","{type:'all',level:6,keep:0}",
    "{type:'all',level:1.5,keep:0}","{type:'all',level:'all',keep:'2'}",
    ...[-1,1.5,1000000,'NaN','Infinity'].map(keep=>`{type:'all',level:'all',keep:${keep}}`)];
  for(const f of invalid){
    assert.deepEqual(g.json(`gemDisposalPreview(${f},'sell')`),emptyPreview,f);
    assert.deepEqual(g.json(`disposeGems(${f},'salvage')`),emptyResult,f);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),f);
  }
  for(const mode of ['undefined','null',"'Sell'","'destroy'",'{}']){
    assert.deepEqual(g.json(`gemDisposalPreview(allGems,${mode})`),emptyPreview,mode);
    assert.deepEqual(g.json(`disposeGems(allGems,${mode})`),emptyResult,mode);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),mode);
  }
});

test('selling spare gems pays level-scaled gold once and leaves kept gems and materials intact',()=>{
  const g=gemsGame();
  g.run(`for(let level=1;level<=5;level++)G.gemInventory[gemId('fire',level)]=5;
    const credits=[];const earn=earnGold;earnGold=amount=>{credits.push(amount);earn(amount);};`);
  assert.deepEqual(g.json("disposeGems(allGems,'sell')"),{count:15,gold:2325,dust:0,crystal:0});
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:2,gem_fire_2:2,gem_fire_3:2,gem_fire_4:2,gem_fire_5:2});
  assert.equal(g.run('G.gold'),2325);
  assert.deepEqual(g.json('G.materials'),{dust:0,crystal:0,gem:0,herb:0});
  assert.deepEqual(g.json('credits'),[2325]);
  assert.equal(g.run('G.log.length'),1);
  assert.equal(g.run('G.rates.goldDelta60.length'),1);
});

test('salvage returns deterministic dust and high-level crystal without paying gold or resource gems',()=>{
  const g=gemsGame();
  g.run(`G.materials={dust:10,crystal:5,gem:7,herb:9};for(let level=1;level<=5;level++)G.gemInventory[gemId('water',level)]=5;`);
  assert.deepEqual(g.json("disposeGems(allGems,'salvage')"),{count:15,gold:0,dust:186,crystal:21});
  assert.deepEqual(g.json('G.materials'),{dust:196,crystal:26,gem:7,herb:9});
  assert.equal(g.run('G.gold'),0);
  assert.equal(g.run('G.rates.goldDelta60.length'),0);
  assert.equal(g.run('G.log.length'),1);
  assert.deepEqual(g.json('Object.values(G.gemInventory)'),[2,2,2,2,2]);
});

test('reserve zero can empty loose stacks; larger reserves preserve everything without credits',()=>{
  const g=gemsGame();g.run('G.gemInventory={gem_fire_1:2,gem_power_5:1};');
  assert.deepEqual(g.json("disposeGems({type:'all',level:'all',keep:999999},'sell')"),emptyResult);
  assert.equal(g.run('G.log.length'),0);
  assert.deepEqual(g.json("disposeGems({type:'all',level:'all',keep:0},'sell')"),{count:3,gold:450,dust:0,crystal:0});
  assert.deepEqual(g.json('G.gemInventory'),{});
});

test('equipped and unequipped gear sockets remain intact, even when their loose gem stacks are sold',()=>{
  const g=gemsGame();
  g.run(`const equipped=genGear('hat',0,'common');equipped.sockets=[{type:'fire',level:1},{type:'power',level:5}];G.gear.hat=equipped;
    const stored=genGear('robe',0,'common');stored.sockets=[{type:'fire',level:1}];G.gearInventory=[stored];
    const beforeGear=JSON.stringify([G.gear,G.gearInventory]);G.gemInventory={gem_fire_1:4};`);
  assert.deepEqual(g.json("gemDisposalPreview({type:'all',level:'all',keep:0},'sell').entries"),[{id:'gem_fire_1',count:4}]);
  assert.deepEqual(g.json("disposeGems({type:'all',level:'all',keep:0},'sell')"),{count:4,gold:100,dust:0,crystal:0});
  assert.equal(g.run('JSON.stringify([G.gear,G.gearInventory])'),g.run('beforeGear'));
  assert.deepEqual(g.json("disposeGems({type:'all',level:'all',keep:0},'salvage')"),emptyResult);
});

test('reviewed stack counts exclude later drops and unreviewed gem types',()=>{
  const g=gemsGame();
  g.run(`G.gemInventory={gem_fire_1:5};const reviewed=gemDisposalPreview(allGems,'sell').entries;
    G.gemInventory.gem_fire_1+=7;G.gemInventory.gem_water_1=50;`);
  assert.deepEqual(g.json("disposeGems(allGems,'sell',reviewed)"),{count:3,gold:75,dust:0,crystal:0});
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:9,gem_water_1:50});
});

test('combining gems during a review reduces the sale and protects the new higher-level gem',()=>{
  const g=gemsGame();
  g.run(`G.gold=10000;G.materials.dust=1000;G.gemInventory={gem_fire_1:5};
    const reviewed=gemDisposalPreview(allGems,'sell').entries;combineGems('fire',1);`);
  assert.deepEqual(g.json("disposeGems(allGems,'sell',reviewed)"),{count:1,gold:25,dust:0,crystal:0});
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:2,gem_fire_2:1});
  assert.equal(g.run('G.gold'),9425);
});

test('stale reviews respect current filters, reserves, deleted stacks and deduplicated quantities',()=>{
  const g=gemsGame();
  g.run(`G.gemInventory={gem_fire_1:7,gem_water_1:9};const reviewed=[{id:'gem_fire_1',count:3},{id:'gem_fire_1',count:3},
    {id:'gem_water_1',count:99},{id:'gem_bad_1',count:999},{id:'gem_fire_2',count:999}];`);
  assert.deepEqual(g.json("disposeGems({type:'fire',level:1,keep:5},'sell',reviewed)"),{count:2,gold:50,dust:0,crystal:0});
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:5,gem_water_1:9});
  g.run('delete G.gemInventory.gem_fire_1;const before=JSON.stringify(G);');
  assert.deepEqual(g.json("disposeGems({type:'fire',level:1,keep:0},'sell',reviewed)"),emptyResult);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
});

test('empty or invalid reviewed lists cannot dispose unreviewed inventory',()=>{
  const g=gemsGame();g.run('G.gemInventory={gem_fire_1:5};const before=JSON.stringify(G);');
  const invalid=['[]','false','{}',"'gem_fire_1'",'[null]',"[{id:'gem_fire_1',count:0}]",
    "[{id:'gem_fire_1',count:-1}]","[{id:'gem_fire_1',count:1.5}]","[{id:'gem_fire_1',count:Infinity}]",
    "[{id:'gem_fire_1',count:'3'}]"];
  for(const reviewed of invalid){
    assert.deepEqual(g.json(`disposeGems(allGems,'sell',${reviewed})`),emptyResult,reviewed);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),reviewed);
  }
});

test('repeated disposal cannot credit absent gems or consume the reserve',()=>{
  const g=gemsGame();g.run(`G.gemInventory={gem_power_3:4};const reviewed=gemDisposalPreview(allGems,'salvage').entries;`);
  assert.deepEqual(g.json("disposeGems(allGems,'salvage',reviewed)"),{count:2,gold:0,dust:16,crystal:2});
  g.run('const before=JSON.stringify(G);');
  assert.deepEqual(g.json("disposeGems(allGems,'salvage',reviewed)"),emptyResult);
  assert.deepEqual(g.json("disposeGems(allGems,'sell')"),emptyResult);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
});

test('combining before sale or salvage never creates profitable resource recycling',()=>{
  const g=gemsGame();
  for(let level=1;level<5;level++){
    const lower=g.json(`gemDisposalTotals([{id:gemId('fire',${level}),count:2}],'sell')`);
    const upper=g.json(`gemDisposalTotals([{id:gemId('fire',${level+1}),count:1}],'sell')`);
    assert.equal(upper.gold,lower.gold);
    const lowerDust=g.run(`gemDisposalTotals([{id:gemId('fire',${level}),count:2}],'salvage').dust`);
    const upperDust=g.run(`gemDisposalTotals([{id:gemId('fire',${level+1}),count:1}],'salvage').dust`);
    assert.equal(upperDust,lowerDust);
    assert.ok(upperDust<40*2**level);
    assert.ok(upper.gold<200*3**level);
  }
});

test('gem disposal inventory and resources survive a manual Base64 save round trip',()=>{
  const g=gemsGame();
  g.run(`G.gemInventory={gem_fire_1:7,gem_power_5:6,gem_water_2:1};
    disposeGems({type:'fire',level:1,keep:2},'sell');disposeGems({type:'power',level:5,keep:2},'salvage');
    const before={gold:G.gold,materials:{...G.materials},gems:{...G.gemInventory}};const code=exportSave();
    G.gold=0;G.materials={dust:0,crystal:0,gem:0,herb:0};G.gemInventory={};`);
  assert.equal(g.run('importSave(code)'),true,g.run('lastSaveError'));
  assert.deepEqual(g.json('({gold:G.gold,materials:G.materials,gems:G.gemInventory})'),g.json('before'));
});

test('maximum imported stack quantities dispose without arbitrary lost value and remain importable',()=>{
  const g=gemsGame();
  g.run(`for(const type of GEM_TYPES)for(let level=1;level<=5;level++)G.gemInventory[gemId(type.id,level)]=1e12;
    const sold=disposeGems({type:'all',level:'all',keep:0},'sell');const code=exportSave();G.gold=0;`);
  assert.equal(g.run('sold.count'),g.run('GEM_TYPES.length*5e12'));
  assert.equal(g.run('sold.gold'),g.run('GEM_TYPES.length*775e12'));
  assert.equal(g.run('importSave(code)'),true,g.run('lastSaveError'));
  assert.equal(g.run('G.gold'),g.run('sold.gold'));
  assert.deepEqual(g.json('G.gemInventory'),{});
});
