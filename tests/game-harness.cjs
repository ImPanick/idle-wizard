const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function game(){
  let now=Date.UTC(2026,9,10,12);
  class TestDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const nodes=new Map();
  function node(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},addEventListener(){},appendChild(){},remove(){},querySelectorAll(){return [];},querySelector(){return null;},focus(){},select(){}});return nodes.get(id);}
  const context=vm.createContext({Math,Date:TestDate,console,TextEncoder,TextDecoder,URL,performance:{now:()=>now},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},confirm:()=>true,alert(){},navigator:{},window:{addEventListener(){},innerWidth:1440,innerHeight:900},document:{hidden:false,body:node('body'),getElementById:node,createElement:()=>node('created'),addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;}}});
  const html=fs.readFileSync(path.join(__dirname,'..','ascii-idle-wizard.html'),'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\ninit\(\);\s*$/,'\n'),context,{timeout:5000});
  const run=code=>vm.runInContext(code,context,{timeout:30000});
  run('function decodeSave(code){return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(code),c=>c.charCodeAt(0))));}renderHot=()=>{};renderCold=()=>{};renderAll=()=>{};initExpeditions();recomputeStats();G.hero.hp=G.hero.maxHp;G.hero.mana=G.hero.maxMana;resetGameClock();genMap();');
  return {run,node,advance:ms=>{now+=ms;},json:code=>JSON.parse(run('JSON.stringify('+code+')'))};
}
module.exports={game};
