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
    }
};
