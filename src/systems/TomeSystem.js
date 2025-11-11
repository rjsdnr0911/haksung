import { Config } from '../core/Config.js';

// Tome (upgrade) definitions
export const TOMES = {
    // Weapon upgrades
    damage_boost: {
        id: 'damage_boost',
        name: '데미지 강화',
        description: '무기 데미지 +15%',
        rarity: 'common',
        icon: '⚔️',
        maxStacks: 5,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapon = game.weaponSystem.weapon;
            weapon.damage = Math.floor(weapon.damage * 1.15);
            console.log('[TomeSystem] Damage increased to:', weapon.damage);
        }
    },

    fire_rate_boost: {
        id: 'fire_rate_boost',
        name: '연사 강화',
        description: '연사속도 +20%',
        rarity: 'common',
        icon: '🔥',
        maxStacks: 5,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapon = game.weaponSystem.weapon;
            weapon.fireRate *= 1.2;
            console.log('[TomeSystem] Fire rate increased to:', weapon.fireRate);
        }
    },

    range_boost: {
        id: 'range_boost',
        name: '사거리 증가',
        description: '무기 사거리 +30%',
        rarity: 'common',
        icon: '🎯',
        maxStacks: 3,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapon = game.weaponSystem.weapon;
            weapon.range = Math.floor(weapon.range * 1.3);
            if (game.weaponSystem.autoAttack) {
                game.weaponSystem.autoAttack.maxRange = weapon.range;
            }
            console.log('[TomeSystem] Range increased to:', weapon.range);
        }
    },

    projectile_speed: {
        id: 'projectile_speed',
        name: '투사체 가속',
        description: '총알 속도 +25%',
        rarity: 'common',
        icon: '💨',
        maxStacks: 3,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapon = game.weaponSystem.weapon;
            weapon.projectileSpeed = Math.floor(weapon.projectileSpeed * 1.25);
            console.log('[TomeSystem] Projectile speed increased to:', weapon.projectileSpeed);
        }
    },

    // Defense upgrades
    max_health_boost: {
        id: 'max_health_boost',
        name: '체력 증가',
        description: '최대 HP +20',
        rarity: 'common',
        icon: '❤️',
        maxStacks: 10,
        apply: (player, game) => {
            player.maxHealth += 20;
            player.health = Math.min(player.health + 20, player.maxHealth);
            console.log('[TomeSystem] Max health increased to:', player.maxHealth);
        }
    },

    heal: {
        id: 'heal',
        name: '즉시 회복',
        description: 'HP 50 회복',
        rarity: 'common',
        icon: '💊',
        maxStacks: 999,
        apply: (player, game) => {
            player.heal(50);
            console.log('[TomeSystem] Healed 50 HP');
        }
    },

    speed_boost: {
        id: 'speed_boost',
        name: '이동속도 증가',
        description: '이동속도 +15%',
        rarity: 'rare',
        icon: '⚡',
        maxStacks: 5,
        apply: (player, game) => {
            Config.player.moveSpeed *= 1.15;
            console.log('[TomeSystem] Move speed increased to:', Config.player.moveSpeed);
        }
    },

    xp_magnet: {
        id: 'xp_magnet',
        name: 'XP 자석',
        description: 'XP 흡수 범위 +50%',
        rarity: 'rare',
        icon: '🧲',
        maxStacks: 3,
        apply: (player, game) => {
            Config.progression.magnetRange *= 1.5;
            console.log('[TomeSystem] Magnet range increased to:', Config.progression.magnetRange);
        }
    },

    // Special upgrades
    multi_shot: {
        id: 'multi_shot',
        name: '다중 발사',
        description: '+1 추가 발사체 (10도 퍼짐)',
        rarity: 'epic',
        icon: '🔫',
        maxStacks: 3,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapon = game.weaponSystem.weapon;

            // Increase projectiles per shot
            weapon.projectilesPerShot = (weapon.projectilesPerShot || 1) + 1;

            // Set or increase spread
            if (weapon.spread === 0) {
                weapon.spread = 10; // Initial spread of 10 degrees
            } else {
                weapon.spread += 5; // Increase spread by 5 degrees per stack
            }

            console.log('[TomeSystem] Multi-shot applied. Projectiles:', weapon.projectilesPerShot, 'Spread:', weapon.spread);
        }
    },

    xp_boost: {
        id: 'xp_boost',
        name: '경험치 강화',
        description: 'XP 획득량 +25%',
        rarity: 'rare',
        icon: '✨',
        maxStacks: 4,
        apply: (player, game) => {
            // Apply multiplier to all XP sources
            Object.keys(Config.enemies.types).forEach(type => {
                Config.enemies.types[type].xpValue = Math.floor(
                    Config.enemies.types[type].xpValue * 1.25
                );
            });
            console.log('[TomeSystem] XP gain increased by 25%');
        }
    }
};

export class TomeSystem {
    constructor(game) {
        this.game = game;
        this.availableTomes = Object.values(TOMES);
        this.playerTomes = {}; // Track how many times each tome was taken
    }

    getRandomTomes(count = 3) {
        // Filter tomes that haven't reached max stacks
        const eligibleTomes = this.availableTomes.filter(tome => {
            const currentStacks = this.playerTomes[tome.id] || 0;
            return currentStacks < tome.maxStacks;
        });

        if (eligibleTomes.length === 0) {
            console.warn('[TomeSystem] No eligible tomes available');
            return [];
        }

        // Shuffle and take first 'count' tomes
        const shuffled = [...eligibleTomes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    applyTome(tome) {
        if (!tome) {
            console.error('[TomeSystem] Invalid tome');
            return;
        }

        console.log('[TomeSystem] Applying tome:', tome.name);

        // Track tome usage
        this.playerTomes[tome.id] = (this.playerTomes[tome.id] || 0) + 1;

        // Apply tome effect
        tome.apply(this.game.player, this.game);

        console.log('[TomeSystem] Tome applied. Stacks:', this.playerTomes[tome.id]);
    }

    getTomeStacks(tomeId) {
        return this.playerTomes[tomeId] || 0;
    }

    reset() {
        this.playerTomes = {};
        console.log('[TomeSystem] Reset');
    }
}
