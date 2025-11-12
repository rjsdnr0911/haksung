# Megabonk Clone

A Megabonk-style top-down 3D roguelike shooter built with Babylon.js.

## Features

### Phase 1 (Implemented)
- ✅ Top-down 3D camera view
- ✅ Player character with WASD movement
- ✅ Auto-aim system (automatically faces nearest enemy)
- ✅ Auto-fire system (shoots automatically at target)
- ✅ Enemy spawning system (3 types: normal, fast, tank)
- ✅ XP orbs with magnet collection
- ✅ Level-up system
- ✅ Procedural grid map (100x100)
- ✅ Clean, modular architecture

## How to Run

1. **Local Development Server:**
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node.js
   npx http-server -p 8000
   ```

2. Open browser: `http://localhost:8000`

3. Click "START GAME"

## Controls

- **WASD** - Move player
- **Auto-aim** - Player automatically faces nearest enemy
- **Auto-fire** - Shoots automatically when enemy is in range
- **ESC** - Pause/Resume

## Project Structure

```
megabonk-clone/
├── index.html          # Main HTML
├── styles.css          # All styling
├── README.md           # This file
└── src/
    ├── main.js         # Entry point
    ├── core/
    │   ├── Game.js     # Main game loop
    │   └── Config.js   # Game configuration
    ├── entities/
    │   ├── Player.js   # Player entity
    │   └── Enemy.js    # Enemy entity
    ├── systems/
    │   ├── InputSystem.js    # Keyboard input
    │   ├── SpawnSystem.js    # Enemy spawning
    │   └── WeaponSystem.js   # Auto-aim & auto-fire
    └── utils/
```

## Game Mechanics

### Player
- Health: 100
- Move speed: 8 units/sec
- Auto-aim range: 15 units
- Gains XP by collecting orbs

### Enemies
- **Normal**: Basic enemy (HP: 30, Speed: 3)
- **Fast**: Quick enemy (HP: 20, Speed: 5)
- **Tank**: Tough enemy (HP: 100, Speed: 2)

### Progression
- Level up by collecting XP
- Each level requires more XP
- Heal 50% on level up

## Planned Features

### Phase 2
- [ ] Tome (upgrade) selection UI
- [ ] Multiple weapon types
- [ ] Weapon upgrades
- [ ] More enemy types
- [ ] Boss enemies

### Phase 3
- [ ] Meta progression (unlock system)
- [ ] Multiple characters
- [ ] Save/load system
- [ ] Statistics tracking

### Phase 4
- [ ] Portal system
- [ ] Multiple maps/zones
- [ ] Chunk-based map loading
- [ ] Procedural map generation

### Phase 5
- [ ] Particle effects
- [ ] Sound effects
- [ ] Background music
- [ ] Polish and balancing

## Tech Stack

- **Engine**: Babylon.js 6.x
- **Language**: JavaScript (ES6 modules)
- **Architecture**: Entity-Component pattern
- **Rendering**: WebGL

## Development Notes

- All code is modular and well-commented
- No dependencies except Babylon.js CDN
- Clean separation of concerns
- Easy to extend and modify
