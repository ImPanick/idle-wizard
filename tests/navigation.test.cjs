const assert=require('node:assert/strict');
const {test}=require('node:test');
const {game}=require('./game-harness.cjs');

function board(tiles,hero=[2,2],dungeon=false){
  const g=game();
  g.run(`G.zoneIdx=0;G.inDungeon=${dungeon};G.trial.inTrial=false;G.hero.alive=true;G.autoExplore=true;
    G.hero.pos={x:${hero[0]},y:${hero[1]}};G.enemy=null;G.mobs=[];G.chests=[];G.engaged=[];G.opened=[];
    G.map=Array.from({length:MAP_H},()=>Array(MAP_W).fill(curPalette().wall));
    for(const [x,y] of ${JSON.stringify(tiles)})G.map[y][x]=curPalette().ground;
    function mob(id,x,y,isBoss=false){const m={id,x,y,isBoss};G.mobs.push(m);return m;}
    function chest(id,x,y,opened=false){const c={id,x,y,opened};G.chests.push(c);return c;}
    engage=m=>{G.enemy=m;G.engaged.push(m.id);};openChest=c=>{c.opened=true;G.opened.push(c.id);};`);
  return g;
}
const vertical=(x,from,to)=>Array.from({length:to-from+1},(_,i)=>[x,from+i]);
const horizontal=(y,from,to)=>Array.from({length:to-from+1},(_,i)=>[from+i,y]);

test('an unreachable closest monster cannot stall movement toward a reachable alternative',()=>{
  const g=board([...vertical(2,2,6),[4,2]]);g.run('mob("blocked",4,2);mob("reachable",2,6);stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:3});assert.equal(g.run('G.enemy'),null);
  g.run('stepHero();stepHero();');assert.equal(g.run('G.enemy.id'),'reachable');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:5});assert.deepEqual(g.json('G.engaged'),['reachable']);
});

test('the chosen reachable monster uses shortest path distance rather than Manhattan distance',()=>{
  const g=board([...vertical(2,1,5),[3,1],[4,1],[4,2]]);
  g.run('mob("detour",4,2);mob("shorter",2,5);stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:3});
  g.run('stepHero();');assert.equal(g.run('G.enemy.id'),'shorter');
});

test('a reachable dungeon chest takes priority over a closer nonadjacent monster',()=>{
  const g=board([...horizontal(2,2,8),...vertical(2,2,5)],[2,2],true);
  g.run('mob("nearby",2,5);chest("treasure",8,2);stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:3,y:2});assert.equal(g.run('G.enemy'),null);
  g.run('for(let i=0;i<5;i++)stepHero();');assert.deepEqual(g.json('G.opened'),['treasure']);
});

test('world exploration prefers a closer enemy over a farther chest',()=>{
  const g=board([...horizontal(2,2,8),...vertical(2,2,5)]);
  g.run('mob("nearby",2,5);chest("treasure",8,2);stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:3});assert.deepEqual(g.json('G.opened'),[]);
});

test('an unreachable priority chest falls back to a reachable monster instead of stalling',()=>{
  const g=board([...vertical(2,2,6),[4,2]],[2,2],true);
  g.run('chest("blocked",4,2);mob("reachable",2,6);stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:3});
  g.run('stepHero();stepHero();');assert.equal(g.run('G.enemy.id'),'reachable');assert.deepEqual(g.json('G.opened'),[]);
});

test('a chest behind an occupied monster is reached only after fighting the blocking monster',()=>{
  const g=board(horizontal(2,2,8),[2,2],true);
  g.run('mob("guard",4,2);chest("guarded",8,2);stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:3,y:2});assert.equal(g.run('G.enemy.id'),'guard');
  assert.deepEqual(g.json('G.opened'),[]);
  g.run('stepHero();');assert.deepEqual(g.json('G.hero.pos'),{x:3,y:2});
  g.run('G.mobs=[];G.enemy=null;for(let i=0;i<5;i++)stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:8,y:2});assert.deepEqual(g.json('G.opened'),['guarded']);
});

test('a reachable boss can be engaged despite a nearer isolated monster',()=>{
  const g=board([...vertical(2,2,6),[4,2]]);
  g.run('mob("isolated",4,2);mob("boss",2,6,true);G.bossActive=true;for(let i=0;i<3;i++)stepHero();');
  assert.equal(g.run('G.enemy.id'),'boss');assert.equal(g.run('G.enemy.isBoss'),true);
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:5});
});

test('turning auto exploration off stops pathfinding but preserves nearby combat and standing loot',()=>{
  const g=board(vertical(2,2,6));
  g.run('G.autoExplore=false;mob("distant",2,6);let walkCalls=0;const walkable=isWalkable;isWalkable=(x,y)=>{walkCalls++;return walkable(x,y);};stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:2});assert.equal(g.run('walkCalls'),0);assert.equal(g.run('G.enemy'),null);
  g.run('chest("standing",2,2);mob("adjacent",2,3);stepHero();');
  assert.deepEqual(g.json('G.opened'),['standing']);assert.equal(g.run('G.enemy.id'),'adjacent');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:2});
});

test('when every goal is unreachable the hero stays put instead of oscillating into dead ends',()=>{
  const g=board([[2,2],[3,2],[5,2],[7,2]]);
  g.run('mob("isolated",5,2);chest("isolatedChest",7,2);for(let i=0;i<50;i++)stepHero();');
  assert.deepEqual(g.json('G.hero.pos'),{x:2,y:2});assert.equal(g.run('G.enemy'),null);assert.deepEqual(g.json('G.opened'),[]);
});

test('one exploration step uses one bounded map traversal even with many candidate goals',()=>{
  const tiles=[];for(let y=1;y<13;y++)for(let x=1;x<37;x++)tiles.push([x,y]);
  const g=board(tiles);
  g.run(`for(let i=0;i<8;i++){mob('m'+i,10+i,5);chest('c'+i,20+i,9);}
    let walkCalls=0;const walkable=isWalkable;isWalkable=(x,y)=>{walkCalls++;return walkable(x,y);};
    bfsNextStep=()=>{throw Error('One exploration must not repeat per-target BFS.');};stepHero();`);
  assert.ok(g.run('walkCalls')>0);assert.ok(g.run('walkCalls')<=g.run('4*MAP_W*MAP_H'));
  assert.ok(g.run('G.hero.pos.x!==2||G.hero.pos.y!==2'));
});

test('active combat and a dead hero cannot move, collect chests, or start another fight',()=>{
  for(const state of ['G.enemy={id:"current"};','G.hero.alive=false;']){
    const g=board([[2,2],[3,2]]);g.run('mob("nearby",3,2);chest("standing",2,2);'+state+'stepHero();');
    assert.deepEqual(g.json('G.hero.pos'),{x:2,y:2});assert.deepEqual(g.json('G.opened'),[]);assert.deepEqual(g.json('G.engaged'),[]);
  }
});

test('opened chests are ignored and standing loot is collected once before continuing',()=>{
  const g=board([...vertical(2,2,6),[3,2]]);
  g.run('chest("opened",3,2,true);chest("standing",2,2);mob("goal",2,6);stepHero();');
  assert.deepEqual(g.json('G.opened'),['standing']);assert.deepEqual(g.json('G.hero.pos'),{x:2,y:3});
  g.run('stepHero();');assert.deepEqual(g.json('G.opened'),['standing']);
});
