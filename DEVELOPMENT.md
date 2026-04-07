# AvoidRain - Development Notes

## Architecture Overview

```
src/
├── main.js              # Entry point, game state machine, system integration
├── core/
│   └── GameLoop.js       # Delta time, requestAnimationFrame, state machine (MENU/PLAYING/GAME_OVER)
├── player/
│   ├── CharacterBuilder.js  # Procedural character mesh (body, head, arms, legs)
│   └── PlayerController.js  # Input handling, sidewalk switching, camera follow
├── world/
│   ├── ChunkManager.js      # Chunk-based procedural generation, recycling, car management
│   ├── BuildingBuilder.js   # Procedural buildings with windows, balconies, roof, base
│   ├── CarBuilder.js        # Procedural cars with body, cabin, wheels, lights
│   └── GroundBuilder.js     # Sidewalks, road, lane markings, curbs
├── systems/
│   ├── RainSystem.js        # BufferGeometry + THREE.Points for ~8000 rain particles
│   ├── AudioManager.js      # Web Audio API oscillators for procedural SFX
│   ├── WetMeter.js          # Rain fill/drain, balcony shelter detection
│   ├── CollisionSystem.js   # AABB collision for cars, balconies, road zones
│   ├── DifficultyManager.js # Progressive curves for rain, cars, balconies
│   └── ScoreManager.js      # Time + distance + dry bonus multiplier (max 3x)
└── ui/
    └── UIManager.js         # Vanilla HTML/CSS overlay (HUD, menu, game over)
```

## Coordinate System (CRITICAL)

```
         -Z (player moves this direction, "forward")
          ↑
          |
  -X ←----+----→ +X
          |
         +Z (behind player)

Y-axis: up (player feet at ~0.1, character top at ~2.1, player.position.y = 1.8)
```

### World Layout (top-down, X-axis cross-section)

```
  x=-6.5        x=-3.5   x=-2.5  x=0  x=+2.5  x=+3.5       x=+6.5
    |             |         |      |      |       |             |
  [BUILDING]  [SIDEWALK] [CURB] [ROAD] [CURB] [SIDEWALK]  [BUILDING]
    |             |         |      |      |       |             |
  Left Bldg   Left Walk          Center       Right Walk   Right Bldg
               Player L                        Player R
              (x=-3.5)                        (x=+3.5)
```

- Road width: 5 units (x=-2.5 to x=+2.5)
- Sidewalk width: 2 units each
- Building X: ±6.5 (center), building width=2.5 (so edges at ±5.25 to ±7.75)
- Player positions: LEFT_SIDE = -3.5, RIGHT_SIDE = +3.5 (centers of sidewalks)
- Player Y = 1.8 (above road surface at y=0)

## Chunk System

### How it Works

- **CHUNK_SIZE = 40** units along Z-axis
- Chunks are THREE.Group objects positioned at `chunk.position.z = chunkZ`
- All child objects (ground, buildings, cars) use LOCAL coordinates relative to chunk
- ChunkManager generates chunks ahead of player, recycles behind

### Critical: Ground Positioning

GroundBuilder.build() receives `{ x: 0, y: 0, z: 0 }` (LOCAL to chunk). The chunk group itself is positioned at chunkZ. **NEVER pass chunkZ to GroundBuilder** — it causes double-offset and disconnected roads.

```javascript
// CORRECT:
const ground = this.groundBuilder.build({ x: 0, y: 0, z: 0 }, ...);
chunk.add(ground);
// chunk.position.z = chunkZ;  // handled by spawnChunk()

// WRONG (causes double-offset, roads disconnected):
const ground = this.groundBuilder.build({ x: 0, y: 0, z: chunkZ }, ...);
```

### Building Placement

- **4 buildings per side per chunk** (numBuildings = 4)
- Evenly spaced: `buildingSpacing = CHUNK_SIZE / numBuildings = 10 units`
- Building Z position: `bz = -CHUNK_SIZE/2 + buildingSpacing/2 + b * buildingSpacing`
- No random Z offset (was causing overlap between adjacent chunks)
- Building Y position: `height / 2` (so bottom sits at y=0)
- Heights: 5-8 units, Depths: 3-6 units, Width: 2.5 units

### Right Building Rotation

Right buildings have `rotation.y = Math.PI` (180°). This flips:
- +X face → -X face (toward road) ✓
- Balconies at +X protrusion automatically face road on right side ✓

## Balcony System

### Orientation (CRITICAL)

Balconies protrude along **X-axis** (toward road), NOT Z-axis.

- Left building (x=-6.5): balcony at `x = +width/2 + protrusion/2` (toward road at x=0)
- Right building (x=+6.5): rotated 180°, so same +X protrusion faces road from other side

