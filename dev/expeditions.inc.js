// Persistent expeditions: integer time checkpoints, finite authored encounters,
// and one resolver shared by visible play and catch-up. No renderer consumes RNG.
const EXPEDITION_REGIONS=[
 {id:'orchard',name:'Ash Orchard',gateBoss:'ember',awakening:0,level:9,zone:2,policies:['balanced','restore','burn'],policyLabels:{balanced:'Balanced',restore:'Restore',burn:'Burn'},
  desc:'Restore the irrigation or burn a path through the roots. Nature waits beyond the first circuit.',
  encounters:[{name:'Cinder Finch Roost',desc:'A flock scatters burning feathers.'},{name:"Kilnkeeper's Channel",desc:'An armored keeper guards the irrigation.'},{name:'Windfall Court',desc:'Fallen branches shelter restless roots.'}],boss:{name:'The Last Orchardkeeper',desc:'Restored roots protect its bark; burned paths increase its heat.'},
  portrait:"       \\|/   \\|/\n   __.-/|\\---/|\\-.__\n  /  /  _   _  \\  \\\n /__/  (o) (o)  \\__\\\n    |     ^     |\n _T_|   /===\\   |_T_\n/___|__/|| ||\\__|___\\\n    /  /|| ||\\  \\\n __/__/ || || \\__\\__\n|~ ~ \\__/\\_/\\__/ ~ ~|\n|_____.==| |==._____|\n  ~~~ /_/|_|\\_\\ ~~~\n     /__/   \\__\\",inscription:{id:'ashglass',name:'Ashglass',desc:"Spark lands its burn immediately, losing fuel for Wildfire and harvesting."}},
 {id:'observatory',name:'Drowned Observatory',gateBoss:'tide',awakening:0,level:16,zone:3,policies:['balanced','drain','flood'],policyLabels:{balanced:'Balanced',drain:'Drain',flood:'Flood'},
  desc:'Broken lenses look into the flooded sky. The water obeys an ancient signal.',
  encounters:[{name:'Bellwell Steps',desc:'Echoing bells call drowned sentries.'},{name:'Inverted Telescope',desc:'An armored lens reflects your attacks.'},{name:'Pressure Vault',desc:'Water pressure hastens its custodians.'}],boss:{name:'The Blind Astronomer',desc:'Protected lenses give way to exposed machinery.'},
  portrait:"          .   *   .\n       .-'___'-.\n      /.-'   '-.\\\n     /_|  .*.  |_\\\n    |  | (o o) |  |\n    |__|__/|\\__|__|\n      /  /| \\  \\\n   __/__/ |  \\__\\__\n  /______/|________\\\n /~ ~\\  [===]  /~ ~\\\n|~ ~ ~\\___|___/~ ~ ~|\n| .--[===>|   |  ~  |\n'~'~~~~~~/ \\~~~~~~~'~'",inscription:{id:'brine',name:'Brine Shard',desc:'Ice Shard Soaks instead of Chilling: gain Conduct setups, lose its slowing and Shatter.'}},
 {id:'atlas',name:'Unfinished Atlas',gateBoss:'hollow',awakening:1,level:36,zone:5,policies:['balanced','survey','improvise'],policyLabels:{balanced:'Balanced',survey:'Survey',improvise:'Improvise'},
  desc:'Finish roads that end in questions. Annotations remain even after retreat.',
  encounters:[{name:'Wandering Compass',desc:'Its needle protects the road it points toward.'},{name:'Unwritten Bridge',desc:'Uncertain crossings hide armored constructs.'},{name:'Eraser Pack',desc:'Quick erasers remove the paths behind you.'}],boss:{name:'The Cartographer Without a Name',desc:'Your annotations shape its defenses.'},
  portrait:"        N\n    .---+---.\n   / \\  |  / \\\n  | W--(?)--E |    ?\n   \\ /  |  \\ /   .-+.\n    '---+---'   / . \\\n        S      |[?]|\n   _____|______ \\_/\n  / .--. .--. / /|\n / /  / /  / /_/ |\n/_/_ /_/ _/ /... ?\n  / / / / /   .-'\n /_/ /_/ /...?'",inscription:{id:'alphabet',name:'Borrowed Alphabet',desc:'Mana Bolt borrows the previous eligible school interaction, trading some neutral power.'}},
 {id:'leviathan',name:'The Ink Leviathan',gateBoss:null,awakening:4,level:70,zone:7,policies:['balanced','recover','purge'],policyLabels:{balanced:'Balanced',recover:'Recover',purge:'Purge'},
  desc:'The living library swallows chapters. Its sighting never expires.',
  encounters:[{name:'Margin Gullet',desc:'Ink parasites hide between swallowed pages.'},{name:'Bone Library',desc:'Rib shelves defend intact books.'},{name:'Black Tide Chamber',desc:'A rising tide of ink feeds its sentries.'}],boss:{name:"The Leviathan's Redactor",desc:'Briefly seals one spell category; diversified builds resist the seal.'},
  portrait:"      ___====___\n  ___/ |||||||| \\___\n / _  _  (O)  _  _  \\\n| / \\/ \\ / \\ / \\/ \\ |\n| |[]|[]| V |[]|[]| |\n \\|__|__|___|__|__|/\n  \\  /|| || ||\\  /\n   \\/ || || || \\/\n   /\\/||_||_||\\/\\\n  /  \\________/  \\\n |~ ~ / /  \\ \\ ~ ~|\n  \\__/ /____\\ \\__/\n ~~~/_/~~~~~~\\_\\~~~",inscription:{id:'redaction',name:'Redaction',desc:'Soul Drain harvests more remaining damage, but supplies no healing.'}},
 {id:'foundry',name:'Paradox Foundry',gateBoss:'aether',awakening:3,level:50,zone:6,policies:['balanced','temper','overload'],policyLabels:{balanced:'Balanced',temper:'Temper',overload:'Overload'},
  desc:'The next mutation is saved and visible. Import never rerolls its machinery.',
  encounters:[{name:'Splinter Golems',desc:'Rebuilt golems inherit the next machine trait.'},{name:'Unmade Apprentices',desc:'Broken apprentices reverse their construction.'},{name:'Contradiction Engine',desc:'Its contradictory plates alter the final smith.'}],boss:{name:'The Smith of Almost',desc:'Assembles its defenses from this circuit\'s machinery.'},
  portrait:"     |  .--.  |\n   __|__|?!|__|__\n  /  |  '--'  |  \\\n | [=]  /##\\  [=] |\n |  \\\\_/ <> \\_//  |\n |===| [@@] |===|\n  \\__|_/||\\_|__/\n   / /  ||  \\ \\\n _/_/___||___\\_\\_\n| _ _  /^^\\  _ _ |\n||_|_|(####)|_|_||\n|_____|_/\\_|_____|\n   <==/____\\==>",inscription:{id:'weighted',name:'Weighted Die',desc:'Chaos uses steadier outcomes with a lower peak.'}},
 {id:'orrery',name:'Orrery Beyond Midnight',gateBoss:'stellar',awakening:5,level:95,zone:8,policies:['balanced','anchor','align'],policyLabels:{balanced:'Balanced',anchor:'Anchor',align:'Align'},
  desc:'Conjunctions follow the journey, never the wall clock. The central star is missing.',
  encounters:[{name:'Orbit Wardens',desc:'Wardens defend the current orbital phase.'},{name:'Moonless Pilgrims',desc:'Their shields grow beneath an empty sky.'},{name:'Broken Satellites',desc:'Falling satellites open brief attack windows.'}],boss:{name:'The Empty Sun',desc:'A concealed core opens after a predictable conjunction.'},
  portrait:"      .     *     .\n    .---.       .---.\n   /  o  '-._.-'  o  \\\n  |  .---.   .---.  |\n  | /  .  \\ /  .  \\ |\n *| |  .-- ? --.  | |*\n  | | (         ) | |\n  | \\  '-- ? --'  / |\n   \\ '--.  |  .--' /\n    '----\\-|-/----'\n       __\\ | /__\n      /___\\|/___\\\n       .  [_]  .",inscription:{id:'orbital',name:'Orbital Veil',desc:'Stardust Veil trades its offensive burst for sustained protection.'}}
];
const EXPEDITION_BOSSES=['wisp','shade','ember','tide','storm','hollow','aether','chrono','stellar','elder'];
for(const r of EXPEDITION_REGIONS)r.gateLabel=r.gateBoss?'Defeat '+['Wisp Drake','Shade Drake','Ember Drake','Tide Drake','Storm Drake','Hollow Wyrm','Aether Drake','Chrono Wyrm','Stellar Behemoth','The Slumbering Elder'][EXPEDITION_BOSSES.indexOf(r.gateBoss)]+(r.awakening?' / Awakening '+r.awakening:''):'Awakening 4 / discover Observatory and Atlas';
const EXPEDITION_EVENTS={
 market:{name:'Market of Borrowed Things',desc:'A wandering stall teaches reusable dust-to-crystal and gold-to-herb exchanges. Unusual trades wait for your choice.',choices:[{id:'crystal',name:'Exchange dust',desc:'120 dust for 8 crystal and reusable market exchanges.',cost:{dust:120},reward:{crystal:8}},{id:'herb',name:'Buy a seed ledger',desc:'500 gold for 20 herbs and reusable market exchanges.',cost:{gold:500},reward:{herb:20}},{id:'listen',name:'Listen to the trader',desc:'Learn both exchange recipes without spending. No material bonus.'}]},
 star:{name:'Fallen Star',desc:'A crater remains until investigated. Its reflected light points toward the Observatory.',choices:[{id:'survey',name:'Survey the crater',desc:'Recover 25 crystal.',reward:{crystal:25}},{id:'study',name:'Study the fragments',desc:'Gain 800 journey XP and a research record.',reward:{xp:800}}]},
 apprentice:{name:'Stranded Apprentice',desc:'Your wizard has rescued a lost apprentice. Choose one permanent utility specialization.',choices:[{id:'gatherer',name:'Teach gathering',desc:'+10% expedition herbs.'},{id:'scout',name:'Teach route scouting',desc:'Expedition travel is 5% shorter.'},{id:'scribe',name:'Teach transcription',desc:'+10% expedition XP.'}]},
 dragon:{name:'Dragon Invitation',desc:'A standing challenge: complete a circuit with no healing during travel. Combat healing remains available.',choices:[{id:'accept',name:'Accept the challenge',desc:'The next successful circuit awards the dragon chapter.'},{id:'decline',name:'Keep the invitation',desc:'Leave the challenge available for later.'}]},
 door:{name:'Chalk Door',desc:'A strange door offers a short, seeded branch. It remains on your atlas.',choices:[{id:'enter',name:'Explore safely',desc:'Queue a saved branch; recover a route fragment and materials on completion.'},{id:'pass',name:'Mark the doorway',desc:'Keep its route clue without entering.'}]},
 sighting:{name:'Leviathan Sighting',desc:'A large silhouette crosses your completed maps. It remains available until investigated.',choices:[{id:'chart',name:'Chart the silhouette',desc:'Record the route into the living library.'}]}
};
function expeditionNumber(v,max=1e15){return Number.isFinite(v)&&v>=0?Math.min(max,v):0;}
function expeditionFlags(raw,keys){const o={};for(const id of keys)if(raw&&raw[id]===true)o[id]=true;return o;}
function expeditionRegion(id){return EXPEDITION_REGIONS.find(r=>r.id===id);}
function normalizeExpeditions(raw,legacyState={}){
 const q=raw&&typeof raw==='object'?raw:{},ids=EXPEDITION_REGIONS.map(r=>r.id),ins=EXPEDITION_REGIONS.map(r=>r.inscription.id);
 const e={v:1,active:null,discoveries:expeditionFlags(q.discoveries,['nature',...ids]),records:{},bossVictories:expeditionFlags(q.bossVictories,EXPEDITION_BOSSES),landscape:{},inscriptions:expeditionFlags(q.inscriptions,ins),inscription:ins.includes(q.inscription)?q.inscription:null,events:{},journal:{},rng:Number.isFinite(q.rng)?Math.floor(expeditionNumber(q.rng,4294967295)):0x51a7c3d9,rngCursor:Math.floor(expeditionNumber(q.rngCursor,1e12)),highlights:[],legacyClaim:null,apprentice:['gatherer','scout','scribe'].includes(q.apprentice)?q.apprentice:null,challenge:q.challenge===true,challengePending:q.challengePending===true,castRemainders:{},market:{preference:['crystal','herb'].includes(q.market?.preference)?q.market.preference:'off',budget:Math.floor(expeditionNumber(q.market?.budget,1e9)),spent:Math.floor(expeditionNumber(q.market?.spent,1e9))},doorBranch:Number.isInteger(q.doorBranch)&&q.doorBranch>=0&&q.doorBranch<=2?q.doorBranch:null};
 for(const id of ids){const r=q.records?.[id]||{};e.records[id]={circuits:Math.floor(expeditionNumber(r.circuits,1e9)),bosses:Math.floor(expeditionNumber(r.bosses,1e9)),failures:Math.floor(expeditionNumber(r.failures,1e9)),seconds:expeditionNumber(r.seconds,1e12),gold:expeditionNumber(r.gold),xp:expeditionNumber(r.xp)};e.landscape[id]=Math.floor(expeditionNumber(q.landscape?.[id]??(['orchard','observatory'].includes(id)?3:0),id==='atlas'?255:id==='leviathan'?12:id==='orrery'?7:6));}
 for(const id in EXPEDITION_EVENTS){const s=q.events?.[id];if(s&&s.seen===true){e.events[id]={seen:true,resolved:s.resolved===true,choice:EXPEDITION_EVENTS[id].choices.some(c=>c.id===s.choice)?s.choice:null};if(id==='door')e.events[id].branchTrait=Math.floor(expeditionNumber(s.branchTrait,2));}}
 for(const id of ['market_recipe','star_clue','research_record','rescued_apprentice','dragon_chapter','door_fragment','sighting_charted',...ids.map(id=>id+'_boss')])if(q.journal?.[id]===true)e.journal[id]=true;
 for(const sp of SPELLS)if(q.castRemainders?.[sp.id]!==undefined)e.castRemainders[sp.id]=expeditionNumber(q.castRemainders[sp.id],.999999999999);
 e.highlights=Array.isArray(q.highlights)?q.highlights.slice(-32).map(x=>String(x).replace(/[^\x20-\x7e]/g,'?').slice(0,160)):[];
 if(e.inscription&&!e.inscriptions[e.inscription])e.inscription=null;
 // A next-zone unlock proves only preceding victories, not unknown past runs.
 const unlocked=Math.floor(expeditionNumber(legacyState.unlocked,9));for(let i=0;i<unlocked;i++)e.bossVictories[EXPEDITION_BOSSES[i]]=true;
 const claim=q.legacyClaim||(!raw?legacyState.crusade?.active:null);
 if(claim){const reward={};for(const k of ['gold','xp','maps','dust','crystal','gem'])reward[k]=expeditionNumber(claim.reward?.[k]);e.legacyClaim={deadline:expeditionNumber(claim.deadline||(expeditionNumber(claim.startedAt)+expeditionNumber(claim.duration_s,28800)*1000),1e16),reward};}
 const a=q.active,r=expeditionRegion(a?.id);
 const allowed=r&&(legacyState.awakenCount||0)>=r.awakening&&(!r.gateBoss||e.bossVictories[r.gateBoss])&&(r.id!=='leviathan'||e.discoveries.observatory&&e.discoveries.atlas);
 if(allowed&&r.policies.includes(a.policy)&&['travel','fight','recover','branch'].includes(a.stage)&&Number.isInteger(a.phase)&&a.phase>=0&&a.phase<=3){
  e.active={id:r.id,policy:a.policy,nextPolicy:r.policies.includes(a.nextPolicy)?a.nextPolicy:null,repeat:a.repeat!==false,phase:a.phase,stage:a.stage,phaseName:String(a.phaseName||'').replace(/[^\x20-\x7e]/g,'?').slice(0,80),circuit:Math.floor(expeditionNumber(a.circuit,1e9)),failures:Math.floor(expeditionNumber(a.failures,2)),elapsed:expeditionNumber(a.elapsed,1e12),remainingMs:Math.max(1,Math.floor(expeditionNumber(a.remainingMs,1e9))),totalMs:Math.max(1,Math.floor(expeditionNumber(a.totalMs,1e9))),enemyHp:expeditionNumber(a.enemyHp),enemyMaxHp:expeditionNumber(a.enemyMaxHp),trait:Math.floor(expeditionNumber(a.trait,3)),machinery:Math.floor(expeditionNumber(a.machinery,15)),annotations:Math.floor(expeditionNumber(a.annotations,255)),bossStep:Math.floor(expeditionNumber(a.bossStep,1)),profile:null};
  e.active.sealedCategory=['damage','heal','buff','utility','summon'].includes(a.sealedCategory)?a.sealedCategory:null;e.active.firstBossHp=expeditionNumber(a.firstBossHp);e.active.progressPaid=a.progressPaid===true;e.active.branchTrait=Math.floor(expeditionNumber(a.branchTrait,2));
  e.active.loadout=Array.isArray(a.loadout)?a.loadout.slice(0,8).filter(id=>SPELLS.some(sp=>sp.id===id)):null;e.active.rules={};e.active.conditionState={};
  e.active.inscription=ins.includes(a.inscription)&&e.inscriptions[a.inscription]?a.inscription:null;
  e.active.segmentStartHp=expeditionNumber(a.segmentStartHp??a.enemyMaxHp);
  for(const id of e.active.loadout||[]){const rule=a.rules?.[id];if(rule&&['useful','hp','mana','multi'].includes(rule.condition)){e.active.rules[id]={condition:rule.condition,threshold:Math.max(.1,Math.min(.95,expeditionNumber(rule.threshold,1)||.6))};if(['hp','mana'].includes(rule.condition))e.active.conditionState[id]=a.conditionState?.[id]===true;}}
  e.active.encounter=null;const ref=a.encounter;if(ref&&typeof ref==='object'){e.active.encounter={};for(const k of ['hp','atk','def','spd'])e.active.encounter[k]=expeditionNumber(ref[k],1e12);e.active.encounter.el=typeof ref.el==='string'?ref.el.slice(0,16):null;e.active.encounter.isBoss=ref.isBoss===true;e.active.encounter.sealedCategory=e.active.sealedCategory&&a.bossStep!==1?e.active.sealedCategory:null;}
  e.active.power=Math.max(.1,expeditionNumber(a.power,4)||1);e.active.threat=Math.max(.1,expeditionNumber(a.threat,4)||1);e.active.deadlineMs=Math.floor(expeditionNumber(a.deadlineMs,8000));e.active.encounterDamage=expeditionNumber(a.encounterDamage);
  const p=a.profile;if(p&&typeof p==='object'){e.active.profile={};for(const k of ['dps','incoming','manaPerSec','manaRegen','restPerSec'])e.active.profile[k]=expeditionNumber(p[k],1e12);e.active.profile.healPerSec=Number.isFinite(p.healPerSec)?Math.max(-1e12,Math.min(1e12,p.healPerSec)):0;e.active.profile.spells=Array.isArray(p.spells)?p.spells.slice(0,8).filter(s=>SPELLS.some(sp=>sp.id===s.id)).map(s=>({id:s.id,rate:expeditionNumber(s.rate,4)})):[];e.active.profile.castRates={};e.active.profile.affinityPerSec={};for(const sp of SPELLS)if(p.castRates?.[sp.id]!==undefined)e.active.profile.castRates[sp.id]=expeditionNumber(p.castRates[sp.id],4);for(const id of ['fire','water','earth','air','light','shadow','blood','arcane','nature','resonance','chaos','cosmic'])if(p.affinityPerSec?.[id]!==undefined)e.active.profile.affinityPerSec[id]=expeditionNumber(p.affinityPerSec[id],1e12);}
  if(e.active.remainingMs>e.active.totalMs)e.active.remainingMs=e.active.totalMs;
  const snapshotIds=[...(e.active.loadout||[]),...(e.active.profile?.spells||[]).map(sp=>sp.id)],state={...legacyState,expeditions:e};
  const insRegion=EXPEDITION_REGIONS.find(region=>region.inscription.id===e.active.inscription);
  if(insRegion&&(legacyState.awakenCount||0)<insRegion.awakening||snapshotIds.some(id=>{const sp=SPELLS.find(s=>s.id===id);return !sp||(Array.isArray(legacyState.knownSpells)&&!legacyState.knownSpells.includes(id))||(typeof schoolUnlocked==='function'&&!schoolUnlocked(sp.element,state));}))e.active=null;
 }
 return e;
}
function initExpeditions(){if(!G.expeditions)G.expeditions=normalizeExpeditions(null,G);if(G.crusade?.active)G.crusade.active=null;return G.expeditions;}
function expeditionActive(){return !!G.expeditions?.active;}
function recordExpeditionBoss(value){const e=initExpeditions();let id=Number.isInteger(value)?EXPEDITION_BOSSES[value]:value;if(!EXPEDITION_BOSSES.includes(id)){const i=ZONES.findIndex(z=>z.boss.name===value);id=EXPEDITION_BOSSES[i];}if(id)e.bossVictories[id]=true;}
function regionUnlocked(id){const r=expeditionRegion(id),e=initExpeditions();return !!(r&&(G.awakenCount||0)>=r.awakening&&(!r.gateBoss||e.bossVictories[r.gateBoss])&&(id!=='leviathan'||(e.discoveries.observatory&&e.discoveries.atlas)));}
function expeditionInscription(){const e=initExpeditions(),r=EXPEDITION_REGIONS.find(r=>r.inscription.id===e.inscription);return r&&(G.awakenCount||0)>=r.awakening?e.inscription:null;}
function equipExpeditionInscription(id){const e=initExpeditions(),r=EXPEDITION_REGIONS.find(r=>r.inscription.id===id);if(id!==null&&(!e.inscriptions[id]||!r||(G.awakenCount||0)<r.awakening))return false;e.inscription=id;return true;}
function expeditionHighlight(text){const e=initExpeditions();e.highlights.push(text);if(e.highlights.length>32)e.highlights.shift();}
function expeditionRandom(){const e=initExpeditions();e.rng=(Math.imul(e.rng,1664525)+1013904223)>>>0;e.rngCursor=Math.min(1e12,e.rngCursor+1);return e.rng/4294967296;}
function discoverExpeditionEvent(id){const e=initExpeditions();if(!EXPEDITION_EVENTS[id]||e.events[id])return false;e.events[id]={seen:true,resolved:false,choice:null};if(id==='door')e.events[id].branchTrait=Math.floor(expeditionRandom()*3);expeditionHighlight('Journal: '+EXPEDITION_EVENTS[id].name);return true;}
function expeditionEventChoices(id){return initExpeditions().events[id]?.seen?EXPEDITION_EVENTS[id]?.choices||[]:[];}
function eventChoices(id){return expeditionEventChoices(id);}
function expeditionAddReward(reward,region=null){
 const e=initExpeditions();for(const k of ['gold','xp','dust','crystal','herb','gem','maps']){const n=Math.floor(expeditionNumber(reward[k]));if(!n)continue;if(k==='gold')G.gold=Math.min(1e15,G.gold+n);else if(k==='xp')G.hero.xp=Math.min(1e15,G.hero.xp+n);else if(k==='maps')G.treasureMaps=Math.min(1e9,G.treasureMaps+n);else G.materials[k]=Math.min(1e15,(G.materials[k]||0)+n);}
 if(region){const r=e.records[region];r.gold=Math.min(1e15,r.gold+(reward.gold||0));r.xp=Math.min(1e15,r.xp+(reward.xp||0));}
 if(typeof checkLevelUp==='function')checkLevelUp({allowDungeon:false});
}
function resolveExpeditionEvent(id,choice){
 const e=initExpeditions(),s=e.events[id],c=expeditionEventChoices(id).find(x=>x.id===choice);if(!s||s.resolved||!c)return false;
 if(id==='dragon'&&choice==='decline')return true;
 for(const k in c.cost||{})if((k==='gold'?G.gold:G.materials[k]||0)<c.cost[k])return false;
 for(const k in c.cost||{})if(k==='gold')G.gold-=c.cost[k];else G.materials[k]-=c.cost[k];
 s.resolved=true;s.choice=choice;expeditionAddReward(c.reward||{});
 if(id==='market')e.journal.market_recipe=true;
 if(id==='star'){e.journal.star_clue=true;if(choice==='study')e.journal.research_record=true;}
 if(id==='apprentice'){e.apprentice=choice;e.journal.rescued_apprentice=true;}
 if(id==='dragon'){e.challengePending=true;s.resolved=false;}
 if(id==='door'){if(choice==='enter')e.doorBranch=s.branchTrait;else e.journal.door_fragment=true;}
 if(id==='sighting')e.journal.sighting_charted=true;
 expeditionHighlight(EXPEDITION_EVENTS[id].name+': '+c.name);return true;
}
function expeditionMarketTrade(kind,quantity=1){
 const e=initExpeditions(),recipe=EXPEDITION_EVENTS.market.choices.find(c=>c.id===kind);quantity=Math.max(1,Math.min(100,Math.floor(quantity)));if(!e.journal.market_recipe||!recipe?.cost||!Number.isFinite(quantity))return false;
 for(const k in recipe.cost)if((k==='gold'?G.gold:G.materials[k]||0)<recipe.cost[k]*quantity)return false;
 for(const k in recipe.reward)if((G.materials[k]||0)+recipe.reward[k]*quantity>1e15)return false;
 for(const k in recipe.cost)if(k==='gold')G.gold-=recipe.cost[k]*quantity;else G.materials[k]-=recipe.cost[k]*quantity;
 const reward={};for(const k in recipe.reward)reward[k]=recipe.reward[k]*quantity;expeditionAddReward(reward);return true;
}
function setExpeditionMarketPolicy(kind,budget=0){const e=initExpeditions();if(!['off','crystal','herb'].includes(kind))return false;e.market={preference:kind,budget:Math.floor(expeditionNumber(budget,1e9)),spent:0};return true;}
function expeditionJournal(){const e=initExpeditions(),out=[];for(const r of EXPEDITION_REGIONS)if(e.discoveries[r.id]&&(G.awakenCount||0)>=r.awakening)out.push({id:r.id,name:r.name,desc:r.desc+' Circuits: '+e.records[r.id].circuits+'.'});for(const id in e.events)if(id!=='sighting'||(G.awakenCount||0)>=4)out.push({id,name:EXPEDITION_EVENTS[id].name,desc:EXPEDITION_EVENTS[id].desc,resolved:e.events[id].resolved});return out;}
function advanceLegacyCrusade(now=Date.now()){
 const e=initExpeditions(),c=e.legacyClaim;if(!c||now<c.deadline)return false;e.legacyClaim=null;expeditionAddReward(c.reward);expeditionHighlight('The previous Crusade delivers its promised reward.');return true;
}
function resetExpeditionJourney(){const e=initExpeditions();e.active=null;e.challengePending=e.challengePending||e.challenge;e.challenge=false;}
function startExpedition(id,policy='balanced',repeat=true){
 const e=initExpeditions(),r=expeditionRegion(id);if(!r||!regionUnlocked(id)||!r.policies.includes(policy)||G.trial?.inTrial||G.inDungeon||!G.hero.alive)return false;
 settleExpeditionFight();
 e.active={id,policy,nextPolicy:null,repeat:repeat!==false,phase:0,stage:'travel',phaseName:'',circuit:0,failures:0,elapsed:0,machinery:0,annotations:0,bossStep:0,trait:0,profile:null};
 if(e.challengePending){e.challenge=true;e.challengePending=false;}
 G.enemy=null;G.bossActive=false;beginExpeditionTravel();expeditionHighlight('Assignment: '+r.name);return true;
}
function stopExpedition(){const e=initExpeditions();if(!e.active)return false;settleExpeditionFight();e.active=null;expeditionHighlight('Returned to World.');return true;}
function setExpeditionPolicy(policy){const a=initExpeditions().active,r=expeditionRegion(a?.id);if(!r||!r.policies.includes(policy))return false;a.nextPolicy=policy;return true;}
function setExpeditionRepeat(value){const a=initExpeditions().active;if(!a)return false;a.repeat=value===true;return true;}
function expeditionPolicy(a){if(a.policy!=='balanced')return a.policy;const r=expeditionRegion(a.id),land=initExpeditions().landscape[a.id];return r.policies[1+(a.id==='orchard'||a.id==='observatory'?land<3?0:1:a.circuit%2)];}
function beginExpeditionTravel(){
 const e=initExpeditions(),a=e.active;if(!a)return;const r=expeditionRegion(a.id);if(a.nextPolicy){a.policy=a.nextPolicy;a.nextPolicy=null;}
 if(e.doorBranch!==null){beginExpeditionDoor();return;}
 a.stage='travel';a.phaseName=a.phase===3?r.boss.name:r.encounters[a.phase].name;a.trait=Math.floor(expeditionRandom()*4);a.machinery|=1<<a.trait;
 if(a.id==='atlas'){a.annotations|=1<<a.phase;e.landscape.atlas|=1<<Math.floor(expeditionRandom()*8);}
 const policy=expeditionPolicy(a),slow=['restore','drain','survey','recover','align'].includes(policy),fast=['burn','flood','improvise','purge','overload'].includes(policy);
 a.totalMs=a.remainingMs=Math.round((slow?150:fast?90:120)*(e.apprentice==='scout'?0.95:1)*1000);a.enemyHp=0;a.enemyMaxHp=0;a.segmentStartHp=0;a.bossStep=0;a.sealedCategory=null;a.firstBossHp=0;a.progressPaid=false;a.branchTrait=0;a.loadout=null;a.rules={};a.conditionState={};a.encounter=null;a.inscription=null;a.power=a.threat=1;a.deadlineMs=0;a.encounterDamage=0;
 const s=G.baseStats||{};a.profile={dps:0,incoming:0,healPerSec:0,manaPerSec:0,manaRegen:s.manaRegen||0,restPerSec:e.challenge?0:(s.maxHp||G.hero.maxHp)*0.004,spells:[],castRates:{},affinityPerSec:{}};
}
function expeditionFighting(a){return a.stage==='fight'||a.stage==='branch'&&a.branchTrait===2;}
function beginExpeditionDoor(){
 const e=initExpeditions(),a=e.active,r=expeditionRegion(a.id),s=G.baseStats||{};a.stage='branch';a.branchTrait=e.doorBranch;a.phaseName='Chalk Door / '+['Quiet Study','Loose Chalk','Mirror Sentry'][a.branchTrait];a.progressPaid=false;
 a.enemyHp=a.enemyMaxHp=a.segmentStartHp=0;a.profile={dps:0,incoming:0,healPerSec:0,manaPerSec:0,manaRegen:s.manaRegen||0,restPerSec:e.challenge?0:G.hero.maxHp*.004,spells:[],castRates:{},affinityPerSec:{}};a.totalMs=a.remainingMs=[45000,60000,45000][a.branchTrait];
 a.loadout=null;a.rules={};a.conditionState={};a.encounter=null;a.inscription=null;a.power=a.threat=1;a.deadlineMs=0;a.encounterDamage=0;
 if(a.branchTrait===2){const source=ZONES[r.zone].boss,ref={hp:source.hp*.04,atk:source.atk*.2,def:source.def*.25,spd:.5,el:source.el,isBoss:false};if(typeof useEncounterPreset==='function')useEncounterPreset(ref);prepareExpeditionConditions(a);a.encounter={...ref,sealedCategory:null};a.enemyHp=a.enemyMaxHp=a.segmentStartHp=ref.hp;setExpeditionCombatProfile(a);a.totalMs=a.remainingMs=Math.max(15000,Math.ceil(ref.hp/a.profile.dps*1000));}
}
// Threshold rules latch once per encounter. Each of at most eight changes
// starts a new credited segment, without replaying individual casts while away.
function prepareExpeditionConditions(a){
 a.loadout=(typeof activeEquippedSpells==='function'?activeEquippedSpells().map(sp=>sp.id):(G.equippedSpells||[])).slice(0,8);a.rules={};a.conditionState={};a.inscription=expeditionInscription();
 for(const id of a.loadout){const r=G.magic?.rules?.[id];if(!r)continue;a.rules[id]={condition:r.condition,threshold:r.threshold};if(r.condition==='hp'||r.condition==='mana')a.conditionState[id]=(r.condition==='hp'?G.hero.hp/G.hero.maxHp:G.hero.mana/G.hero.maxMana)<r.threshold;}
}
function setExpeditionCombatProfile(a,p=null){
 const ref={...a.encounter,conditionState:a.conditionState,loadout:a.loadout,rules:a.rules,inscription:a.inscription},s=G.baseStats||{};p??=expeditionProfile(ref);const power=a.power||1,threat=a.threat||1;
 a.profile={dps:Math.max(1,expeditionNumber(p.dps,1e12))*power,healPerSec:Number.isFinite(p.healPerSec)?Math.max(-1e12,Math.min(1e12,p.healPerSec)):0,incoming:(Number.isFinite(p.incoming)?Math.max(0,p.incoming):Math.max(.1,ref.atk-(s.def||0)/2)*ref.spd*(1-Math.max(0,Math.min(.8,p.mitigation||0))))*threat,manaPerSec:expeditionNumber(p.manaPerSec,1e12),manaRegen:p.manaRegen??s.manaRegen??0,restPerSec:0,spells:Array.isArray(p.spells)?p.spells.map(sp=>({id:sp.id,rate:Math.min(4,Math.max(0,sp.rate||0))})):[],castRates:{...p.castRates},affinityPerSec:{...p.affinityPerSec}};
 for(const id in a.profile.affinityPerSec)a.profile.affinityPerSec[id]*=power;
}
function latchExpeditionConditions(a){
 if(!a.encounter||!a.loadout)return false;let changed=false;
 for(const id of a.loadout){const r=a.rules[id];if(!r||a.conditionState[id]!==false)continue;const ratio=r.condition==='hp'?G.hero.hp/G.hero.maxHp:r.condition==='mana'?G.hero.mana/G.hero.maxMana:Infinity;if(ratio<=r.threshold+1e-12){a.conditionState[id]=true;changed=true;}}
 if(!changed)return false;settleExpeditionFight();setExpeditionCombatProfile(a);a.segmentStartHp=a.enemyHp;a.progressPaid=false;a.totalMs=a.remainingMs=Math.max(1,Math.ceil(a.enemyHp/a.profile.dps*1000));if(a.deadlineMs>0)a.totalMs=a.remainingMs=Math.min(a.remainingMs,a.deadlineMs);return true;
}
function expeditionConditionBoundary(a,healthRate,manaRate){
 let next=Infinity;for(const id of a.loadout||[]){const r=a.rules[id];if(!r||a.conditionState[id]!==false)continue;const hp=r.condition==='hp',rate=hp?healthRate:manaRate,current=hp?G.hero.hp:G.hero.mana,maximum=hp?G.hero.maxHp:G.hero.maxMana;if(rate<0)next=Math.min(next,Math.max(1,Math.ceil((current-maximum*r.threshold)/-rate*1000-1e-8)));}return next;
}
function expeditionProfile(enemy){
 if(typeof getExpeditionProfile==='function')return getExpeditionProfile(enemy);
 const s=G.baseStats||{},spells=(G.equippedSpells||[]).map(id=>SPELLS.find(sp=>sp.id===id)).filter(Boolean),casts=[];let actions=s.spd||1,mana=s.manaRegen||0,spent=0;
 for(const sp of spells){const rate=Math.min(actions,1/Math.max(.25,sp.cd||1),sp.cost?mana/sp.cost:Infinity);actions-=rate;mana-=rate*(sp.cost||0);spent+=rate*(sp.cost||0);casts.push({sp,rate});}
 if(typeof estimateIdleCombat==='function'){const v=estimateIdleCombat(casts,actions,s,enemy,{enemyHp:1,enemyAtk:1,enemyDef:1});return {dps:v.dps,healPerSec:v.healing,mitigation:.4*(v.chillUptime||0),manaPerSec:spent,conditions:[],attackRate:(s.spd||1)-actions};}
 return {dps:Math.max(1,(s.atk||3)-enemy.def)*(s.spd||1),healPerSec:0,mitigation:0,manaPerSec:0,conditions:[]};
}
function beginExpeditionFight(second=false){
 const e=initExpeditions(),a=e.active,r=expeditionRegion(a.id),boss=a.phase===3,policy=expeditionPolicy(a),s=G.baseStats||{},d=awakenDifficulty(),source=ZONES[r.zone].boss;
 const ref={hp:source.hp*(boss?.7:.1+.035*a.phase)*d.enemyHp,atk:source.atk*(boss?(a.id==='orrery'?.20:.4):.22)*d.enemyAtk,def:source.def*(boss?.7:.35)*d.enemyDef,spd:boss?.5:.6,el:source.el,isBoss:boss};
 if(['burn','flood','improvise','purge','overload'].includes(policy))ref.atk*=1.15;
 if(policy==='restore')ref.def*=1.15;if(policy==='drain')ref.def*=1.3;
 if(a.id==='orchard'&&boss){ref.def*=1+e.landscape.orchard*.06;ref.atk*=1+(6-e.landscape.orchard)*.05;}
 if(a.id==='atlas'&&boss)ref.def*=1+.08*a.annotations.toString(2).replace(/0/g,'').length;
 if(a.id==='foundry'&&(policy==='overload'||boss)){ref.atk*=[.8,1.35,1.05,1.15][a.trait];ref.def*=[1.3,.7,1.25,.85][a.trait];}
 if(!second){if(typeof useEncounterPreset==='function')useEncounterPreset(ref);prepareExpeditionConditions(a);}
 if(a.id==='leviathan'&&boss&&!second){const spells=typeof activeEquippedSpells==='function'?activeEquippedSpells():(G.equippedSpells||[]).map(id=>SPELLS.find(s=>s.id===id)).filter(Boolean),types=[...new Set(spells.map(sp=>sp.type))];a.sealedCategory=types.length?types[Math.floor(expeditionRandom()*types.length)]:null;ref.sealedCategory=a.sealedCategory;}
 let power=1,threat=1;
 if(a.id==='observatory'&&boss){power=second?1.35:.7;threat=second?.8:1;ref.hp*=second?.65:.35;}
 if(a.id==='orrery'&&boss){power=second?(policy==='align'?1.8:1.3):.65;threat=policy==='anchor'?.8:1.1;ref.hp*=second?.6:.4;}
 if(a.id==='leviathan'&&boss&&!second)threat=.7;
 if(a.id==='foundry'&&boss)threat*=1+.035*a.machinery.toString(2).replace(/0/g,'').length;
 a.stage='fight';a.bossStep=second?1:0;a.power=power;a.threat=threat;a.encounter={...ref,sealedCategory:ref.sealedCategory||null};a.deadlineMs=0;a.encounterDamage=0;setExpeditionCombatProfile(a);
 if(a.id==='leviathan'&&boss&&!second){ref.hp=Math.min(ref.hp,a.profile.dps*8);a.firstBossHp=ref.hp;a.deadlineMs=8000;}
 if(a.id==='leviathan'&&boss&&second)ref.hp=Math.max(1,source.hp*.7*d.enemyHp-a.firstBossHp);
 a.encounter.hp=ref.hp;a.enemyMaxHp=a.enemyHp=a.segmentStartHp=ref.hp;a.progressPaid=false;
 a.totalMs=a.remainingMs=Math.max(1000,Math.ceil(a.enemyHp/a.profile.dps*1000));if(a.deadlineMs)a.totalMs=a.remainingMs=Math.min(a.remainingMs,a.deadlineMs);
 a.phaseName=(boss?r.boss.name:r.encounters[a.phase].name)+(boss&&['observatory','orrery','leviathan'].includes(a.id)?second?' / exposed':a.id==='leviathan'?' / sealed '+(a.sealedCategory||'none'):' / protected':'');
}
function completeExpeditionEncounter(report){
 const e=initExpeditions(),a=e.active,r=expeditionRegion(a.id),boss=a.phase===3,policy=expeditionPolicy(a),stats=G.baseStats||{},source=ZONES[r.zone].boss;
 if(boss&&['observatory','orrery','leviathan'].includes(a.id)&&!a.bossStep){if(a.id==='leviathan')a.firstBossHp=a.encounterDamage;beginExpeditionFight(true);return;}
 const luck=.9+expeditionRandom()*.2,scale=(boss?.28:.045)*awakenDifficulty().reward,reward={gold:Math.floor(source.gold*scale*luck*(stats.goldFind||1)),xp:Math.floor(source.xp*scale*(stats.xpMul||1)*(e.apprentice==='scribe'?1.1:1)),dust:Math.floor((18+r.zone*7)*(boss?3:1)*luck),herb:Math.floor((4+r.zone*2)*(e.apprentice==='gatherer'?1.1:1)),crystal:r.zone>=3?Math.floor((2+r.zone)*(boss?2:1)):0,gem:boss&&r.zone>=6?1:0};
 if(['restore','flood','recover'].includes(policy)){reward.herb*=2;reward.dust=Math.floor(reward.dust*.7);}else if(['burn','purge','overload'].includes(policy)){reward.dust=Math.floor(reward.dust*1.5);reward.herb=Math.floor(reward.herb*.7);}else if(policy==='drain'||policy==='survey'){reward.crystal+=5;reward.herb=Math.floor(reward.herb*.8);}
 expeditionAddReward(reward,a.id);for(const k in reward)report[k]=(report[k]||0)+reward[k];
 if(!boss){a.phase++;beginExpeditionTravel();return;}
 const rec=e.records[a.id];rec.circuits=Math.min(1e9,rec.circuits+1);rec.bosses=Math.min(1e9,rec.bosses+1);report.circuits++;a.circuit++;a.failures=0;
 e.discoveries[a.id]=true;if(a.id==='orchard')e.discoveries.nature=true;e.inscriptions[r.inscription.id]=true;e.journal[a.id+'_boss']=true;
 if(a.id==='orchard'||a.id==='observatory'){const restoration=policy==='restore'||policy==='drain';e.landscape[a.id]=Math.max(0,Math.min(6,e.landscape[a.id]+(restoration?1:-1)));}else if(a.id==='leviathan')e.landscape.leviathan=Math.min(12,e.landscape.leviathan+1);else if(a.id==='foundry')e.landscape.foundry=(e.landscape.foundry+1)%4;else if(a.id==='orrery')e.landscape.orrery=(e.landscape.orrery+1)%8;
 expeditionHighlight(r.boss.name+' defeated. Circuit '+rec.circuits+'.');
 const market=e.market,recipe=EXPEDITION_EVENTS.market.choices.find(c=>c.id===market.preference),cost=recipe?.cost?Object.values(recipe.cost)[0]:0;if(cost&&market.spent+cost<=market.budget&&expeditionMarketTrade(market.preference)){market.spent+=cost;expeditionHighlight('Market standing exchange: '+market.preference+'.');}
 discoverExpeditionEvent('market');if(a.id==='observatory')discoverExpeditionEvent('star');if(rec.circuits>=2)discoverExpeditionEvent('apprentice');discoverExpeditionEvent('dragon');if(a.id==='atlas')discoverExpeditionEvent('door');
 if((G.awakenCount||0)>=4&&e.discoveries.observatory&&e.discoveries.atlas)discoverExpeditionEvent('sighting');
 if(e.challenge){e.challenge=false;e.journal.dragon_chapter=true;e.events.dragon={seen:true,resolved:true,choice:'accept'};expeditionHighlight('Dragon challenge complete: a permanent bestiary chapter.');}
 if(!a.repeat){e.active=null;return;}a.phase=0;a.machinery=0;a.annotations=0;if(e.challengePending){e.challenge=true;e.challengePending=false;}beginExpeditionTravel();
}
function expeditionCastCredits(profile,seconds){
 const e=initExpeditions();G.spellMastery??={};for(const cast of profile.spells||[]){if(!SPELLS.some(sp=>sp.id===cast.id))continue;const count=(e.castRemainders[cast.id]||0)+cast.rate*seconds,whole=Math.floor(count+1e-9);e.castRemainders[cast.id]=Math.max(0,count-whole);G.spellMastery[cast.id]=Math.min(1e12,(G.spellMastery[cast.id]||0)+whole);}
}
function settleExpeditionFight(){const a=initExpeditions().active;if(!a||a.progressPaid||!expeditionFighting(a))return;a.progressPaid=true;const seconds=(a.totalMs-a.remainingMs)/1000,damage=Math.max(0,(a.segmentStartHp??a.enemyMaxHp)-a.enemyHp);if(typeof creditAssignmentSpellProgress==='function')creditAssignmentSpellProgress(a.profile,seconds,damage);else expeditionCastCredits(a.profile,seconds);}
function advanceExpedition(seconds){
 const e=initExpeditions(),report={seconds:0,usedSeconds:0,unusedSeconds:0,gold:0,xp:0,dust:0,crystal:0,herb:0,gem:0,circuits:0,failures:0,materials:{},highlights:[]};let ms=Math.max(0,Math.round(Number.isFinite(seconds)?seconds*1000:0));
 const first=e.highlights.length;
 while(ms>0&&e.active){const a=e.active;if(!a.profile){if(a.stage==='travel')beginExpeditionTravel();else if(a.stage==='fight')beginExpeditionFight(a.bossStep===1);else a.profile={incoming:0,healPerSec:0,restPerSec:0,manaPerSec:0,manaRegen:G.baseStats?.manaRegen||0,dps:0};}
  if(expeditionFighting(a))latchExpeditionConditions(a);
  const p=a.profile,fighting=expeditionFighting(a),ailment=typeof assignmentAilmentDps==='function'?assignmentAilmentDps():0,healthRate=(fighting?p.healPerSec-p.incoming:p.restPerSec>0?G.hero.maxHp*.004:0)-ailment,loss=Math.max(0,-healthRate),deathMs=loss>0?Math.max(1,Math.ceil(Math.max(0,G.hero.hp)/loss*1000)):Infinity;
  const ritualDrain=G.ritual?.active&&typeof isRitualUnlocked==='function'&&isRitualUnlocked()&&G.hero.alive?ritualCfg().manaCost:0,conditionClock=fighting?expeditionConditionBoundary(a,healthRate,p.manaRegen-p.manaPerSec-ritualDrain):Infinity;
  const owed=(G.magic?.deferred||[]).filter(o=>o.remaining>0).reduce((n,o)=>Math.min(n,Math.max(1,Math.ceil(o.remaining*1000))),Infinity),ailmentClock=(G.hero.ailments||[]).filter(o=>o.remaining>0).reduce((n,o)=>Math.min(n,Math.max(1,Math.ceil(o.remaining*1000))),Infinity),buffClock=(G.buffs||[]).filter(o=>o.dur>0).reduce((n,o)=>Math.min(n,Math.max(1,Math.ceil(o.dur*1000))),Infinity),cdClock=Object.values(G.spellCd||{}).filter(n=>n>0).reduce((n,v)=>Math.min(n,Math.max(1,Math.ceil(v*1000))),Infinity),resourceClock=typeof nextAssignmentResourceBoundary==='function'?Math.max(1,nextAssignmentResourceBoundary(p)):Infinity,used=Math.min(ms,a.remainingMs,deathMs,owed,ailmentClock,buffClock,cdClock,resourceClock,conditionClock,a.deadlineMs||Infinity),dt=used/1000,initialMana=G.hero.mana;
  G.hero.hp=Math.max(0,Math.min(G.hero.maxHp,G.hero.hp+healthRate*dt));
  G.hero.mana=Math.max(0,G.hero.mana+(p.manaRegen-p.manaPerSec)*dt);
  if(typeof advanceAssignmentResources==='function')advanceAssignmentResources(dt,{initialMana,regeneration:p.manaRegen,combatManaPerSec:p.manaPerSec});
  G.hero.mana=Math.min(G.hero.maxMana,G.hero.mana);
  if(typeof ageAssignmentEffects==='function')ageAssignmentEffects(dt);
  a.remainingMs-=used;a.elapsed+=dt;e.records[a.id].seconds=Math.min(1e12,e.records[a.id].seconds+dt);report.usedSeconds+=dt;ms-=used;
  if(fighting){const damage=Math.min(a.enemyHp,p.dps*dt);a.enemyHp=Math.max(0,a.enemyHp-damage);a.encounterDamage=(a.encounterDamage||0)+damage;if(a.deadlineMs>0){a.deadlineMs=Math.max(0,a.deadlineMs-used);if(!a.deadlineMs)a.remainingMs=0;}}
  if(a.stage!=='recover'&&(G.hero.hp<=1e-9||!G.hero.alive)){settleExpeditionFight();if(G.hero.alive&&typeof onHeroDead==='function')onHeroDead();a.failures++;e.records[a.id].failures=Math.min(1e9,e.records[a.id].failures+1);report.failures++;expeditionHighlight('Retreat: '+a.phaseName+'. Strengthen defense or healing.');if(a.failures>=2){e.active=null;G.hero.hp=Math.max(1,G.hero.maxHp*.5);G.hero.alive=true;expeditionHighlight('Repeated danger: returned safely to World.');break;}a.stage='recover';a.totalMs=a.remainingMs=5000;a.profile={incoming:0,healPerSec:0,restPerSec:0,manaPerSec:0,manaRegen:G.baseStats?.manaRegen||0,dps:0,spells:[],castRates:{},affinityPerSec:{}};continue;}
  if(a.remainingMs<=0){if(a.stage==='travel')beginExpeditionFight();else if(a.stage==='recover'){G.hero.alive=true;G.hero.hp=Math.max(1,G.hero.maxHp*.5);G.hero.mana=Math.max(G.hero.mana,G.hero.maxMana*.25);beginExpeditionTravel();}else if(a.stage==='branch'){settleExpeditionFight();const reward=[{crystal:12,xp:400},{dust:70},{dust:45,crystal:8}][a.branchTrait];expeditionAddReward(reward);for(const k in reward)report[k]=(report[k]||0)+reward[k];e.journal.door_fragment=true;e.doorBranch=null;expeditionHighlight(a.phaseName+': route fragment recovered.');beginExpeditionTravel();}else{settleExpeditionFight();completeExpeditionEncounter(report);}}else if(fighting)latchExpeditionConditions(a);
 }
 report.seconds=report.usedSeconds;report.unusedSeconds=ms/1000;for(const k of ['dust','crystal','herb','gem'])if(report[k])report.materials[k]=report[k];report.highlights=e.highlights.slice(first).slice(-32);return report;
}
