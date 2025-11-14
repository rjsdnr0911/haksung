import { CharacterStats } from './CharacterStats.js';

// Tome (비전서) definitions - Megabonk style
// Each Tome upgrades a specific character stat
export const TOMES = {
    // ===== 기본 Tomes (13개) - 처음부터 사용 가능 =====

    damage: {
        id: 'damage',
        name: '데미지 비전서',
        description: '모든 무기 데미지 +8%',
        stat: 'damage',
        rarity: 'common',
        icon: '⚔️',
        unlocked: true
    },

    cooldown: {
        id: 'cooldown',
        name: '공속 비전서',
        description: '공격 속도 +10%',
        stat: 'cooldown',
        rarity: 'common',
        icon: '🔥',
        unlocked: true
    },

    hp: {
        id: 'hp',
        name: '체력 비전서',
        description: '최대 HP +20',
        stat: 'hp',
        rarity: 'common',
        icon: '❤️',
        unlocked: true
    },

    regen: {
        id: 'regen',
        name: '재생 비전서',
        description: '체력 재생 +2 HP/분',
        stat: 'regen',
        rarity: 'common',
        icon: '💚',
        unlocked: true
    },

    shield: {
        id: 'shield',
        name: '쉴드 비전서',
        description: '쉴드 +10',
        stat: 'shield',
        rarity: 'common',
        icon: '🛡️',
        unlocked: true
    },

    agility: {
        id: 'agility',
        name: '민첩 비전서',
        description: '이동 속도 +15%',
        stat: 'agility',
        rarity: 'common',
        icon: '⚡',
        unlocked: true
    },

    size: {
        id: 'size',
        name: '크기 비전서',
        description: '투사체 크기 +10%',
        stat: 'size',
        rarity: 'common',
        icon: '📏',
        unlocked: true
    },

    knockback: {
        id: 'knockback',
        name: '넉백 비전서',
        description: '넉백 파워 +15%',
        stat: 'knockback',
        rarity: 'rare',
        icon: '💥',
        unlocked: true
    },

    projectile: {
        id: 'projectile',
        name: '투사체 비전서',
        description: '투사체 속도 +15%',
        stat: 'projectile',
        rarity: 'common',
        icon: '💨',
        unlocked: true
    },

    precision: {
        id: 'precision',
        name: '정밀 비전서',
        description: '크리티컬 확률 +5%',
        stat: 'precision',
        rarity: 'rare',
        icon: '🎯',
        unlocked: true
    },

    evasion: {
        id: 'evasion',
        name: '회피 비전서',
        description: '회피 확률 +3%',
        stat: 'evasion',
        rarity: 'rare',
        icon: '🌪️',
        unlocked: true
    },

    gold: {
        id: 'gold',
        name: '골드 비전서',
        description: '골드 획득량 +15%',
        stat: 'gold',
        rarity: 'common',
        icon: '💰',
        unlocked: true
    },

    silver: {
        id: 'silver',
        name: '실버 비전서',
        description: '실버 획득량 +15%',
        stat: 'silver',
        rarity: 'common',
        icon: '🪙',
        unlocked: true
    },

    // ===== 언락 가능한 Tomes (7개) - 상점에서 해금 =====

    thorns: {
        id: 'thorns',
        name: '가시 비전서',
        description: '피격 시 반사 데미지 +5',
        stat: 'thorns',
        rarity: 'rare',
        icon: '🌵',
        unlocked: false, // Shop unlock: 9 coins
        unlockCost: 9
    },

    quantity: {
        id: 'quantity',
        name: '수량 비전서',
        description: '투사체 개수 +1',
        stat: 'quantity',
        rarity: 'epic',
        icon: '🔢',
        unlocked: false, // Shop unlock: 9 coins
        unlockCost: 9
    },

    lifesteal: {
        id: 'lifesteal',
        name: '흡혈 비전서',
        description: '피해의 3%만큼 체력 회복',
        stat: 'lifesteal',
        rarity: 'epic',
        icon: '🩸',
        unlocked: false, // Shop unlock: 9 coins
        unlockCost: 9
    },

    attraction: {
        id: 'attraction',
        name: '자석 비전서',
        description: 'XP 자석 범위 +30%',
        stat: 'attraction',
        rarity: 'rare',
        icon: '🧲',
        unlocked: false, // Shop unlock: 9 coins
        unlockCost: 9
    },

    armor: {
        id: 'armor',
        name: '방어 비전서',
        description: '데미지 감소 +5%',
        stat: 'armor',
        rarity: 'rare',
        icon: '🛡️',
        unlocked: false, // Shop unlock: 9 coins
        unlockCost: 9
    },

    duration: {
        id: 'duration',
        name: '지속 비전서',
        description: '공격 지속시간 +20%',
        stat: 'duration',
        rarity: 'rare',
        icon: '⏱️',
        unlocked: false, // Shop unlock: 9 coins
        unlockCost: 9
    },

    xp: {
        id: 'xp',
        name: 'XP 비전서',
        description: '경험치 획득량 +10%',
        stat: 'xp',
        rarity: 'rare',
        icon: '✨',
        unlocked: false, // Shop unlock: 12 coins
        unlockCost: 12
    }
};

