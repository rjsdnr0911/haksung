import { Config } from '../core/Config.js';

// Tome (upgrade) definitions
export const TOMES = {
    // Weapon upgrades (apply to all weapons)
    damage_boost: {
        id: 'damage_boost',
        name: '데미지 강화',
        description: '모든 무기 데미지 +15%',
        rarity: 'common',
        icon: '⚔️',
        maxStacks: 5,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapons = game.weaponSystem.getAllWeapons();
            weapons.forEach(slot => {
                slot.weapon.damage = Math.floor(slot.weapon.damage * 1.15);
            });
            console.log('[TomeSystem] All weapons damage increased by 15%');
        }
    },

    fire_rate_boost: {
        id: 'fire_rate_boost',
        name: '연사 강화',
        description: '모든 무기 연사속도 +20%',
        rarity: 'common',
        icon: '🔥',
        maxStacks: 5,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapons = game.weaponSystem.getAllWeapons();
            weapons.forEach(slot => {
                slot.weapon.fireRate *= 1.2;
                slot.fireInterval = 1000 / slot.weapon.fireRate;
            });
            console.log('[TomeSystem] All weapons fire rate increased by 20%');
        }
    },

    range_boost: {
        id: 'range_boost',
        name: '사거리 증가',
        description: '모든 무기 사거리 +30%',
        rarity: 'common',
        icon: '🎯',
        maxStacks: 3,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapons = game.weaponSystem.getAllWeapons();
            weapons.forEach(slot => {
                slot.weapon.range = Math.floor(slot.weapon.range * 1.3);
            });
            console.log('[TomeSystem] All weapons range increased by 30%');
        }
    },

    projectile_speed: {
        id: 'projectile_speed',
        name: '투사체 가속',
        description: '모든 투사체 속도 +25%',
        rarity: 'common',
        icon: '💨',
        maxStacks: 3,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const weapons = game.weaponSystem.getAllWeapons();
            weapons.forEach(slot => {
                slot.weapon.projectileSpeed = Math.floor(slot.weapon.projectileSpeed * 1.25);
            });
            console.log('[TomeSystem] All projectiles speed increased by 25%');
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
        description: '첫 무기에 +1 발사체',
        rarity: 'epic',
        icon: '🔫',
        maxStacks: 3,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const slot = game.weaponSystem.getWeaponSlot(0);
            if (!slot) return;

            // Increase projectiles per shot
            slot.weapon.projectilesPerShot = (slot.weapon.projectilesPerShot || 1) + 1;

            // Set or increase spread
            if (slot.weapon.spread === 0) {
                slot.weapon.spread = 10;
            } else {
                slot.weapon.spread += 5;
            }

            console.log('[TomeSystem] Multi-shot applied. Projectiles:', slot.weapon.projectilesPerShot, 'Spread:', slot.weapon.spread);
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
            Object.keys(Config.enemies.types).forEach(type => {
                Config.enemies.types[type].xpValue = Math.floor(
                    Config.enemies.types[type].xpValue * 1.25
                );
            });
            console.log('[TomeSystem] XP gain increased by 25%');
        }
    },

    // New weapon unlocks
    unlock_shotgun: {
        id: 'unlock_shotgun',
        name: '샷건 획득',
        description: '강력한 근거리 샷건 추가',
        rarity: 'rare',
        icon: '💥',
        maxStacks: 1,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const added = game.weaponSystem.addWeapon('shotgun');
            if (added) {
                console.log('[TomeSystem] Shotgun unlocked!');
            } else {
                console.warn('[TomeSystem] Could not add shotgun (max slots?)');
            }
        }
    },

    unlock_laser: {
        id: 'unlock_laser',
        name: '레이저 획득',
        description: '관통 레이저 무기 추가',
        rarity: 'epic',
        icon: '⚡',
        maxStacks: 1,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const added = game.weaponSystem.addWeapon('laser');
            if (added) {
                console.log('[TomeSystem] Laser unlocked!');
            } else {
                console.warn('[TomeSystem] Could not add laser (max slots?)');
            }
        }
    },

    unlock_rocket: {
        id: 'unlock_rocket',
        name: '로켓 런처 획득',
        description: '폭발 범위 데미지 무기',
        rarity: 'legendary',
        icon: '🚀',
        maxStacks: 1,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const added = game.weaponSystem.addWeapon('rocket');
            if (added) {
                console.log('[TomeSystem] Rocket launcher unlocked!');
            } else {
                console.warn('[TomeSystem] Could not add rocket (max slots?)');
            }
        }
    },

    unlock_smg: {
        id: 'unlock_smg',
        name: 'SMG 획득',
        description: '빠른 연사 기관단총 추가',
        rarity: 'rare',
        icon: '🔫',
        maxStacks: 1,
        apply: (player, game) => {
            if (!game.weaponSystem) return;
            const added = game.weaponSystem.addWeapon('smg');
            if (added) {
                console.log('[TomeSystem] SMG unlocked!');
            } else {
                console.warn('[TomeSystem] Could not add SMG (max slots?)');
            }
        }
    }
};

export class TomeSystem {
    constructor(game) {
        this.game = game;
        this.availableTomes = Object.values(TOMES);
        this.playerTomes = {}; // Track how many times each tome was taken

        // Reroll state (per level)
        this.rerollsUsed = 0;
        this.maxRerolls = 1; // Can reroll once per level up
    }

    getRandomTomes(count = 3) {
        // Get meta progression system for filtering
        const metaSystem = this.game.metaProgressionSystem;

        // Filter tomes that haven't reached max stacks
        let eligibleTomes = this.availableTomes.filter(tome => {
            const currentStacks = this.playerTomes[tome.id] || 0;
            return currentStacks < tome.maxStacks;
        });

        // Apply meta-progression filters if available
        if (metaSystem) {
            // Filter by toggler only (all tomes unlocked by default)
            eligibleTomes = eligibleTomes.filter(tome => {
                return !metaSystem.isTomeDisabled(tome.id);
            });

            // Special filter for weapon unlock tomes
            eligibleTomes = eligibleTomes.filter(tome => {
                // Check if this is a weapon unlock tome
                if (tome.id.startsWith('unlock_')) {
                    const weaponId = tome.id.replace('unlock_', ''); // e.g., 'unlock_shotgun' -> 'shotgun'

                    // Check if weapon is toggled off
                    if (metaSystem.isWeaponDisabled(weaponId)) {
                        return false; // Weapon disabled in toggler
                    }

                    // Check if weapon is already in player's build
                    const hasWeapon = this.game.weaponSystem.weaponSlots.some(slot => slot.type === weaponId);
                    if (hasWeapon) {
                        return false; // Already have this weapon
                    }
                }

                return true; // Include this tome
            });
        }

        if (eligibleTomes.length === 0) {
            console.warn('[TomeSystem] No eligible tomes available');
            return [];
        }

        // Shuffle and take first 'count' tomes
        const shuffled = [...eligibleTomes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    canReroll() {
        // Always available (1x per level up)
        return this.rerollsUsed < this.maxRerolls;
    }

    useReroll() {
        if (!this.canReroll()) {
            console.warn('[TomeSystem] Cannot reroll');
            return false;
        }

        this.rerollsUsed++;
        console.log('[TomeSystem] Reroll used:', this.rerollsUsed, '/', this.maxRerolls);
        return true;
    }

    resetRerolls() {
        this.rerollsUsed = 0;
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
        this.rerollsUsed = 0;
        console.log('[TomeSystem] Reset');
    }
}
