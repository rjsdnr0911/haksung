# Megabonk Clone - System Redesign Plan

## 🎯 재설계 목표
실제 Megabonk 게임 시스템을 정확히 반영한 3계층 업그레이드 구조 구현

---

## 🔍 현재 시스템 vs Megabonk 비교

### 현재 구현 (Phase 1-6)
```
✅ 완료된 기능:
- 3D 탑다운 카메라, WASD 이동, 점프
- 자동 조준/발사 시스템
- 5가지 무기 타입 (Pistol, Shotgun, SMG, Laser, Rocket)
- 최대 6개 무기 슬롯
- 15개 Tome (무기 언락 4 + 스탯 부스트 11)
- 적 스폰 시스템 (3가지 타입)
- XP/레벨업 시스템
- 3D 지형 (언덕, 바위, 산)
- 파티클/사운드 효과 (Phase 6)

❌ 문제점:
- 무기가 독립적으로 업그레이드되지 않음
- Tome이 모든 무기에 동시 적용 (개별성 부족)
- 아이템 시스템(제2의 패시브) 없음
- 골드/실버 이중 화폐 시스템 없음
- 무기 진화는 없지만 무한 업그레이드 시스템도 없음
```

### Megabonk 실제 시스템
```
1️⃣ 무기 업그레이드 (Weapon Upgrades)
   - 초기 2개 슬롯 → 상점에서 +2개 해금 (총 4개)
   - 각 무기가 독립적으로 레벨업 (최대 Lv.40)
   - 무기별 특화 스탯 존재
     예) 검: Damage, Knockback, Size, Duration
         리볼버: Damage, Crit Chance, Crit Damage, Ricochet
   - 레어도별 배율: Common(1x), Uncommon(1.2x), Rare(1.4x), Epic(1.6x), Legendary(2x)
   - 업그레이드는 랜덤하게 1-2개 스탯 선택

2️⃣ Tome (비전서 - 캐릭터 패시브)
   - 레벨업 시 선택 (무기와 함께 나옴)
   - 캐릭터 전체에 적용 (모든 무기 영향)
   - 단일 스탯만 증가 (최대 Lv.99)
   - 누적 효과 감소 (Diminishing returns)
   - 종류: 약 20개
     기본(13): Damage, Cooldown, HP, Regen, Shield, Agility, Size,
              Knockback, Projectile, Precision, Evasion, Gold, Silver
     언락(7): Thorns, Quantity, Lifesteal, Attraction, Armor, Duration,
             Luck, XP, Cursed, Chaos

3️⃣ Items (아이템 - 제2의 패시브)
   - 골드로 상자 열어서 획득 (레벨업과 별개)
   - 무제한 중첩 가능 (이론상)
   - 상자와 골드는 유한 (실질적 제한)
   - 특수 효과 제공
     예) 공속 증가, 버거 드랍(2% 확률로 체력 회복),
         보스버스터(엘리트/보스 데미지 증가),
         선인장(피격 시 가시 반사),
         자석(경험치 획득 범위), 등등
```

---

## 🎮 재설계 핵심 변경사항

### 1. 무기 슬롯 시스템 개선
```javascript
현재: 6개 고정 슬롯
변경: 2개 시작 → 상점에서 +2개 해금 (총 4개)

// WeaponSystem 수정
class WeaponSystem {
    maxSlots: 2, // 초기 2개
    unlockedSlots: 2, // 상점에서 증가 가능

    unlockSlot() {
        if (this.maxSlots < 4) {
            this.maxSlots++;
            return true;
        }
        return false;
    }
}
```

