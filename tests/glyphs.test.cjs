/* UI symbols and Unicode labels must never depend on Latin-1 save encoding. */
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');

test('UTF-8 Base64 round trips accents, CJK, combining marks and supplementary characters',()=>{
  const g=game();
  for(const text of ['Mýrë 龙','🔥 ☾ ☀ ✦ ↯ ⚒ ⌁','e\u0301 Ελληνικά العربية','𐐷 🚀']){
    const encoded=g.run(`utf8ToB64(${JSON.stringify(text)})`);
    assert.match(encoded,/^[A-Za-z0-9+/]*={0,2}$/);
    assert.equal(g.run(`b64ToUtf8(${JSON.stringify(encoded)})`),text);
    assert.equal(Buffer.from(encoded,'base64').toString('utf8'),text);
  }
});

test('exported saves retain Unicode labels and the actual element symbols after import',()=>{
  const g=game();
  g.run(`const label='Mýrë 龙 🔥 𐐷 '+ELEMENTS.map(id=>EL_INFO[id].glyph).join('');
    G.familiars=[{type:'sprite',rarity:'rare',name:label}];
    const code=exportSave();G.familiars=[];`);
  const encoded=g.run('code');
  assert.match(encoded,/^[A-Za-z0-9+/]*={0,2}$/);
  assert.equal(g.run('importSave(code)'),true,g.run('lastSaveError'));
  assert.equal(g.run('G.familiars[0].name'),g.run('label'));
  assert.equal(g.run('JSON.parse(b64ToUtf8(exportSave())).familiars[0].name'),g.run('label'));
});

test('imported label limits count code points without splitting a supplementary character',()=>{
  const g=game();
  const boundary='A'.repeat(39)+'🔥';
  g.run(`G.familiars=[{type:'sprite',rarity:'rare',name:${JSON.stringify(boundary+'suffix')}}];
    const code=exportSave();G.familiars=[];`);
  assert.equal(g.run('importSave(code)'),true,g.run('lastSaveError'));
  assert.equal(g.run('G.familiars[0].name'),boundary);
  assert.equal(g.run('asciiText(G.familiars[0].name)'),boundary);
  assert.equal(g.run('Array.from(G.familiars[0].name).length'),40);
});

test('Unicode saves accept URL-safe Base64, clipboard wrapping and omitted padding together',()=>{
  const g=game();
  g.run(`G.familiars=[{type:'sprite',rarity:'rare',name:'Mýrë 龙 🔥 🚀'}];`);
  const code=g.run('exportSave()');
  const portable=code.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'').match(/.{1,53}/g).join('\r\n\t');
  g.run('G.familiars=[];');
  assert.equal(g.run(`importSave(${JSON.stringify(' \n'+portable+'\n ')})`),true,g.run('lastSaveError'));
  assert.equal(g.run('G.familiars[0].name'),'Mýrë 龙 🔥 🚀');
});

test('older ASCII-only saves remain compatible with byte-for-byte legacy Base64',()=>{
  const g=game();
  g.run(`G.gold=123456;G.familiars=[{type:'sprite',rarity:'common',name:'Legacy Familiar'}];
    const legacy=JSON.parse(b64ToUtf8(exportSave()));legacy.v=26;
    const legacyJSON=JSON.stringify(legacy);const legacyCode=btoa(legacyJSON);G.gold=0;G.familiars=[];`);
  assert.equal(g.run('legacyCode===utf8ToB64(legacyJSON)'),true);
  assert.equal(g.run('importSave(legacyCode)'),true,g.run('lastSaveError'));
  assert.equal(g.run('G.gold'),123456);
  assert.equal(g.run('G.familiars[0].name'),'Legacy Familiar');
});

test('pre-v29 Latin-1 saves retain accented names through the normalized legacy fallback',()=>{
  const g=game();
  g.run(`G.familiars=[{type:'sprite',rarity:'common',name:'Mýrë Café'}];
    const legacy=JSON.parse(b64ToUtf8(exportSave()));legacy.v=28;
    const legacyCode=btoa(JSON.stringify(legacy));G.familiars=[];`);
  const code=g.run('legacyCode').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'').match(/.{1,61}/g).join('\n ');
  assert.equal(g.run(`importSave(${JSON.stringify(code)})`),true,g.run('lastSaveError'));
  assert.equal(g.run('G.familiars[0].name'),'Mýrë Café');
});

test('malformed UTF-8 in current saves is rejected without changing the running character',()=>{
  const g=game();
  g.run(`G.gold=54321;G.familiars=[{type:'sprite',rarity:'common',name:'BROKEN'}];`);
  const data=Buffer.from(g.run('exportSave()'),'base64');
  const offset=data.indexOf(Buffer.from('BROKEN'));
  assert.notEqual(offset,-1);
  g.run('const before=JSON.stringify(G);');
  for(const invalid of [[0xff],[0xc0,0xaf],[0xe2,0x82],[0xed,0xa0,0x80]]){
    const code=Buffer.concat([data.subarray(0,offset),Buffer.from(invalid),data.subarray(offset+6)]).toString('base64');
    assert.throws(()=>g.run(`b64ToUtf8(${JSON.stringify(code)})`),/encoded data|encoding|UTF-8/i);
    assert.equal(g.run(`importSave(${JSON.stringify(code)})`),false);
    assert.equal(g.run('JSON.stringify(G)'),g.run('before'));
    assert.ok(g.run('lastSaveError').length>0);
  }
});

test('display helpers preserve exact visible Unicode and expose controls and lone surrogates',()=>{
  const g=game();
  const visible='Mýrë 龙 e\u0301 👩\u200d🚀 فارسی\u200cنویسی\n\t✦';
  assert.equal(g.run(`asciiText(${JSON.stringify(visible)})`),visible);
  const controls=[0,1,8,11,12,13,31,127,128,159,0x061c,0x200b,0x200e,0x200f,0x202a,0x202b,0x202c,0x202d,0x202e,0x2060,0x2066,0x2067,0x2068,0x2069,0xfeff,0xd800,0xdfff];
  for(const code of controls){
    const label='A'+String.fromCharCode(code)+'龙';
    const expected='A[U+'+code.toString(16).toUpperCase().padStart(4,'0')+']龙';
    assert.equal(g.run(`asciiText(${JSON.stringify(label)})`),expected);
  }
});

test('Unicode labels and logs are escaped before entering HTML',()=>{
  const g=game();
  const text='☾<龍 & "Mýrë">🔥';
  const escaped='☾&lt;龍 &amp; &quot;Mýrë&quot;&gt;🔥';
  assert.equal(g.run(`asciiHTML(${JSON.stringify(text)})`),escaped);
  g.run(`logLine(${JSON.stringify(text)});renderLog();`);
  assert.ok(g.node('log').innerHTML.includes(escaped));
  assert.doesNotMatch(g.node('log').innerHTML,/<龍/);
});
