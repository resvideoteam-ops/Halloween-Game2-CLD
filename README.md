# Halloween Ikura Blaster — Animated Enemy Build

Files:
- index.html
- assets/enemy1.usdz   (Enemy 1, static pumpkin)
- assets/enemy2.usdz   (Enemy 2 rigged file)
- assets/enemy3.usdz   (Enemy 3 rigged file)

Current behaviour:
- enemies respawn at a random bearing and distance on the arena floor, anywhere around the
  player including directly behind them — you have to turn the camera to find them
- every spawn stands on the same floor plane and turns to face the player
- Enemy 1: hops around its spawn spot, so the shot has to be led
- Enemy 2 and Enemy 3: play their embedded rig animation, grounded and in place
- on death every enemy topples over backwards away from the player, then fades
- no fake floor shadow
- iPhone camera mode is still a camera-overlay fallback, not true world-tracked AR
- WebXR-capable devices use floor hit-testing automatically

Test settings (⚙ button):
- respawn count, HP, scale and yaw per enemy
- spawn distance min/max, Enemy 1 hop radius and height, respawn delay
- Enemy 1 / Enemy 2 / Enemy 3 buttons spawn any enemy immediately, without clearing
  the earlier rounds first

Asset notes:
- Enemy 2 and Enemy 3 are exported Z-up. `modelUpAxis` in index.html stands them up; set an
  entry to 'Z' if a replacement model loads lying face-down.
- Enemy 2 and Enemy 3 are skinned meshes, cloned with SkeletonUtils so their rig animations
  actually play on the spawned copy.

Upload:
Each asset is under GitHub's 25 MB web-upload limit, so the files can be uploaded individually.
GitHub Pages must be served over HTTPS — enable "Enforce HTTPS" or the camera will not start.
