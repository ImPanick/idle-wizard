const {test}=require('node:test'),assert=require('node:assert/strict'),{game}=require('./game-harness.cjs');
function ui(){const g=game();g.run(`G.autoExplore=false;G.unlocked=5;G.gold=1e10;G.commissions=normalizeCommissions();
 const item=genGear('staff',5,'legendary',{legendary:true});item.sockets=[{type:'water',level:5},null,null,null,null];
 G.gear.staff=item;activeTab='gear';$('artificer-panel').open=true;renderArtificer();initEconomyTools();`);return g;}
test('socket purchase requires two clicks and a cancel spends no gold',()=>{
 const g=ui(),before=g.run('G.gold');g.node('socket-expand').onclick();
 assert.equal(g.run('item.sockets.length'),5);assert.equal(g.run('G.gold'),before);
 assert.equal(g.node('socket-expand').textContent,'Confirm socket purchase');
 g.node('socket-expand-cancel').onclick();assert.equal(g.run('_socketExpansionReview'),null);
 g.node('socket-expand').onclick();g.node('socket-expand').onclick();
 assert.equal(g.run('item.sockets.length'),6);assert.equal(g.run('G.gold'),before-500000000);
 assert.deepEqual(g.json('item.sockets[0]'),{type:'water',level:5});
});
test('replaced ownership cannot fulfill a stale socket purchase review',()=>{
 const g=ui(),before=g.run('G.gold');g.node('socket-expand').onclick();
 g.run('G.gear.staff={...item,sockets:[...item.sockets]};');g.node('socket-expand').onclick();
 assert.equal(g.run('G.gear.staff.sockets.length'),5);assert.equal(g.run('G.gold'),before);
 assert.equal(g.run('_socketExpansionReview.item===G.gear.staff'),true);
});
test('reserve increase during a review prevents its confirmation',()=>{
 const g=ui(),before=g.run('G.gold');g.node('socket-expand').onclick();g.run('G.purchaseRules.reserve=G.gold;');g.node('socket-expand').onclick();
 assert.equal(g.run('G.gold'),before);assert.equal(g.run('item.sockets.length'),5);
});
test('repeat order controls retain a drafted allowance until explicit apply',()=>{
 const g=ui();g.run(`activeTab='manor';renderCommissions();$('commission-budget').value='2500';$('commission-budget').oninput();`);
 g.node('commission-auto').checked=true;g.node('commission-auto').onchange();
 assert.equal(g.node('commission-budget').value,'2500');assert.equal(g.run('G.commissions.rule.budget'),0);
 g.node('commission-apply-budget').onclick();
 assert.equal(g.run('G.commissions.rule.budget'),2500);assert.equal(g.run('G.commissions.rule.spent'),1500);
 g.node('commission-reserve').value='500';g.node('commission-reserve').onchange();
 assert.equal(g.run('G.commissions.rule.spent'),1500);
});
test('changing a shipment immediately changes its displayed price and yield',()=>{
 const g=ui();g.run(`activeTab='manor';renderCommissions();$('commission-recipe').value='gem';$('commission-recipe').onchange();`);
 assert.match(g.node('commission-offer').textContent,/3 gem.*100K.*30m/);
});
test('tempering stats and comparison labels hide floating point residue',()=>{
 const g=ui();g.run('item.stats.atk=1382;item.temper=10;renderArtificer();');
 assert.match(g.node('artificer-stats').textContent,/atk: \+1658.4/);
 assert.doesNotMatch(g.node('artificer-stats').textContent,/999999999/);
 assert.match(g.run('gearCompareText(item)'),/\[\+10\]/);
});
