// Spare gems: reserves apply to each loose type + level stack; sockets are untouched.
function gemDisposalTotals(entries,mode){
  const result={entries,count:0,gold:0,dust:0,crystal:0};
  for(const e of entries){
    const level=Number(e.id.slice(-1)),scale=2**(level-1);
    result.count+=e.count;
    if(mode==='sell')result.gold+=e.count*25*scale;
    else{result.dust+=e.count*2*scale;if(level>=3)result.crystal+=e.count*2**(level-3);}
  }
  return result;
}
function gemDisposalPreview(f,mode){
  if(!f||!(f.type==='all'||GEM_TYPES.some(t=>t.id===f.type))
    ||!(f.level==='all'||Number.isInteger(f.level)&&f.level>=1&&f.level<=5)
    ||!Number.isInteger(f.keep)||f.keep<0||f.keep>999999||!['sell','salvage'].includes(mode))
    return {entries:[],count:0,gold:0,dust:0,crystal:0};
  const entries=[];
  for(const t of GEM_TYPES)if(f.type==='all'||f.type===t.id)for(let level=1;level<=5;level++)if(f.level==='all'||f.level===level){
    const id=gemId(t.id,level),count=G.gemInventory[id];
    if(Number.isSafeInteger(count)&&count>f.keep)entries.push({id,count:count-f.keep});
  }
  return gemDisposalTotals(entries,mode);
}
function disposeGems(f,mode,reviewedEntries=null){
  let entries=gemDisposalPreview(f,mode).entries;
  if(reviewedEntries!==null){
    const reviewed=new Map();
    if(Array.isArray(reviewedEntries))for(const e of reviewedEntries)
      if(e&&typeof e.id==='string'&&Number.isSafeInteger(e.count)&&e.count>0)
        reviewed.set(e.id,Math.max(reviewed.get(e.id)||0,e.count));
    entries=entries.map(e=>({id:e.id,count:Math.min(e.count,reviewed.get(e.id)||0)})).filter(e=>e.count>0);
  }
  const {count,gold,dust,crystal}=gemDisposalTotals(entries,mode),result={count,gold,dust,crystal};
  if(!count)return result;
  for(const e of entries){G.gemInventory[e.id]-=e.count;if(!G.gemInventory[e.id])delete G.gemInventory[e.id];}
  if(gold)earnGold(gold);
  G.materials.dust+=dust;G.materials.crystal+=crystal;
  logLine(mode==='sell'?`Sold ${count} loose gems for ${fmtG(gold)}.`:`Salvaged ${count} loose gems: +${fmt(dust)} dust, +${fmt(crystal)} crystal.`,'sys');
  return result;
}
