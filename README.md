# Halloween Ikura Blaster — Animated Enemy Build

Files:
- index.html
- assets/enemy1.usdz … enemy11.usdz

Everything about an enemy lives in the `ENEMIES` table at the top of the script — name, file,
height, up-axis, HP, respawn count, score bonus and motion type. The settings grid, the progress
pills and the jump buttons are all generated from it, so adding enemy 6 is one table entry plus
the file. Nothing else in the code counts enemies.

Current behaviour:
- a round is 30 enemies, drawn in random order from the whole roster rather than one type at a
  time. Each type's `count` is its share of the round, weighted by how cheap the model is
- the round opens with LOOK FOR ENEMY for three seconds before the first one appears
- enemies respawn at a random bearing and distance around the player, including directly behind
  them — you have to turn the camera to find them
- each spawn turns to face the player; a spawn out of view announces itself with BEHIND YOU!
- 'hover' enemies (1, 4, 5) drop in and hover at a height picked fresh each spawn, drifting
  slowly around their anchor, so they are not all pegged to one level
- 'ground' enemies stand on the floor at human height
- Enemy 3 is a bat: it flies, and its wings and legs are driven directly from the rig
- models with no rig get a procedural idle — three slow sines at unrelated periods, so the body
  keeps shifting instead of ticking through a visible loop
- killing an enemy queues the next one immediately; the body falls and fades in its own group,
  so shooting stays continuous instead of waiting on the corpse
- floating enemies are knocked back and burn out; only enemies with legs topple over
- on death every enemy topples over backwards away from the player, then fades
- no fake floor shadow
- iPhone camera mode is still a camera-overlay fallback, not true world-tracked AR
- WebXR-capable devices use floor hit-testing automatically

An off-screen arrow points at the live enemy whenever it is out of view, with its distance, so
hunting one down is a turn in a known direction rather than a blind sweep of the room.

Test settings (⚙ button):
- respawn count, HP, scale, yaw and Float/Ground motion per enemy (one column per table entry)
- exposure and reflections (see Lighting below)
- per-enemy spawn arc: how far around you that enemy can appear. It ramps across the roster
  (60° for Enemy 1, 340° for Enemy 5) so early rounds are a shooting gallery and later ones
  make you sweep the room
- bat wingbeat rate, wing travel and leg spread; idle sway for rig-less models
- spawn distance min/max
- hover height min/max, drift radius, bob, drop-in height, phone height above floor, respawn delay
- E1 … E5 buttons spawn any enemy immediately, without clearing the earlier rounds first

360° scene mode:
The start screen offers "360° scene (no camera)", which swaps the live camera feed for an
equirectangular panorama. Turning the phone pans across it, and the same image lights the
enemies, so they sit in the scene rather than on top of it. Drop the artwork at
`assets/panorama.jpg`; without it a placeholder night sky is generated in-engine.

Panorama spec: equirectangular, 2:1 aspect (4096x2048 is the sweet spot — 8192 wide costs four
times the GPU memory for little gain on a phone), JPEG under about 2 MB, left and right edges
seamless, horizon on the vertical centre line. The top and bottom pinch to points, so keep
detail away from them. If the image has a visible floor, set "Phone height above floor" so the
grounded enemies stand on it.

The shipped panorama was supplied at 8192x4096 (128 MB of GPU texture) with the artwork filling
only the 24%-75% band, which left a hard horizontal edge at +47 degrees elevation whenever the
player looked up. It was downscaled to 4096x2048 and the band edges were mirror-feathered into
the flat sky and ground so the line dissolves. The 8K original is kept in assets_original_2048/
in case it needs recutting.

Lighting:
Neutral environment (RoomEnvironment) with ACES filmic tone mapping at exposure 0.9 — the same
combination as the lucky-cat build. Enemies 2 and 3 have metalness around 0.4, so without an
environment to reflect they render almost black no matter how many lights are added. Ambient is
kept low and the directional key does the shaping: ambient light is what flattens contrast.

Floor height:
Camera-fallback mode has no floor hit-test, so the floor is assumed to be one 'phone height'
below the camera (1.45 m by default, adjustable). Floating enemies hide any error in that guess
because nothing about them promises ground contact; grounded ones expose it. That is what the
per-enemy Float/Ground toggle is for.

Asset notes:
- Enemy 2 and Enemy 3 are exported Z-up; their table entries carry `up:'Z'`, which stands them
  up on load. Set that on any replacement model that loads lying face-down.
- Enemy 2 and Enemy 3 are skinned meshes, cloned with SkeletonUtils so their rig animations
  actually play on the spawned copy.
- Enemy 1, 4 and 5 are static props with no rig, so they use the procedural idle motion.
- `height` in the table is metres after normalisation: the source models arrive at wildly
  different scales, so this is the only thing that sets how big an enemy really is.

Upload:
Each asset is under GitHub's 25 MB web-upload limit, so the files can be uploaded individually.
All five together are about 53 MB; only the enemy in play is downloaded (lazy-loaded).
GitHub Pages must be served over HTTPS — enable "Enforce HTTPS" or the camera will not start.
