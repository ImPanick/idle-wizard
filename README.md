```text
      /\
     /.*\        ASCII IDLE WIZARD
    /_.._\       [ explore | study | become ]
      ||
    __||__
```

# ASCII Idle Wizard

A complete ASCII idle RPG in **one HTML file**. Open it in a current browser
and play. No installation, build step, dependencies, external assets, accounts,
telemetry, or browser storage. The game makes no network calls.

The whole adventure is under **500 KiB** of HTML, CSS, and vanilla JavaScript.
Keep it on a USB stick, open it locally, or host the same file wherever you like.
Your progress lives in memory. **You decide when to export it and where to keep it.**

## Start playing

1. Download [ascii-idle-wizard.html](ascii-idle-wizard.html) and open it in a browser.
2. Your wizard explores and fights automatically. Use **WASD** or the **arrow keys**
   to move manually. Hover over enemies, chests, and equipment for details.
3. Learn spells in **Wizard -> Elements**, arrange their priority in **Spellbook**,
   and equip your finds in **Equipment**. Each action chooses the first ready,
   affordable useful spell. Waiting slots eventually receive a turn; urgent
   healing gets priority. Casting conditions and three saved builds give you
   control over how your wizard spends mana.
4. Defeat a zone's dragon to open the next path. New ranks unlock more of your
   sanctum; milestones appear in the live field notes.
5. Before leaving, choose **Export save** and keep the code or download its text
   file. Choose **Import save** to continue later, including on another device.

There is **no autosave**. Closing or reloading the page discards progress made
since your last exported snapshot.

## Find your way around

The interface puts an ASCII encounter portrait and health bars at the center,
with a map view one click away. It groups related systems into chapters
and adapts the navigation for smaller screens. Equipment crafting, gems, and
detailed character attributes fold away when you do not need them.

Fourteen detailed character and creature portraits and six illustrated
expedition scenes use plain ASCII. Each drawing keeps its character alignment
as a single centered block, including on narrow screens.

**Choose your pace:** Settings offers 1x, 2x, 4x, 8x, 16x, 32x, 64x, 128x,
and 256x game speed from the start. Combat, movement, Trials, expeditions,
research, brewing, rituals, and passive production all accelerate. The screen
updates at its usual pace. Your speed survives Awakening and manual save
export/import; older saves start at 1x. Away progress also uses the saved speed,
with the existing limit of **12 game hours per absence**. The recap shows real
time away separately from credited game time. Countdown timers show game time;
the Pulse shows rates per real second. Acceleration is a player choice,
including when rebuilding progress after losing a save.

| Chapter | Contents |
|---|---|
| Adventure | Encounter portraits and map, atlas, Pinnacle Trials, six Expeditions, Journal |
| Wizard | Spellbook, elemental study, equipment, inventory, gem sockets, gear combining |
| Sanctum | Manor, Research, Magic Tower, Legendary Forge, Alchemy, Golems, Familiars, Ritual |
| Legacy | Awakening preview and permanent upgrades |

Field notes show your next milestones, current encounter, recent earning and
damage rates, and the adventure chronicle. Export and import stay at the top.
Appearance and density controls live under **Settings**.

There are **7 palettes**: Field Grimoire, Midnight Grimoire (default), Dark Forest,
Light Warm, Light Blue, Amber CRT, and High Contrast. Your exported save includes
the selected palette and density. Reduced motion follows your system preference.

Portraits, landscapes, and map grids use **plain ASCII**. Map glyphs occupy one
character each, and font ligatures are disabled. Element and navigation symbols
use richer Unicode glyphs with system font fallbacks, prioritizing Windows.
There are no external assets, icon fonts, or downloaded fonts. Mobile layouts
remain responsive, with readable navigation labels.

Visible Unicode names retain their original characters in saves and on screen.
Labels are escaped as HTML, and invisible controls use `[U+XXXX]` notation.
UTF-8 Base64 saves preserve the text independently of the device's glyph fonts;
older direct Latin-1 saves remain importable. The game requires a current browser.

