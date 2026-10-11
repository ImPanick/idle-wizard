/* Focused UI state regressions; no browser or external dependencies required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
const html=fs.readFileSync(path.join(__dirname,'..','ascii-idle-wizard.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ninit\(\);\s*$/,'\n');

function ui(){
  const nodes=new Map();
  const document={activeElement:null,addEventListener(){},querySelectorAll(){return [];}};
  function createNode(){
    return {
      children:[],style:{},dataset:{},innerHTML:'',textContent:'',isConnected:true,
      classList:{add(){},remove(){},toggle(){},contains(){return false;}},
      setAttribute(){},addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;},
      appendChild(child){child.parent=this;this.children.push(child);return child;},
      remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.isConnected=false;},
      focus(){document.activeElement=this;},
    };
  }
  document.body=createNode();
  document.createElement=createNode;
  document.getElementById=id=>{if(!nodes.has(id))nodes.set(id,createNode());return nodes.get(id);};
  const context={console,document,window:{addEventListener(){}},TextEncoder,TextDecoder,URL,
    setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},navigator:{}};
  vm.createContext(context);vm.runInContext(script,context,{timeout:5000});
  return {document,node:document.getElementById,run:code=>vm.runInContext(code,context,{timeout:5000})};
}

test('repeated background rewards share one stable dialog and add up until dismissed',()=>{
  const page=ui();
  page.run(`showOfflineGains({seconds:120,gold:15,xp:20,kills:2,materials:{dust:1.5},estimateNote:'Single-target estimate.'});`);
  const wrapper=page.document.body.children[0];
  const continueButton=wrapper.children[0].children[2].children[0];
  page.run(`showOfflineGains({seconds:180,gold:25,xp:40,kills:3,materials:{dust:2,crystal:1},estimateNote:'Single-target estimate.'});`);
  assert.equal(page.document.body.children.length,1);
  assert.equal(page.document.body.children[0],wrapper);
  assert.equal(wrapper.children[0].children[2].children[0],continueButton);
  assert.deepEqual(JSON.parse(page.run('JSON.stringify(_pendingOfflineGains)')),
    {seconds:300,gold:40,xp:60,kills:5,materials:{dust:3.5,crystal:1},estimateNote:'Single-target estimate.'});
  assert.match(wrapper.children[0].children[1].innerHTML,/Single-target estimate\./);
  continueButton.onclick();
  assert.equal(page.document.body.children.length,0);
  assert.equal(page.run('_offlineGainsDialog'),null);
  page.run(`showOfflineGains({seconds:60,gold:3,xp:4,kills:1,materials:{}});`);
  assert.equal(page.document.body.children.length,1);
  assert.equal(page.run('_pendingOfflineGains.gold'),3);
});

test('reaction guide uses shared recipes and reports the suggested loadout state',()=>{
  const page=ui();
  page.run(`G.knownSpells=['spark','gust'];G.equippedSpells=['spark','gust',null];renderReactionGuide();`);
  const output=page.node('reaction-guide').innerHTML;
  assert.match(output,/\[CONDUCT\]/);
  assert.match(output,/\[WILDFIRE\]/);
  assert.match(output,/\[SHATTER\]/);
  assert.match(output,/Spark -&gt; Gust/);
  assert.match(output,/Equipped in the suggested priority\./);
  assert.match(output,/Learn Tidal Wave \+ Lightning Bolt in Elements\./);
  page.run(`G.equippedSpells=[null,null,null,'spark','gust'];renderReactionGuide();`);
  assert.doesNotMatch(page.node('reaction-guide').innerHTML,/Equipped in the suggested priority\./);
});

test('encounter text exposes conditions, effective stats, and one-hit guard readiness',()=>{
  const page=ui();
  page.run(`recomputeStats();G.enemy={hp:50,maxHp:100,ref:{name:'Test enemy',glyph:'t',hp:100,atk:10,def:100,spd:2,el:'fire',gold:1,xp:1},statuses:{chilled:4,soaked:6,fractured:6},dotTimers:[{spellId:'spark',element:'fire',dps:1,remaining:3}]};G.buffs=[{_spellId:'earthward',_guardReady:true,dur:10}];renderTargetIntel();`);
  const output=page.node('target-intel').innerHTML;
  for(const name of ['Burning','Chilled','Soaked','Fractured'])assert.match(output,new RegExp(name));
  assert.match(output,/def 70/);
  assert.match(output,/spd 1\.20/);
  assert.match(output,/guard ready/);
  assert.match(page.run('mobTooltip(G.enemy)'),/Chilled: 4\.0s/);
  page.run('G.buffs[0]._guardReady=false;renderTargetIntel();');
  assert.match(page.node('target-intel').innerHTML,/guard spent/);
});

test('school surfaces hide locked names and reveal Cosmic exactly at Awakening five',()=>{
  const page=ui();
  page.run(`G.knownSpells=['spark','manabolt','cosmiceye','cometprocession'];G.uiCollapsed={'spellbook:arcane':false,'spellbook:cosmic':false};renderElements();renderKnownSpells();renderSpellFilters();renderCrusade();`);
  for(const id of ['el-grid','known-spells','spell-filters']){
    assert.doesNotMatch(page.node(id).innerHTML,/Arcane|Mana Bolt|Cosmic|Comet Procession/);
  }
  assert.doesNotMatch(page.node('expedition-regions').innerHTML,/Orrery/);
  page.run(`G.awakenCount=4;renderElements();renderKnownSpells();renderSpellFilters();renderCrusade();`);
  assert.match(page.node('known-spells').innerHTML,/Cosmic Eye/);
  assert.doesNotMatch(page.node('known-spells').innerHTML,/Comet Procession/);
  assert.doesNotMatch(page.node('el-grid').innerHTML,/class="el cosmic"/);
  assert.doesNotMatch(page.node('expedition-regions').innerHTML,/Orrery/);
  page.run(`G.awakenCount=5;renderElements();renderKnownSpells();renderSpellFilters();renderCrusade();`);
  assert.match(page.node('el-grid').innerHTML,/class="el cosmic"/);
  assert.match(page.node('known-spells').innerHTML,/Comet Procession/);
  assert.match(page.node('expedition-regions').innerHTML,/Orrery Beyond Midnight/);
});

test('casting feedback shows ready spells and distinguishes mana or conditional waits',()=>{
  const page=ui();
  page.run(`recomputeStats();G.knownSpells=['spark'];G.equippedSpells=['spark',null,null];G.hero.mana=G.hero.maxMana;renderSpellHotbar();renderSpellSlots();`);
  assert.match(page.node('spell-hotbar').innerHTML,/class="hk ready"/);
  assert.match(page.node('spell-hotbar').innerHTML,/READY/);
  assert.doesNotMatch(page.node('spell-slots').innerHTML,/Waiting: Ready/);
  page.run(`G.hero.mana=0;renderSpellHotbar();`);
  assert.match(page.node('spell-hotbar').innerHTML,/MANA/);
  page.run(`G.hero.mana=G.hero.maxMana;G.hero.hp=G.hero.maxHp;setSpellRule('spark','hp',0.5);renderSpellHotbar();renderSpellSlots();`);
  assert.match(page.node('spell-hotbar').innerHTML,/WAIT/);
  assert.match(page.node('spell-slots').innerHTML,/data-cast-threshold="spark"/);
});

test('portrait and map reflect the assignment without exposing a suspended world map',()=>{
  const page=ui();
  page.run(`recomputeStats();G.ui={worldView:'scene'};renderEncounterScene();`);
  assert.equal(page.node('encounter-stage').hidden,false);
  assert.equal(page.node('world-map-stage').hidden,true);
  assert.match(page.node('encounter-art').textContent,/\(o_o\)/);
  assert.doesNotMatch(page.node('encounter-art').textContent,/[^\x20-\x7e\n]/);
  page.run(`G.ui.worldView='map';renderEncounterScene();`);
  assert.equal(page.node('world-map-stage').hidden,false);
  page.run(`initExpeditions();G.expeditions.active={id:'orchard',policy:'restore',repeat:true,stage:'travel',phase:0,circuit:0,remainingMs:45000,totalMs:90000,phaseName:'Walking the Orchard',enemyHp:0,enemyMaxHp:0};renderEncounterScene();renderCrusade();`);
  assert.equal(page.node('world-map-stage').hidden,true);
  assert.equal(page.node('btn-map').disabled,true);
  assert.match(page.node('scene-caption').textContent,/Restore policy/);
  assert.match(page.node('crusade-status').innerHTML,/Circuit 1/);
  assert.match(page.node('crusade-status').innerHTML,/Route 50%/);
  assert.match(page.node('crusade-status').innerHTML,/Repeat circuits automatically/);
  page.run(`G.expeditions.active.stage='branch';G.expeditions.active.branchTrait=2;G.expeditions.active.phaseName='Mirror Sentry';G.expeditions.active.enemyHp=40;G.expeditions.active.enemyMaxHp=80;renderEncounterScene();renderCrusade();`);
  assert.equal(page.node('scene-enemy-bar').hidden,false);
  assert.match(page.node('crusade-status').innerHTML,/Target 40 \/ 80 HP/);
});

test('spell state displays paid Resonance notes and bounded delayed effects',()=>{
  const page=ui();
  page.run(`G.awakenCount=5;G.magic=normalizeMagic({notes:[{el:'fire',spent:12,damage:40},{el:'water',spent:8,damage:30}],comets:{remaining:3,budget:100},deferred:[{remaining:4,amount:20}]});renderMagicState();`);
  const output=page.node('magic-state').innerHTML;
  assert.match(output,/Score: Fire \/ Water/);
  assert.match(output,/Comets: 3\.0s/);
  assert.match(output,/Deferred damage: 20/);
  assert.match(output,/Next Chaos:/);
});

test('journal keeps opportunities in the page and hides dormant late rewards',()=>{
  const page=ui();
  page.run(`initExpeditions();G.expeditions.events={market:{seen:true,resolved:false,choice:null},sighting:{seen:true,resolved:false,choice:null}};G.expeditions.discoveries.orrery=true;G.expeditions.inscriptions.orbital=true;renderExpeditionJournal();`);
  assert.match(page.node('expedition-events').innerHTML,/Market of Borrowed Things/);
  assert.match(page.node('expedition-events').innerHTML,/data-event-choice="listen"/);
  assert.doesNotMatch(page.node('expedition-events').innerHTML,/Leviathan Sighting/);
  assert.doesNotMatch(page.node('expedition-journal').innerHTML,/Orrery/);
  assert.doesNotMatch(page.node('expedition-inscriptions').innerHTML,/Orbital Veil/);
  assert.equal(page.document.body.children.length,0);
});

test('learned market recipes expose reusable trades and a bounded standing plan',()=>{
  const page=ui();
  page.run(`initExpeditions();G.expeditions.journal.market_recipe=true;G.expeditions.market={preference:'crystal',budget:480,spent:120};G.materials.dust=120;G.gold=500;renderExpeditionJournal();`);
  const output=page.node('expedition-events').innerHTML;
  assert.match(output,/data-market-trade="crystal"/);
  assert.match(output,/data-market-trade="herb"/);
  assert.match(output,/id="market-budget"/);
  assert.match(output,/120 \/ 480 dust spent/);
  assert.match(output,/at most one exchange per completed circuit/);
});

test('Market drafts survive panel refresh, commit on Apply, and reset with a replacement journey',()=>{
  const page=ui(),root=page.node('expedition-events');
  const policy={value:'crystal'},budget={value:'480'},apply={focus(){}};
  root.querySelector=selector=>({'#market-policy':policy,'#market-budget':budget,'#market-apply':apply}[selector]||null);
  page.run(`initExpeditions();G.expeditions.journal.market_recipe=true;renderExpeditionJournal();`);
  policy.onchange();budget.oninput();
  page.run(`renderExpeditionJournal();`);
  assert.match(root.innerHTML,/<option value="crystal" selected>/);
  assert.match(root.innerHTML,/id="market-budget"[^>]*value="480"/);
  assert.equal(page.run(`G.expeditions.market.preference`),'off');
  apply.onclick();
  assert.equal(page.run(`G.expeditions.market.preference`),'crystal');
  assert.equal(page.run(`G.expeditions.market.budget`),480);
  assert.equal(page.run(`uiExpansionDrafts().market`),null);
  policy.value='herb';budget.value='999';policy.onchange();budget.oninput();
  page.run(`G.expeditions=normalizeExpeditions(null,G);G.expeditions.journal.market_recipe=true;renderExpeditionJournal();`);
  assert.match(root.innerHTML,/<option value="off" selected>/);
  assert.doesNotMatch(root.innerHTML,/value="999"/);
});

test('casting threshold drafts survive refresh until a valid commit and stay outside saves',()=>{
  const page=ui(),input={dataset:{castThreshold:'spark'},value:'7'};
  page.node('spell-slots').querySelectorAll=selector=>selector==='[data-cast-threshold]'?[input]:[];
  page.run(`G.knownSpells=['spark'];G.equippedSpells=['spark'];setSpellRule('spark','hp',0.6);bindCastingRules();`);
  input.oninput();
  page.run(`renderSpellSlots();`);
  assert.match(page.node('spell-slots').innerHTML,/value="7"/);
  assert.equal(page.run(`G.magic.rules.spark.threshold`),0.6);
  input.value='';input.oninput();input.onchange();
  assert.equal(page.run(`uiExpansionDrafts().thresholds.spark`),'');
  input.value='95';input.oninput();input.onchange();
  assert.equal(page.run(`G.magic.rules.spark.threshold`),0.95);
  assert.equal(page.run(`uiExpansionDrafts().thresholds.spark`),undefined);
  input.value='45';input.oninput();
  page.run(`G.magic=normalizeMagic({rules:{spark:{condition:'hp',threshold:0.8}}});renderSpellSlots();`);
  assert.match(page.node('spell-slots').innerHTML,/value="80"/);
  assert.equal(page.run(`uiExpansionDrafts().thresholds.spark`),undefined);
});