### 2. 무기별 독립 업그레이드 시스템 (NEW!)
```javascript
// 각 무기가 자체 레벨과 스탯 보유
class WeaponSlot {
    type: 'sword',
    level: 5,
    baseStats: {
        damage: 10,
        knockback: 2,
        size: 1.0,
        duration: 1.0
    },
    upgrades: {
        damage: 3,      // +3 stacks
        knockback: 2,   // +2 stacks
        size: 1,        // +1 stack
        duration: 0     // 0 stacks
    },

    // 무기 타입별 업그레이드 가능한 스탯 정의
    availableUpgrades: ['damage', 'knockback', 'size', 'duration']
}

// 무기 타입별 특화 스탯 예시
WEAPON_UPGRADE_TYPES = {
    sword: {
        damage: { base: 10, perLevel: +2, desc: "데미지 증가" },
        knockback: { base: 2, perLevel: +0.5, desc: "넉백 증가" },
        size: { base: 1.0, perLevel: +0.15, desc: "공격 범위 증가" },
        duration: { base: 1.0, perLevel: +0.2, desc: "지속시간 증가" }
    },
    pistol: {
        damage: { base: 15, perLevel: +3, desc: "데미지" },
        fireRate: { base: 3, perLevel: +0.3, desc: "연사속도" },
        range: { base: 15, perLevel: +2, desc: "사거리" },
        critChance: { base: 0, perLevel: +0.05, desc: "크리티컬 확률" }
    },
    // ... 각 무기마다 4-5개 스탯
}
```

### 3. Tome 시스템 재설계
```javascript
// 현재: 효과가 즉시 적용 (배율 증가)
// 변경: 레벨 기반 누적, 캐릭터 스탯으로 관리

class CharacterStats {
    damage: { level: 5, multiplier: 1.4 },  // Lv5 = 1 + (0.08 * 5) = 1.4x
    agility: { level: 3, value: 1.45 },     // 이속 +45%
    hp: { level: 2, value: 120 },           // +20 HP per level
    shield: { level: 1, value: 20 },
    regen: { level: 0, value: 0 },
    // ... 총 20개 Tome 스탯
}

TOMES = {
    damage: {
        name: "데미지 비전서",
        maxLevel: 99,
        effect: (level) => 1 + (level * 0.08), // 레벨당 +8%
        applies: "multiplicative", // 곱연산
        icon: "⚔️"
    },
    agility: {
        name: "민첩 비전서",
        maxLevel: 99,
        effect: (level) => 1 + (level * 0.15), // 레벨당 +15%
        applies: "multiplicative",
        icon: "⚡"
    },
    hp: {
        name: "체력 비전서",
        maxLevel: 99,
        effect: (level) => 100 + (level * 20), // 레벨당 +20 HP
        applies: "additive",
        icon: "❤️"
    }
    // ... 20개 Tome
}
```

### 4. 아이템 시스템 (NEW!)
```javascript
// 골드로 상자 열어서 획득하는 특수 패시브
class ItemSystem {
    items: Map<itemId, stacks>

    openChest(cost) {
        if (this.gold < cost) return false;
        this.gold -= cost;

        const item = this.getRandomItem();
        this.addItem(item);
    }
}

ITEMS = {
    attack_speed: {
        name: "공속 증가",
        effect: (stacks) => 1 + (stacks * 0.1), // 스택당 +10%
        rarity: "common",
        icon: "🔥"
    },
    burger_drop: {
        name: "버거 드랍",
        effect: (stacks) => stacks * 0.02, // 스택당 +2% 확률
        onKill: (chance) => {
            if (Math.random() < chance) {
                // 체력 회복 아이템 드랍
                return { type: 'heal', value: 25 };
            }
        },
        rarity: "rare",
        icon: "🍔"
    },
    boss_buster: {
        name: "보스버스터",
        effect: (stacks) => 1 + (stacks * 0.25), // 스택당 +25%
        applies: "boss_damage",
        rarity: "epic",
        icon: "💀"
    },
    thorns: {
        name: "선인장",
        effect: (stacks) => stacks * 5, // 스택당 +5 반사 데미지
        onHit: (damage, stacks) => {
            // 적에게 데미지 반사
            return stacks * 5;
        },
        rarity: "rare",
        icon: "🌵"
    }
    // ... 15-20개 아이템
}
```

### 5. 화폐 시스템 (이중 화폐)
```javascript
class CurrencySystem {
    silver: 0,  // 런 종료 후 획득, 영구 업그레이드/언락에 사용
    gold: 0     // 런 중 획득, 상자 열어서 아이템 획득

    // 실버 획득처
    earnSilver(amount) {
        this.silver += amount * this.silverMultiplier;
    }

    // 골드 획득처
    earnGold(amount) {
        this.gold += amount * this.goldMultiplier;
    }
}
```

