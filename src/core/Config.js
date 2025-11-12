// Game Configuration
export const Config = {
    // Player settings
    player: {
        moveSpeed: 15, // Increased from 8 for more speed
        radius: 0.75,
        height: 1.8,
        maxHealth: 100,
        color: '#4a9eff',
        jumpForce: 12, // Jump power
        gravity: 30 // Gravity force
    },

    // Camera settings
    camera: {
        radius: 20,
        angle: Math.PI / 3.5, // 51 degrees
        minRadius: 12,
        maxRadius: 30,
        smoothing: 0.1
    },

    // Map settings
    map: {
        size: 200, // 200x200 units (increased from 100)
        gridSize: 10 // Grid line spacing
    },

    // Enemy settings
    enemies: {
        spawnInterval: 2000, // ms
        maxCount: 50,
        types: {
            normal: {
                health: 30,
                damage: 10,
                speed: 6, // Increased from 3
                size: 0.8,
                color: '#ff4444',
                xpValue: 10
            },
            fast: {
                health: 20,
                damage: 8,
                speed: 10, // Increased from 5
                size: 0.6,
                color: '#ffaa44',
                xpValue: 15
            },
            tank: {
                health: 100,
                damage: 20,
                speed: 4, // Increased from 2
                size: 1.2,
                color: '#aa44ff',
                xpValue: 30
            }
        }
    },

    // Weapon settings
    weapons: {
        pistol: {
            name: 'Pistol',
            damage: 15,
            fireRate: 3, // shots per second
            range: 15,
            projectileSpeed: 30,
            color: '#ffff00',
            projectilesPerShot: 1,
            spread: 0,
            icon: '🔫'
        },
        shotgun: {
            name: 'Shotgun',
            damage: 8,
            fireRate: 1.5,
            range: 10,
            projectileSpeed: 25,
            color: '#ff8800',
            projectilesPerShot: 6,
            spread: 25,
            icon: '💥'
        },
        laser: {
            name: 'Laser',
            damage: 10,
            fireRate: 5,
            range: 20,
            projectileSpeed: 50,
            color: '#00ffff',
            projectilesPerShot: 1,
            spread: 0,
            piercing: true, // Can hit multiple enemies
            icon: '⚡'
        },
        rocket: {
            name: 'Rocket',
            damage: 50,
            fireRate: 0.5,
            range: 18,
            projectileSpeed: 20,
            color: '#ff0000',
            projectilesPerShot: 1,
            spread: 0,
            explosive: true, // AOE damage
            explosionRadius: 3,
            icon: '🚀'
        },
        smg: {
            name: 'SMG',
            damage: 8,
            fireRate: 8,
            range: 12,
            projectileSpeed: 35,
            color: '#88ff00',
            projectilesPerShot: 1,
            spread: 5,
            icon: '🔫'
        }
    },

    // XP and leveling
    progression: {
        baseXPRequired: 50,
        xpScaling: 1.2,
        magnetRange: 3
    },

    // Biome settings
    biomes: {
        plains: {
            name: '평원',
            groundColor: '#4a7c4e', // Green
            skyColor: '#87ceeb', // Sky blue
            terrainColors: {
                hill: '#3a6c3e',
                rock: '#666666',
                mountain: '#5a4a3a'
            },
            enemySpawnRate: 1.0, // Normal
            playerSpeedMultiplier: 1.0, // Normal
            nextBiomes: ['forest', 'desert'], // Possible next zones
            icon: '🌾'
        },
        forest: {
            name: '숲',
            groundColor: '#2d5016', // Dark green
            skyColor: '#6b8e9e',
            terrainColors: {
                hill: '#3d6026',
                rock: '#4a3c30',
                mountain: '#2a4015'
            },
            enemySpawnRate: 1.3, // More enemies
            playerSpeedMultiplier: 0.9, // Slightly slower
            obstacleCount: 1.5, // More obstacles
            nextBiomes: ['desert', 'snow'],
            icon: '🌲'
        },
        desert: {
            name: '사막',
            groundColor: '#e8c170', // Sand
            skyColor: '#ffa657',
            terrainColors: {
                hill: '#d8b160',
                rock: '#a89060',
                mountain: '#c8a150'
            },
            enemySpawnRate: 0.8, // Fewer enemies
            playerSpeedMultiplier: 0.85, // Slower (sand)
            enemySpeedMultiplier: 0.9, // Enemies also slower
            nextBiomes: ['plains', 'volcano'],
            icon: '🏜️'
        },
        snow: {
            name: '설원',
            groundColor: '#e8f4f8', // White snow
            skyColor: '#c8d8e8',
            terrainColors: {
                hill: '#d8e4e8',
                rock: '#a0b0c0',
                mountain: '#b8c8d8'
            },
            enemySpawnRate: 0.7, // Fewer enemies
            playerSpeedMultiplier: 0.75, // Much slower (snow)
            enemySpeedMultiplier: 0.8,
            nextBiomes: ['forest', 'plains'],
            icon: '❄️'
        },
        volcano: {
            name: '화산',
            groundColor: '#3a2020', // Dark red
            skyColor: '#8b4513',
            terrainColors: {
                hill: '#5a3030',
                rock: '#2a1010',
                mountain: '#4a2020'
            },
            enemySpawnRate: 1.5, // Many enemies
            playerSpeedMultiplier: 1.1, // Slightly faster
            hazardDamage: 5, // Periodic damage
            hazardInterval: 3000, // ms
            nextBiomes: ['desert', 'plains'],
            icon: '🌋'
        }
    },

    // Portal settings
    portal: {
        radius: 2,
        height: 4,
        color: '#00ffff',
        rotationSpeed: 0.02,
        interactionRange: 3
    }
};
