// Optional authoring utility. The released HTML works directly without this.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const target=path.join(root,'ascii-idle-wizard.html');
let html=fs.readFileSync(target,'utf8');
const start=html.indexOf('// BEGIN EMBEDDED foundation');
const ending=html.match(/\ninit\(\);\s*<\/script>/);
if(start<0||!ending||ending.index<start)throw Error('Embedded source boundaries missing.');
let embedded='';
for(const name of ['foundation','spell-expansion','expeditions','expansion-ui','auto-sell','gem-tools','inventory-ui']){
  const begin=`// BEGIN EMBEDDED ${name}`,end=`// END EMBEDDED ${name}`;
  const source=fs.readFileSync(path.join(__dirname,name+'.inc.js'),'utf8').trim();
  const block=begin+'\n'+source+'\n'+end+'\n';
  embedded+=block;
}
html=html.slice(0,start)+embedded+html.slice(ending.index+1);
fs.writeFileSync(target,html);
