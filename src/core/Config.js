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

    // Weapon upgrade stats (Megabonk style)
    weaponUpgrades: {
        pistol: {
            damage: { base: 15, perLevel: 2, max: 999, desc: '데미지' },
            fireRate: { base: 3, perLevel: 0.15, max: 999, desc: '연사속도' },
            range: { base: 15, perLevel: 1, max: 999, desc: '사거리' },
            critChance: { base: 0, perLevel: 0.03, max: 0.5, desc: '크리티컬 확률' }
        },
        shotgun: {
            damage: { base: 8, perLevel: 1, max: 999, desc: '데미지' },
            pelletCount: { base: 6, perLevel: 1, max: 15, desc: '탄환 개수' },
            spread: { base: 25, perLevel: -1, max: 10, desc: '집탄율' }, // 감소 (더 좋아짐)
            range: { base: 10, perLevel: 0.5, max: 999, desc: '사거리' }
        },
        smg: {
            damage: { base: 8, perLevel: 1, max: 999, desc: '데미지' },
            fireRate: { base: 8, perLevel: 0.3, max: 999, desc: '연사속도' },
            spread: { base: 5, perLevel: -0.2, max: 0.5, desc: '정확도' }, // 감소
            range: { base: 12, perLevel: 0.5, max: 999, desc: '사거리' }
        },
        laser: {
            damage: { base: 10, perLevel: 1.5, max: 999, desc: '데미지' },
            fireRate: { base: 5, perLevel: 0.2, max: 999, desc: '연사속도' },
            pierceCount: { base: 3, perLevel: 1, max: 10, desc: '관통 횟수' },
            range: { base: 20, perLevel: 1, max: 999, desc: '사거리' }
        },
        rocket: {
            damage: { base: 50, perLevel: 5, max: 999, desc: '데미지' },
            explosionRadius: { base: 3, perLevel: 0.2, max: 10, desc: '폭발 범위' },
            fireRate: { base: 0.5, perLevel: 0.05, max: 3, desc: '연사속도' },
            range: { base: 18, perLevel: 1, max: 999, desc: '사거리' }
        }
    },

    // XP and leveling
    progression: {
        baseXPRequired: 50,
        xpScaling: 1.2,
        magnetRange: 3
    }
};
