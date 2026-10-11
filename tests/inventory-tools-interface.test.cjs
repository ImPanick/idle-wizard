const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');

function gemsUI(inventory={gem_fire_1:5}){
  const g=game();
  g.run(`G.gold=0;G.materials={dust:0,crystal:0,gem:0,herb:0};G.log=[];
    G.gemInventory=${JSON.stringify(inventory)};G.gearInventory=[];`);
  for(const [id,value,label] of [['type','all','All types'],['level','all','All levels'],['keep','2',''],['mode','sell','Sell for gold']]){
    const node=g.node('gem-clean-'+id);node.value=value;node.selectedOptions=[{textContent:label}];
  }
  g.run('initInventoryTools();');
  g.run(`confirm=()=>{throw Error('Gem disposal must use its inline review.');};`);
  return g;
}
function review(g){g.node('gem-clean-confirm').onclick();}
function change(g,id,value,label=value){
  const node=g.node('gem-clean-'+id);node.value=value;node.selectedOptions=[{textContent:label}];node.onchange();
}

test('gem controls populate known types and levels, reserve pairs, and require review before sale',()=>{
  const g=gemsUI();
  assert.match(g.node('gem-clean-type').innerHTML,/<option value="fire">Ruby<\/option>/);
  assert.match(g.node('gem-clean-level').innerHTML,/<option value="5">L5<\/option>/);
  assert.equal(g.node('gem-clean-preview').textContent,'3 spare gems | 75 g');
  assert.equal(g.node('gem-clean-confirm').textContent,'Review gems');
  assert.equal(g.node('gem-clean-confirm').disabled,false);
  assert.equal(g.node('gem-clean-cancel').hidden,true);
  const before=g.run('JSON.stringify(G)');review(g);
  assert.equal(g.run('JSON.stringify(G)'),before);
  assert.equal(g.node('gem-clean-confirm').textContent,'Confirm sale');
  assert.equal(g.node('gem-clean-cancel').hidden,false);
  assert.match(g.node('gem-clean-preview').textContent,/All types \/ All levels \/ Keep 2 per type and level/);
  assert.deepEqual(g.json('_gemDisposalReview.entries'),[{id:'gem_fire_1',count:3}]);
});

test('confirming a gem sale pays once, returns to review state, and protects the retained pair from repeat clicks',()=>{
  const g=gemsUI();review(g);const handler=g.node('gem-clean-confirm').onclick;handler();
  assert.equal(g.run('G.gold'),75);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:2});
  assert.equal(g.run('_gemDisposalReview'),null);
  assert.equal(g.node('gem-clean-confirm').textContent,'Review gems');
  assert.equal(g.node('gem-clean-confirm').disabled,true);
  assert.equal(g.node('gem-clean-cancel').hidden,true);
  const before=g.run('JSON.stringify(G)');handler();handler();
  assert.equal(g.run('JSON.stringify(G)'),before);
});

test('salvage uses a separate review label and grants only the displayed material refund',()=>{
  const g=gemsUI({gem_power_3:5});change(g,'mode','salvage','Salvage for materials');
  assert.equal(g.node('gem-clean-preview').textContent,'3 spare gems | 24 dust | 3 crystal');
  review(g);assert.equal(g.node('gem-clean-confirm').textContent,'Confirm salvage');
  assert.match(g.node('gem-clean-preview').textContent,/Confirm to salvage permanently\./);
  review(g);assert.deepEqual(g.json('G.materials'),{dust:24,crystal:3,gem:0,herb:0});
  assert.equal(g.run('G.gold'),0);assert.deepEqual(g.json('G.gemInventory'),{gem_power_3:2});
  assert.equal(g.run('_gemDisposalReview'),null);assert.equal(g.node('gem-clean-cancel').hidden,true);
});

test('canceling a gem review preserves all inventory and resources and restores the initial controls',()=>{
  const g=gemsUI(),before=g.run('JSON.stringify(G)');review(g);g.node('gem-clean-cancel').onclick();
  assert.equal(g.run('_gemDisposalReview'),null);assert.equal(g.run('JSON.stringify(G)'),before);
  assert.equal(g.node('gem-clean-preview').textContent,'3 spare gems | 75 g');
  assert.equal(g.node('gem-clean-confirm').textContent,'Review gems');
  assert.equal(g.node('gem-clean-cancel').hidden,true);
});