### 6. 레벨업 UI 재설계
```
현재: 레벨업 시 3개 Tome 선택
변경: 레벨업 시 무기 업그레이드 + Tome 혼합 제공

┌─────────────────────────────────────────┐
│         LEVEL UP! (Lv. 15)              │
├─────────────────────────────────────────┤
│  [Rare]           [Common]      [Epic]  │
│  ⚔️ Sword         🔫 Pistol      ✨ Luck │
│  Lv.8 → Lv.9      Lv.5 → Lv.6   Tome    │
│  +2 Damage        +3 Damage     Lv.2    │
│  +0.5 Knockback   +0.3 Fire Rate        │
└─────────────────────────────────────────┘

- 무기 업그레이드: 해당 무기 레벨업, 1-2개 랜덤 스탯
- Tome 업그레이드: 캐릭터 스탯 레벨업
- 레어도에 따라 효과 배율 차등 (1x ~ 2x)
```

---

## 🗺️ 구현 로드맵

### Phase 7.1: 무기 시스템 재설계 (3-4시간)
- [ ] WeaponSlot 클래스에 레벨/스탯 추가
- [ ] 무기 타입별 업그레이드 스탯 정의 (5가지 무기 × 4-5개 스탯)
- [ ] 무기 업그레이드 적용 로직
- [ ] 무기 슬롯 언락 시스템 (2→4개)

### Phase 7.2: Tome 시스템 재설계 (2-3시간)
- [ ] CharacterStats 클래스 생성
- [ ] 20개 Tome 정의 (기본 13 + 언락 7)
- [ ] 레벨 기반 효과 계산 (누적 감소)
- [ ] Tome이 무기/플레이어에 영향 주는 방식 변경

### Phase 7.3: 아이템 시스템 구현 (4-5시간)
- [ ] ItemSystem 클래스 생성
- [ ] 15-20개 아이템 정의
- [ ] 상자 오픈 시스템
- [ ] 아이템 효과 적용 (공속, 드랍, 반사 등)
- [ ] 아이템 UI 표시

### Phase 7.4: 화폐 시스템 (2시간)
- [ ] CurrencySystem 클래스
- [ ] 실버/골드 획득 로직
- [ ] 골드로 상자 오픈
- [ ] 실버로 영구 업그레이드 (상점)

### Phase 7.5: 레벨업 UI 통합 (2-3시간)
- [ ] 무기 업그레이드 + Tome 혼합 선택지
- [ ] 레어도 시스템 적용
- [ ] 새 UI 디자인

### Phase 7.6: 밸런싱 & 테스트 (2-3시간)
- [ ] 무기별 스탯 밸런싱
- [ ] Tome 효과 조정
- [ ] 아이템 드랍률/효과 조정
- [ ] 플레이 테스트

**총 예상 시간: 15-20시간**

---

## 📊 데이터 구조 예시

### WeaponSlot 구조
```javascript
{
    id: "slot_0",
    type: "sword",
    level: 8,
    rarity: "rare",
    baseConfig: Config.weapons.sword,
    upgrades: {
        damage: 5,      // 5 stacks
        knockback: 3,   // 3 stacks
        size: 2,        // 2 stacks
        duration: 1     // 1 stack
    },
    // 실시간 계산된 스탯
    currentStats: {
        damage: 20,     // base(10) + (5*2) = 20
        knockback: 3.5, // base(2) + (3*0.5) = 3.5
        size: 1.3,      // base(1) + (2*0.15) = 1.3
        duration: 1.2   // base(1) + (1*0.2) = 1.2
    }
}
```

### CharacterStats 구조
```javascript
{
    damage: { level: 10, multiplier: 1.8 },   // 모든 무기 데미지 1.8배
    agility: { level: 5, multiplier: 1.75 },  // 이동속도 1.75배
    hp: { level: 3, value: 160 },             // 최대 HP 160
    shield: { level: 2, value: 40 },          // 쉴드 40
    regen: { level: 4, value: 20 },           // 분당 20 HP 재생
    cooldown: { level: 7, multiplier: 1.56 }, // 공속 1.56배
    // ... 총 20개
}
```