| Key | Action |
|---|---|
| `WASD` / arrows | Move the wizard |
| `Tab` / `Shift+Tab` | Move between controls |
| `Enter` / `Space` | Activate a focused button or disclosure |
| `Escape` | Close an export/import dialog |

## A world inside the file

- **10 zones**, from Verdant Meadow to Eldermyst, plus treasure dungeons.
- **12 discoverable schools and 80 spells**: damage, healing, buffs, summons,
  damage over time, lifesteal, true damage, finite resources, and spell interactions.
  Arcane remains expensive and powerful, appearing after the first Awakening.
- **6 passive elemental combinations**, including Eclipse, Steam, and Bloodmoon.
- **3 combat reactions**: Conduct, Wildfire, and Shatter. Conditions, spell order,
  and nearby enemies give individual spells different jobs.
- **Spell mastery** grows with successful casts, up to level 10 at 20,000 casts.
  Each mastery level improves a spell's effect by 5%; mastery survives Awakening.
- **5 equipment slots, 6 tiers, and 5 rarities**, with sockets, cumulative set
  bonuses, gear combining, guaranteed-rarity crafts, and **8 unique legendaries**.
- **11 manor buildings**, material-gathering golems, and **8 familiar types**.
- **13 research projects**, a passive XP ritual, and alchemy with potion quality,
  brewing queues, and configurable automatic use.
- **Six expedition regions** with standing policies, repeat circuits, automatic
  rewards, saved encounter progress, persistent landscapes, and sidegrade inscriptions.
- **Six journal events**, including a market with capped standing exchanges,
  a utility apprentice, a seeded Chalk Door branch, and a dragon challenge.
- **Pinnacle Trials**, an endless boss tower whose
  Essence upgrades persist across Awakening.
- **19 Awakening upgrades**, including permanent unlocks and options to retain
  equipment, spells, familiars, and research between journeys.

## The living grimoire

### Four new disciplines

| School | Unlock | Choices |
|---|---|---|
| Nature | Complete Ash Orchard | Grow up to three Seeds per enemy; spend them on healing, spreading, or damage. |
| Resonance | Awakening 2 | Collect three casting notes; spend their paid mana and school diversity on refunds, protection, or finite echoes. |
| Chaos | Awakening 3 | Preview a saved condition sequence, manipulate it, then consume contrasting conditions or summon a decoy. |
| Cosmic | Awakening 5 | Prepare finite comet volleys, distribute a shared damage budget, borrow cooldown time, or defer incoming damage. |

Cosmic names and controls remain hidden before the fifth Awakening. Its four
spells become available at that point; entry to its expedition additionally
requires defeating Stellar Behemoth. Delayed incoming damage always settles,
including beyond the idle reward cap. Awakening waits until obligations clear.

Each existing school also gains one spell: Ember Familiar, Purifying Current,
Clay Sentinel, Draft, Luminous Seal, Hex Ledger, Transfusion, and Spellforge.
The original six Arcane spells retain their prices and power.

Choose conditions beside equipped spells. Save builds for clearing, bosses,
and survival; optional automatic switching selects them at encounter starts.
Expedition profiles commit spell priorities, rules, and inscriptions at each
encounter boundary. Their changes take effect on the next encounter. Character
stats are recalculated when an encounter or a newly reached threshold starts.
HP and mana conditions activate when their threshold is reached and keep that
spell available for the rest of the expedition encounter.

### Six places to leave your mark

| Expedition | Entry | Persistent choice |
|---|---|---|
| Ash Orchard | Ember Drake | Restore irrigation or burn roots; discover Nature and Ashglass. |
| Drowned Observatory | Tide Drake | Drain machinery or flood its channels; recover Brine Shard. |
| Unfinished Atlas | Awakening 1 and Hollow Wyrm | Survey or improvise roads; retain annotations and Borrowed Alphabet. |
| Paradox Foundry | Awakening 3 and Aether Drake | Temper or overload seeded machinery; recover Weighted Die. |
| Ink Leviathan | Awakening 4 and Observatory/Atlas discoveries | Recover books or purge ink; resist a temporary category seal and discover Redaction. |
| Orrery Beyond Midnight | Awakening 5 and Stellar Behemoth | Anchor or align saved orbital phases; recover Orbital Veil. |

