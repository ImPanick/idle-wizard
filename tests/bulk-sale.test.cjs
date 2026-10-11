const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');

function inventoryGame(){
  const g=game();
  g.run(`G.gold=0;G.gearInventory=[];G.gear=Object.fromEntries(GEAR_SLOTS.map(slot=>[slot,null]));
    G.gemInventory={};G.log=[];G.rates.goldDelta60=[];
    function addGear(slot='hat',tier=0,rarity='common',unique=false,sockets=[]){
      const item=genGear(slot,tier,rarity,{legendary:unique});item.sockets=sockets;
      G.gearInventory.push(item);return item;
    }
    const allFilter={slot:'all',rarity:'all',tier:'all'};`);
  return g;
}

function bulkSaleUI(g){
  g.run(`confirm=()=>{throw Error('Bulk sales must use the inline review, not native confirmation.');};bindBulkSale();`);
  const values={slot:'all',rarity:'common',tier:'all'};
  const labels={slot:'All categories',rarity:'Common',tier:'All tiers'};
  for(const key of ['slot','rarity','tier']){
    const select=g.node('sell-'+key);
    select.value=values[key];select.selectedOptions=[{textContent:labels[key]}];
  }
  g.run('renderBulkSale();');
}

test('bulk sale filters intersect exact slot, rarity and tier without mutating the preview',()=>{
  const g=inventoryGame();
  g.run(`const target=addGear('hat',2,'rare'),otherSlot=addGear('robe',2,'rare');
    const lowerTier=addGear('hat',1,'rare'),lowerRarity=addGear('hat',2,'uncommon');
    const upperTier=addGear('hat',3,'rare'),upperRarity=addGear('hat',2,'epic');
    const before=JSON.stringify(G);`);
  assert.deepEqual(g.json("bulkSalePreview({slot:'hat',rarity:'rare',tier:2}).items.map(i=>i.id)"),[g.run('target.id')]);
  assert.equal(g.run("bulkSalePreview({slot:'hat',rarity:'rare',tier:2}).gold"),500);
  assert.deepEqual(g.json("bulkSalePreview({slot:'all',rarity:'rare',tier:2}).items.map(i=>i.id)"),[g.run('target.id'),g.run('otherSlot.id')]);
  assert.equal(g.run("bulkSalePreview({slot:'all',rarity:'rare',tier:2}).gold"),1000);
  assert.equal(g.run("bulkSalePreview({slot:'hat',rarity:'all',tier:'all'}).items.length"),5);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  assert.deepEqual(g.json("bulkSellGear({slot:'hat',rarity:'rare',tier:2})"),{count:1,gold:500,gems:0});
  assert.equal(g.run('G.gold'),500);
  assert.equal(g.run('G.gearInventory.length'),5);
});

test('empty inventories and invalid or missing filters are atomic no-ops',()=>{
  const g=inventoryGame();
  assert.deepEqual(g.json('bulkSalePreview(allFilter)'),{items:[],gold:0});
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:0,gold:0,gems:0});
  g.run(`addGear('hat',0,'common',false,[{type:'fire',level:1}]);const before=JSON.stringify(G);`);
  const invalid=['undefined','null','{}','[]',"{slot:'all',rarity:'all'}","{slot:'gloves',rarity:'all',tier:'all'}",
    "{slot:'all',rarity:'Rare',tier:'all'}","{slot:'all',rarity:'all',tier:'2'}",
    ...[-1,6,1.5,'NaN','Infinity'].map(tier=>`{slot:'all',rarity:'all',tier:${tier}}`)];
  for(const filter of invalid){
    assert.deepEqual(g.json(`bulkSalePreview(${filter})`),{items:[],gold:0},filter);
    assert.deepEqual(g.json(`bulkSellGear(${filter})`),{count:0,gold:0,gems:0},filter);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),filter);
  }
});

test('crafted uniques and equipped IDs are protected while ordinary legendary drops can be sold',()=>{
  const g=inventoryGame();
  g.run(`const unique=addGear('hat',0,'common',true,[{type:'fire',level:1}]);
    const uniqueLegend=addGear('ring',2,'legendary',true);
    const equipped=addGear('robe',0,'common',false,[{type:'water',level:1}]);G.gear.robe={...equipped};
    const ordinaryLegend=addGear('staff',2,'legendary'),ordinary=addGear('amulet',0,'common');`);
  assert.deepEqual(g.json('bulkSalePreview(allFilter).items.map(i=>i.id)'),[g.run('ordinaryLegend.id'),g.run('ordinary.id')]);
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:2,gold:2020,gems:0});
  assert.deepEqual(g.json('G.gearInventory.map(i=>i.id)'),[g.run('unique.id'),g.run('uniqueLegend.id'),g.run('equipped.id')]);
  assert.equal(g.run('G.gear.robe.id'),g.run('equipped.id'));
  assert.deepEqual(g.json('G.gemInventory'),{});
});

