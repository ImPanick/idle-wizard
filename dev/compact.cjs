// Optional authoring step: remove core comments and unused trailing whitespace.
// Pass an installed Acorn module path, or install Acorn in dev/node_modules.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const acorn=require(process.argv[2]?path.resolve(process.argv[2]):'acorn');
const file=path.join(__dirname,'..','ascii-idle-wizard.html'),html=fs.readFileSync(file,'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/),source=match[1],comments=[];
const options={ecmaVersion:'latest',sourceType:'script'},before=acorn.parse(source,{...options,onComment:comments});
const boundary=source.indexOf('// BEGIN EMBEDDED foundation');
let compact=source;
for(const c of comments.reverse())if(c.start<boundary&&!/@license|copyright/i.test(c.value)){
  const breaks=source.slice(c.start,c.end).match(/\r?\n/g);
  compact=compact.slice(0,c.start)+(breaks?breaks.join(''):c.type==='Block'?' ':'')+compact.slice(c.end);
}
const tokens=[];acorn.parse(compact,{...options,onToken:tokens});
const compactBoundary=compact.indexOf('// BEGIN EMBEDDED foundation');
for(const m of [...compact.matchAll(/[ \t]+(?=\r?$)/gm)].reverse())if(m.index<compactBoundary
  &&!tokens.some(t=>t.start<m.index+m[0].length&&t.end>m.index))
  compact=compact.slice(0,m.index)+compact.slice(m.index+m[0].length);
const semantic=ast=>JSON.stringify(ast,(key,value)=>['start','end','raw'].includes(key)?undefined:value);
assert.equal(semantic(acorn.parse(compact,options)),semantic(before),'Comment removal must preserve the complete syntax tree.');
const result=html.slice(0,match.index)+'<script>'+compact+'</script>'+html.slice(match.index+match[0].length);
fs.writeFileSync(file,result);console.log(`Removed ${Buffer.byteLength(html)-Buffer.byteLength(result)} comment/whitespace bytes; runtime ${Buffer.byteLength(result)} bytes.`);