An expedition becomes your wizard's active assignment, sharing HP, mana,
ritual costs, and production. It repeats automatically unless you disable repeat.
Two dangerous encounters return the wizard safely to World. Discoveries, journal
choices, landscapes, and inscription unlocks survive Awakening; the active
circuit ends. One inscription may be equipped, each with a stated tradeoff.

Journal opportunities wait without expiring or opening interrupting dialogs.
Earlier Crusades deliver their promised reward once at their original deadline.

### Original reactions

Eight spells now do more than scale their damage. Their descriptions appear
directly in the equipped slots; the folded **Reaction field guide** suggests
pairs and shows whether you have learned or equipped them.

| Spell | What it does |
|---|---|
| Spark | Burns for 25% of the damage actually dealt, spread over 3 seconds. |
| Ice Shard | Applies Chilled for 4 seconds, reducing enemy attack rate by 40%. |
| Tidal Wave | Splashes 40% damage onto up to 2 nearby enemies and applies Soaked for 6 seconds to everyone hit. |
| Chain Lightning | Jumps to 2 additional enemies, dealing 55% then 30% damage. |
| Quake | Splashes 45% damage onto up to 3 nearby enemies; Fractured reduces their defense by 30% for 6 seconds. |
| Earthward | Keeps its defense buff and reduces the next incoming hit by 40%. |
| Holy Smite | Deals 50% more damage to targets at or below 30% health. |
| Soul Drain | Harvests up to 2 seconds from each active damage-over-time effect for immediate damage, retaining its 60% lifesteal. |

| Reaction | Setup, then trigger | Result |
|---|---|---|
| Conduct | Tidal Wave -> Lightning Bolt or Chain Lightning | Consumes Soaked for a 35% bonus strike on the main target and up to 2 nearby enemies. |
| Wildfire | Spark -> Gust (or another Air damage spell) | Transfers the main target's burns to up to 2 neighbors at 60% strength, preserving remaining duration. Requires a nearby enemy. |
| Shatter | Ice Shard -> Stoneblow (or another Earth damage spell) | Consumes Chilled for a bonus hit worth 50% of the triggering hit, ignoring defense. |

Put the setup spell earlier in your priority list; cooldowns and mana determine
when each spell actually fires. Burning, Chilled, Soaked, and Fractured appear
with timers and explanations in the Encounter panel and enemy tooltips.
Earthward's guard shows whether it is ready or already spent.

Splash and reaction range is 3 map steps; Quake reaches 2. Each Chain Lightning
jump can travel 3 steps from the previous target. Distance counts horizontal
plus vertical steps, and walls or blocked corners stop secondary hits.
Reapplying the same condition refreshes its duration rather than stacking it.
Only the primary hit triggers reactions; splash, chains, and reaction hits do
not start another reaction. Defeating a secondary target leaves the current
engagement intact.

## Progression and time

Level requirements follow the world's reward curve, so later regions remain
reachable without the old runaway exponential XP requirement. Trials use a
steadier difficulty curve. Healing scales with a developed wizard, repeated
damage effects refresh sensibly, and familiar gains have diminishing returns.
The damage meter counts damage actually dealt, including staff attacks and
damage over time; overkill does not inflate it.

Awakening requires **level 24 and defeating Ember Drake in the current journey**.
The preview shows the Spark you will earn from your level and deepest unlocked
region. Each Awakening increases both difficulty and rewards.

The simulation uses elapsed time with 250 ms steps. Short timer delays are
processed in bounded batches when the browser runs the game again. Spell
cooldowns recover during travel and while automatic exploration is disabled.

Hidden tabs suspend their simulation and rendering. Returning to the page
accounts for the absence once, then restarts one timer. Long absences produce
one recap; if you leave again before dismissing it, that same recap accumulates
the new gains. Each absence retains the 12-hour reward cap. Temporary effects
age by the full absence, including time beyond the reward cap.

