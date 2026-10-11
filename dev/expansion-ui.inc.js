// Expansion presentation. Inlined before init; illustrations use plain ASCII.
function uiVisibleSchools(){return typeof visibleSchools==='function'?visibleSchools():ELEMENTS.filter(e=>e!=='arcane'||isArcaneUnlocked());}
function uiSchoolUnlocked(id){return uiVisibleSchools().includes(id);}
function uiSpellUsable(sp){return !!sp&&uiSchoolUnlocked(sp.element)&&G.knownSpells.includes(sp.id);}
function uiFilteredSchools(){const selected=G.ui?.spellSchool;return selected&&uiSchoolUnlocked(selected)?[selected]:uiVisibleSchools();}
function uiFocusControl(root,selector){const next=root.querySelector(selector);if(next&&!next.disabled)next.focus({preventScroll:true});}
let _expansionDrafts={magic:null,expeditions:null,thresholds:{},market:null};
function resetExpansionDrafts(){_expansionDrafts={magic:G.magic,expeditions:G.expeditions,thresholds:{},market:null};}
function uiExpansionDrafts(){
  if(_expansionDrafts.magic!==G.magic){_expansionDrafts.magic=G.magic;_expansionDrafts.thresholds={};}
  if(_expansionDrafts.expeditions!==G.expeditions){_expansionDrafts.expeditions=G.expeditions;_expansionDrafts.market=null;}
  return _expansionDrafts;
}
function uiCommitCastThreshold(id,value){
  if(String(value).trim()===''||!Number.isFinite(Number(value)))return false;
  const threshold=Math.max(0.1,Math.min(0.95,Number(value)/100));
  setSpellRule(id,G.magic?.rules?.[id]?.condition||'useful',threshold);
  if(G.magic?.rules?.[id]?.threshold!==threshold)return false;
  delete uiExpansionDrafts().thresholds[id];return true;
}
function uiCastingRuleHTML(sp){
  if(typeof spellRuleOptions!=='function')return '';
  const options=spellRuleOptions(sp),rule=G.magic?.rules?.[sp.id]||{condition:'useful',threshold:0.6};
  const reason=typeof spellWaitReason==='function'?spellWaitReason(sp):'';
  const wait=reason==='Ready'?'':reason;
  const threshold=uiExpansionDrafts().thresholds[sp.id]??Math.round((rule.threshold||0.6)*100);
  return `<span class="casting-rule"><label for="rule-${sp.id}">Cast</label><select id="rule-${sp.id}" data-cast-rule="${sp.id}">${options.map(o=>`<option value="${o.id}" ${rule.condition===o.id?'selected':''}>${asciiHTML(o.label)}</option>`).join('')}</select>${['hp','mana'].includes(rule.condition)?`<label for="threshold-${sp.id}">below</label><input id="threshold-${sp.id}" data-cast-threshold="${sp.id}" type="number" min="10" max="95" step="5" value="${asciiHTML(threshold)}" aria-label="${asciiHTML(sp.name)} threshold percent"><span>%</span>`:''}</span>${wait?`<span class="cast-wait">Waiting: ${asciiHTML(wait)}</span>`:''}`;
}
function bindCastingRules(){
  $('spell-slots').querySelectorAll('[data-cast-rule]').forEach(select=>{select.onchange=()=>{const id=select.dataset.castRule;setSpellRule(id,select.value,G.magic?.rules?.[id]?.threshold||0.6);renderSpellSlots();uiFocusControl($('spell-slots'),'[data-cast-rule="'+id+'"]');};});
  $('spell-slots').querySelectorAll('[data-cast-threshold]').forEach(input=>{
    input.oninput=()=>{uiExpansionDrafts().thresholds[input.dataset.castThreshold]=input.value;};
    input.onchange=()=>{const id=input.dataset.castThreshold;if(uiCommitCastThreshold(id,input.value)){renderSpellSlots();uiFocusControl($('spell-slots'),'[data-cast-threshold="'+id+'"]');}};
  });
}
function renderSpellFilters(){
  const root=$('spell-filters');if(!root)return;
  const schools=uiVisibleSchools();
  const selected=schools.includes(G.ui?.spellSchool)?G.ui.spellSchool:'all';
  root.innerHTML=`<div class="spell-filter"><label for="known-school-filter">School</label><select id="known-school-filter"><option value="all">All discovered schools</option>${schools.map(e=>`<option value="${e}" ${selected===e?'selected':''}>${asciiHTML(EL_INFO[e].name)}</option>`).join('')}</select><span class="sub">${G.knownSpells.filter(id=>uiSpellUsable(SPELLS.find(s=>s.id===id))).length} learned</span></div>`;
  const select=root.querySelector('select');if(select)select.onchange=()=>{G.ui=G.ui||{};G.ui.spellSchool=select.value;renderKnownSpells();};
}
function renderSpellPresets(){
  const root=$('spell-presets');if(!root||!G.magic)return;
  const names={clearing:'Clearing',boss:'Boss',safe:'Safe'};
  root.innerHTML=`<div class="preset-box"><p>Save builds for clearing, bosses, and survival. Automatic switching applies when an encounter starts.</p><p>On expeditions, an HP or mana threshold opens that spell for the rest of the encounter.</p><div class="preset-rows">${Object.entries(names).map(([key,name])=>{
    const preset=G.magic.presets?.[key];
    const count=(preset?.spells||[]).filter(id=>uiSpellUsable(SPELLS.find(s=>s.id===id))).length;
    return `<div class="preset-row"><strong>${name}</strong><div class="row"><button class="act" data-preset-use="${key}" ${count?'':'disabled'}>Use</button><button class="act" data-preset-save="${key}">Save</button></div><small>${count?count+' spells stored':'Save your current priority'}</small></div>`;
  }).join('')}</div><div class="assignment-controls"><label for="auto-spell-preset">Automatic switch</label><select id="auto-spell-preset"><option value="off">Keep current build</option><option value="boss-safe" ${G.magic.autoPreset==='boss-safe'?'selected':''}>Boss for bosses, Safe when hurt, Clearing otherwise</option></select></div></div>`;
  root.querySelectorAll('[data-preset-use]').forEach(b=>{b.onclick=()=>{const key=b.dataset.presetUse;applySpellPreset(key);renderSpellbook();renderHero();uiFocusControl(root,'[data-preset-use="'+key+'"]');};});
  root.querySelectorAll('[data-preset-save]').forEach(b=>{b.onclick=()=>{const key=b.dataset.presetSave;saveSpellPreset(key);renderSpellPresets();uiFocusControl(root,'[data-preset-save="'+key+'"]');};});
  const mode=root.querySelector('select');if(mode)mode.onchange=()=>{if(typeof setAutoSpellPreset==='function')setAutoSpellPreset(mode.value);else G.magic.autoPreset=mode.value;};
}
function renderMagicState(){
  const root=$('magic-state');if(!root)return;
  const m=G.magic;if(!m){root.innerHTML='';return;}
  const rows=[],notes=m.notes||[];
  if(notes.length&&uiSchoolUnlocked('resonance'))rows.push('Score: '+notes.map(n=>EL_INFO[n.el]?.name||'Staff').join(' / '));
  const seeds=G.enemy?.magic?.seeds||[];
  if(seeds.length&&uiSchoolUnlocked('nature'))rows.push('Seeds: '+seeds.length+' ('+seeds.filter(s=>(typeof s==='number'?s:s.remaining||0)<=0).length+' mature)');
  if(m.forge?.charges)rows.push('Spellforge: '+m.forge.charges+' charges');
  const summons=Object.keys(m.summons||{}).filter(key=>m.summons[key]);
  if(summons.length)rows.push('Summons: '+summons.join(', '));
  if(m.comets?.remaining>0&&uiSchoolUnlocked('cosmic'))rows.push('Comets: '+m.comets.remaining.toFixed(1)+'s');
  const debt=(m.deferred||[]).reduce((sum,d)=>sum+(d.amount||0),0);
  if(debt>0)rows.push('Deferred damage: '+fmt(Math.ceil(debt)));
  if(m.chaos&&uiSchoolUnlocked('chaos'))rows.push('Next Chaos: '+(typeof chaosNext==='function'?chaosNext():'saved outcome')+' / prefer '+asciiText(m.chaos.preference||'soaked'));
  root.innerHTML=rows.map(text=>'<span>'+asciiHTML(text)+'</span>').join('');
  if(uiSchoolUnlocked('chaos')){
    root.innerHTML+=`<label class="casting-rule" for="chaos-preference">Chaos preference <select id="chaos-preference">${['burning','chilled','soaked'].map(value=>`<option value="${value}" ${m.chaos.preference===value?'selected':''}>${value}</option>`).join('')}</select></label>`;
    const select=root.querySelector('select');if(select)select.onchange=()=>{setChaosPreference(select.value);renderMagicState();};
  }
}
const ENCOUNTER_PORTRAITS=Object.fromEntries(Object.entries({
wizard:String.raw`          /\
      .  /::\    *
        /.*::\
       /:..*::\
      /________\
         (o_o)      .
        /| - |\   _/
   ____/ | : | \_/
  /__/   | : |   \__
     \   |___|   /
      \_/|   |\_/
        /|___|\
       /_/   \_\
     .   . @ .   .`,
drake:String.raw`    /\               /\
   /  \     __      /  \
  / /\ \___/o \____/ /\ \
 / /  \___  __   ___/  \ \
/_/       \ \__)/       \_\
     __   /  __\   __
    /  \_/  /  \\_/  \
   /____   / /\  ____/
     __/  / /  \ \__
    /___ /_/    \___\
         \  \__/
   .  .   \___/   .  .`,
wisp:String.raw`     .        *      .
        .-~~~~~-.
    .-~~  .   .  ~~-.
   / .   /\___/\   . \
   ~     ( o o )     ~
    ~.    \_^_/    .~
      ~-.  | | .-~
    .   /  | |  \   .
       / ./   \. \
      ~ /  | |  \ ~
    *  ~   | |   ~
         .  ~   .`,
slime:String.raw`           .     o
        .-~~~~~-.
      .~  .      ~.
     / .   ____    \
    /     (o  o) .  \
   |  .     __       |
   |      .____.  .  |
  /|   o          .  |\
 / |      .    o     | \
/__|__..________..___|__\
    ~  ~ . ~ .  ~  ~
       .       .`,
spider:String.raw`    \   \           /   /
     \   \ .-----. /   /
  ____\___\|o o o|/___/____
 /         | o o |         \
/   ______/|\_v_/|\______   \
   /      /|:::::|\      \
  /      /  \___/  \      \
 /      /   / | \   \      \
       /   /  |  \   \
      /   /   |   \   \
         . .  .  . .`,
knight:String.raw`         .-===-.
         |.-.-.|
         ||_ _||
         |\_^_/|       /
      ___|=====|___   /
     /[] /| + |\ []\ /
    | __/ |___| \__ |\
    | |   /===\   | | \
    |_|  |:[ ]:|  |_|
     /   |__|__|   \
         / / \ \
        /_/   \_\ `,
beast:String.raw`     /\          /\
    /  \________/  \
    |  /\      /\  |
    |  >o<    >o<  |
    \    \_  _/    /
     \__  _\/_  __/
        \______/
   ____/  : :   \____
  /   /   : :    \   \
 /___/___/   \____\___\
    /_/         \_\
      .   .   .`,
boar:String.raw`      /\    ____    /\
     /  \__/####\__/  \
    /  __  /##\  __   \
   |  /o \      / o\  |
   |  \__/ .--. \__/  |
  /|  /\  (o  o)  /\  |\
 / |  \ \__\__/__/ /  | \
/__|   \___|__|___/   |__\
   |    /########\    |
   |___/##/    \##\___|
     /__/      \__\ `,
elder:String.raw`     . * .     . * .
         .-===-.
     ___/ .   . \___
    /  /\   o   /\  \
   /__/  \_____/  \__\
 __/ /\ | /___\ | /\ \__
/___/  \|   |   |/  \___\
     ___|  (o)  |___
    /   |-------|   \
   / /\ | /|||\ | /\ \
  / /  \|/ ||| \|/  \ \
 /_/    /__|||__\    \_\
    .  .   |   .  .`,
eye:String.raw`      .  \  |  /  .
    .    .-----.
  .   .-'       '-.   .
     /  .-------.  \
    |  /  .---.  \  |
    | |  / .-. \  | |
    | | | ( @ ) | | |
    | |  \ '-' /  | |
    |  \  '---'  /  |
     \  '-------'  /
  .   '-._____.-'   .
      /  | |  \
    ~    | |    ~
         . .`,
serpent:String.raw`       __/\_/\__
      /  /o o\  \
      \  \_V_/  /
       \_______/
        /:::::\
    ___/:::|:::\___
   /   \:::|:::/   \
  /     \__|__/     \
 | .----/:::::\----. |
 | |   /:::::::\   | |
  \ '-------------' /
   '---._______ .--'
     ~   ~  ~   ~`,
pixie:String.raw`      .      *      .
   .-._      /\    _.-.
  /    \    /__\  /    \
 | .-.  \  (o o) /  .-. |
  \___\  \ /|=|\ /  /___/
       \__\/| |\/__/
    ___/   /| |\   \___
   / .    / | | \    . \
   \_____/  |_|  \_____/
         .  /\  .
           /__\
      *     .     *`,
harpy:String.raw`    /\        /\        /\
   /  \      /__\      /  \
  / /\ \    /o o \    / /\ \
 / /  \ \___\_v_/___/ /  \ \
/_/    \____/|||\____/    \_\
        /  /|||||\  \
       /__/ ||||| \__\
           /|||\
          /_|||_\
            | |
           _| |_
          /_V V_\
      .     .     .`,
clock:String.raw`         .-===-.
      __/ .---. \__
     /  .' XII '.  \
    |  /   |     \  |
    | | IX +--III | |
    |  \   VI    /  |
     \  '.___.'   /
      '---|||---'
     /  __|||__  \
    /__/  |||  \__\
          (o)
         / | \
      __/  |  \__
      .    .    .`
}).map(([id,art])=>[id,art.split('\n')]));
let _sceneArtKey='';
function renderEncounterScene(){
  const root=$('encounter-stage');if(!root)return;
  const assignment=G.expeditions?.active;
  const region=assignment?uiExpeditionRegions().find(r=>r.id===assignment.id):null;
  const showMap=G.ui?.worldView==='map'&&!assignment;
  root.hidden=showMap;$('world-map-stage').hidden=!showMap;$('world-map-key').hidden=!showMap;
  $('btn-scene').classList.toggle('on',!showMap);$('btn-scene').setAttribute('aria-pressed',String(!showMap));
  $('btn-map').classList.toggle('on',showMap);$('btn-map').setAttribute('aria-pressed',String(showMap));
  $('btn-map').disabled=!!assignment;
  if(region){
    const key='expedition:'+region.id;
    if(key!==_sceneArtKey){_sceneArtKey=key;$('encounter-art').textContent=region.portrait||'   . . @ . .   ';}
    $('scene-title').textContent=asciiText(assignment.phaseName||region.name);
    $('scene-enemy-bar').hidden=!(typeof expeditionFighting==='function'?expeditionFighting(assignment):assignment.stage==='fight');
    $('scene-enemy-fill').style.width=Math.max(0,(assignment.enemyHp||0)/Math.max(1,assignment.enemyMaxHp||1)*100)+'%';
    $('scene-enemy-hp').textContent='Encounter '+fmt(Math.ceil(assignment.enemyHp||0))+' / '+fmt(Math.ceil(assignment.enemyMaxHp||0));
    $('scene-hero-fill').style.width=Math.max(0,G.hero.hp/G.hero.maxHp*100)+'%';
    $('scene-hero-hp').textContent='Wizard '+fmt(Math.ceil(G.hero.hp))+' / '+fmt(G.hero.maxHp)+' HP';
    $('scene-caption').textContent=asciiText(region.policyLabels?.[assignment.policy]||assignment.policy)+' policy / '+Math.ceil((assignment.remainingMs||0)/1000)+'s to next phase / rewards collect automatically.';
    return;
  }
  const e=G.enemy,name=e?.ref?.name||'',key=!e?'wizard':e.isBoss?(name.match(/Drake|Wyrm/)?'drake':'elder'):name.match(/Eye/)?'eye':name.match(/Naga|Mer|Eel|Salamander/)?'serpent':name.match(/Pixie|Sprite/)?'pixie':name.match(/Harpy|Roc/)?'harpy':name.match(/Chrono|Time|Hour/)?'clock':name.match(/Boar/)?'boar':name.match(/Slime|Blob/)?'slime':name.match(/Spider/)?'spider':name.match(/Knight|Golem|Guard|Construct/)?'knight':name.match(/Horror|Old One|Elder|Fiend|Voidpriest/)?'elder':name.match(/Wisp|Wraith|Spirit|Specter|Nebula/)?'wisp':'beast';
  if(key!==_sceneArtKey){_sceneArtKey=key;$('encounter-art').textContent=ENCOUNTER_PORTRAITS[key].join('\n');}
  $('scene-title').textContent=e?asciiText(name)+(e.isBoss?' / BOSS':''):'Your wizard / '+ZONES[G.zoneIdx].name;
  $('scene-enemy-bar').hidden=!e;
  if(e){$('scene-enemy-fill').style.width=Math.max(0,e.hp/e.maxHp*100)+'%';$('scene-enemy-hp').textContent='Target '+fmt(Math.ceil(Math.max(0,e.hp)))+' / '+fmt(e.maxHp)+' HP';}
  const h=G.hero;$('scene-hero-fill').style.width=Math.max(0,h.hp/h.maxHp*100)+'%';$('scene-hero-hp').textContent=h.alive?'Wizard '+fmt(Math.ceil(h.hp))+' / '+fmt(h.maxHp)+' HP':'Recovering / '+Math.ceil(h.respawnIn)+'s';
  $('scene-caption').textContent=!h.alive?'Your wizard will recover and continue automatically.':e?'Spells follow your casting priority. Staff attacks fill the gaps.':G.autoExplore?'Following the path / looking for the next encounter.':'Exploration paused / movement keys still work.';
}
function uiExpeditionRegions(){return typeof EXPEDITION_REGIONS==='undefined'?[]:EXPEDITION_REGIONS.filter(r=>(G.awakenCount||0)>=(r.awakening||0));}
function renderExpeditionAssignment(){
  const state=G.expeditions,active=state?.active;
  const regions=uiExpeditionRegions(),region=regions.find(r=>r.id===active?.id);
  if(active&&region){
    const hp=Math.max(0,Number(active.enemyHp)||0),max=Math.max(1,Number(active.enemyMaxHp)||1),remaining=(active.remainingMs||0)/1000;
    const fighting=typeof expeditionFighting==='function'?expeditionFighting(active):active.stage==='fight';
    const pct=fighting?hp/max*100:100*(1-(active.remainingMs||0)/Math.max(1,active.totalMs||1));
    const progress=fighting?'Target '+fmt(Math.ceil(hp))+' / '+fmt(Math.ceil(max))+' HP':(active.stage==='recover'?'Recovery':'Route')+' '+Math.max(0,Math.round(pct))+'%';
    $('crusade-status').innerHTML=`<div class="assignment-head"><strong class="assignment-title">${asciiHTML(region.name)}</strong><span class="sub">Circuit ${(active.circuit||0)+1}</span></div><pre class="expedition-art" aria-label="ASCII destination illustration">${asciiHTML(region.portrait||'   . . @ . .   ')}</pre><div class="expedition-progress"><strong>${asciiHTML(active.phaseName||region.encounters?.[active.phase]?.name||region.boss?.name||'Following the route')}</strong><div class="bar"><span style="width:${Math.max(0,Math.min(100,pct))}%;background:var(--mob)"></span><div class="txt">${asciiHTML(progress)}</div></div><span class="sub">${Math.max(0,Math.ceil(remaining))}s to the next phase | ${asciiHTML(region.policyLabels?.[active.policy]||active.policy)}${active.nextPolicy?' | Next: '+asciiHTML(region.policyLabels?.[active.nextPolicy]||active.nextPolicy):''}</span></div><div class="assignment-controls"><label for="expedition-policy">Standing policy</label><select id="expedition-policy">${region.policies.map(p=>`<option value="${p}" ${(active.nextPolicy||active.policy)===p?'selected':''}>${asciiHTML(region.policyLabels?.[p]||p)}</option>`).join('')}</select><label class="repeat-label"><input type="checkbox" id="expedition-repeat" ${active.repeat?'checked':''}>Repeat circuits automatically</label><button class="act" id="expedition-return">Return to World</button></div><p class="expedition-note">Rewards collect automatically. Policy changes start at the next encounter. Current circuit ends when you return to World.</p>`;
    if(active.stage==='fight'&&!active.bossStep&&active.sealedCategory){const detail=$('crusade-status').querySelector('.expedition-progress');if(detail)detail.insertAdjacentHTML('beforeend','<span class="sub">Temporarily sealed: '+asciiHTML(active.sealedCategory)+' spells. Staff attacks remain available.</span>');}
    const policy=$('crusade-status').querySelector('select');if(policy)policy.onchange=()=>{setExpeditionPolicy(policy.value);renderCrusade();uiFocusControl($('crusade-status'),'select');};
    const repeat=$('crusade-status').querySelector('input');if(repeat)repeat.onchange=()=>setExpeditionRepeat(repeat.checked);
    const stop=$('crusade-status').querySelector('#expedition-return');if(stop)stop.onclick=()=>{stopExpedition();renderAll();};
  }else{
    $('crusade-status').innerHTML=`<div class="assignment-head"><strong class="assignment-title">${G.trial?.inTrial?'Pinnacle Trials':'World / '+asciiHTML(ZONES[G.zoneIdx].name)}</strong><span class="sub">Current assignment</span></div><p class="expedition-note">Choose a charted destination below. The wizard follows every encounter and collects rewards automatically.</p>`;
  }
  const legacy=state?.legacyClaim||G.crusade?.active;
  $('crusade-options').innerHTML=legacy?'<p class="expedition-note">Your earlier Crusade will pay its promised reward automatically when its original timer completes.</p>':'';
  $('expedition-regions').innerHTML=regions.map(r=>{
    const unlocked=typeof regionUnlocked==='function'&&regionUnlocked(r.id),record=state?.records?.[r.id];
    const running=active?.id===r.id;
    return `<article class="expedition-card"><div class="row"><div><h3>${asciiHTML(r.name)}</h3><span class="sub">${running?'CURRENT ASSIGNMENT':unlocked?'Charted / suggested level '+r.level:'Entry / '+asciiHTML(r.gateLabel||('Defeat '+(r.gateBossName||r.gateBoss||'the guardian')))}</span></div><span class="spacer"></span><button class="act" data-expedition-start="${r.id}" ${unlocked&&!running?'':'disabled'}>${running?'Running':unlocked?'Explore':'Uncharted'}</button></div><p>${asciiHTML(r.desc||r.encounters?.[0]?.desc||'Set a standing policy and discover what this place remembers.')}</p><p>Policies: ${r.policies.map(p=>asciiHTML(r.policyLabels?.[p]||p)).join(' / ')}${record?.circuits?' | '+record.circuits+' circuits complete':''}</p></article>`;
  }).join('')||'<p class="expedition-note">Explore the world and defeat its dragons to chart your first destination.</p>';
  $('expedition-regions').querySelectorAll('[data-expedition-start]').forEach(b=>{b.onclick=()=>{startExpedition(b.dataset.expeditionStart,'balanced',true);renderAll();};});
}
function renderExpeditionJournal(){
  const state=G.expeditions||{},regions=uiExpeditionRegions();
  const entries=(typeof expeditionJournal==='function'?expeditionJournal():[]).filter(entry=>{
    const region=typeof expeditionRegion==='function'?expeditionRegion(entry.id):null;
    if(entry.id==='sighting'&&((G.awakenCount||0)<4||!state.discoveries?.observatory||!state.discoveries?.atlas))return false;
    return !region||regions.some(r=>r.id===region.id);
  });
  $('expedition-journal').innerHTML=entries.map(entry=>`<article class="journal-entry"><h3>${asciiHTML(entry.name)}</h3><p>${asciiHTML(entry.desc)}</p></article>`).join('')||'<p class="expedition-note">Your first circuit writes the first page. Discoveries survive Awakening.</p>';
  const highlights=(state.highlights||[]).slice(-6);
  if(highlights.length)$('expedition-journal').innerHTML+='<details class="detail-fold"><summary>Recent field notes</summary><ul class="journal-highlights">'+highlights.map(h=>'<li>'+asciiHTML(h)+'</li>').join('')+'</ul></details>';
  const events=Object.entries(state.events||{}).filter(([id,event])=>event.seen&&(id!=='sighting'||((G.awakenCount||0)>=4&&state.discoveries?.observatory&&state.discoveries?.atlas)));
  $('expedition-events').innerHTML=events.map(([id,event])=>{
    const choices=typeof expeditionEventChoices==='function'?expeditionEventChoices(id):[];
    const info=typeof EXPEDITION_EVENTS!=='undefined'?EXPEDITION_EVENTS[id]:null;
    const name=info?.name||event.name||id.replace(/[_-]/g,' '),description=info?.desc||event.desc||'A discovered opportunity waits here until you choose.';
    return `<article class="journal-entry"><h3>${asciiHTML(name)}${event.resolved?' / resolved':''}</h3><p>${asciiHTML(description)}</p>${!event.resolved?`<div class="event-choices">${choices.map(c=>`<button class="act" data-event-id="${id}" data-event-choice="${c.id}" ${c.cost&&!canPay(c.cost)?'disabled':''}>${asciiHTML(c.name)}<small>${asciiHTML(c.desc)}</small></button>`).join('')}</div>`:`<p>Choice: ${asciiHTML(event.choice||'recorded')}</p>`}</article>`;
  }).join('')||'<p class="expedition-note">Sightings and invitations appear as you explore. They remain available while your wizard continues working.</p>';
  renderExpeditionMarket();
  $('expedition-events').querySelectorAll('[data-event-choice]').forEach(b=>{b.onclick=()=>{resolveExpeditionEvent(b.dataset.eventId,b.dataset.eventChoice);renderExpeditionJournal();renderTop();};});
  const inscriptions=regions.map(r=>r.inscription).filter(i=>i&&state.inscriptions?.[i.id]);
  $('expedition-inscriptions').innerHTML=inscriptions.map(i=>`<article class="journal-entry"><div class="row"><h3>${asciiHTML(i.name)}</h3><span class="spacer"></span><button class="act" data-inscription="${i.id}">${state.inscription===i.id?'Remove':'Equip'}</button></div><p>${asciiHTML(i.desc)}</p></article>`).join('')||'<p class="expedition-note">Complete expeditions to discover spell inscriptions. One inscription is active at a time; each changes a spell with a stated tradeoff.</p>';
  $('expedition-inscriptions').querySelectorAll('[data-inscription]').forEach(b=>{b.onclick=()=>{equipExpeditionInscription(state.inscription===b.dataset.inscription?null:b.dataset.inscription);renderExpeditionJournal();renderSpellbook();};});
}
function renderExpeditionMarket(){
  const state=G.expeditions;if(!state?.journal?.market_recipe)return;
  const root=$('expedition-events'),market=state.market||{preference:'off',budget:0,spent:0},unit=market.preference==='crystal'?'dust':'gold';
  const draft=uiExpansionDrafts().market||{preference:market.preference,budget:market.budget||0};
  root.innerHTML+=`<article class="journal-entry"><h3>Market recipes</h3><p>Exchange materials whenever useful, or give the trader a spending limit for automatic exchanges after completed circuits.</p><div class="event-choices"><button class="act" data-market-trade="crystal" ${(G.materials.dust||0)>=120?'':'disabled'}>Exchange dust<small>120 dust -&gt; 8 crystal</small></button><button class="act" data-market-trade="herb" ${G.gold>=500?'':'disabled'}>Buy herbs<small>500 gold -&gt; 20 herbs</small></button></div><div class="casting-rule"><label for="market-policy">After each circuit</label><select id="market-policy">${[['off','No automatic trade'],['crystal','Exchange dust for crystal'],['herb','Buy herbs with gold']].map(([id,name])=>`<option value="${id}" ${draft.preference===id?'selected':''}>${name}</option>`).join('')}</select><label for="market-budget">Spending limit</label><input id="market-budget" type="number" min="0" max="1000000000" step="1" value="${asciiHTML(draft.budget)}" style="width:120px"><button class="act" id="market-apply">Apply plan</button></div><p>${market.preference==='off'?'Automatic trading is off.':fmt(market.spent||0)+' / '+fmt(market.budget||0)+' '+unit+' spent under this plan.'} Automatic trades make at most one exchange per completed circuit.</p></article>`;
  root.querySelectorAll('[data-market-trade]').forEach(button=>{button.onclick=()=>{const kind=button.dataset.marketTrade;expeditionMarketTrade(kind);renderExpeditionJournal();renderTop();uiFocusControl(root,'[data-market-trade="'+kind+'"]');};});
  const policy=root.querySelector('#market-policy'),budget=root.querySelector('#market-budget');
  const keepDraft=()=>{uiExpansionDrafts().market={preference:policy.value,budget:budget.value};};
  if(policy)policy.onchange=keepDraft;if(budget)budget.oninput=keepDraft;
  const apply=root.querySelector('#market-apply');if(apply)apply.onclick=()=>{const amount=Number(budget.value);if(String(budget.value).trim()===''||!Number.isFinite(amount))return;if(setExpeditionMarketPolicy(policy.value,amount)){uiExpansionDrafts().market=null;renderExpeditionJournal();uiFocusControl(root,'#market-apply');}};
}
function initExpansionInterface(){
  $('btn-scene').onclick=()=>{G.ui=G.ui||{};G.ui.worldView='scene';renderEncounterScene();};
  $('btn-map').onclick=()=>{G.ui=G.ui||{};G.ui.worldView='map';renderEncounterScene();};
}