### Item 인벤토리
```javascript
{
    attack_speed: 3,    // 3 stacks = +30% 공속
    burger_drop: 5,     // 5 stacks = 10% 버거 드랍
    boss_buster: 2,     // 2 stacks = +50% 보스 데미지
    thorns: 4,          // 4 stacks = 20 반사 데미지
    magnet: 1           // 1 stack = 자석 범위 증가
}
```

---

## 🎯 핵심 차별화 포인트

### 1. 3계층 업그레이드 구조
- **무기 업그레이드**: 개별 무기 강화 (최대 Lv.40)
- **Tome**: 캐릭터 전체 스탯 (최대 Lv.99)
- **아이템**: 특수 효과/시너지 (무제한 이론상)

### 2. 전략적 깊이
- 무기마다 특화 스탯이 다름 → 무기 조합 전략
- Tome은 모든 무기에 영향 → 범용 vs 특화 선택
- 아이템은 골드로 별도 획득 → 자원 관리

### 3. 누적 효과 감소
- Tome 레벨업 효율 하락 (Diminishing returns)
- 초반: 빠른 성장 / 후반: 느린 성장
- 밸런스 유지

### 4. 레어도 시스템
- Common → Legendary까지 5단계
- 레어도에 따라 업그레이드 효과 배율 증가
- 행운(Luck) 시스템으로 레어도 조절

---

## 📝 개발 우선순위

### 🚀 High Priority (Phase 7.1-7.2)
1. **무기 독립 업그레이드**: 가장 핵심적인 변경사항
2. **Tome 레벨 시스템**: 캐릭터 스탯 구조 개편

### 📌 Medium Priority (Phase 7.3-7.4)
3. **아이템 시스템**: 새로운 깊이 추가
4. **화폐 시스템**: 메타 진행 기반

### ⭐ Low Priority (Phase 7.5-7.6)
5. **UI 통합**: 시각적 개선
6. **밸런싱**: 플레이 테스트 기반 조정

---

## 🎮 기대 효과

### 게임플레이
- ✅ 무기별 빌드 다양성 증가
- ✅ 선택의 중요성 강화 (무기 vs Tome vs 아이템)
- ✅ 플레이 타임 증가 (더 많은 실험)

### 기술적 개선
- ✅ 모듈화된 스탯 시스템
- ✅ 확장 가능한 구조 (새 무기/Tome/아이템 추가 용이)
- ✅ Megabonk와의 유사성 극대화

---

## 🔧 기술적 고려사항

### 1. 스탯 계산 최적화
```javascript
// 무기 최종 스탯 = 무기 기본 스탯 + 무기 업그레이드 + 캐릭터 스탯
function calculateWeaponDamage(slot, characterStats) {
    const baseDamage = slot.baseConfig.damage;
    const weaponUpgrade = slot.upgrades.damage * WEAPON_UPGRADE_TYPES[slot.type].damage.perLevel;
    const characterMultiplier = characterStats.damage.multiplier;

    return (baseDamage + weaponUpgrade) * characterMultiplier;
}
```

### 2. 저장/로드 시스템
```javascript
// 런 진행 상황 저장
saveRunProgress() {
    return {
        weapons: this.weaponSlots,
        characterStats: this.characterStats,
        items: this.items,
        gold: this.gold,
        level: this.player.level
    };
}
```

### 3. 성능 고려
- 스탯 계산 캐싱
- 업그레이드 적용 시에만 재계산
- 무기/적 풀링 시스템 유지

---

## 📌 다음 단계

1. ✅ **이 문서 검토 및 승인**
2. ⏩ **Phase 7.1 시작**: 무기 시스템 재설계
3. 각 Phase별 순차적 구현
4. 플레이 테스트 및 밸런싱

---

**작성일**: 2025-01-14
**버전**: v1.0
**상태**: 계획 수립 완료, 승인 대기