test('changing any gem filter or mode cancels the pending transaction before applying the new choice',()=>{
  for(const [id,value,label] of [['type','water','Sapphire'],['level','2','L2'],['keep','3',''],['mode','salvage','Salvage for materials']]){
    const g=gemsUI(),before=g.run('JSON.stringify(G)');review(g);change(g,id,value,label);
    assert.equal(g.run('_gemDisposalReview'),null,id);
    assert.equal(g.run('JSON.stringify(G)'),before,id);
    assert.equal(g.node('gem-clean-confirm').textContent,'Review gems',id);
    assert.equal(g.node('gem-clean-cancel').hidden,true,id);
  }
});

test('invalid reserve input clears confirmation and cannot accidentally dispose every gem',()=>{
  for(const value of ['','-1','1.5','1000000','not a number','Infinity']){
    const g=gemsUI(),before=g.run('JSON.stringify(G)');review(g);
    g.node('gem-clean-keep').value=value;g.node('gem-clean-keep').oninput();
    assert.equal(g.run('_gemDisposalReview'),null,value);
    assert.equal(g.node('gem-clean-confirm').disabled,true,value);
    assert.equal(g.node('gem-clean-cancel').hidden,true,value);
    assert.equal(g.node('gem-clean-preview').textContent,'Keep must be a whole number from 0 to 999999.',value);
    review(g);assert.equal(g.run('JSON.stringify(G)'),before,value);
    assert.equal(g.run('_gemDisposalReview'),null,value);
  }
});

test('normal inventory renders preserve reviewed quantities while new idle drops remain outside the sale',()=>{
  const g=gemsUI();review(g);const initialText=g.node('gem-clean-preview').textContent;
  g.run('G.gemInventory.gem_fire_1+=7;G.gemInventory.gem_water_1=50;renderGear();');
  assert.equal(g.node('gem-clean-preview').textContent,initialText);
  assert.deepEqual(g.json('_gemDisposalReview.entries'),[{id:'gem_fire_1',count:3}]);
  review(g);assert.equal(g.run('G.gold'),75);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:9,gem_water_1:50});
  assert.equal(g.run('_gemDisposalReview'),null);
  const before=g.run('JSON.stringify(G)');review(g);
  assert.equal(g.run('JSON.stringify(G)'),before);
  assert.equal(g.node('gem-clean-confirm').textContent,'Confirm sale');
  assert.equal(g.run('_gemDisposalReview.count'),55);
});

test('combining during a review reduces the confirmed sale instead of consuming new higher-level gems',()=>{
  const g=gemsUI();g.run('G.gold=10000;G.materials.dust=1000;');review(g);
  g.run("combineGems('fire',1);renderGear();");
  assert.equal(g.run('_gemDisposalReview.count'),3);
  review(g);assert.equal(g.run('G.gold'),9425);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:2,gem_fire_2:1});
  assert.equal(g.run('_gemDisposalReview'),null);
  assert.equal(g.node('gem-clean-confirm').disabled,true);
});

test('successful save imports clear obsolete gem confirmation before imported gems can be touched',()=>{
  const g=gemsUI();g.run('const saved=exportSave();G.gemInventory.gem_fire_1=10;');
  review(g);assert.equal(g.run('_gemDisposalReview.count'),8);
  assert.equal(g.run('importSave(saved)'),true,g.run('lastSaveError'));
  assert.equal(g.run('_gemDisposalReview'),null);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:5});
  const before=g.run('JSON.stringify(G)');review(g);
  assert.equal(g.run('JSON.stringify(G)'),before);
  assert.equal(g.run('_gemDisposalReview.count'),3);
});

test('Awakening clears pending gem confirmation even when loose gems are retained',()=>{
  const g=gemsUI();review(g);
  g.run('confirm=()=>true;G.hero.lvl=AWAKEN_LEVEL;G.unlocked=AWAKEN_ZONE;G.awakening.a_keep_gear=true;awaken();');
  assert.equal(g.run('G.awakenCount'),1);assert.equal(g.run('_gemDisposalReview'),null);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_1:5});
  const before=g.run('JSON.stringify(G)');review(g);assert.equal(g.run('JSON.stringify(G)'),before);
  assert.equal(g.node('gem-clean-confirm').textContent,'Confirm sale');
});
