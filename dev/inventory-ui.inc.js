// Inventory controls remain in the single-file release; no browser persistence.
let _gearSaleDialog=null,_gemDisposalReview=null;
function clearGearSaleDialog(restoreFocus=true,resume=true){
  const sale=_gearSaleDialog;if(!sale)return;
  _gearSaleDialog=null;sale.wrap.remove();
  if(restoreFocus){const target=sale.focusedBefore?.isConnected?sale.focusedBefore:$('btn-bulk-sell');target?.focus({preventScroll:true});}
  if(resume)renderOfflineGains();
}
function openGearSaleModal(itemId){
  clearGearSaleDialog(false,false);
  const item=G.gearInventory.find(i=>i.id===itemId);
  if(!item||Object.values(G.gear).some(i=>i?.id===itemId))return;
  const gems=item.sockets.filter(Boolean).length;
  if(!gems){sellGear(itemId);renderGear();renderTop();return;}
  const wrap=document.createElement('div');wrap.className='modal-bg';
  const card=document.createElement('section');card.className='modal';
  card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Sell socketed gear');
  const heading=document.createElement('h3');heading.textContent='Sell socketed gear';
  const content=document.createElement('p');content.className='sub';
  content.textContent=`${asciiText(gearLabel(item))} | ${fmtG(gearSellPrice(item))} | ${gems} socketed gem${gems===1?'':'s'}. Sell with gems permanently discards those gems for the gear price shown. Retrieve gems and sell returns them to your collection.`;
  const actions=document.createElement('div');actions.className='save-dialog-actions';
  const sale={wrap,focusedBefore:document.activeElement},buttons=[];
  for(const [label,refund] of [['Sell with gems',false],['Retrieve gems and sell',true],['Cancel',null]]){
    const button=document.createElement('button');button.type='button';button.className=refund===false?'act danger':'act';button.textContent=label;
    button.onclick=()=>{
      if(_gearSaleDialog!==sale)return;
      const current=G.gearInventory.find(i=>i.id===itemId);
      if(refund!==null&&current===item&&!Object.values(G.gear).some(i=>i?.id===itemId)){
        sellGear(itemId,refund);renderGear();renderTop();
      }
      clearGearSaleDialog();
    };
    buttons.push(button);actions.appendChild(button);
  }
  wrap.onclick=e=>{if(e.target===wrap)clearGearSaleDialog();};
  wrap.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Escape'){e.preventDefault();clearGearSaleDialog();}
    if(e.key==='Tab'){e.preventDefault();const i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
  });
  card.appendChild(heading);card.appendChild(content);card.appendChild(actions);wrap.appendChild(card);
  _gearSaleDialog=sale;document.body.appendChild(wrap);buttons[1].focus();
}
function renderAutoSellRules(){
  const r=normalizeAutoSell(G.autoSell),ready=r.tiers.length&&r.rarities.length,id=document.activeElement?.id;
  $('auto-sell-status').textContent=r.enabled&&ready?'On':'Off';
  let html='<p class="casting-note">New loot matching a selected tier AND rarity is sold automatically. Equipped gear and crafted uniques are kept; socketed gems return to your collection. Export to keep your rules.</p>';
  for(const [key,values] of [['tiers',[0,1,2,3,4,5]],['rarities',RARITY_ORDER]]){
    html+=`<div class="row"><b class="sub">${key==='tiers'?'Tiers':'Rarities'}</b>`+values.map(v=>`<label class="sub"><input type="checkbox" id="auto-${key}-${v}" data-auto-key="${key}" data-auto-value="${v}" ${r[key].includes(v)?'checked':''}> ${key==='tiers'?'T'+v:RARITIES[v].label}</label>`).join('')+`<button class="act" id="auto-all-${key}" data-auto-all="${key}">${values.every(v=>r[key].includes(v))?'Clear':'All'} ${key}</button></div>`;
  }
  html+=`<label class="sub"><input type="checkbox" id="auto-sell-enabled" ${r.enabled&&ready?'checked':''} ${ready?'':'disabled'}> Enable auto-sell${ready?'':' (choose tiers and rarities first)'}</label>`;
  $('auto-sell-controls').innerHTML=html;
  $('auto-sell-controls').querySelectorAll('[data-auto-key]').forEach(input=>input.onchange=()=>{
    const key=input.dataset.autoKey,v=key==='tiers'?Number(input.dataset.autoValue):input.dataset.autoValue;
    r[key]=input.checked?[...r[key],v]:r[key].filter(x=>x!==v);G.autoSell=normalizeAutoSell(r);
    if(!G.autoSell.tiers.length||!G.autoSell.rarities.length)G.autoSell.enabled=false;
    renderAutoSellRules();
  });
  $('auto-sell-controls').querySelectorAll('[data-auto-all]').forEach(button=>button.onclick=()=>{
    const key=button.dataset.autoAll,values=key==='tiers'?[0,1,2,3,4,5]:RARITY_ORDER;
    r[key]=values.every(v=>r[key].includes(v))?[]:[...values];G.autoSell=normalizeAutoSell(r);
    if(!G.autoSell.tiers.length||!G.autoSell.rarities.length)G.autoSell.enabled=false;
    renderAutoSellRules();
  });
  $('auto-sell-enabled').onchange=e=>{G.autoSell={...r,enabled:e.target.checked&&!!ready};renderAutoSellRules();};
  if(id?.startsWith('auto-'))$(id)?.focus({preventScroll:true});
}
function gemDisposalFilter(){
  const level=$('gem-clean-level').value,keep=$('gem-clean-keep').value;
  return {type:$('gem-clean-type').value,level:level==='all'?'all':Number(level),keep:keep===''?NaN:Number(keep)};
}
function cancelGemDisposal(){_gemDisposalReview=null;renderGemDisposal();}
function renderGemDisposal(){
  const filter=gemDisposalFilter(),mode=$('gem-clean-mode').value,p=_gemDisposalReview||gemDisposalPreview(filter,mode);
  const reward=(_gemDisposalReview?.mode||mode)==='sell'?fmtG(p.gold):`${fmt(p.dust)} dust | ${fmt(p.crystal)} crystal`;
  $('gem-clean-preview').textContent=`${p.count} spare gems | ${reward}`+(_gemDisposalReview?` | ${p.scope}. Confirm to ${p.mode} permanently.`:'');
  $('gem-clean-confirm').textContent=_gemDisposalReview?(_gemDisposalReview.mode==='sell'?'Confirm sale':'Confirm salvage'):'Review gems';
  $('gem-clean-confirm').disabled=!p.count;$('gem-clean-cancel').hidden=!_gemDisposalReview;
  if(!Number.isInteger(filter.keep)||filter.keep<0||filter.keep>999999)$('gem-clean-preview').textContent='Keep must be a whole number from 0 to 999999.';
}
function initInventoryTools(){
  $('gem-clean-type').innerHTML='<option value="all">All types</option>'+GEM_TYPES.map(t=>`<option value="${t.id}">${asciiHTML(t.name)}</option>`).join('');
  $('gem-clean-level').innerHTML='<option value="all">All levels</option>'+[1,2,3,4,5].map(n=>`<option value="${n}">L${n}</option>`).join('');
  for(const id of ['type','level','keep','mode'])$('gem-clean-'+id).onchange=cancelGemDisposal;
  $('gem-clean-keep').oninput=cancelGemDisposal;$('gem-clean-cancel').onclick=cancelGemDisposal;
  $('gem-clean-confirm').onclick=()=>{
    if(_gemDisposalReview){const p=_gemDisposalReview;_gemDisposalReview=null;disposeGems(p.filter,p.mode,p.entries);renderGear();renderTop();return;}
    const filter=gemDisposalFilter(),mode=$('gem-clean-mode').value,p=gemDisposalPreview(filter,mode);if(!p.count)return;
    const scope=['type','level'].map(id=>$('gem-clean-'+id).selectedOptions[0].textContent).join(' / ')+` / Keep ${filter.keep} per type and level`;
    _gemDisposalReview={...p,filter,mode,scope};renderGemDisposal();
  };
  renderAutoSellRules();renderGemDisposal();
}
