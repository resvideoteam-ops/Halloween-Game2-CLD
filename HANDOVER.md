# Handover — Halloween Ikura Blaster

State as of 2026-09-09. Written so a fresh session (or a different Claude account) can pick this
up without re-deriving anything.

## The one urgent thing

**Nothing since the very first deploy has been pushed.** The live site still runs the original
three-enemy build, which is why it 404s on enemies 9/10/11 and why it still behaves the way the
first screenshots showed. Two commits are prepared and waiting on a `git push` the user has to
run themselves — see below.

A commit is prepared but the scratchpad it lives in is session-scoped and may be gone. If so,
re-create it: clone `resvideoteam-ops/Halloween-Game2-CLD`, copy in the files below, push.

Files that must go up together — uploading `index.html` alone makes things **worse**, because the
code now expects the *new* enemy2/enemy3 models and would render the old ones lying on the floor:

| File | State |
|---|---|
| `index.html` | changed |
| `assets/enemy2.usdz` | replaced (Grim Reaper, Y-up) |
| `assets/enemy3.usdz` | replaced (bat, Z-up, rigged) |
| `assets/enemy6…11.usdz` | new |
| `assets/panorama.jpg` | new |
| `assets/coin.usdz` | new (gold coin, repacked from Gold-Coins.usdz) |
| `assets/header.png` | new (Trick or Blast title art) |

`enemy1/4/5.usdz` are unchanged. About 20 MB total; GitHub's web uploader caps a commit at 25 MB,
so it fits — but never drag `assets_original_2048/`, it is ~66 MB of pre-shrink backups and will
blow the limit.

**Filename case matters.** `header.png` arrived as `Header.png`. macOS is case-insensitive so it
worked locally and would have 404'd on GitHub Pages. Before any upload, check every `assets/…`
path in `index.html` against the real filenames.

Claude cannot push here: no `gh` CLI, and `git push` needs the macOS keychain which the sandbox
cannot reach. Prepare the commit, hand over the command.

**The user deploys through GitHub's web uploader, not `git push`.** That has bitten once already:
five "Add files via upload" commits landed on `origin/main` while a prepared local branch sat on
the shared parent, so the histories diverged and `git push` would have been rejected. Before
preparing anything, `git fetch` and check `origin/main`. If it has moved, `git reset --hard
origin/main`, copy the working files over the top and commit once — the working tree at
`/Users/alex.khawlk/Documents/SOFTWARES/3D AR Halloween` is the content source of truth, the
remote is the history source of truth. Diff their upload against the last known commit first, in
case they hand-edited something.

**The web uploader silently skips dotfiles.** `.nojekyll` and `.gitignore` were both missing from
the deployed site, so GitHub was running Jekyll over ~20 MB of binary assets on every build. If a
deploy is mysteriously slow, check `.nojekyll` is actually in the repo.

**Each upload commit is its own Pages deployment, and they queue.** Uploading five batches means
five serial builds; that is what "17 minutes still processing" was, not a stuck build.

## The screens

`#coverScreen` (full-bleed `assets/cover.jpg` + START GAME) → `#startScreen` ("How To Play":
the rules, the level picker, the name field, PLAY) → the game. Both are `.overlay` divs toggled
with the `hidden` attribute.

The **enemy-1 preload gates the cover button**, not PLAY. The wait then happens on the artwork
rather than on a form, and PLAY is always live by the time anyone reaches it.

**The cover is composed in HTML, not shipped as one flat 9:16 picture, and that was learned the
hard way.** A single image has to be fitted to the viewport, and both ways of fitting it broke:
`object-fit:cover` cropped the baked-in title off the sides of a tall phone (the "!" went
missing), and `contain` letterboxed it savagely the moment the on-screen keyboard shrank the
visual viewport — because `syncVisualViewport()` applies that height to `#app`, so the container
went short-and-wide and the image fitted to its height instead. Absolutely positioning the
button at a fixed offset from that same moving container is what made it disappear.

What works: `assets/cover-bg.jpg` (the artwork with the baked title cropped off) as a
`background-size:cover` backdrop, which cannot letterbox; `assets/header.png` as an `<img>` that
just scales to its container; and the button in **normal flow** underneath, so nothing can push
it off. `.overlay` also gained `overflow-y:auto` so a keyboard-shrunk viewport can still scroll
to reach the buttons. Verified at 390x660 and at 390x380.

