# Idle Wizard Expansion Blueprint

Design blueprint and implementation notes, 10 October 2026.

The 28 core spells, four disciplines, six regions, six events, inscriptions,
standing policies, journal, and encounter interface are implemented on
`codex/idle-expansions`. The twelve reserve spells remain future candidates.
The README describes the implemented release and its save format; the proposals
below retain the reasoning and longer-term options.

The implemented balance suite clears each expedition with two developed builds
at its entry band. Deterministic tests compare all six routes across a nine-hour
jump and quarter-second advances, and save/import tests resume mid-encounter.
Desktop and narrow-phone layouts have been checked in the browser. World idle
income remains a forecast, so the proposed 5% live/away target below is not a
measured guarantee. A real overnight device soak and cross-browser coverage
remain future validation work.

The release passes 166 automated tests. On the development PC in Node, a
twelve-hour Orrery stress run with HP-triggered spells, 2,000 Lab Imps, and
automatic brewing took 172 ms: 70 circuits, no retreats, and all 43,200 seconds
credited. This is above the original 50 ms aim; it uses bounded encounter and
threshold transitions rather than replaying every combat tick.

Expand the game around automatic spell builds, six persistent expedition regions, and discoveries that survive Awakening. The complete candidate roster adds 40 spells across the eight existing schools and four new schools. Deliver 28 of those first through several releases; keep 12 as playtest candidates. The eventual ceiling is 92 spells, with each addition earning its place through a distinct use.

The central loop remains: choose a destination, arrange a spell priority, set a standing policy, and let the wizard work. Returning should reveal a changed world, useful discoveries, and a single readable summary.

## Fixed requirements

- One self-contained HTML game. No accounts, network calls, external assets, telemetry, cookies, or browser storage.
- Progress remains in memory until the player explicitly exports a Base64 snapshot. Import and export remain the only persistence mechanism.
- Printable ASCII for built-in art, names, controls, and messages. Use system monospace fonts with ligatures disabled; use CSS for borders.
- Automatic play must complete the ordinary game and every expansion region. No daily claims, timed clicking, expiring sightings, mandatory manual dodging, or repeated choice dialogs.
- Arcane opens after the first Awakening and has no identifying school card, enemy label, or affinity reward before then. Preserve its existing spell IDs, names, prices, and identity as expensive, exceptionally powerful neutral magic.
- Cosmic opens when the fifth Awakening completes. Before that, its school, spells, recipes, achievements, reward previews, and identifying collection totals remain absent from the interface.
- Keep the background lifecycle fix: no hidden rendering, one active timer, absence credited once, one accumulating recap, and bounded catch-up work.
- Retain the 12-hour reward cap. Age temporary effects by actual elapsed time even beyond the reward cap.

## Where the expansion stands

