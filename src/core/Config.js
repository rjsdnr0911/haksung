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
        spawnInterval: 800, // ms (2000 -> 800으로 대폭 감소, 더 빠른 스폰)
        maxCount: 150, // 50 -> 150으로 증가 (화면에 더 많은 적)
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
        },
        // Character-specific weapons
        bone_throw: {
            name: 'Bone Throw',
            damage: 12,
            fireRate: 2.5,
            range: 15,
            projectileSpeed: 20,
            color: '#f0f0f0',
            projectilesPerShot: 1,
            spread: 0,
            boomerang: true, // Returns and hits again
            icon: '🦴'
        },
        dice_cannon: {
            name: 'Dice Cannon',
            damage: 15, // Base damage (will be randomized 5-30)
            fireRate: 2,
            range: 14,
            projectileSpeed: 25,
            color: '#ffffff',
            projectilesPerShot: 1,
            spread: 0,
            randomDamage: true,
            damageMin: 5,
            damageMax: 30,
            icon: '🎲'
        },
        garlic: {
            name: 'Garlic Aura',
            damage: 5, // Tick damage
            fireRate: 5, // Ticks per second
            range: 5, // Aura radius
            projectileSpeed: 0, // Not a projectile
            color: '#e8d4ff',
            projectilesPerShot: 0,
            spread: 0,
            aura: true, // Continuous area effect
            knockback: 3, // Pushes enemies away
            icon: '🧄'
        },
        blood_scythe: {
            name: 'Blood Scythe',
            damage: 18,
            fireRate: 1.5,
            range: 10,
            projectileSpeed: 30,
            color: '#cc0000',
            projectilesPerShot: 1,
            spread: 15, // Slight spread for scythe arc
            lifesteal: 0.2, // 20% lifesteal
            icon: '🩸'
        },
        poison_cloud: {
            name: 'Poison Cloud',
            damage: 8, // Initial hit
            fireRate: 1,
            range: 12,
            projectileSpeed: 15,
            color: '#00ff88',
            projectilesPerShot: 1,
            spread: 0,
            poisonCloud: true,
            dotDamage: 15, // Damage over time
            dotDuration: 3000, // 3 seconds
            cloudRadius: 3,
            icon: '☁️'
        },
        railgun: {
            name: 'Railgun',
            damage: 25,
            fireRate: 0.8,
            range: 25,
            projectileSpeed: 60,
            color: '#00ccff',
            projectilesPerShot: 1,
            spread: 0,
            piercing: true, // Infinite piercing
            explosive: true,
            explosionRadius: 2,
            icon: '⚡'
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
    },

    // Meta-progression settings
    metaProgression: {
        // Silver rewards
        silver: {
            perKill: 5,           // Base silver per enemy kill
            perLevel: 20,         // Bonus silver per player level
            survivalBonus: 2      // Silver per second survived
        },

        // Shop prices (only slot expansions)
        shop: {
            // Weapon slot expansion (price increases each time)
            weaponSlotBase: 100,
            weaponSlotMultiplier: 1.5,

            // Tome slot expansion (price increases each time)
            tomeSlotBase: 120,
            tomeSlotMultiplier: 1.6
        }
    }
};