**Never write `#app`'s size from JavaScript.** `syncVisualViewport()` used to force `#app` and
`body` to `visualViewport`'s pixel height. While a mobile browser's toolbars are showing, the
visual viewport is shorter than the layout viewport *and* can sit at a non-zero `offsetTop` — so
a `position:fixed` `#app` sized from it came out both too short (a black strip above the browser
toolbar) and shifted up (the title art cut off at the top). `#app` is now plain
`position:fixed; inset:0; height:100dvh` and CSS owns the geometry; the function only *measures*
`app.clientWidth/clientHeight` and points the renderer at it. `dvh` already tracks dynamic
toolbars, which is the whole problem the JS was trying to solve badly.

**The overlays must be `position:fixed` with `100dvh`, not `absolute` inside `#app`.** `#app`'s
height is whatever `syncVisualViewport()` last measured. Whenever that measurement and the
actually-visible area disagree — a dynamic browser toolbar, an open keyboard, standalone mode
after Add to Home Screen — an `absolute` overlay is the wrong size and its content gets clipped
off the top. That is what cut "TRICK OR BLAST!" in half on a real iPhone while measuring
perfectly at 390x660 in a desktop browser. `fixed` + `100dvh` tracks the viewport itself, and
`env(safe-area-inset-*)` padding keeps content out from under the status bar. The title also
carries `max-height:32vh` + `object-fit:contain` so it shrinks rather than overflowing, and
`.startCard` has `max-height:100%; overflow-y:auto`.

Checked at 320x568, 390x380, 390x660 and 430x932: title and button fully on screen, and
`document.elementFromPoint` at the button centre returns the button at every size — which is the
check that actually catches "the button is not clickable", since a clipped or covered button
still reports a sane bounding box.

**`el.hidden = true` DOES NOTHING to any element this file styles with `display`.** `hidden` is
only a UA-stylesheet rule (`[hidden]{display:none}`), so any author `display` declaration beats
it — and `.overlay` sets `display:grid`, `.cover` sets `display:flex`. Toggling `.hidden` set the
attribute and left the element on screen, so START GAME looked completely dead: the click fired,
the state changed, the cover stayed put. There is now a global `[hidden]{display:none!important}`
rule. The original author had hit the same thing and patched it for `#results`, `#loadingBox`
and a few others individually — which is why it looked safe to reuse.

**The lesson that cost the most here: verify the computed style, never the attribute.** Every
check I ran said `coverScreen.hidden === true` and passed, while the user stared at a cover that
had not moved. `getComputedStyle(el).display === 'none'` is the assertion that catches it, and
`document.elementFromPoint` at a button's centre is the one that catches a dead button.

**Do not dismiss a full-screen splash on `pointerup`.** A pointerup left over from a press that
began before navigation lands on the fresh page and skips the splash instantly. Use `click`
(which needs press and release on the same element) plus a short time guard after load.

**A primary button that quietly refuses is reported as broken.** PLAY blocks on an empty name,
and the only feedback was a small red hint under the field — reported twice as "the button does
nothing". It now shakes the field, shows a full-screen ENTER YOUR NAME banner, and focuses the
input. Any future blocking validation on a main button needs the same treatment.

**Never auto-focus the name field on arrival.** Doing it on the cover button opened the keyboard
immediately, which shrank the viewport and wrecked the layout before the player had touched
anything.

Camera AR and the desktop preview are both still wired and working, just `hidden` off the
player's path (preview is dev-only via `?dev=1`/localhost). Nothing was deleted.

## How the code is organised

One file, `index.html`. three.js r184 from a CDN importmap, no build step.

Everything about an enemy lives in the **`ENEMIES` table** at the top of the script — name, file,
height in metres, up-axis, HP, spawn weight, score, motion, arc, optional `near`/`far`/`yaw`.
The settings grid, the HUD and the jump buttons are generated from it. Adding an enemy is one row
plus a file; nothing else in the code counts enemies.

Current roster: 11. Enemy 2 is the reaper (1.8 m, grounded, HP 10, its own 2.4–3.2 m range because
a 1.8 m model cannot fit in the frame at 1 m). Enemy 3 is the bat — rigged, wings and legs driven
from bone rotations. Everything else is a static prop that hovers.