test('bulk sale refunds every occupied socket including repeated gem types and levels',()=>{
  const g=inventoryGame();
  g.run(`G.gemInventory={gem_fire_2:4};
    addGear('hat',0,'common',false,[{type:'fire',level:2},null,{type:'fire',level:2},{type:'water',level:1}]);
    addGear('robe',1,'common',false,[{type:'fire',level:2},{type:'power',level:5}]);`);
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:2,gold:70,gems:5});
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:7,gem_water_1:1,gem_power_5:1});
  assert.equal(g.run('G.gearInventory.length'),0);
});

test('individual selling also refunds socketed gems exactly once',()=>{
  const g=inventoryGame();
  g.run(`const item=addGear('hat',0,'common',false,[{type:'earth',level:3},null,{type:'earth',level:3}]);sellGear(item.id);`);
  assert.equal(g.run('G.gold'),20);
  assert.deepEqual(g.json('G.gemInventory'),{gem_earth_3:2});
  assert.equal(g.run('G.gearInventory.length'),0);
  g.run('const before=JSON.stringify(G);sellGear(item.id);');
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
});

test('reviewed IDs exclude new drops and stop matching after equipping or changing rarity',()=>{
  const g=inventoryGame();
  g.run(`const equipped=addGear(),changed=addGear(),sellable=addGear();
    const filter={slot:'hat',rarity:'common',tier:0};
    const reviewed=bulkSalePreview(filter).items.map(i=>i.id);
    equipFromInventory(equipped.id);changed.rarity='rare';
    const newDrop=addGear();reviewed.push(sellable.id,'g999999');`);
  assert.deepEqual(g.json('bulkSellGear(filter,reviewed)'),{count:1,gold:20,gems:0});
  assert.equal(g.run('G.gear.hat.id'),g.run('equipped.id'));
  assert.deepEqual(g.json('G.gearInventory.map(i=>i.id)'),[g.run('changed.id'),g.run('newDrop.id')]);
  assert.equal(g.run('G.gold'),20);
});

test('empty or invalid review lists cannot sell anything and repeated batches cannot credit twice',()=>{
  const g=inventoryGame();
  g.run(`addGear('hat',0,'common',false,[{type:'fire',level:1}]);const before=JSON.stringify(G);`);
  for(const reviewed of ['[]',"'g1'",'{}','false']){
    assert.deepEqual(g.json(`bulkSellGear(allFilter,${reviewed})`),{count:0,gold:0,gems:0});
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  }
  assert.deepEqual(g.json('bulkSellGear(allFilter,null)'),{count:1,gold:20,gems:1});
  g.run('const after=JSON.stringify(G);');
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:0,gold:0,gems:0});
  assert.equal(g.run('JSON.stringify(G)'),g.run('after'));
});

test('one bulk batch credits income once and produces one aggregate log entry',()=>{
  const g=inventoryGame();
  g.run(`for(let n=0;n<10;n++)addGear();
    const credits=[];const originalEarnGold=earnGold;
    earnGold=amount=>{credits.push(amount);originalEarnGold(amount);};`);
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:10,gold:200,gems:0});
  assert.deepEqual(g.json('credits'),[200]);
  assert.equal(g.run('G.log.length'),1);
  assert.equal(g.run('G.rates.goldDelta60.length'),1);
  assert.equal(g.run('G.rates.goldDelta60[0].amt'),200);
});

test('selling a 2000-item inventory preserves uniques, bounded logs and gems across manual saves',()=>{
  const g=inventoryGame();
  g.run(`G.gold=17;G.gemInventory={gem_fire_1:2};
    for(let n=0;n<2000;n++)addGear(GEAR_SLOTS[n%5],0,'common',n%100===99,[{type:'fire',level:1},null,{type:'fire',level:1}]);
    for(const slot of GEAR_SLOTS)G.gear[slot]=genGear(slot,0,'common');
    const equippedIds=GEAR_SLOTS.map(slot=>G.gear[slot].id);
    const uniqueIds=G.gearInventory.filter(item=>item.legendary).map(item=>item.id);
    G.log=Array.from({length:119},()=>({text:'Older report',cls:'sys'}));`);
  assert.equal(g.run('bulkSalePreview(allFilter).items.length'),1980);
  assert.equal(g.run('bulkSalePreview(allFilter).gold'),39600);
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:1980,gold:39600,gems:3960});
  assert.equal(g.run('G.gold'),39617);
  assert.equal(g.run('G.gemInventory.gem_fire_1'),3962);
  assert.equal(g.run('G.gearInventory.length'),20);
  assert.equal(g.run('G.log.length'),120);
  assert.equal(g.run("G.log.filter(entry=>entry.text==='Older report').length"),119);
  assert.equal(g.run('G.rates.goldDelta60.length'),1);
  g.run('const code=exportSave();G.gold=0;G.gearInventory=[];G.gemInventory={};');
  assert.equal(g.run('importSave(code)'),true,g.run('lastSaveError'));
  assert.equal(g.run('G.gold'),39617);
  assert.equal(g.run('G.gemInventory.gem_fire_1'),3962);
  assert.deepEqual(g.json('G.gearInventory.map(item=>item.id)'),g.json('uniqueIds'));
  assert.deepEqual(g.json('GEAR_SLOTS.map(slot=>G.gear[slot].id)'),g.json('equippedIds'));
  assert.deepEqual(g.json('bulkSellGear(allFilter)'),{count:0,gold:0,gems:0});
});