Main includes the merged background lifecycle fix from [PR 3](https://github.com/ImPanick/idle-wizard/pull/3), at commit `8baf0ba`. The expansion branch integrates the living grimoire from [PR 2](https://github.com/ImPanick/idle-wizard/pull/2) with that fix, preserving its lifecycle safeguards.

PR 2 keeps the existing 52 spells and gives eight of them more distinct mechanics: Spark burns, Ice Shard chills, Tidal Wave soaks and splashes, Chain Lightning jumps, Quake fractures and splashes, Earthward intercepts damage, Holy Smite executes weakened targets, and Soul Drain harvests damage over time. Conduct, Wildfire, and Shatter then connect those effects automatically.

That is the foundation for the new spells. Its away estimator still excludes several of these interactions; the expansion must address that before offering builds whose main value disappears while the player is away.

## Progression and school identity

The new disciplines can be neutral in the existing damage matchup system. Their mechanics provide their identity; expanding the elemental counter wheel is a separate balance decision.

| School | Proposed discovery gate | Job in a build |
|---|---|---|
| Fire | Existing starting school | Establish burns, spread them, or spend them for a burst |
| Water | Existing starting school | Healing, cleansing, and preparation through Chilled or Soaked |
| Earth | Existing starting school | Armor, interception, and deliberate heavy attacks |
| Air | Existing starting school | Chains, movement, and grouping targets |
| Light | Existing starting school | Prevent ailments, protect allies, finish weakened enemies |
| Shadow | Existing starting school | Persistent damage, marks, harvesting, and effects that survive a kill |
| Blood | Existing starting school | Trade health, mana, and recovered life under visible limits |
| Nature | First Ash Orchard circuit; possible before Awakening 1 | Grow Seeds, then choose healing, spreading, or damage |
| Arcane | Awakening 1 | Expensive neutral force, strong direct attacks, and mana manipulation |
| Resonance | Awakening 2 | Turn the recent casting pattern into a limited resource |
| Chaos | Awakening 3 | Manipulate a visible sequence of unstable outcomes |
| Cosmic | Awakening 5 exactly | Control orbits, damage distribution, and the timing of consequences |

Nature's discovery persists across Awakening. Arcane, Resonance, Chaos, and Cosmic use Awakening count as their school gate. School availability permits study; spells still have learning costs. Region access can have additional requirements without delaying a school's reveal.

Cosmic Eye, Astral Lance, Stardust Veil, Reality Tear, and Singularity remain Arcane. Cosmic receives its own rules and spell roster. The first Cosmic release includes a standalone offensive spell so its reveal immediately offers a spectacular new build option.

Awakening 4 can deepen existing systems through the Leviathan and advanced inscriptions. A new school at every Awakening is unnecessary.

## One wizard assignment

Give the wizard one active assignment: World, Trials, or an expedition region. Manor production, golems, brewing, and research continue alongside that assignment.

Treasure dungeons are subactivities of World. Expedition level-ups must not invoke the existing automatic dungeon entry path. Any newly available dungeon becomes a journal opportunity until the wizard returns to World.

Ritual shares the wizard's gold and mana pool. Advance its consumption through the same chronological resource accounting as combat, with no second copy of available mana or gold. The assignment screen should show when Ritual's resource use limits the current build.

The Adventure screen shows the destination, current phase, spell preset, policy, repeat setting, and accumulated results together. Entering an expedition suspends world combat and its income. Existing Crusades currently run alongside world activity; moving to this system is an intentional economy change that requires migration and balancing.

Each expedition uses the same structure:

1. Choose a known region and a spell preset.
2. Set a policy and either repeat circuits or return after the current circuit.
3. The wizard advances through encounters and the boss automatically.
4. Ordinary rewards enter inventory automatically. Discoveries enter the journal once.
5. Repeated circuits continue without a claim button. A single recap reports progress when the player returns.

Use a balanced policy by default, with two distinct specializations per region. Policy and loadout changes apply at the next encounter boundary after previous time is settled. Repeating failure triggers automatic retreat to a safe activity according to a visible fallback setting; it never traps the wizard in a prompt.

Aim for roughly 10-20 minute circuits at recommended power as an initial tuning target. The system still supports a short visit or hours of repetition. Every policy eventually permits every essential discovery; policies change route emphasis, risk, and material mix.

## The six expedition regions

### Ash Orchard

**Entry:** Defeat Ember Drake. This is the first expedition and the source of Nature's discovery.

Blackened `T` trees stand over `#` roots and broken `~` irrigation. Restoring channels gradually replaces ash with living growth; burning paths exposes buried stone and opens shortcuts. The saved landscape changes visibly over several circuits.

- **Restore:** Longer channel encounters, safer recovery, more herbs.
- **Burn:** Faster clearance, more aggressive enemies, more dust.
- **Balanced:** Alternates the two according to the current orchard condition.
- **Encounters:** Cinder Finch Roost, Kilnkeeper's Channel, Windfall Court.
- **Boss:** The Last Orchardkeeper. Restored roots protect it; accumulated heat makes it attack more aggressively. Both routes remain manageable with automatic builds.
- **Discovery:** Nature study, orchard entries, and the Ashglass inscription. Ashglass converts Spark's burn into immediate damage, sacrificing fuel for Wildfire and Soul Drain.
- **Persistence:** Orchard condition and discoveries survive Awakening. Opposing policies can reverse its condition; there is no permanently wrong route.

### Drowned Observatory

**Entry:** Defeat Tide Drake. A later chapter supports Resonance after Awakening 2.

Broken telescope rings `()` rise from flooded corridors. Stars appear reflected below the floor. Repaired instruments reveal that the water is responding to a repeating signal.

- **Drain:** Exposes armored custodians and crystal caches.
- **Flood:** Opens shorter waterways with faster enemies and more herbs.
- **Encounters:** Bellwell Steps, Inverted Telescope, Pressure Vault.
- **Boss:** The Blind Astronomer. Protected lenses alternate with exposed machinery; the chosen water level changes the length of these phases.
- **Discovery:** Resonance blueprints when eligible, instrument records, and Brine Shard. This inscription changes Ice Shard from Chilled to Soaked, trading protection and Shatter setups for Conduct setups.
- **Persistence:** Water level and instrument repairs are saved. Tides use expedition progress, with no real-world schedule.

### Unfinished Atlas

**Entry:** Awakening 1 and a recorded defeat of Hollow Wyrm.

Small islands of punctuation float in blank space. Roads end in `?`; completed routes become dotted lines. The wizard is discovering how the world is written.

- **Survey:** Reliable routes and steady research material.
- **Improvise:** Harder encounters and a broader material mix.
- **Encounters:** Wandering Compass, Unwritten Bridge, Eraser Pack.
- **Boss:** The Cartographer Without a Name. Its defenses reflect the annotations gathered during that circuit.
- **Discovery:** Arcane sidegrades and Borrowed Alphabet. The inscription lets Mana Bolt borrow the previous eligible non-Arcane school's interaction at reduced base power. It trades some reliable neutral damage for sequencing options.
- **Persistence:** Save a compact map seed, checkpoint, and discovered-node set. Failed routes retain annotations. Both policies eventually complete the atlas.

### The Ink Leviathan

**Entry:** At Awakening 4, discoveries from the Observatory and Atlas produce a persistent sighting. Completing the first expedition makes it a permanent destination.

A huge silhouette moves across the atlas. Inside are `|||` rib arches, pools of ink, and fragments of swallowed books. Each circuit uncovers another part of the creature's history.

- **Recover:** Protects intact pages through slower encounters.
- **Purge:** Clears parasites more quickly and salvages damaged material.
- **Encounters:** Margin Gullet, Bone Library, Black Tide Chamber.
- **Boss:** The Leviathan's Redactor. It briefly seals one advertised spell category. The seal expires automatically, never blocks every offensive option, and leaves staff attacks available.
- **Discovery:** Advanced inscriptions and recovered chapters. Redaction lets Soul Drain harvest more remaining damage while removing its healing.
- **Persistence:** Sightings never expire. Save chamber progress and recovered pages. Repeat visits provide normal materials after unique discoveries are complete.

### Paradox Foundry

**Entry:** Awakening 3 and a recorded defeat of Aether Drake. Chaos study itself opens at Awakening 3.

Misaligned `[]` furnaces, mirrored corridors, and `?!` machinery continually rebuild an impossible workshop. The next mutation is visible before the wizard encounters it.

- **Temper:** Predictable encounter traits and steadier output.
- **Overload:** A saved sequence of stronger and weaker mutations with wider material variance.
- **Encounters:** Splinter Golems, Unmade Apprentices, Contradiction Engine.
- **Boss:** The Smith of Almost. It assembles its final traits from machinery encountered earlier in that circuit.
- **Discovery:** Advanced Chaos spells and Weighted Die. The inscription trades peak output for a more predictable sequence of outcomes.
- **Persistence:** Save the sequence and its current position. Importing the same snapshot reproduces the same sequence. Failure costs time and recovery, with discoveries retained.

### Orrery Beyond Midnight

**Reveal:** Awakening 5. **Region entry:** A recorded defeat of Stellar Behemoth. Cosmic study is available at Awakening 5 even if this region is not yet accessible.

Sparse `*` constellations form nested orbital rings around a large empty center. Every completed orbit changes the ASCII scene. Something has removed the sun from its own system.

- **Anchor:** Steady defense and predictable rewards.
- **Align:** Automatically coordinates attacks with favorable orbital phases, accepting slower setup for stronger releases.
- **Encounters:** Orbit Wardens, Moonless Pilgrims, Broken Satellites.
- **Boss:** The Empty Sun. Predictable conjunctions expose and conceal its core. Spell priorities handle those phases without manual timing.
- **Discovery:** Advanced Cosmic spells and orbital inscriptions. One proposed inscription exchanges Stardust Veil's offensive burst for sustained protection.
- **Persistence:** Orbital phase follows expedition progress. Nothing requires returning at a particular hour or date.

### Region rewards and Awakening

Keep school discoveries, route knowledge, journal entries, and unlocked inscription blueprints permanently. Current HP, combat state, and temporary effects reset with the journey. Initial region entry checks use recorded boss victories and permanent discoveries; revisiting after Awakening still requires enough current power to survive.

Awakening settles elapsed progress and already-earned rewards, then ends the active circuit and resets its combat checkpoint. A partially completed boss grants no completion reward. Landscape state and discoveries persist; an export/import during an ordinary journey resumes the saved circuit instead.

Older saves have no complete permanent boss-victory ledger. Backfill only victories provable from saved region unlocks and the current run's boss flags. Begin recording all later victories permanently. An earlier-run victory that cannot be recovered requires one new clear; the migrated journal explains that requirement rather than inferring it from Awakening count.

Start with **one equipped expedition inscription**. These rewards change a spell or policy and have a stated tradeoff. Equipping a different inscription replaces the previous one. This gives reasons to revisit regions without accumulating six compulsory global multipliers.

Use existing gold, dust, crystal, herbs, and gems. Discoveries and blueprints are finite flags. Avoid introducing a separate wallet and upgrade ladder for each region.

## Forty spell candidates

The following mechanics are proposed. Damage coefficients, mana costs, cooldowns, and prices are set through progression measurements. **Core** means part of the first 28 additions across staged releases. **Reserve** means one of 12 candidates to validate after those releases.

### Additions to the eight existing schools

| School | Core spell | Reserve spell |
|---|---|---|
| Fire | **Ember Familiar:** One temporary sprite feeds modest burns into the current target. Its attacks cannot trigger reactions. | **Flashover:** Consumes up to four seconds of the target's burns to damage two nearby enemies. Immediate clearance spends future damage. |
| Water | **Purifying Current:** Removes one damaging ailment. If it succeeds, Soaks the current target. Automatically skips when there is no ailment to remove. | **Tidepool:** Creates three healing pulses. A Water attack can spend a remaining pulse to apply Soaked instead. |
| Earth | **Clay Sentinel:** One construct with finite HP intercepts up to three attacks. Recasting replaces the old sentinel. | **Loadbearing Rune:** Commits part of the wizard's defense to the next three Earth attacks. Damage rises while protection falls. |
| Air | **Draft:** Pulls up to two nearby enemies one walkable tile toward the current target. No direct damage; prepares splash and reactions. Anchored bosses resist movement. | **Windrunner:** Grants three extra travel steps after combat using normal pathfinding. Never grants extra combat actions or crosses walls. |
| Light | **Luminous Seal:** Blocks the next ailment an enemy attack would inflict. The attack's damage still lands. | **Beacon of Mercy:** Three modest pulses heal the most injured eligible ally, including a summon. Less efficient than Greater Heal for only an injured wizard. |
| Shadow | **Hex Ledger:** Records a capped fraction of damage the marked enemy actually deals. A later original Shadow damage spell settles that debt; applying or renewing the Ledger cannot settle itself. | **Grave Echo:** Transfers one remaining Shadow damage effect to the next enemy at reduced strength after a kill. An inherited effect cannot transfer again. |
| Blood | **Transfusion:** Trades a fixed fraction of maximum HP for mana. Automatic use requires healthy HP, low mana, and a safe projected HP after the cost. | **Crimson Reserve:** Banks a capped fraction of actual overhealing, then spends it on a Blood attack. That attack cannot replenish the reserve. |
| Arcane | **Spellforge:** Spends substantial mana on three finite charges that strengthen subsequent original direct hits. | **Null Mantle:** Routes some incoming damage into mana until its finite protection budget expires. Defensive strength competes with spellcasting resources. |

Existing Arcane learn costs span 8,000 to 800,000 gold. Keep those six prices intact initially. Price Spellforge and Null Mantle against their sustained value and the income available after Awakening; neither should make learning Singularity pointless.

### Nature

**Resource:** Each enemy holds at most three Seeds. Seeds mature after a short delay. Healing, spreading, and damage compete for the same Seeds.

At the cap, new hits leave existing Seeds and their maturation clocks intact. Seeds disappear when their host dies; there is no implicit death transfer. The casting rule can wait for harvesting when useful, while ordinary attacks remain available.

| Spell | Effect and choice | Scope |
|---|---|---|
| Seedshot | A modest hit plants one Seed. Refreshing or adding a Seed never instantly matures it. | Core |
| Briar Patch | A finite patch under the target retaliates against its next three attacks. Works against stationary enemies. | Core |
| Bloom | Consumes mature Seeds on the current target to heal. Consuming two also cleanses one ailment. Automatically skips if healing and cleansing would both be wasted. | Core |
| Sporecall | Spends a Seed to plant fresh Seeds on up to two nearby enemies. Trades current maturity for future spread. | Core |
| Orchard Sprite | A temporary, nonattacking summon accelerates maturation on one target at a time. | Core |
| Wild Harvest | Consumes mature Seeds across up to three enemies for damage. Those Seeds are no longer available to Bloom. | Core |

No extra spell-slot purchases are required just to make Nature functional. Seedshot plus Bloom is a useful two-slot option in sustained encounters where Seeds have time to mature; fast clearing may favor direct healing. The whole six-spell school offers alternative specializations.

### Resonance

**Resource:** The last three eligible original non-Resonance casts form a score, such as `[F][W][A]`. Use distinct ASCII abbreviations for all schools in detailed views. Store finite values such as actual mana spent and damage dealt. Resonance consumes notes and never creates its own.

| Spell | Effect and choice | Scope |
|---|---|---|
| Unison | Consumes two or three matching notes for an armor-piercing strike. Rewards focused casting. | Core |
| Counterpoint | Consumes two or three different notes for a small protective barrier. Rewards mixed schools. | Core |
| Quiet Measure | Consumes notes to return a fraction of their recorded mana expense. Zero-cost casts cannot generate mana. | Core |
| Suspension | Consumes a note to extend one ordinary buff briefly, once per buff activation. Never restores a spent guard or extends itself. | Core |
| Clockwork Chorus | Consumes three distinct notes to summon a construct with three finite impacts, released as the wizard continues casting. | Core |
| Final Cadence | Spends the full score on one damage budget divided among nearby enemies. More targets do not create more total damage. | Core |

An eligible note is created only after a successful original cast. A delayed effect does not become another note when it resolves. The interface previews which equipped spells can feed the score.

### Chaos

**Resource:** A small, saved sequence of outcomes. Show the next outcome using text, such as `Next: Soaked`. Chaos offers controlled uncertainty with no permanent random penalties.

| Spell | Effect and choice | Scope |
|---|---|---|
| Dicefire | A moderate hit applies the next displayed condition: Burning, Chilled, or Soaked. Lower direct efficiency than a dedicated elemental spell. | Core |
| Stack the Deck | Spends mana and one action to advance the sequence once. A standing preference can seek a condition; it cannot reroll repeatedly within one action. | Core |
| Contradiction | Consumes two different conditions for a bounded burst. Gives up effects that could have enabled other reactions. | Core |
| Jester's Double | One decoy takes a single enemy attack before disappearing. A long cooldown limits continuous protection. It never copies player spells. | Core |
| Odd Bargain | Takes one small mana loan, visibly repaid from later regeneration. One loan at a time, with no compounding debt. | Reserve |
| Misprint | Converts the next ordinary enemy's gold reward into a comparable material reward determined by the sequence. Never affects bosses or awards both rewards. | Reserve |

Stack the Deck only casts when the next outcome differs from the saved preference. A cooldown and an attempt limit prevent it from monopolizing the casting priority. Automatic resource trades use a visible cap and can be disabled independently.

### Cosmic

**Resource:** Finite orbits and scheduled effects. The display shows what is held, when it resolves, and any outstanding damage owed.

| Spell | Effect and choice | Scope |
|---|---|---|
| Constellation | Links up to three reachable enemies. Subsequent original direct hits split one budget before mitigation; each recipient's defenses apply once. Improves distribution while sacrificing focus on the main target. | Core |
| Comet Procession | Pays mana up front to build three visible orbiting comets. They release automatically at the end of the charge cycle, sharing a fixed damage budget. One original cast creates the volley; its impacts are delayed secondary events. | Core |
| Borrowed Moment | Advances one eligible non-Cosmic cooldown, adding that time plus a premium to its own recovery. Select an equipped spell with a satisfied casting condition and affordable cost after this cast. At most one acceleration per target cooldown cycle. | Core |
| Redshift | Defers part of incoming damage for a short time. The visible obligation eventually resolves, giving healing time to work. Deferred damage cannot be delayed again. | Core |
| Perihelion | Withholds a bounded fraction of damage that could actually be dealt and releases it on the next valid target or at the end of its storage window. It cannot bank overkill, store its own release, or apply offense scaling twice. | Reserve |
| Causal Knot | Places one enemy attack behind the wizard's next action. It then resolves immediately unless the source has died. The same attack cannot be postponed twice. | Reserve |

Comet Procession is the main visual moment: three ASCII stars form an orbit around the wizard, then collapse toward the target. Before Awakening 5, there is no empty orbit, locked Cosmic tab, or teaser to reveal the school.

Constellation, Comet Procession, Borrowed Moment, and Redshift are all study options immediately at Awakening 5, each with its own learning price. None requires Orrery entry. Advanced spells and inscriptions may come from the region. Comet Procession creates one Resonance note on its original cast, recording mana paid and zero immediate damage; later impacts add no notes.

## Build choices and automatic casting

Keep a short ordered loadout. Add optional, readable casting rules to individual slots: `When useful`, `HP below 60%`, `Mana below 30%`, `At least 2 targets`, or a school-specific prerequisite. Sensible defaults handle ordinary use.

Healing skips when full, cleansing skips without an ailment, shields skip when already active, and conditional harvests wait until their resource exists. A skipped spell does not consume its cooldown, mana, or action. If nothing qualifies, the wizard uses its normal fallback attack.

Spellforge skips while its charges remain, Comet Procession skips while a paid volley is charging, and summons skip while their existing instance is useful. Earthward waits until a fresh activation is legal; a spent interception inside an active ward is not permission to refresh it immediately.

Save a few named presets, such as Clearing, Boss, and Safe. Optional automatic switching at encounter boundaries can select the relevant preset. It must preserve cooldowns, debt, charges, and temporary effects; switching is not a resource reset. Learning new spells remains an explicit decision.

Illustrative priorities, subject to the available spell-slot cap:

| Build | Priority example | Intended behavior |
|---|---|---|
| Storm Gardener | Bloom when hurt; Quiet Measure when low on mana; Seedshot when no Seed exists; Tidal Wave; Chain Lightning | Water and Air clear groups while Seeds provide a delayed healing reserve |
| The House Always Wins | Greater Heal when hurt; Transfusion when safe and low on mana; Earthward when a fresh activation is legal; Contradiction when two conditions exist; Dicefire | Predictable condition cycling fuels bursts while resource trades remain bounded |
| Fifth Orbit | Greater Heal when hurt; Constellation for groups; Borrowed Moment when useful; Comet Procession; Reality Tear | Cosmic shapes a charged offensive cycle while Arcane supplies decisive neutral damage |

The final order must be checked for starvation: a fast, always-ready spell must not prevent a useful lower slot from ever casting. Provide a simple loadout explanation such as `Bloom waiting for mature Seeds` or `Mana reserve protecting Greater Heal`.

Expand elemental hybrids through inscriptions first: Steam, Frost, Magma, and Gravity can modify existing spells without adding another full set of school affinities and counters.

## Events and stories

Events enter the journal as persistent opportunities. Routine outcomes follow a standing policy; unique spending decisions wait in the journal while ordinary play continues. One unresolved event can never block the simulation.

| Event | Discovery and automatic behavior | Lasting reward |
|---|---|---|
| Market of Borrowed Things | A wandering stall appears on a known route. A saved preference can accept ordinary exchanges below a player-set budget; unusual bargains wait. No automatic sale of equipped or unique items. | Trade recipes, a spell inscription, and a recurring character |
| Fallen Star | A crater remains on the atlas until investigated. Survey favors crystal; Study favors research. | An Observatory clue and a finite discovery. Before Cosmic's reveal, text does not identify that school. |
| Stranded Apprentice | Rescue follows the current expedition policy. Training runs through an optional queue. | A named helper with one utility specialization chosen later |
| Dragon Invitation | A defeated dragon leaves a standing challenge with a visible restriction. Auto-combat can retry it. | A sidegrade inscription and a bestiary chapter |
| Chalk Door | A strange door adds a short, seeded branch to a known expedition. A standing setting chooses safe entry or continued travel. | A map fragment and a persistent route clue |
| Leviathan Sighting | Observatory and Atlas discoveries reveal a large moving silhouette. It remains available until investigated. | Permanent access to the Ink Leviathan after the first expedition |

Do not queue a modal for each event, level, drop, or discovery. Put a bounded selection of highlights into the single return summary and aggregate the rest into totals. The journal keeps the permanent discoveries.

## Existing systems that grow with the expansion

| System | Expansion direction | Boundaries |
|---|---|---|
| Journal and bestiary | Region pages, enemy behavior, reaction explanations, discovered recipes, and next known leads | Unknown schools and their collection denominators remain hidden |
| Manor | Clear worker allocation and production rows; Orchard and Observatory discoveries add production choices | Reuse the existing economy; avoid a compulsory new building for every school |
| Research and Magic Tower | Projects unlock rule options and useful summaries, such as better route forecasts | Keep paid queues persistent; do not lock basic idle competence behind research |
| Alchemy | Presets for long expeditions, clear automatic-use thresholds, sustainable brewing queues | No continuous refill clicking; spending caps and existing stock limits apply |
| Golems and familiars | Utility specializations for gathering, scouting, or spell resources | Distinguish passive helpers from combat summons; enforce separate finite caps |
| Equipment and forge | A few affixes that support Seeds, guards, notes, or charged spells | Review the current gear tier ceiling before adding power; avoid mandatory new best-in-slot sets for every build |
| Trials | Challenge floors that test one mechanic clearly, with automatic retries and readable failure summaries | Enforce school gates in enemy and reward generation; keep permanent Essence progression coherent |
| Awakening | Preview retained discoveries, school unlocks, and reset resources together | Preserve existing retention upgrades; new blueprints persist, while learned spell retention follows the existing rules |
| Adventure scrolls | Later, export a compact route seed and rule set for another player to try | Entirely manual sharing, no server, no account, and no imported executable content |
| Optional vows | Later challenges such as One Flame or Empty Hands, chosen before a run | Cosmetic or horizontal rewards; ordinary progress never requires vows |

## Interface direction from AFK Wizard

The reference screenshots show a dark portrait composition, warm pale borders, large ASCII wizard and monster portraits, compact resource rows, health bars, a boxed combat chronicle, room-and-corridor exploration, and short production or spell lists. Use those visual relationships as the target. The screenshots do not establish the original game's hidden combat formulas. [AFK Wizard screenshot reference](https://afk-wizard.en.uptodown.com/android)

### Screen hierarchy

- **Home:** Wizard room, current assignment, current rank and progress, one next milestone, and concise navigation.
- **Adventure:** World, Atlas, Expeditions, and Trials. The current encounter shows a large enemy portrait, health bars, spell activity, and a short chronicle. Map and encounter are views of the same assignment.
- **Wizard:** Spellbook, school study, equipment, and character details. Put basic effect, mana, cooldown, and automatic rule together in each spell detail.
- **Sanctum:** Manor, Research, Tower, Forge, Alchemy, Golems, Familiars, and Ritual. Use a list of sections with one open at a time on mobile.
- **Journal:** Discoveries, bestiary, events, and reaction guide. Persistent opportunities live here.
- **Legacy:** Awakening and permanent upgrades, with an explicit retention preview.

Export and Import remain visible in the top utility area; Settings holds appearance and density. Preserve players' existing theme preferences. Add a faithful navy-and-cream portrait presentation without forcing a palette change on imported saves.

### Portrait composition

```text
+----------------------------------+
| ASH ORCHARD        Auto: Running  |
| Gold 12,840       Mana 180 / 240  |
+----------------------------------+
|       THE LAST ORCHARDKEEPER      |
|       HP [########......]        |
|                                  |
|             .-^^-.               |
|          __/ (oo) \__            |
|         /  \ /\/  /  \           |
|        /_T__\____/__T_\          |
|           / /  \ \               |
|          /_/    \_\              |
|                                  |
| YOU [##########....]  720 / 1000  |
| Seeds 2 ready    Guard available |
+----------------------------------+
| Bloom restores 84 HP.            |
| The roots release their grip.    |
+----------------------------------+
| Policy [Restore v]  Repeat [On]  |
| Circuit 3       [View map]       |
+----------------------------------+
| Home       Adventure     Wizard  |
| Sanctum    Journal       Legacy  |
+----------------------------------+
```

The numbers and encounter above are illustrative. Avoid fixed-width full-screen layouts in the implementation: the portrait art fits a compact character grid and the surrounding interface reflows.

### Detail and accessibility

- Match the reference's scale and hierarchy: creature art is the focal point, with compact controls around it.
- Use CSS borders and plain ASCII for scenes. Use Unicode element and navigation symbols with system fonts and readable labels, prioritizing Windows.
- Use readable body text, approximately 44-pixel touch targets, and at least 16-pixel text in editable fields.
- Keep every essential detail available through touch and keyboard. Hover may add convenience.
- Mobile gets one primary column. Desktop can show an adjacent management pane while keeping the same navigation and encounter hierarchy.
- Keep the chronicle bounded. Offer summarized or detailed combat text without growing the DOM indefinitely.
- Animate only small ASCII frame changes while visible; honor reduced motion. Never require animation to understand an effect.
- Test current Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome, including narrow screens and zoom. Printable ASCII reduces font problems; correct reflow still requires device testing.

## Engineering work required before content scales

### Enforce discovery consistently

The audit confirmed that Arcane is currently shown as a sealed card and is not protected by learning or equipping logic. A test harness at Awakening 0 can learn and equip Mana Bolt when given enough gold. Chest affinities, trial enemies, and late-region enemies can also expose Arcane early.

Use one school registry and shared eligibility checks for learning, equipping, casting, passive effects, rituals, rewards, imports, and every display surface. School visibility is a rule of the game, not only a button state.

Preserve locked content from legacy saves as dormant ownership data. Exclude it from active loadouts and bonuses until the relevant gate is met. An import must not silently delete player-owned progress. Existing names such as Cosmic Eye and Resonant Theorem can remain; they are not disclosures of the new school roster.

### Make every normal save importable

The audit reproduced a valid export containing 5,001 normally generated gear items that then fails import with `Invalid gear inventory`. Import limits gear to 5,000 and familiars to 2,000 while producers do not enforce corresponding limits.

Align acquisition limits, inventory capacity, pending rewards, and import validation before increasing loot. If a capacity rule is introduced, explain it before acquisition and provide a bounded recovery path for earned rewards. Do not silently discard items or create an unlimited overflow list.

### Share the rules used while present and away

Main estimates long absences and does not replay encounter rewards or boss clears. The draft grimoire improves some calculations but excludes chains, splash, reactions, and harvesting. The existing `0.65` kill factor is an estimate, not proof of equivalent play.

New expeditions should use the same pure advancement function in both modes. Move between meaningful event boundaries, such as cast readiness, enemy attacks, phase completion, or a reward checkpoint. Aggregate repeatable segments when their state is stable. Never replay nine hours through a timer callback for every quarter second.

Allocate the 12-hour reward allowance once for the whole absence, before dividing work into chunks or activities. Every subsystem consumes that same credited interval. Successful import or Awakening invalidates pending catch-up from the replaced state, so stale work cannot later pay into the new journey.

Carry remaining elapsed time, remaining reward allowance, and the simulation cursor together through repeat circuits, retreat, and fallback assignments. Export or a loadout change first settles pending work or serializes that exact checkpoint. A new callback never creates another allowance.

For world combat, first measure live and away performance across the actual loadout and region matrix. Replace or extend the estimator with shared mechanics before releasing schools whose main contribution cannot be represented while away. Until then, label estimates honestly.

### Save all consequential state

Persist assignment, policy, repeat setting, encounter checkpoint, rules version, RNG version and cursor, pending rewards, current effects, and resource obligations. Save Chaos's sequence, Resonance notes, Seeds and maturity, summon charges, stored damage, Redshift debt, and loan balances when those features exist.

Use separate saved random streams for map generation, combat, loot, and expeditions. Cosmetic rendering must not consume gameplay randomness. Replace random sorting with a proper shuffle. A seed alone is insufficient while import regenerates the current map; preserve its checkpoint or define a deliberate, reproducible transition.

Settle elapsed time using the old loadout before applying a new one. A save imported midway through an encounter must neither restart a reward nor erase an obligation. Snapshots remain player-owned; reproducibility keeps repeated imports consistent with the same starting state.

The reward cap never forgives an existing obligation. Redshift damage that falls due must settle even beyond the credited interval. Mana loans remain owed until eligible regeneration repays them; a timer expiring cannot erase principal. Reaching the end of an absence ages benefits and resolves obligations according to those rules.

| Transition | Resource rule |
|---|---|
| Enemy death | Remove its Seeds and ordinary marks; only explicit bounded inheritance effects may transfer |
| Next encounter or assignment | Keep the wizard's notes, paid charges, remaining effect durations, and obligations; enemy-bound state ends with that enemy |
| Retreat | Settle elapsed attacks first; deferred incoming damage and mana debt continue to follow the wizard |
| Wizard death | Settle pending incoming damage as part of that death event, then clear notes, summons, and unused charges; mana principal remains owed after recovery |
| Awakening | The preview suspends new borrowing and damage deferrals. Commit only after existing obligations settle; then reset ordinary journey effects and show the resulting eligibility |
| Export or import | Preserve every unresolved amount and clock; neither operation is a repayment, refresh, or new cast |

Cap the duration and size of loans so settling one remains a short, visible process. Loan repayment receives its share of mana regeneration before discretionary spell spending.

Exact replay applies within the same supported rules revision. A balance update migrates an active run at a defined encounter boundary, preserving earned rewards and obligations. Retaining a version number does not imply that every historical engine remains bundled forever.

Migrate already-running Crusades as legacy claims: automatically pay the already-generated reward on the first update at or after its original deadline, then remove the record atomically. The new exclusive assignment system begins without retroactively changing that promise. Restoring an older player-owned snapshot naturally restores that earlier timeline and its pending reward.

### Bound effects and work

- One original cast per action. Every secondary effect records its origin.
- Reactions, summons, inherited damage effects, and stored damage do not recursively trigger themselves, create free casts, or generate new Resonance notes.
- An initial target budget of eight simultaneous combatants, three Seeds per enemy, three notes, two combat summons in total, and one instance of each summon type.
- Recasting a summon replaces its previous instance. Lower caps may be appropriate during early progression.
- Shields, stored damage, intercepted attacks, loans, and delayed effects have finite amounts and durations.
- Mastery advances on eligible original casts; secondary events grant no extra cast credit. Every enemy pays its reward once.
- Mana refunds remain below the actual cost being refunded. Free effects cannot create a profitable resource loop.
- HP costs cannot kill through automatic casting. Include already-scheduled damage when evaluating safe resource trades.
- Bosses resist indefinite control. Movement and interruption rules have explicit immunity or duration limits.
- A Cosmic or Shadow damage budget is computed once. Splitting or storing it cannot apply offense multipliers repeatedly, bypass defense accidentally, or inflate damage meters before it lands.
- Start expeditions with at most 24 authored phases and a recap of at most 32 highlight entries. Aggregate repeated results.
- Every repeated circuit advances simulation time. Bound zero-time transitions, aggregate fast repetitions, and benchmark overpowered builds as well as ordinary ones; a phase limit alone does not bound a whole absence.
- If catch-up must be split, retain all unprocessed elapsed time. No iteration cap may silently throw time away.

### Preserve compatibility and footprint

Use stable region IDs. Do not insert new regions into the existing zone array and thereby change saved destinations, loot tiers, or index-based reward formulas.

If PR 2's v28 format lands first, the expansion becomes v29 with migration coverage for older saves. Preserve the existing pre-v27 XP migration boundary, the v28 Earthward guard state, active projects, and atomic import rollback.

The initial proposal targeted 400 KiB. The complete core expansion uses a revised
documented ceiling of 500 KiB uncompressed, including all art, styling, data, and
mechanics. The HTML remains the only runtime file. Shared region templates and
compact data limit growth; authoring fragments, this document, and development
tests remain outside the runtime payload. The tests enforce the release ceiling.

## Balance measurements

Build a matrix of the ten existing regions and six expeditions at eligible Awakenings 0 through 5. For each progression band, exercise at least two sustainable automatic loadouts, including a simple existing build and a new mechanical build.

Measure ordinary and boss kill time, deaths and recovery, mana sustainability, net gold and materials, spell affordability, mastery growth, and the same build's away results. Review the gear system's current six-tier ceiling before extending late-game item power.

Initial guardrails for tuning:

- Preserve baseline progression times within roughly 15% where a region is not intentionally being rebalanced.
- Price new spells by the time and alternatives required to afford them at their unlock stage. Avoid setting prices from Awakening count alone, because gold resets.
- Chaos may vary individual encounters while remaining bounded over a full outcome sequence.
- Cosmic can deliver exceptional planned bursts while charging the full mana, time, and slot cost. Arcane remains valuable in those builds.
- Side regions should trade general income for a different material mix or a discovery. No region should dominate every resource and combat reward simultaneously.
- Additional spell slots are not the default answer to build friction. Verify that useful two- and three-spell combinations exist.

## Delivery sequence

| Release | Scope | Spell count after release | Exit condition |
|---|---|---:|---|
| Foundation | Integrate PR 2 with main's lifecycle fix; school enforcement; importable inventory; effect contracts; away measurement | 52 | Existing behavior and save migrations pass; hidden lifecycle regression stays fixed |
| Orchard | Shared assignment engine, policies, journal, reference-inspired encounter layout; Nature six; Ember Familiar, Purifying Current, Clay Sentinel, Draft | 62 | One expedition completes, repeats, saves, imports, and resolves away identically |
| Observatory and Atlas | Two regions; Resonance six; Luminous Seal, Hex Ledger, Transfusion, Spellforge; spell presets | 72 | Mixed builds have sustainable mana and useful casting priorities; Arcane remains a major Awakening reward |
| Leviathan and events | Permanent sighting, Leviathan region, event journal, inscriptions, first Market and apprentice stories | 72 | Events never block automatic play or create modal queues; repeat rewards stay bounded |
| Foundry | Chaos four, saved outcome sequence, Foundry policies and boss | 76 | Outcomes reproduce across export/import; no condition or reroll loops |
| Orrery | Cosmic four, strict Awakening 5 reveal, Orrery region and orbital presentation | 80 | Hidden surfaces and delayed resource obligations pass all checks |
| Selective additions | Eight existing-school reserve spells plus two Chaos and two Cosmic candidates | Up to 92 | Each candidate supports a demonstrably different build and stays within footprint and simulation budgets |

Sequence can overlap in design and art production. Runtime systems and releases follow the dependency order above. Exact coefficients and purchase prices are resolved in the corresponding balance pass.

## Acceptance checks

1. **Idle completion:** Every expedition and boss can complete with a suitable automatic loadout. Events never require immediate input. Repeat mode needs no reward claiming.
2. **Hidden schools:** Inspect every UI and reward path at Awakenings 0 through 5. Cosmic has no identifying teaser before 5. Arcane has no identifying card, enemy label, or affinity reward before 1 and cannot be learned, equipped, or applied early, including through import.
3. **Exact expedition parity:** Within the same supported rules revision, the same state and seed produce identical integer rewards and completion state through small visible advances, one nine-hour absence, and an export/import midway. Floating accumulators differ by at most `1e-6`.
4. **World parity:** Target live versus away average gold and XP within 5% across a fixed seed suite and legal build matrix. Check survival, mastery, materials, and unlock behavior separately. This is a release target, not a claim about the current estimator.
5. **Time ownership:** New World, Trial, and expedition rewards never overlap for the same wizard time. The only grandfathered exception is the previously generated reward of a legacy Crusade, paid once under its original rules. Repeated lifecycle notifications, interrupted imports, and repeated reward claims cannot double-pay.
6. **Performance:** Benchmark a twelve-hour worst-case catch-up on a recorded reference device. Aim for under 50 ms of simulation work, excluding rendering; otherwise process bounded chunks without dropping elapsed time or freezing input. Perform a real Chrome overnight soak in addition to simulated lifecycle tests.
7. **Save integrity:** Round-trip old fixtures and every new resource state, including full legal inventories, completed and pending rewards, RNG position, Redshift debt, notes, Seeds, and summon charges. Failed imports leave the existing game intact.
8. **Build integrity:** Exercise reaction chains, cooldown manipulation, overhealing, delayed damage, boss control, summon replacement, and priority starvation. No infinite loop or unlimited resource growth is permitted.
9. **Presentation:** Check desktop and narrow mobile layouts, keyboard and touch, high contrast and reduced motion, long numbers, and imported names. Verify illustrations and map cells remain plain ASCII; verify Unicode UI symbols render on Windows and survive UTF-8 Base64 save imports.
10. **Portability:** One HTML file, no runtime network access, no browser persistence, no external assets, and an explicitly measured size within the project's budget.

## First implementation package

Begin with the foundation and Ash Orchard. They establish the shared mechanics needed by every later destination: enforced school eligibility, reliable save boundaries, automatic policies, deterministic expedition progress, bounded summaries, and meaningful Seeds. In parallel, author the remaining regions and spell data against those contracts.

This gives each later release a clear identity: the Orchard grows, the Observatory conducts, the Atlas rewrites, the Leviathan remembers, the Foundry mutates, and the Orrery controls the moment of impact.