Four systems sit alongside that table, each self-contained and each with its own settings block:

- **Sound** (`SFX`) — every sound is synthesised from oscillators and one shared noise buffer, so
  there are no audio files to download. iOS will not create an AudioContext outside a real user
  gesture, so `SFX.unlock()` is called from the start buttons and from the first canvas tap.
  There is a mute toggle in the HUD, persisted in localStorage.
- **Gold coins** (`coins`) — a bonus track, deliberately NOT an `ENEMIES` row: a coin has no HP,
  no death animation and no arc of its own, and a table row would have meant special-casing every
  loop that walks that table. Ten per round, `cfg.coinBonus` each, up to `cfg.coinLive` on screen,
  spun about Z. `pickCoinSpot` retries up to 14 times to keep a coin clear of the live enemy and
  of the other coins.
- **Sushi Angel** (`angels`) — the one thing that must NOT be shot: a direct hit costs
  `cfg.angelPenalty` (1000). It does not hover, it **crosses**: one sweep of the front arc at a
  radius set just outside the live enemy, so it passes behind whatever is being shot at. The
  fairness rule is the whole design — the angel is hit **only** by a direct ray, and no aim
  assist anywhere can pull a shot onto it, because a penalty the game aimed for you would be
  indefensible. It announces itself with a chime, a cyan aura and a DON'T SHOOT banner.
  The real `assets/angel.usdz` is in place (repacked 8.7 MB → 1.9 MB). A procedural
  nigiri-with-halo placeholder still stands in automatically if the file is ever missing, and the
  test panel reports which of the two is live.
- **Brand tokens** — 16 sponsor discs mixed in with the gold coins, worth `cfg.brandBonus`
  (500) against a coin's 100. `cfg.brandChance` (40%) decides how often a due pickup is a brand
  rather than a coin; they share the coins' group, schedule, cap, clearance and collect path
  entirely. **They are not reskins of `Brand-1-GKK.usdz`** — that model's UV atlas scatters its
  artwork across a dozen islands, so a flat logo cannot be pasted into it. The supplied PNGs are
  finished renders of the whole token, rim and shading included, so each is the face of a
  billboarded `CircleGeometry` instead. That is why 16 brands cost 0.46 MB rather than the ~4.5 MB
  sixteen copies of the model would have. CircleGeometry's UVs map the texture's inscribed circle
  onto the disc, which is exactly how the artwork was cropped, so no alpha channel is needed.
  Adding brand 17 is one JPG in `assets/brands/` plus one code in `BRANDS`.
  They **sway about Z like a hanging coin rather than spinning** — a full rotation would carry a
  sponsor's wordmark upside down.
- **Mystery box** (`boxes`) — shoot it for one random effect from a weighted table: a coin drop
  (bonus coins that ignore the round quota on purpose), **weak cannon** (0.6× size and 0.5×
  damage for 9 s) or **dizzy** (yaw and roll mirrored for 7 s, pitch left alone so the player can
  always find the floor again). Direct-ray only, same rule as the angel — two of three outcomes
  are handicaps and no assisted shot may ever land one. Only one effect runs at a time, always
  named on screen with a countdown pill. Gated per level — see the LEVELS note below.
- **Floor mist** (`mist`) — 16 soft cards in the lowest half-metre, billboarded about Y only and
  drifting around the player. Not `scene.fog`: fog would tint the enemies while leaving the camera
  passthrough behind them untouched, which reads as a bug.
- **Player name** — required before any round starts, stamped on every leaderboard entry, and
  remembered in localStorage. Scores saved before names existed render as `PLAYER`.

## Traps worth knowing

**Texture memory is the recurring failure.** Source models ship 2048² and often 4096² maps; a 4096
map is 64 MB decoded and one model can cost 144 MB. iOS Safari dies around the third one, and it
surfaces as "failed to load" even though the file is fine. Every asset here has been repacked to
1024 colour/normal and 512 metallic/roughness, same filenames, stored (uncompressed) zip, root
layer first. Do the same to anything new. Originals are in `assets_original_2048/`.

**Up-axis.** Some exports are Z-up and load lying face-down. The table's `up:'Z'` fixes it. If the
model then shows its back (the donut did), add `yaw:180`.