```javascript
// In BuildingBuilder.build():
const balconyX = width / 2 + balconyProtrusion / 2;  // +X = toward road
balcony.position.set(balconyX, 1.5, 0);  // Z=0, centered along building depth
```

### Balcony Dimensions
- Protrusion (X): 1.2 units
- Length (Z): 2.0 units (covers most of sidewalk width)
- Thickness (Y): 0.2 units
- Height: Y=1.5 (platform), Y=2.3 (top rail)
- Posts: 3 along Z, at outer edge of balcony

### Balcony Config (per chunk side)
- First 60 seconds: BOTH (60%), LEFT (20%), RIGHT (20%) — no NEITHER
- After 60 seconds: BOTH (50%), LEFT (25%), RIGHT (25%), NEITHER (if random < balconyChance)
- Balcony probability starts at 98%, decreases to ~60% over time

## Character (CharacterBuilder)

### Leg Animation
- Legs are Groups containing thigh mesh + foot mesh
- Pivot at HIP (Y=0.8, which is torso bottom = 1.15 - 0.35)
- Geometry translated by `-legLength/2` so pivot is at top
- Feet at `y = -legLength` (relative to hip)
- Animation rotates leftLeg/rightLeg groups on X-axis for walking

```javascript
const hipY = 0.8;  // torso bottom
legGeo.translate(0, -legLength / 2, 0);  // pivot at hip
leftLegGroup.position.set(-0.22, hipY, 0);
leftFoot.position.set(0, -legLength, 0.02);  // bottom of leg
```

### Materials
- ALL materials created fresh in build() method (NOT shared via this.*Mat)
- Random shirt/pants colors per character
- Previous shared-material bug caused color flickering between characters

## Car System

### Spawning
- MAX_CARS = 8 global limit
- Per chunk: 30% chance of 2 cars, 70% chance of 1 car
- Car spawn controlled by DifficultyManager.getCarSpawnChance()
- Cars move along +Z at speed 8, wrap around at z>20 to z=-40

### Materials
- ALL materials created fresh per car in build()
- Random body color from CAR_COLORS array
- Previous shared-material bug caused color flickering

## Wet Meter & Collision

### Balcony Shelter Detection
- Collision uses actual building positions from chunk children
- Shelter X: sidewalk positions (LEFT_SIDEWALK_X=-3.5, RIGHT_SIDEWALK_X=+3.5)
- Shelter Z: iterates chunk children to find actual building Z positions
- BALCONY_DEPTH = 1.2 (matches BuildingBuilder balconyProtrusion)
- BALCONY_WIDTH = 2.0 (matches BuildingBuilder balconyLength)

### Known Issue
- Wet meter fills too fast (~10 seconds instead of 60-90). Fill rate needs tuning.

## Performance Budget

- Target: 30fps with <100 draw calls
- Rain: ~8000 particles via BufferGeometry + THREE.Points (CPU)
- Fog: range 20-80 for visibility optimization
- Object pooling for chunks and cars

## Common Pitfalls (Lessons Learned)

1. **Double-offset bug**: When objects are children of a positioned group, their local position should be relative to the group, not world coordinates. Ground at z=0 local + chunk at z=chunkZ = correct. Ground at z=chunkZ local + chunk at z=chunkZ = 2× offset.

2. **Shared materials**: Three.js materials are objects. If you set `this.mat = new Material()` in constructor and use it for all instances, changing color on one changes all. Always create fresh materials in build().

3. **Balcony axis**: The game world has X=left/right, Z=forward/backward. Balconies need to protrude along X (toward road), not Z (forward). The right building's rotation.y=Math.PI handles mirroring automatically.

4. **Leg pivot**: For proper leg swing, the geometry must be translated so the pivot point (origin of the Group) is at the hip. `legGeo.translate(0, -legLength/2, 0)` moves the cylinder so its top is at the Group origin.

5. **const vs let**: When a variable needs reassignment (like furthestAheadChunkZ in a while loop), use `let`, not `const`.

6. **Building overlap**: Random Z offsets between buildings in adjacent chunks cause intersection. Solution: evenly space buildings within each chunk with no cross-chunk offset.

## Difficulty Curves

| Parameter | Start | After 120s |
|-----------|-------|------------|
| Rain intensity | 0.3 | 1.0 |
| Car spawn rate | 1 per 8s | 1 per 2s |
| Balcony probability | 98% | ~60% |
| Balcony NEITHER | 0% (first 60s) | ~40% |

## Input

- Keyboard: A/D or ArrowLeft/ArrowRight to switch sidewalks, Enter/Space to start/restart
- Touch: swipe left/right to switch sidewalks, tap to start/restart
- Input debounce: 0ms (instant response)