For gaps longer than a minute, or when importing an older snapshot, the game
estimates up to **12 hours** of idle progress. Estimated combat rewards account
for your loadout and survivability and require Auto-Explore to be enabled.
Passive income, golem production, rituals, paid research, and brewing can also
advance. This estimate does not replay each encounter or award boss clears and
gear drops. Existing spell builds use a conservative single-target estimate.
Builds with expansion spells use a sustainable profile that models bounded
spell interactions; World rewards remain estimates rather than encounter replays.
Long interruptions end an active dungeon or Trial run.

Expeditions use one chronological resolver for visible play and catch-up. It
advances saved travel, combat, recovery, and branch checkpoints; circuit rewards
and seed order match across small steps and long jumps in the tested scenarios.
They share the same 12-hour reward cap. Paid effects age through the full absence.

## Your save belongs to you

**Export save** opens a snapshot of the current journey. Copy the code, select it
for manual copying, or download a `.txt` file. Opening the dialog alone does not
store a copy anywhere. Paste the code into anything that holds text and keep it
where you choose.

**Import save** accepts pasted codes or local text files. Importing replaces the
current journey. Invalid saves are rejected without partially overwriting your
character. Codes support Unicode, whitespace, line wrapping, and URL-safe base64.

The current save format is **v29**: UTF-8 JSON encoded as base64. It includes
active research, brewing progress, spell cooldowns, mastery, equipment, UI
preferences, whether Earthward's guard is available or spent, the world's map
and encounter checkpoint, expedition phases, discoveries, journal choices,
casting rules/presets, seeded sequences, summons, notes, and delayed obligations. Saves older
than v27 migrate to the new XP curve while preserving the hero's level and
fraction of progress toward the next level. Pre-v5 saves retain the
legacy migration that resets incompatible equipment, gems, and legendaries.

Older saves without world checkpoints regenerate their map. Previously
exported codes remain usable, and **Settings -> Start over** only resets the
current in-memory journey.

New ordinary gear drops at a full 5,000-item inventory turn into dust. Paid
crafting and manual unequipping require space; older oversized inventories stay
intact on import. Save codes and imported files accept up to 32 MiB.

## Footprint and development

| Resource | Game requirement |
|---|---|
| Files | One HTML file, under 500 KiB |
| External assets / services | None |
| Cookies / browser storage | None |
| Build step / dependencies | None |
| Persistence | Only the save codes or files you choose to keep |
| Clipboard / downloads | Used when you select the corresponding export action |

Use a current browser: the interface uses modern CSS features such as
`color-mix()` and `:has()`, as well as optional chaining and `TextEncoder`.

The optional regression suite uses Node's built-in test runner. No package
installation is needed; from the repository root, run:

```sh
node --test tests/*.test.cjs
```

Tests cover progression, Trial rewards, generated-map connectivity, damage and
healing, cooldowns, elapsed time, manual save round trips, older-save migration,
invalid-save rejection, idle project completion, spell/reaction mechanics, and background lifecycle behavior.
The deterministic lifecycle suite simulates nine-hour absences, repeated hidden
wakeups, page restoration, recap accumulation, save replacement, short stalls,
and deferred Trial transitions. These tests do not claim browser layout,
cross-browser coverage, or a real overnight device soak. Expansion tests also
cover school gates, finite spell budgets, inscriptions, save checkpoints,
shared ritual resources, and all six expedition routes across small steps and
long catch-up periods.

Optional authoring fragments live in `dev/`. After editing one, run
`node dev/embed.cjs` to refresh its section of the HTML. Players only need the
HTML; neither this utility nor any development files are runtime dependencies.
See [the expansion blueprint](docs/EXPANSION_PLAN.md) for the design and the
twelve reserve spells that remain candidates for a future release.

## Credits

By **Joseph Jeffrey**, in collaboration with Claude.

ASCII art and game design by the author. Inspired by the tradition of games
that fit in a single HTML file: a small, portable world you can open, inspect,
and carry with you.

## License

See repository for license terms.