**Skinned meshes need `SkeletonUtils.clone`.** A plain `.clone()` leaves the copy bound to the
original skeleton, so the mixer animates bones nothing is attached to and the model looks frozen.

**iOS Safari has no positional tracking.** Orientation only. Walking moves the whole scene with
you; this is a platform limit, not a bug. Real world-locked AR needs AR Quick Look (a viewer, no
game logic), a native ARKit app, or a browser SLAM SDK. Android's WebXR path here does give 6DoF.

**Lighting.** Metallic models render near-black without an environment to reflect. `RoomEnvironment`
+ ACES tone mapping at exposure 0.9 is the combination that works — copied from the user's Lucky
Cat AR3 build (`../3D AR/AR3`), which they consider the benchmark. Keep ambient low; ambient light
is what flattens contrast.

## How it should feel

A shooting gallery, not a hunt. The user reacted strongly to having to turn and search. Keep arcs
near 90°, distances 1.3–2 m, never spawn behind, drift each spawn from the last bearing rather
than drawing independently, and keep targets off dead centre. The cannon muzzle reaches ~0.62 m
from the eye — anything closer clips through the barrel.

Format is a **2-minute time attack** ending in a leaderboard (localStorage, top 10).

## Traps that have already bitten twice

**Instance scale must multiply the normalisation scale, not replace it.** The coin template was a
single wrapper carrying its own fit-to-size scale; setting `instance.scale` then wiped that out,
and because the source model is only a few hundredths of a unit across, every coin came out a
fraction of the size asked for. It now uses two wrappers — `norm` holds the fit, `pivot` is left
at scale 1 for the instance. Any future model loaded this way needs the same shape.

**`DeviceOrientationEvent.requestPermission()` must be called before the first `await`.** iOS
grants it only from a live user gesture, and any await consumes the tap. `startAR` always did
this correctly; `startPanorama` asked *after* awaiting the panorama texture, so the entire 360
mode — the default entry point — ran with no head tracking on every iPhone. If the gyro is dead,
check the call ordering first, then read the Gyro line in the test panel.

**iOS treats a WebAudio-only page as *ambient* audio.** The hardware ring/silent switch mutes it
outright and the volume buttons move ringer volume instead of media volume, so an iPhone plays
nothing while every other device is fine. The graph is now routed out through an `<audio>`
element on iOS only, which makes it ordinary media playback and ignores the switch; everything
else keeps the direct output. iOS also has a third context state, `'interrupted'`, which a call
or a backgrounded tab leaves behind — checking only for `'suspended'` meant the game came back
permanently silent.

Why routing through a media element works: iOS picks the audio session **category** from what you
play, and the web gives you no way to ask directly. WebAudio straight to `ctx.destination` gets an
*ambient* session, which the ring switch mutes. An `HTMLMediaElement` playing real media gets a
*playback* session, which ignores it. So the graph is connected to a
`MediaStreamAudioDestinationNode` and that stream is handed to a hidden `<audio playsinline>` —
full synthesis kept, but the output is media playback. The element is appended to the document
because Safari has long-standing quirks playing a MediaStream from a detached element.

**The user tests in Chrome on iPhone.** Every browser on iOS is a WKWebView wrapper, so all of the
above applies identically — the UA still contains "iPhone" so the detection holds. One extra
Chrome-only gate: iOS Settings → Chrome → **Motion & Orientation Access** must be on, or no
`deviceorientation` events arrive no matter how correct the permission call is.

**A gyro-less browser fires one `deviceorientation` event with all three angles null.** Reading
those as zeros is not neutral — beta 0 means "phone lying flat, screen up", so the camera snapped
to point straight at the floor and nothing in the scene was ever in frame. That made panorama
mode look like a broken brown screen on desktop, and sent a long hunt after the mist (which was
rendering perfectly, just out of shot). `orient()` now ignores events with no reading.

**The panorama cache has to be keyed by level.** `loadPanorama` originally returned any already
loaded texture, so Level 2 would have shown whichever sky was fetched first. It now tracks which
level its texture belongs to, and disposes the old one rather than keeping both resident —
Level 1 alone is 32 MB of texture, and holding every level is how this project ran out of memory
before. The PMREM reflection probe is disposed on each switch for the same reason.

