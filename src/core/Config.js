// Game Configuration
export const Config = {
    // Player settings
    player: {
        moveSpeed: 8,
        radius: 0.75,
        height: 1.8,
        maxHealth: 100,
        color: '#4a9eff'
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
        size: 100, // 100x100 units
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
                speed: 3,
                size: 0.8,
                color: '#ff4444',
                xpValue: 10
            },
            fast: {
                health: 20,
                damage: 8,
                speed: 5,
                size: 0.6,
                color: '#ffaa44',
                xpValue: 15
            },
            tank: {
                health: 100,
                damage: 20,
                speed: 2,
                size: 1.2,
                color: '#aa44ff',
                xpValue: 30
            }
        }
    },

    // Weapon settings
    weapons: {
        pistol: {
            damage: 15,
            fireRate: 3, // shots per second
            range: 15,
            projectileSpeed: 30,
            color: '#ffff00',
            projectilesPerShot: 1, // Number of projectiles per shot
            spread: 0 // Spread angle in degrees (0 = no spread)
        }
    },

    // XP and leveling
    progression: {
        baseXPRequired: 50,
        xpScaling: 1.2,
        magnetRange: 3
    }
};
