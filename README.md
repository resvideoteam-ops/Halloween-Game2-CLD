# Halloween Ikura Blaster — Animated Enemy Build

Files:
- index.html
- assets/enemy1.usdz … enemy5.usdz

Everything about an enemy lives in the `ENEMIES` table at the top of the script — name, file,
height, up-axis, HP, respawn count, score bonus and motion type. The settings grid, the progress
pills and the jump buttons are all generated from it, so adding enemy 6 is one table entry plus
the file. Nothing else in the code counts enemies.

Current behaviour:
- enemies respawn at a random bearing and distance around the player, including directly behind
  them — you have to turn the camera to find them
- each spawn turns to face the player; a spawn out of view announces itself with BEHIND YOU!
- 'hover' enemies (1, 4, 5) drop in and hover at a height picked fresh each spawn, drifting
  slowly around their anchor, so they are not all pegged to one level
- 'ground' enemies (2, 3) stand on the floor at human height and play their embedded rig clip
- on death every enemy topples over backwards away from the player, then fades
- no fake floor shadow
- iPhone camera mode is still a camera-overlay fallback, not true world-tracked AR
- WebXR-capable devices use floor hit-testing automatically

Test settings (⚙ button):
- respawn count, HP, scale and yaw per enemy (one column per table entry)
- spawn distance min/max, hover height min/max, drift radius, bob, drop-in height, respawn delay
- E1 … E5 buttons spawn any enemy immediately, without clearing the earlier rounds first

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
