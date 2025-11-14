/**
 * Characters.js - 플레이 가능한 캐릭터 정의
 * 각 캐릭터는 고유한 스탯, 무기, 패시브 능력을 가짐
 */

export const CHARACTERS = {
    calcium: {
        id: 'calcium',
        name: 'Calcium',
        icon: '💀',
        description: '안 맞으면 점점 빨라지고 강해지는 해골',

        stats: {
            maxHP: 80,
            speed: 8,
            size: 0.9
        },

        visual: {
            bodyColor: '#e8e8e8',    // Bone white
            headColor: '#f0f0f0',     // Lighter bone white
            emissiveScale: 0.2        // Subtle glow
        },

        startingWeapon: 'bone_throw',
        startingSlots: 2,

        passive: {
            name: 'Speed Demon',
            description: '피해를 받지 않으면 2초마다 속도/데미지 +2% (최대 100%). 피해 시 절반 리셋.',
            type: 'speed_demon',
            // 게임 로직에서 사용할 값들
            speedPerTick: 0.02,    // 2% per 2 seconds
            damagePerTick: 0.02,   // 2% per 2 seconds
            maxBonus: 1.0,         // 최대 100%
            tickInterval: 2000,    // 2초
            resetOnHit: 0.5        // 피해 시 50%로 감소
        },

        unlocked: true // 기본 제공
    },

    dicehead: {
        id: 'dicehead',
        name: 'Dicehead',
        icon: '🎲',
        description: '10초마다 랜덤 효과가 발동되는 도박꾼',

        stats: {
            maxHP: 100,
            speed: 8,
            size: 1.0
        },

        visual: {
            bodyColor: '#f0f0f0',     // White dice
            headColor: '#ffffff',      // White
            emissiveScale: 0.3,        // Moderate glow
            accentColor: '#2a2a2a'     // Black dots
        },

        startingWeapon: 'dice_cannon',
        startingSlots: 2,

        passive: {
            name: "Gambler's Curse",
            description: '10초마다 랜덤 효과 (좋은 것 60% / 나쁜 것 40%)',
            type: 'gamblers_curse',
            interval: 10000, // 10초
            goodEffects: [
                { type: 'damage', value: 0.5, duration: 10000, name: '데미지 +50%' },
                { type: 'speed', value: 0.3, duration: 10000, name: '속도 +30%' },
                { type: 'fireRate', value: 0.4, duration: 10000, name: '연사 +40%' },
                { type: 'invincible', duration: 2000, name: '무적 2초' }
            ],
            badEffects: [
                { type: 'damage', value: -0.3, duration: 10000, name: '데미지 -30%' },
                { type: 'speed', value: -0.2, duration: 10000, name: '속도 -20%' },
                { type: 'slow', value: 0.5, duration: 5000, name: '느려짐 5초' }
            ],
            goodChance: 0.6 // 60%
        },

        unlocked: true
    },

    garlic_boi: {
        id: 'garlic_boi',
        name: 'Garlic Boi',
        icon: '🧄',
        description: '주변에 지속 데미지 오라를 가진 마늘맨',

        stats: {
            maxHP: 110,
            speed: 7,
            size: 1.0
        },

        visual: {
            bodyColor: '#e8d4ff',     // Light purple (garlic skin)
            headColor: '#f0e8ff',      // Lighter purple
            emissiveScale: 0.4         // Moderate glow for aura effect
        },

        startingWeapon: 'garlic_aura', // 특수: 오라가 무기 역할
        startingSlots: 3, // 오라는 슬롯 차지 안 함

        passive: {
            name: 'Garlic Aura',
            description: '주변 3 유닛에 초당 20 데미지. 레벨업마다 범위 +0.3, 데미지 +5%',
            type: 'garlic_aura',
            baseRange: 3,
            baseDamage: 20,
            rangePerLevel: 0.3,
            damagePerLevel: 0.05,
            tickRate: 0.5 // 0.5초마다 데미지
        },

        unlocked: true
    },

    vlad: {
        id: 'vlad',
        name: 'Vlad the Drainer',
        icon: '🧛',
        description: '적 처치로 HP를 흡수하는 뱀파이어',

        stats: {
            maxHP: 70,
            speed: 8.5,
            size: 1.0
        },

        visual: {
            bodyColor: '#3a0a0a',     // Dark red (vampire cloak)
            headColor: '#e8d8d0',      // Pale vampire skin
            emissiveScale: 0.5,        // Blood glow
            accentColor: '#cc0000'     // Blood red
        },

        startingWeapon: 'blood_scythe',
        startingSlots: 2,

        passive: {
            name: 'Blood Drain',
            description: '적 처치 시 HP 5 회복. 최대 HP -30%, HP 회복 Tome 효과 차단',
            type: 'blood_drain',
            healOnKill: 5,
            maxHPMultiplier: 0.7, // -30%
            blockHealTomes: true
        },

        unlocked: true
    },

    amog: {
        id: 'amog',
        name: 'Amog',
        icon: '📮',
        description: '근처 적이 죽으면 폭발하는 Sus한 캐릭터',

        stats: {
            maxHP: 95,
            speed: 8,
            size: 0.8
        },

        visual: {
            bodyColor: '#c9302c',     // Among Us red
            headColor: '#7fc8f8',      // Cyan visor
            emissiveScale: 0.3,        // Moderate glow
            accentColor: '#7fc8f8'     // Cyan for visor
        },

        startingWeapon: 'poison_cloud',
        startingSlots: 2,

        passive: {
            name: 'Sus Explosion',
            description: '5 유닛 내 적 사망 시 폭발 (범위 3, 데미지 30). 연쇄 폭발 가능',
            type: 'sus_explosion',
            triggerRange: 5,
            explosionRange: 3,
            explosionDamage: 30,
            chainable: true
        },

        unlocked: true
    },

    cl4nk: {
        id: 'cl4nk',
        name: 'CL4NK',
        icon: '🤖',
        description: '크리티컬에 특화된 로봇',

        stats: {
            maxHP: 90,
            speed: 8,
            size: 1.0
        },

        visual: {
            bodyColor: '#6a7f8a',     // Metallic gray
            headColor: '#404a50',      // Darker gray
            emissiveScale: 0.6,        // Strong glow (robotic)
            accentColor: '#00ccff'     // Cyan circuits
        },

        startingWeapon: 'railgun',
        startingSlots: 2,

        passive: {
            name: 'Critical Core',
            description: '레벨당 크리티컬 확률 +2% (최대 50%). 크리티컬 데미지 +50%',
            type: 'critical_core',
            critChancePerLevel: 0.02, // 2%
            maxCritChance: 0.5, // 50%
            critDamageBonus: 0.5 // +50%
        },

        unlocked: true
    }
};

/**
 * 캐릭터 ID 배열
 */
export const CHARACTER_IDS = Object.keys(CHARACTERS);

/**
 * 기본 캐릭터 ID
 */
export const DEFAULT_CHARACTER = 'calcium';

/**
 * ID로 캐릭터 가져오기
 */
export function getCharacter(id) {
    return CHARACTERS[id] || CHARACTERS[DEFAULT_CHARACTER];
}

/**
 * 언락된 캐릭터 목록 가져오기
 */
export function getUnlockedCharacters() {
    return CHARACTER_IDS.filter(id => CHARACTERS[id].unlocked);
}
