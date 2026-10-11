/* Socketed manual sales: choices, keyboard containment, and stale item safety. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');

function page(){
  const html=fs.readFileSync(path.join(__dirname,'..','ascii-idle-wizard.html'),'utf8');
  const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ninit\(\);\s*$/,'\n');
  const nodes=new Map();let document;
  const walk=n=>n.children.flatMap(child=>[child,...walk(child)]);
  function node(tag='div'){
    const n={tagName:tag.toUpperCase(),children:[],parent:null,style:{},dataset:{},attributes:{},tabIndex:0,
      value:'',textContent:'',innerHTML:'',disabled:false,
      classList:{add(){},remove(){},toggle(){},contains(){return false;}},
      setAttribute(k,v){this.attributes[k]=String(v);},getAttribute(k){return this.attributes[k]??null;},
      addEventListener(k,fn){this['on'+k]=fn;},
      appendChild(child){child.parent=this;this.children.push(child);return child;},
      append(...children){children.forEach(child=>this.appendChild(child));},
      remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;},
      focus(){document.activeElement=this;},select(){},
      querySelectorAll(selector){return walk(this).filter(child=>selector.split(',').some(s=>s.trim()===child.tagName.toLowerCase()));},
      querySelector(selector){return this.querySelectorAll(selector)[0]||null;},
      get isConnected(){return this===document.body||!!this.parent?.isConnected;}};
    return n;
  }
  document={hidden:false,activeElement:null,body:node(),createElement:node,addEventListener(){},
    getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},
    querySelectorAll(){return [];},querySelector(){return null;}};
  const context=vm.createContext({console,Math,Date,document,window:{addEventListener(){},innerWidth:1440,innerHeight:900},
    TextEncoder,TextDecoder,URL,performance:{now:()=>Date.now()},navigator:{},
    btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
    setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},
    confirm:()=>true,alert(){}});
  vm.runInContext(source,context,{timeout:5000});
  const run=code=>vm.runInContext(code,context,{timeout:5000});
  run(`renderAll=()=>{};renderCold=()=>{};renderHot=()=>{};renderGear=()=>{};renderTop=()=>{};
    recomputeStats();resetGameClock();initExpeditions();genMap();
    G.gold=0;G.gearInventory=[];G.gear=Object.fromEntries(GEAR_SLOTS.map(s=>[s,null]));G.gemInventory={};
    function addItem(sockets=[{type:'fire',level:2},null,{type:'fire',level:2}],unique=false){
      const item=genGear('hat',0,'common',{legendary:unique});item.sockets=sockets;G.gearInventory.push(item);return item;
    }
    const item=addItem();`);
  return {run,document,node,walk,json:code=>JSON.parse(run('JSON.stringify('+code+')')),
    modals:()=>document.body.children.filter(n=>n.className==='modal-bg')};
}
function controls(g){return g.walk(g.modals()[0]).filter(n=>n.tagName==='BUTTON');}
function choose(g,label){const button=controls(g).find(n=>n.textContent===label);assert.ok(button,'Missing '+label);button.onclick();return button;}
function key(g,code,shiftKey=false){const event={key:code,shiftKey,prevented:false,stopped:false,
  preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};
  g.modals()[0].onkeydown(event);return event;
}

test('socketed gear opens one accessible three-choice modal and leaves the inventory unchanged',()=>{
  const g=page();const before=g.run('JSON.stringify(G)');g.run('openGearSaleModal(item.id);');
  assert.equal(g.modals().length,1);
  assert.deepEqual(controls(g).map(b=>b.textContent),['Sell with gems','Retrieve gems and sell','Cancel']);
  const card=g.modals()[0].children[0];
  assert.equal(card.attributes.role,'dialog');assert.equal(card.attributes['aria-modal'],'true');
  assert.ok(card.attributes['aria-label']||card.attributes['aria-labelledby']);
  assert.equal(g.document.activeElement.textContent,'Retrieve gems and sell');
  assert.equal(g.run('JSON.stringify(G)'),before);
});

test('retrieve choice sells once and returns every repeated socketed gem',()=>{
  const g=page();g.run('openGearSaleModal(item.id);');const button=choose(g,'Retrieve gems and sell');
  assert.equal(g.run('G.gearInventory.length'),0);assert.equal(g.run('G.gold'),20);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:2});assert.equal(g.modals().length,0);
  button.onclick();assert.equal(g.run('G.gold'),20);assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:2});
});

test('explicit sell with gems discards socketed gems without changing loose gems',()=>{
  const g=page();g.run('G.gemInventory={gem_fire_2:4,gem_water_1:3};openGearSaleModal(item.id);');
  choose(g,'Sell with gems');assert.equal(g.run('G.gold'),20);assert.equal(g.run('G.gearInventory.length'),0);
  assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:4,gem_water_1:3});assert.equal(g.modals().length,0);
});

test('cancel, Escape, and clicking the backdrop preserve all gear and gems',()=>{
  for(const method of ['button','escape','backdrop']){
    const g=page();const before=g.run('JSON.stringify(G)');g.run('openGearSaleModal(item.id);');
    if(method==='button')choose(g,'Cancel');
    else if(method==='escape'){const e=key(g,'Escape');assert.equal(e.prevented,true);assert.equal(e.stopped,true);}
    else {const wrap=g.modals()[0];wrap.onclick({target:wrap});}
    assert.equal(g.modals().length,0,method);assert.equal(g.run('JSON.stringify(G)'),before,method);
  }
});

test('gear without occupied sockets sells immediately without a confirmation overlay',()=>{
  const g=page();g.run('item.sockets=[null,null];openGearSaleModal(item.id);');
  assert.equal(g.modals().length,0);assert.equal(g.run('G.gold'),20);assert.equal(g.run('G.gearInventory.length'),0);
});

test('reopening a sale replaces the singleton and confirms only the selected current item',()=>{
  const g=page();g.run('const other=addItem([{type:"water",level:1}]);openGearSaleModal(item.id);');
  const first=g.modals()[0],obsolete=controls(g)[1];g.run('openGearSaleModal(other.id);');assert.equal(g.modals().length,1);
  const before=g.run('JSON.stringify(G)');obsolete.onclick();assert.equal(g.run('JSON.stringify(G)'),before);
  assert.notEqual(g.modals()[0],first);choose(g,'Retrieve gems and sell');
  assert.deepEqual(g.json('G.gearInventory.map(i=>i.id)'),[g.run('item.id')]);
  assert.deepEqual(g.json('G.gemInventory'),{gem_water_1:1});
});

test('crafted uniques remain manually sellable after an explicit socket review',()=>{
  const g=page();g.run('const unique=addItem([{type:"earth",level:3}],true);openGearSaleModal(unique.id);');
  assert.equal(g.modals().length,1);choose(g,'Retrieve gems and sell');
  assert.equal(g.run('G.gold'),200);assert.deepEqual(g.json('G.gemInventory'),{gem_earth_3:1});
  assert.deepEqual(g.json('G.gearInventory.map(i=>i.id)'),[g.run('item.id')]);
});

test('a stale sale cannot sell an item that disappeared or became equipped while the review was open',()=>{
  for(const stale of ['G.gearInventory=[];','G.gear.hat={...item};']){
    for(const action of ['Sell with gems','Retrieve gems and sell']){
      const g=page();g.run('openGearSaleModal(item.id);'+stale);const before=g.run('JSON.stringify(G)');
      choose(g,action);assert.equal(g.run('JSON.stringify(G)'),before);assert.equal(g.modals().length,0);
    }
  }
});

test('Tab wraps within the three choices and closing returns focus to the original control',()=>{
  const g=page(),prior=g.node('button');g.document.body.appendChild(prior);prior.focus();
  g.run('openGearSaleModal(item.id);');const buttons=controls(g);
  buttons[2].focus();let e=key(g,'Tab');assert.equal(e.prevented,true);assert.equal(g.document.activeElement,buttons[0]);
  buttons[0].focus();e=key(g,'Tab',true);assert.equal(e.prevented,true);assert.equal(g.document.activeElement,buttons[2]);
  e=key(g,'ArrowUp');assert.equal(e.stopped,true);choose(g,'Cancel');assert.equal(g.document.activeElement,prior);
});

test('untrusted gear names cannot inject markup into the sale dialog',()=>{
  const g=page();g.run(`item.name='<img src=x onerror="hurt">';openGearSaleModal(item.id);`);
  const authored=g.walk(g.modals()[0]).map(n=>n.innerHTML).join('');
  assert.doesNotMatch(authored,/<img|onerror="hurt"/);
  const all=g.walk(g.modals()[0]).map(n=>n.textContent+n.innerHTML).join('');
  assert.match(all,/img src=x/);choose(g,'Cancel');
});

test('away recaps wait for the sale decision and use a single recap after dismissal',()=>{
  const g=page();g.run(`openGearSaleModal(item.id);showOfflineGains({seconds:120,gold:15,xp:20,kills:2,materials:{}});`);
  assert.equal(g.modals().length,1);assert.equal(controls(g).length,3);
  choose(g,'Cancel');assert.equal(g.modals().length,1);assert.deepEqual(controls(g).map(b=>b.textContent),['Continue']);
  assert.equal(g.run('_pendingOfflineGains.gold'),15);
});

test('a successful import removes an obsolete gear sale and its handlers cannot sell imported gear',()=>{
  const g=page();g.run('const saved=exportSave();openGearSaleModal(item.id);');const action=controls(g)[1];
  assert.equal(g.run('importSave(saved)'),true);assert.equal(g.modals().length,0);
  const before=g.run('JSON.stringify(G)');action.onclick();assert.equal(g.run('JSON.stringify(G)'),before);
});

test('a failed import preserves the pending sale and the current inventory',()=>{
  const g=page();g.run('openGearSaleModal(item.id);');const wrap=g.modals()[0],before=g.run('JSON.stringify(G)');
  assert.equal(g.run('importSave("broken save")'),false);assert.equal(g.modals()[0],wrap);
  assert.equal(g.run('JSON.stringify(G)'),before);choose(g,'Retrieve gems and sell');
  assert.equal(g.run('G.gold'),20);assert.deepEqual(g.json('G.gemInventory'),{gem_fire_2:2});
});

test('Awakening clears the sale even when carried gear is retained',()=>{
  const g=page();g.run(`G.hero.lvl=AWAKEN_LEVEL;G.unlocked=AWAKEN_ZONE;G.awakening.a_keep_gear=true;
    openGearSaleModal(item.id);awaken();`);
  assert.equal(g.run('G.awakenCount'),1);assert.equal(g.modals().length,0);
  assert.equal(g.run('G.gearInventory.length'),1);assert.deepEqual(g.json('G.gemInventory'),{});
});

test('declining Awakening leaves the socket sale decision available',()=>{
  const g=page();g.run('confirm=()=>false;G.hero.lvl=AWAKEN_LEVEL;G.unlocked=AWAKEN_ZONE;openGearSaleModal(item.id);');
  const wrap=g.modals()[0];g.run('awaken();');assert.equal(g.modals()[0],wrap);
  assert.equal(g.run('G.awakenCount'),0);assert.equal(g.run('G.gearInventory.length'),1);assert.equal(g.run('G.gold'),0);
  choose(g,'Cancel');assert.deepEqual(g.json('G.gemInventory'),{});
});
