// Investments travel with the player's save code.
function normalizePurchaseRules(raw,state=G){
 const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},out={reserve:0,refinement:null,tempering:null};
 if(r.reserve!==undefined&&(!Number.isFinite(r.reserve)||r.reserve<0||r.reserve>1e100))throw Error('Invalid upgrade gold reserve.');
 out.reserve=r.reserve||0;
 const sp=SPELLS.find(s=>s.id===r.refinement?.id);
 if(sp&&state.knownSpells.includes(sp.id)&&refinementPaths(sp).includes(r.refinement.path))out.refinement={id:sp.id,path:r.refinement.path};
 if(typeof r.tempering==='string'&&[...Object.values(state.gear),...state.gearInventory].some(i=>i?.id===r.tempering))out.tempering=r.tempering;
 return out;
}
function runPurchaseRules(){
 const r=G.purchaseRules;if(!r)return;
 if(r.refinement)purchaseRefinement(r.refinement.id,r.refinement.path,true);
 if(r.tempering){if(!artificerItem(r.tempering))r.tempering=null;else temperGear(r.tempering,true);}
}
function purchaseRuleBoundarySeconds(goldRate=0){
 const r=G.purchaseRules;if(!r||goldRate<=0)return Infinity;
 const candidates=[r.refinement?refinementPreview(r.refinement.id,r.refinement.path):null,r.tempering?temperPreview(r.tempering):null];
 return Math.min(Infinity,...candidates.filter(p=>p?.available).map(p=>Math.max(0,(p.cost+r.reserve-G.gold)/goldRate)));
}
function advanceEconomyTime(seconds,goldRate=0){
 let remaining=seconds;const r=G.purchaseRules,c=commissionState(),reserve=r.reserve,guildReserve=c.rule.reserve;
 const hold=()=>{const owed=Math.max(0,-goldRate*remaining);r.reserve=reserve+owed;c.rule.reserve=guildReserve+owed;};
 try{while(remaining>1e-8){
  hold();
  advanceCommissions(0);runPurchaseRules();
  const dt=Math.min(remaining,Math.max(1e-6,Math.min(commissionBoundarySeconds(goldRate),purchaseRuleBoundarySeconds(goldRate))));
  G.gold=Math.max(0,G.gold+goldRate*dt);remaining-=dt;hold();advanceCommissions(dt,false);
 }}finally{r.reserve=reserve;c.rule.reserve=guildReserve;}
 runPurchaseRules();
}
let _socketExpansionReview=null,_commissionBudgetDraft=false;
function clearEconomyReview(){_socketExpansionReview=null;_commissionBudgetDraft=false;}
function economyOptions(id,entries){
 const el=$(id),before=el.value,signature=JSON.stringify(entries);
 if(el.dataset.choices!==signature){el.innerHTML=entries.map(([value,label])=>`<option value="${value}">${asciiHTML(label)}</option>`).join('');el.dataset.choices=signature;el.value=entries.some(e=>e[0]===before)?before:entries[0]?.[0]||'';}
 return el.value;
}
function renderRefinement(){
 if(!$('refinement-spell'))return;
 const id=economyOptions('refinement-spell',SPELLS.filter(s=>spellUsable(s)&&refinementPaths(s).length).map(s=>[s.id,s.name])),sp=SPELLS.find(s=>s.id===id),rank=G.refinements?.[id];
 const paths=rank?[rank.path]:refinementPaths(sp),path=economyOptions('refinement-path',paths.map(p=>[p,p==='potency'?'Potency (+2% effect / rank)':'Efficiency (-1.5% mana / rank)']));
 const p=refinementPreview(id,path),max=refinementPreview(id,path,true),current=refinedSpell(sp);
 $('refinement-status').textContent=sp?`Rank ${p.from}/10 | current limit ${p.cap} | ${rank?.path==='potency'?'+'+2*p.from+'% potency':rank?.path==='efficiency'?'-'+1.5*p.from+'% mana':'Choose a permanent path'}${current.cost>0?' | '+Number(current.cost.toFixed(2))+' mana':''} | ${p.available?'next '+fmtG(p.cost):'limit reached'}`:'Learn a spell to begin.';
 $('refinement-buy').disabled=!p.affordable;$('refinement-max').disabled=!max.affordable;
 $('refinement-auto').checked=G.purchaseRules.refinement?.id===id&&G.purchaseRules.refinement.path===path;
 $('refinement-auto').disabled=!sp||!paths.length;
 $('upgrade-reserve').value=G.purchaseRules.reserve;
 $('upgrade-targets').textContent=`Automatic targets: ${G.purchaseRules.refinement?SPELLS.find(s=>s.id===G.purchaseRules.refinement.id)?.name+' / '+G.purchaseRules.refinement.path:'no spell'} | ${artificerItem(G.purchaseRules.tempering)?gearLabel(artificerItem(G.purchaseRules.tempering)):'no gear'}.`;
}
function renderArtificer(){
 if(!$('artificer-item'))return;
 const entries=[...Object.values(G.gear).filter(Boolean).map(i=>[i.id,'Equipped: '+gearLabel(i)]),...G.gearInventory.map(i=>[i.id,gearLabel(i)])];
 const id=economyOptions('artificer-item',entries),item=artificerItem(id),p=temperPreview(id),max=temperPreview(id,true),s=socketExpansionPreview(id);
 $('artificer-status').textContent=item?`Temper +${p.from}/10 | current limit ${p.cap} | ${p.available?'next '+fmtG(p.nextCost):'limit reached'} | gold reserve ${fmtG(G.purchaseRules.reserve)}`:'Equip or find a piece of gear to begin.';
 $('artificer-stats').textContent=item?statsLine(temperedGearStats(item)):'';
 $('temper-buy').disabled=!p.affordable;$('temper-max').disabled=!max.affordable;
 $('temper-auto').checked=G.purchaseRules.tempering===id;$('temper-auto').disabled=!item;
 $('artificer-reserve').value=G.purchaseRules.reserve;
 const review=_socketExpansionReview;
 if(review&&(review.item!==item||review.count!==s.count||review.cost!==s.cost))clearEconomyReview();
 $('socket-expansion-status').textContent=item?`${s.count}/8 sockets | ${s.addedSockets}/3 purchased | ${s.available?'add one for '+fmtG(s.cost):'expansion limit reached'}. Existing gems stay socketed.`:'';
 $('socket-expand').textContent=_socketExpansionReview?'Confirm socket purchase':'Review extra socket';
 $('socket-expand').disabled=!s.affordable;$('socket-expand-cancel').hidden=!_socketExpansionReview;
}
function renderCommissions(){
 if(!$('commission-recipe'))return;
 const c=commissionState(),id=economyOptions('commission-recipe',Object.entries(COMMISSION_RECIPES).filter(([,r])=>G.unlocked>=r.gate).map(([k,r])=>[k,r.name])),r=COMMISSION_RECIPES[id];
 $('commission-offer').textContent=r?`${r.amount} ${id} | ${fmtG(r.cost)} prepaid | ${fmtTime(r.seconds)} game time. Further shipments unlock as dragons fall.`:'';
 $('commission-buy').disabled=!commissionPreview(id).count;$('commission-max').disabled=!commissionPreview(id,true).count;
 $('commission-queue').textContent=c.queue.length?c.queue.map((o,n)=>`${n===0?'In transit':'Queued'}: ${COMMISSION_RECIPES[o.recipe].name} (${fmtTime(o.timeLeft)})`).join(' | '):'No shipments in transit. Three order slots; delivery is automatic.';
 economyOptions('commission-repeat-recipe',Object.entries(COMMISSION_RECIPES).filter(([,p])=>G.unlocked>=p.gate).map(([k,p])=>[k,p.name]));
 if(Object.hasOwn(COMMISSION_RECIPES,c.rule.recipe)&&G.unlocked>=COMMISSION_RECIPES[c.rule.recipe].gate)$('commission-repeat-recipe').value=c.rule.recipe;
 $('commission-auto').checked=c.rule.enabled;$('commission-reserve').value=c.rule.reserve;if(!_commissionBudgetDraft)$('commission-budget').value=c.rule.budget;
 $('commission-spent').textContent=`Spent ${fmtG(c.rule.spent)} of ${fmtG(c.rule.budget)}. Apply a new budget to reset this allowance. Repeat orders use their own reserve and are funded before automatic upgrades.`;
}
function renderEconomyTools(){
 if(activeTab==='spells')renderRefinement();
 if(activeTab==='gear'&&$('artificer-panel')?.open)renderArtificer();
 if(activeTab==='manor')renderCommissions();
}
function initEconomyTools(){
 const refresh=()=>{renderEconomyTools();renderTop();renderHero();};
 const action=fn=>()=>{settleClockForAction();fn();refresh();};
 for(const id of ['refinement-spell','refinement-path'])$(id).onchange=renderRefinement;
 $('refinement-buy').onclick=action(()=>purchaseRefinement($('refinement-spell').value,$('refinement-path').value));
 $('refinement-max').onclick=action(()=>purchaseRefinement($('refinement-spell').value,$('refinement-path').value,true));
 $('refinement-auto').onchange=action(()=>{G.purchaseRules.refinement=$('refinement-auto').checked?{id:$('refinement-spell').value,path:$('refinement-path').value}:null;runPurchaseRules();});
 $('upgrade-reserve').onchange=action(()=>{const n=Number($('upgrade-reserve').value);if(Number.isFinite(n)&&n>=0&&n<=1e100)G.purchaseRules.reserve=n;});
 $('artificer-reserve').onchange=action(()=>{const n=Number($('artificer-reserve').value);if(Number.isFinite(n)&&n>=0&&n<=1e100)G.purchaseRules.reserve=n;});
 $('artificer-panel').ontoggle=()=>{if($('artificer-panel').open)renderArtificer();};
 $('pane-gear').addEventListener('click',event=>{const id=event.target.closest('[data-improve-id]')?.dataset.improveId;if(id&&artificerItem(id)){clearEconomyReview();$('artificer-panel').open=true;renderArtificer();$('artificer-item').value=id;renderArtificer();$('artificer-panel').scrollIntoView({block:'nearest'});$('artificer-item').focus();}});
 $('artificer-item').onchange=()=>{clearEconomyReview();renderArtificer();};
 $('temper-buy').onclick=action(()=>{temperGear($('artificer-item').value);renderGear();});
 $('temper-max').onclick=action(()=>{temperGear($('artificer-item').value,true);renderGear();});
 $('temper-auto').onchange=action(()=>{G.purchaseRules.tempering=$('temper-auto').checked?$('artificer-item').value:null;runPurchaseRules();renderGear();});
 $('socket-expand-cancel').onclick=()=>{clearEconomyReview();renderArtificer();};
 $('socket-expand').onclick=action(()=>{
  const item=artificerItem($('artificer-item').value),p=socketExpansionPreview(item?.id),r=_socketExpansionReview;
  if(r&&r.item===item&&r.cost===p.cost&&r.count===p.count){addGearSocket(item.id);clearEconomyReview();renderGear();}
  else if(item&&p.affordable)_socketExpansionReview={item,cost:p.cost,count:p.count};
 });
 $('commission-buy').onclick=action(()=>buyCommission($('commission-recipe').value));
 $('commission-recipe').onchange=renderCommissions;
 $('commission-max').onclick=action(()=>buyCommission($('commission-recipe').value,true));
 for(const id of ['commission-auto','commission-repeat-recipe','commission-reserve'])$(id).onchange=action(()=>{setCommissionRule({enabled:$('commission-auto').checked,recipe:$('commission-repeat-recipe').value,reserve:Number($('commission-reserve').value)});advanceCommissions(0);});
 $('commission-budget').oninput=()=>{_commissionBudgetDraft=true;};
 $('commission-apply-budget').onclick=action(()=>{if(setCommissionRule({enabled:$('commission-auto').checked,recipe:$('commission-repeat-recipe').value,reserve:Number($('commission-reserve').value),budget:Number($('commission-budget').value)}))_commissionBudgetDraft=false;advanceCommissions(0);});
}