export class TomeSystem {
    constructor(game) {
        this.game = game;
        this.characterStats = new CharacterStats();

        console.log('[TomeSystem] Initialized with Megabonk style character stats');
    }

    // Get random Tomes for level up selection
    getRandomTomes(count = 3) {
        // Filter to unlocked tomes
        const availableTomes = Object.values(TOMES).filter(tome => tome.unlocked);

        if (availableTomes.length === 0) {
            console.warn('[TomeSystem] No available tomes');
            return [];
        }

        // Shuffle and select
        const shuffled = [...availableTomes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Apply a Tome (upgrade its stat)
    applyTome(tome) {
        if (!tome || !tome.stat) {
            console.error('[TomeSystem] Invalid tome');
            return false;
        }

        // Upgrade the corresponding character stat
        const success = this.characterStats.upgrade(tome.stat);

        if (success) {
            const statLevel = this.characterStats.getLevel(tome.stat);
            const display = this.characterStats.getDisplayString(tome.stat);
            console.log(`[TomeSystem] Applied ${tome.name}: ${display}`);

            // Apply stats to player immediately
            this.applyToPlayer();
        }

        return success;
    }

    // Apply character stats to player and weapons
    applyToPlayer() {
        if (!this.game.player) return;

        // Apply to player
        this.characterStats.applyToPlayer(this.game.player);

        // Apply to weapons (damage, cooldown multipliers)
        if (this.game.weaponSystem) {
            const damageMult = this.characterStats.getMultiplier('damage');
            const cooldownMult = this.characterStats.getMultiplier('cooldown');
            const sizeMult = this.characterStats.getMultiplier('size');

            for (const slot of this.game.weaponSystem.weaponSlots) {
                // Recalculate weapon stats with character multipliers
                // Note: This will be applied during fire() in WeaponSystem
                slot.characterDamageMult = damageMult;
                slot.characterCooldownMult = cooldownMult;
                slot.characterSizeMult = sizeMult;

                // Recalculate fire interval with cooldown multiplier
                const baseFireInterval = 1000 / slot.weapon.fireRate;
                slot.fireInterval = baseFireInterval / cooldownMult;
            }

            console.log(`[TomeSystem] Applied multipliers - Damage: ${damageMult.toFixed(2)}x, Cooldown: ${cooldownMult.toFixed(2)}x`);
        }
    }

    // Unlock a Tome (shop feature)
    unlockTome(tomeId) {
        const tome = TOMES[tomeId];
        if (!tome) {
            console.error('[TomeSystem] Unknown tome:', tomeId);
            return false;
        }

        if (tome.unlocked) {
            console.warn('[TomeSystem] Tome already unlocked:', tomeId);
            return false;
        }

        tome.unlocked = true;
        console.log('[TomeSystem] Unlocked tome:', tome.name);
        return true;
    }

    // Get stats summary
    getStatsSummary() {
        return this.characterStats.getSummary();
    }

    // Reset for new run
    reset() {
        this.characterStats.reset();
        console.log('[TomeSystem] Reset for new run');
    }
}
