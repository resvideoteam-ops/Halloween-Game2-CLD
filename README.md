# Halloween Ikura Blaster — Animated Enemy Build

Files:
- index.html
- assets/enemy1.usdz   (original static Enemy 1)
- assets/enemy2.usdz   (Enemy 2 rigged file)
- assets/enemy3.usdz   (Enemy 3 rigged file)

Current behaviour:
- Enemy 1: original model, no embedded animation expected, drop-in only
- Enemy 2: loads embedded rig animation when present, floats in place
- Enemy 3: loads embedded rig animation when present, grounded in place
- no fake floor shadow
- no roaming movement
- iPhone camera mode is still a camera-overlay fallback, not true world-tracked AR
- WebXR-capable devices use floor hit-testing automatically

Upload:
Because the combined package is over 25 MB, extract and upload the files individually to GitHub,
or use the split ZIP files below and extract them first.
