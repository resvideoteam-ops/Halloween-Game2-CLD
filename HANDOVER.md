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

**A gyro-less browser fires one `deviceorientation` event with all three angles null.** Reading
those as zeros is not neutral — beta 0 means "phone lying flat, screen up", so the camera snapped
to point straight at the floor and nothing in the scene was ever in frame. That made panorama
mode look like a broken brown screen on desktop, and sent a long hunt after the mist (which was
rendering perfectly, just out of shot). `orient()` now ignores events with no reading.

**`up:'Z'` and `up:'-Z'` are both real.** Some exports run their height along −Z, and rotating
those the way a `Z` model needs stands them on their head. That is what made the donut (enemy 11)
hang upside down with its icing dripping upwards.

## Open threads

- The round is **60 seconds** — the title art says "60 SEC CHALLENGE", so the artwork is the spec.
- The panorama's artwork only fills the middle band; looking straight up/down is flat colour. The
  band edges were mirror-feathered so there is no hard line, but full coverage needs new artwork.
- The &REWARDS logo was tried on the cannon and removed — it read as pasted on. The natural home
  is inside the panorama artwork or as a flat 2D mark on the start screen.
- **Next up: a backend** for game settings and scoring logic, so the round is configured server
  side rather than from the on-device test panel, and the leaderboard is shared rather than
  per-device localStorage. Not started — the user wants the player experience settled first.