test('inline review preserves its snapshot through inventory rendering and new idle drops',()=>{
  const g=inventoryGame();
  g.run(`const first=addGear('hat',0,'common',false,[{type:'fire',level:1}]);
    const second=addGear('robe'),third=addGear('ring');const before=JSON.stringify(G);`);
  bulkSaleUI(g);
  g.node('btn-bulk-sell').onclick();
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  assert.equal(g.node('btn-bulk-sell').textContent,'Confirm sale');
  assert.equal(g.node('cancel-bulk-sell').hidden,false);
  assert.deepEqual(g.json('_bulkSaleReview.items.map(item=>item.id)'),[g.run('first.id'),g.run('second.id'),g.run('third.id')]);
  const preview=g.node('bulk-sale-preview').textContent;
  g.run(`const newDrop=addGear('robe');renderGear();`);
  assert.equal(g.node('bulk-sale-preview').textContent,preview);
  assert.equal(g.run('_bulkSaleReview.items.length'),3);
  assert.equal(g.run('G.gearInventory.length'),4);
  g.node('btn-bulk-sell').onclick();
  assert.equal(g.run('_bulkSaleReview'),null);
  assert.equal(g.run('G.gold'),60);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:1});
  assert.deepEqual(g.json('G.gearInventory.map(item=>item.id)'),[g.run('newDrop.id')]);
  assert.equal(g.node('btn-bulk-sell').textContent,'Review sale');
  assert.equal(g.node('cancel-bulk-sell').hidden,true);
});

test('canceling inline review leaves the inventory, funds and gems unchanged',()=>{
  const g=inventoryGame();
  g.run(`addGear('hat',0,'common',false,[{type:'water',level:2}]);const before=JSON.stringify(G);`);
  bulkSaleUI(g);
  g.node('btn-bulk-sell').onclick();
  assert.notEqual(g.run('_bulkSaleReview'),null);
  g.node('cancel-bulk-sell').onclick();
  assert.equal(g.run('_bulkSaleReview'),null);
  assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
  assert.equal(g.node('btn-bulk-sell').textContent,'Review sale');
  assert.equal(g.node('cancel-bulk-sell').hidden,true);
});

test('changing any bulk filter cancels pending confirmation without selling gear',()=>{
  const g=inventoryGame();
  g.run('addGear();const before=JSON.stringify(G);');
  bulkSaleUI(g);
  for(const [key,value,label] of [['slot','hat','Hat'],['rarity','rare','Rare'],['tier','2','T2']]){
    for(const id of ['slot','rarity','tier']){
      const select=g.node('sell-'+id);select.value=id==='rarity'?'common':'all';
      select.selectedOptions=[{textContent:id==='rarity'?'Common':'All'}];
    }
    g.run('renderBulkSale();');g.node('btn-bulk-sell').onclick();
    assert.notEqual(g.run('_bulkSaleReview'),null);
    const select=g.node('sell-'+key);select.value=value;select.selectedOptions=[{textContent:label}];
    select.onchange();
    assert.equal(g.run('_bulkSaleReview'),null,key);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'),key);
    assert.equal(g.node('btn-bulk-sell').textContent,'Review sale');
    assert.equal(g.node('cancel-bulk-sell').hidden,true);
  }
});

test('successful save import clears an old inline review before displaying the imported inventory',()=>{
  const g=inventoryGame();
  g.run(`const savedItem=addGear();const code=exportSave();addGear('robe');`);
  bulkSaleUI(g);g.node('btn-bulk-sell').onclick();
  assert.equal(g.run('_bulkSaleReview.items.length'),2);
  assert.equal(g.run('importSave(code)'),true,g.run('lastSaveError'));
  assert.equal(g.run('_bulkSaleReview'),null);
  assert.equal(g.run('G.gold'),0);
  assert.deepEqual(g.json('G.gearInventory.map(item=>item.id)'),[g.run('savedItem.id')]);
  assert.equal(g.node('btn-bulk-sell').textContent,'Review sale');
  assert.equal(g.node('cancel-bulk-sell').hidden,true);
  g.node('btn-bulk-sell').onclick();
  assert.equal(g.run('_bulkSaleReview.items.length'),1);
  assert.equal(g.run('G.gold'),0);
  assert.equal(g.run('G.gearInventory.length'),1);
});