**`Object3D.clone()` shares geometry with the template.** `deepCloneMaterialTree` clones the
materials, not the geometry — so disposing geometry when a clone is thrown away frees the buffers
every later clone still needs. Dispose materials only.

**A rigged model animates its limbs and nothing else.** `updateIdle` used to bail out entirely
for anything with a mixer or flap bones, so the bat flapped while facing dead ahead for its whole
life and read as a flat cutout. The body turn (`cfg.enemyTurn`) is applied to every enemy; only
the rest of the procedural idle is reserved for models with no rig.

**Enemies 2, 4 and 5 were replaced with lighter re-exports** (`enemy4N`/`enemy5N` from the user).
All three are 22-26% smaller than the versions they replaced, at the same 1024 colour map — the
saving is in the geometry, not the textures: the old enemy4's `.usdc` root layer alone was 1.0 MB
against the new one's 537 KB. Worth knowing when a file looks stubbornly large: check the root
layer before blaming the maps. Every one arrived at 2048 colour plus two 4096 data maps, about
144 MB of texture memory each, and all kept `up:'Y'`.

**Colour maps should be JPEG, whatever the filename inside the USDZ says.** This is the single
biggest saving available and it cost nothing in quality: 53% off the whole asset folder. The
`.usdc` references a texture by name so the entry cannot be renamed, but that does not matter —
`USDComposer` builds `new Blob([data])` with **no MIME type** and hands it to an `<img>`, so the
browser sniffs the bytes and the filename is never consulted. Verified by reading the loader
source, not by hoping. JPEG bytes therefore work under a `.png` entry name, on iOS too.

Two exceptions found by checking rather than assuming:
- Colour maps that carry a **used alpha channel** cannot go to JPEG, which has none. `enemy3`
  and `enemy11` both had alpha in range 136-255. Both were then compared on screen with and
  without it and looked identical — their materials never read the map's alpha — so they kept
  JPEG. If transparency is ever switched on for a model, re-check this.
