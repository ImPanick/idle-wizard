function stepHero(){
  if(!G.hero.alive||G.enemy)return;
  const pos=G.hero.pos,standing=G.chests.find(c=>!c.opened&&c.x===pos.x&&c.y===pos.y);
  if(standing)openChest(standing);
  const adjacent=G.mobs.find(m=>Math.abs(m.x-pos.x)+Math.abs(m.y-pos.y)<=1);
  if(adjacent){engage(adjacent);return;}
  if(!G.autoExplore)return;
  if(!G.mobs.length&&!G.chests.some(c=>!c.opened))return;
  const key=(x,y)=>y*MAP_W+x,start=key(pos.x,pos.y),size=MAP_W*MAP_H;
  const occupied=new Set(G.mobs.map(m=>key(m.x,m.y))),distance=new Int16Array(size),first=new Int16Array(size);
  distance.fill(-1);first.fill(-1);distance[start]=0;
  const queue=[start];
  for(let head=0;head<queue.length;head++){
    const k=queue[head],x=k%MAP_W,y=Math.floor(k/MAP_W);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,n=key(nx,ny);
      if(!isWalkable(nx,ny)||distance[n]>=0)continue;
      distance[n]=distance[k]+1;first[n]=k===start?n:first[k];
      if(!occupied.has(n))queue.push(n);
    }
  }
  const nearest=(items,chests=false)=>{
    let best=null,d=Infinity;
    for(const item of items){
      const k=key(item.x,item.y),path=distance[k];
      if(path>=0&&path<d&&(!chests||!item.opened&&!occupied.has(k))){best=item;d=path;}
    }
    return {item:best,d};
  };
  const mob=nearest(G.mobs),chest=nearest(G.chests,true);
  const target=chest.item&&(G.inDungeon||chest.d<mob.d)?chest.item:mob.item;
  if(!target)return;
  const next=first[key(target.x,target.y)];if(next<0||occupied.has(next))return;
  pos.x=next%MAP_W;pos.y=Math.floor(next/MAP_W);
  const threat=G.mobs.find(m=>Math.abs(m.x-pos.x)+Math.abs(m.y-pos.y)===1);
  if(threat){engage(threat);return;}
  const onChest=G.chests.find(c=>!c.opened&&c.x===pos.x&&c.y===pos.y);
  if(onChest)openChest(onChest);
}