- **Data maps at 128 flatten a glossy surface.** enemy14's chocolate went visibly pale until
  metallic/roughness went back to 256. 128 is fine on a matte model (enemy1's pumpkin) and
  wrong on a shiny one. 256 is the safe default.

**Geometry is now the wall, not textures.** The `.usdc` root layer is 37-74% of every asset.
enemy4 cannot go below 500 KB by any texture work at all: its geometry alone is 537 KB. Getting
past that needs mesh decimation in the 3D tool, not repacking. Print the split before promising
a size — `zipfile` and a filter on `.usdc` is enough.

**Pickup clearance is measured from `userData.full`, not `cfg.coinSize`.** Coins and brand
tokens are different sizes; assuming one size let a 0.9 m token be dropped on top of a 0.4 m coin.

**Texture budget is set per asset, by how hard the thing is looked at.** Enemies are aimed
at and stared at, so they keep 768 colour / 512 data. The coin is small and spinning and the
angel crosses the view in seconds, so both are 512 colour / 256 data — checked on screen at
1.1 m, deliberately oversized, and neither shows it. Before reaching for resolution, look at
where the bytes actually are: `unzip -l` the file, because the `.usdc` root layer is often
20-40% of it and no amount of texture work touches that.

**Metallic and roughness tolerate very low resolution.** They are low-frequency data, not
pictures: enemy1 runs them at 128 and it is invisible. That is the cheapest byte saving available
after the colour map. Colour maps for props hold up at 512 — checked by scaling models up 1.6x
on screen, which is a harder test than they ever get in play.

**Metallic and roughness must be stored as grayscale (`L`), not RGB.** An earlier repack of the
coin converted them to RGB, which tripled those two maps for nothing — samplers read a single
channel either way. That one mistake was 40% of the coin's file size.

**Do not quantise a colour map to shrink it.** PNG-8 at 256 colours is roughly a sixth the size,
which is tempting, but it posterises the gradients and flattens the dark areas into flat black.
Compared side by side on these donut atlases the loss is obvious. 1024 colour with 512 data maps
remains the recipe.

**Roster is 14.** Enemies 12-14 are the Mister Donut trio (Monsta, Spidey, Mummy). 12 and 14 are
plain `up:'Y'`. Spidey (13) needed `up:'-Z'`: it loaded flat, then `'Z'` stood it up with the
spider upside down and facing away. `'Z'` and `'-Z'` differ by 180 degrees about X, which flips
top-for-bottom *and* front-for-back together — so `'-Z'` alone fixes both and needs no yaw. The
lying-flat signature is unmistakable once seen: the model fills the frame, because
`normaliseTemplate` scales by the Y extent and a flat model's Y extent is its thickness.

**`up:'Z'` and `up:'-Z'` are both real.** Some exports run their height along −Z, and rotating
those the way a `Z` model needs stands them on their head. That is what made the donut (enemy 11)
hang upside down with its icing dripping upwards.

## Open threads

- The round is **60 seconds** — the title art says "60 SEC CHALLENGE", so the artwork is the spec.
- The panorama's artwork only fills the middle band; looking straight up/down is flat colour. The
  band edges were mirror-feathered so there is no hard line, but full coverage needs new artwork.
- The &REWARDS logo was tried on the cannon and removed — it read as pasted on. The natural home
  is inside the panorama artwork or as a flat 2D mark on the start screen.
- **Levels.** `LEVELS` near `loadPanorama` is one row per level: name plus panorama file, so
  Level 2 is a data change and a file, not code. The level also picks the leaderboard key —
  two backdrops will not be equally hard, so pooling scores would mislead. Level 1 keeps the
  bare storage key so scores already on players' phones survive. Overridable as `?level=1`.
- The page title, round length and title graphic are already externally overridable, ready for the
  backend: `CONFIG` at the top of the script takes `roundSeconds`, `headerImage`, `title` and `level` from
  a `window.TRICK_OR_BLAST_CONFIG` object or from `?round=` / `?header=` / `?title=` / `?level=`
  query parameters. `document.title` is set from `CONFIG.title` at boot, so the backend can
  rename the page without touching the file. The
  header path is restricted to same-origin relative paths on purpose — it reaches an `img src`
  and can arrive from a query string.
- Level 1's panorama was re-exported with full top-to-bottom coverage, so the flat-colour band
  at the poles is gone. It is still the only 4096x2048 one.
- **Levels 2 and 3 are in** (`panorama2.jpg` graveyard, `panorama3.jpg` Marina Bay). Both are
  full-coverage equirects with no flat band at the poles, unlike Level 1 — but both are only
  **1774x887** against Level 1's 4096x2048. Spread over a full sphere that is noticeably soft on
  a phone. A 4096x2048 re-export of either is a drop-in; no code change needed.
- **Mystery boxes are Level 2 and 3 only**, via `box:true/false` on the `LEVELS` row. Level 1
  stays a clean shooting gallery — the box changes the rules mid-round, which is a lot to meet
  on a first go. `boxesAllowed()` is the single gate both the round scheduler and the dev button
  use, so the two cannot drift apart.
- **Levels are a progression, not a menu.** Every run starts at Level 1; clearing a level
  advances to the next. There is no picker — the three pills on How To Play are a progress
  track (spans, not buttons). `?level=` still pins one, which is how a single level gets tested
  without playing up to it.
- **The accuracy gate is ON at 60%** (`passAccuracy: 60`), settled after trying 70 and 0. It is
  one number: the requirement, the How To Play rule line, the pass/fail banner, the TRY AGAIN
  button and the withholding of a failed round's points all follow it, and 0 turns the whole
  thing off. Both branches are verified — a sub-threshold round gives "LEVEL n FAILED", a red
  "NEED 60% HIT RATE · you got n%" and TRY AGAIN with no NEXT.
- **When on, clearing a level needs `cfg.passAccuracy` hit rate.** Below that you replay the same
  level and the round's points are NOT banked into the run total — otherwise a player could farm
  the total by failing the same level repeatedly.
- **`hits` is a real counter, not kills.** The figure previously labelled "hit rate" was
  kills/shots; an enemy takes four to ten hits, so it could never approach 70% and a 70% gate
  against it would have been unpassable. `hits` counts every shot that connected with anything —
  enemy, coin, box or angel. Angel hits count as hits: the shot was on target, and it already
  costs 1000 points.
- **Dizzy has never been verified on a device.** The inversion runs inside the
  `deviceorientation` handler, so a desktop browser with no gyro cannot exercise it at all; only
  the toast, the pill and the timer were testable here. Confirm on a phone.
- **Warm every asset up in `resetGame`, never on first use.** The brand textures were the one
  thing loading on demand, and it was obvious: the first brand token due mid-round kicked off 16
  fetches, 16 JPEG decodes and 16 GPU uploads while the player was shooting. They now load in
  the look-for-enemy beat with the other templates, and `renderer.initTexture()` pays the GPU
  upload there too — without that the stall just moves from load time to the first frame that
  draws the disc.
- **The leaderboard is built and waiting on Cloudflare.** `fetchRuns()` and `submitRun()` near
  `RUNS_KEY` are the *only* two places that touch where scores live, and both are already async
  so the swap is entirely inside them. The intended shape is a Cloudflare Worker over KV:
  `GET /api/runs?limit=50` returning `[{name,total,at}]`, and `POST /api/runs` taking
  `{name,total,at,levels}`. Keep the localStorage read as a fallback when the fetch fails, or a
  flaky network at the event shows an empty board instead of a stale one. Flip `RUNS_ARE_LOCAL`
  to drop the "this device only" note.
  It ranks **completed runs** (grand total across all three levels), not single rounds — the
  per-level `LB_BASE` boards still exist separately on the results card. Reachable before play
  from How To Play and after play from the results card; `#leaderScreen` is z-index 16 because
  results is 13 and the cover is 14.
- **Next up: the rest of the backend** for game settings and scoring logic, so the round is configured server
  side rather than from the on-device test panel, and the leaderboard is shared rather than
  per-device localStorage. Not started — the user wants the player experience settled first.

## Viewport units on the cover screen (the black bar and the cropped top)

Symptom, reported from a real iPhone in Chrome: the bottom third of the cover was black and the
top of the title was cut off — but Add to Home Screen looked perfect. Three separate causes,
and the standalone case is the tell for all of them:

1. **`inset:0` plus an explicit `height:100dvh` fight, and the height wins.** A `position:fixed`
   element with `inset:0` is already the full layout viewport; adding `height:100dvh` overrides
   `bottom:0` and sizes it to the *dynamic* viewport instead. iOS Chrome reports `dvh` short of
   the area it actually paints while the toolbars are up, so the element ended above the bottom
   edge and the page background showed through as a black strip. **Fix: let `inset:0` define the
   box and never also give it a viewport height.**
2. **A `vh` cap on the title resolved against the *large* viewport**, so in a shorter box the
   title was bigger than its container, overflowed a centred flex column, and got clipped.
3. **`place-items:center` makes overflow unreachable at the top.** A centred item taller than its
   scroll container overflows equally in both directions, and there is no scroll position that
   brings the top back. **Fix: `align-items:safe center`** — `safe` degrades to start-alignment
   exactly when the content overflows. Verified: at 375x190 the cover overflows and `innerTop`
   is 0, not negative.

**In standalone there are no toolbars, so `dvh == vh == screen height` and all three faults
vanish.** "Works on the home screen but not in the browser" means a viewport-unit disagreement,
every time.

**Which unit to use.** `svh` is the *small* viewport — the visible area with the toolbars
showing — so a cap written in `svh` can never overshoot. Scaling caps (`max-height:min(21svh,
158px)`, `clamp(10px,1.7svh,14px)`) use `svh`; box geometry uses neither and is left to
`inset:0`. Do not write `dvh` or `vh` into anything that must not be clipped.

Chrome's bottom toolbar is **not** reported by `env(safe-area-inset-bottom)`. Bottom-anchored
content needs a real minimum on top of the inset — the cover uses
`calc(env(safe-area-inset-bottom,0px) + clamp(40px,8svh,78px))`.

## Home screen install

`manifest.webmanifest` plus `apple-touch-icon` / `apple-mobile-web-app-*` metas. Icons are built
from `Working files/ARTWORK-COVER.jpg` (1024x1024): `assets/icon-180.png` for iOS, which wants a
real PNG, and JPEG for the manifest sizes because the art is photographic and JPEG is a fifth of
the size. Regenerate with PIL — **`sips` cannot run under this sandbox**, it writes to the system
temp directory and honours neither `TMPDIR` nor the scratchpad.

## Cover artwork dimensions

`background-size:cover` always crops the axis that does not fit. A phone viewport is about
**0.46** wide-to-tall; a 1080x1406 source is 0.768, so roughly 40% of its width was being thrown
away. A **1080x1920** source (9:16) crops almost nothing, and 1290x2796 covers the tallest
iPhones. The backdrop must be exported **without the baked-in title**: the title ships separately
as `assets/header.png` and is laid over the art, so a baked title appears twice.
`assets/cover.jpg` (1080x1920, uploaded by the user) has the title baked in at the top and is
therefore unused.

## Cover interaction

The cover advances from the **START GAME button only**. It used to advance on a tap anywhere, as
a workaround while "START GAME does nothing" was unexplained; the real cause was the `[hidden]`
attribute losing to `.cover{display:flex}`, fixed by `[hidden]{display:none!important}`. The
tap-anywhere path made the button look decorative and is gone.

## iOS Chrome puts the fixed box in the wrong place (the real cause)

The black band and the cropped top were **not** only a `dvh` problem. In iOS Chrome the **layout
viewport starts above the visible area** — it runs behind the URL bar — and is only as tall as
the small viewport. A `position:fixed;inset:0` box therefore sits about 99 CSS px too high *and*
ends about 99 CSS px short of the visible bottom. Both reported symptoms at once: the HUD's top
row pushed off the top, and a black band along the bottom.

Measured off a phone screenshot before changing anything: the health bar rendered 94 CSS px
higher than its CSS says, and iOS Chrome's URL bar is ~99 CSS px. That is the whole bug.

**`visualViewport.offsetTop` is the only API that reports the offset.** `syncViewportBox()`
writes `--vvTop` and `--vvH`, applied as:

```css
html #app,html .overlay{top:var(--vvTop,0px);height:var(--vvH,auto);bottom:var(--vvBottom,0px)}
```

Two things about that rule are load-bearing:

- **The `html` prefix is required.** `#app{...inset:0}` and `.overlay{...inset:0}` are declared
  later in the file at equal specificity and were silently resetting `top` to 0. The simulation
  caught it — the height applied and the offset did not.
- **Move *and* size, or do neither.** An earlier attempt wrote the height from `visualViewport`
  and ignored `offsetTop`, which produced a black bar of its own. Half the transform is worse
  than none.

Frozen while a text field has focus: the on-screen keyboard shrinks `visualViewport`, and
following it there squashes the name screen. Re-measured on `focusout`, because the keyboard
closing does not reliably fire a viewport event. Where `visualViewport` is absent, or reports
`offsetTop:0` and `height == innerHeight` (desktop, and Safari in most states), the whole thing
is a no-op and `inset:0` stands — verified.

**Verify it by simulation, not by eye.** Set `--vvTop:99px; --vvH:461px` in a 375x560 viewport
and assert the box spans exactly 99 to 560. Desktop viewports cannot reproduce the bug.

## Overlays could not be scrolled by touch at all

`html,body{touch-action:none}` stops the game view panning — and also killed dragging inside
every overlay, so a card taller than the screen had its top permanently unreachable. Overlays
now set `touch-action:pan-y`.

Related: the cards used to nest a **second scroller** (`.startCard`/`.resultCard` had their own
`max-height:100%;overflow-y:auto` inside the already-scrolling overlay). That sized the card to
the box, let its inner scroller hold the overflow, and left it scrolled down and clipped at the
top. The overlay is now the only scroll container; cards have no `max-height`.

## Never use style.display to hide an overlay

Four places did `$('startScreen').style.display='none'`. An inline `display` beats
`.overlay{display:grid}`, so a later `hidden=false` has no effect unless the inline style is also
cleared — the same trap as the `[hidden]` one, one layer up. Use the `hidden` attribute alone;
`[hidden]{display:none!important}` makes it reliable.

## The on-screen build stamp now carries viewport numbers

`BUILD <id>  in<innerHeight> s<svh> d<dvh> l<lvh> vv<height>+<offsetTop> app<clientHeight> ov<overlay height>`

It lives on `#app` above the overlays, so it is legible on every screen including gameplay. The
phone has no console; one screenshot of this line answers any geometry question. Whichever number
disagrees with the visible area is the cause.
