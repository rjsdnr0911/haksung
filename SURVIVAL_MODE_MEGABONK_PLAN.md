# 서바이벌 모드 재설계: Megabonk 스타일

> Megabonk를 모티브로 한 자동 공격 생존 모드 설계 문서

---

## 🎯 핵심 컨셉

**Megabonk의 성공 요소를 적용한 좀비 서바이벌**
- ✅ 자동 공격으로 포지셔닝과 전략에 집중
- ✅ 큰 맵에서 자유로운 탐험
- ✅ 레벨업 업그레이드 선택의 재미
- ✅ 10분 생존 목표와 긴장감
- ✅ 다양한 빌드 시너지

---

## 📐 1. 맵 시스템 재설계

### 현재 문제
- 작은 원형 아레나 (반지름 15)
- 영역 제한이 너무 좁음
- 탐험 요소 없음

### Megabonk 스타일 개선

#### A. 프로시저럴 맵 생성
```javascript
// 맵 설정
const MAP_CONFIG = {
    type: 'PROCEDURAL',  // 프로시저럴 생성
    size: 200,           // 200x200 크기
    chunks: 4,           // 4x4 청크 시스템

    // 지형 타일 종류
    tiles: [
        'grass',         // 풀밭 (기본)
        'pavement',      // 포장도로
        'dirt',          // 흙길
        'rubble'         // 잔해
    ],

    // 장애물 밀도
    obstacleDensity: 0.15,

    // 안개 시스템
    fogOfWar: true,
    revealRadius: 20
};
```

#### B. 맵 구조
1. **4x4 청크 시스템** (각 청크 50x50)
   - 청크별로 다른 테마와 적 타입
   - 점진적 로딩으로 성능 최적화

2. **랜드마크 배치**
   - 버려진 건물 (엄폐물)
   - 차량 잔해 (장애물)
   - 보급 상자 (헬스팩 스폰)
   - 이벤트 존 (대량 적 + 보상)

3. **안개 시스템**
   - 플레이어 주변 20유닛만 보임
   - 탐험한 영역은 반투명으로 표시
   - 미니맵 추가

---

## 🎮 2. 자동 공격 시스템

### 핵심 메커니즘

#### A. 자동 타겟팅
```javascript
const AUTO_AIM = {
    enabled: true,

    // 타겟 우선순위
    priority: [
        'NEAREST',      // 가장 가까운 적
        'LOWEST_HP',    // 체력 낮은 적
        'BOSS',         // 보스 우선
        'MANUAL'        // 마우스 방향 (옵션)
    ],

    // 자동 공격 범위
    range: 15,

    // 공격 각도
    attackAngle: 360  // 전방향 (업그레이드로 조절 가능)
};
```

#### B. 무기 자동화
```javascript
// 무기별 자동 공격 패턴
const WEAPON_AUTO_PATTERNS = {
    pistol: {
        autoFire: true,
        targetCount: 1,
        firePattern: 'SINGLE',
        aimAssist: 0.8
    },

    shotgun: {
        autoFire: true,
        targetCount: 1,
        firePattern: 'SPREAD',
        spread: 30,
        aimAssist: 0.6
    },

    smg: {
        autoFire: true,
        targetCount: 3,      // 3개 타겟 번갈아 공격
        firePattern: 'BURST',
        aimAssist: 0.9
    },

    sniper: {
        autoFire: true,
        targetCount: 1,
        firePattern: 'PIERCE', // 관통
        aimAssist: 1.0
    },

    // 새로운 무기
    minigun: {
        autoFire: true,
        targetCount: 5,
        firePattern: 'SWEEP',  // 부채꼴 스윕
        aimAssist: 0.7
    }
};
```

#### C. 플레이어 역할 변화
- ❌ 조준 및 사격 → ✅ **이동과 포지셔닝**
- ❌ 탄약 관리 → ✅ **업그레이드 선택**
- ❌ 수동 조작 → ✅ **전략적 위치 선정**

---

## 📊 3. XP & 레벨업 시스템

### A. XP 드롭 메커니즘
```javascript
// 적 처치 시 XP 크리스탈 드롭
function onEnemyKilled(enemy) {
    const xpAmount = enemy.maxHealth * 0.1; // 체력의 10%

    // XP 크리스탈 생성
    const xpCrystal = createXPCrystal({
        position: enemy.position,
        value: xpAmount,
        attractRadius: 3,      // 3유닛 내 자동 수집
        lifetime: 30           // 30초 후 사라짐
    });

    // 크리스탈 시각 효과
    xpCrystal.color = getRarityColor(xpAmount);
}

// XP 등급별 색상
function getRarityColor(xp) {
    if (xp > 100) return PURPLE;  // 보스
    if (xp > 50) return GOLD;     // 엘리트
    if (xp > 20) return BLUE;     // 특수
    return GREEN;                 // 일반
}
```

### B. 레벨링 곡선
```javascript
const LEVELING = {
    // 필요 XP (지수 증가)
    getRequiredXP: (level) => {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    },

    maxLevel: 50,  // 최대 레벨

    // 레벨업 보상
    rewards: {
        everyLevel: 'TOME_CHOICE',     // 매 레벨: 업그레이드 선택
        every5Levels: 'RARE_TOME',     // 5레벨마다: 레어 업그레이드
        every10Levels: 'NEW_WEAPON'    // 10레벨마다: 새 무기 슬롯
    }
};
```

---

## 🎲 4. Tome 업그레이드 시스템

### A. Tome 카테고리

#### 무기 업그레이드
```javascript
const WEAPON_TOMES = [
    {
        name: "더블 배럴",
        rarity: "COMMON",
        effect: "발사체 +1",
        stackable: true,
        maxStack: 5
    },
    {
        name: "관통탄",
        rarity: "RARE",
        effect: "총알이 적 2명 관통",
        stackable: true,
        maxStack: 3
    },
    {
        name: "폭발탄",
        rarity: "EPIC",
        effect: "총알이 폭발하여 범위 피해",
        stackable: false
    },
    {
        name: "체인 라이트닝",
        rarity: "LEGENDARY",
        effect: "공격이 5명에게 연쇄",
        stackable: false,
        synergy: ['전기 속성']
    }
];
```

#### 이동 업그레이드
```javascript
const MOVEMENT_TOMES = [
    {
        name: "스피드 부스트",
        rarity: "COMMON",
        effect: "이동속도 +15%",
        stackable: true,
        maxStack: 5
    },
    {
        name: "대시",
        rarity: "RARE",
        effect: "대시 스킬 획득 (쿨타임 5초)",
        stackable: false,
        cooldown: 5
    },
    {
        name: "잔상",
        rarity: "EPIC",
        effect: "이동 시 잔상이 적 공격",
        stackable: false
    },
    {
        name: "순간이동",
        rarity: "LEGENDARY",
        effect: "텔레포트 (쿨타임 15초)",
        stackable: false,
        cooldown: 15
    }
];
```

#### 생존 업그레이드
```javascript
const SURVIVAL_TOMES = [
    {
        name: "체력 증가",
        rarity: "COMMON",
        effect: "최대 체력 +20",
        stackable: true,
        maxStack: 10
    },
    {
        name: "흡혈",
        rarity: "RARE",
        effect: "피해의 5% 체력 회복",
        stackable: true,
        maxStack: 4
    },
    {
        name: "가시 갑옷",
        rarity: "EPIC",
        effect: "근접 공격 시 반사 피해 30%",
        stackable: true,
        maxStack: 3
    },
    {
        name: "부활",
        rarity: "LEGENDARY",
        effect: "사망 시 1회 부활 (체력 50%)",
        stackable: false,
        oneTime: true
    }
];
```

#### 특수 업그레이드
```javascript
const SPECIAL_TOMES = [
    {
        name: "드론 소환",
        rarity: "EPIC",
        effect: "자동 공격 드론 1기 추가",
        stackable: true,
        maxStack: 3
    },
    {
        name: "시간 왜곡",
        rarity: "LEGENDARY",
        effect: "주변 적 이동속도 -50%",
        stackable: false,
        aura: 10  // 10유닛 반경
    },
    {
        name: "자석",
        rarity: "RARE",
        effect: "XP 수집 범위 +100%",
        stackable: true,
        maxStack: 3
    },
    {
        name: "경험치 부스트",
        rarity: "RARE",
        effect: "획득 XP +25%",
        stackable: true,
        maxStack: 4
    }
];
```

### B. 시너지 시스템
```javascript
const SYNERGIES = {
    "불꽃 마스터": {
        requires: ['화염 피해', '폭발탄', '범위 증가'],
        bonus: "폭발 시 적 점화 (3초간 DoT)"
    },

    "스피드 악마": {
        requires: ['스피드 부스트 x3', '대시', '잔상'],
        bonus: "이동속도 추가 +50%, 회피율 +20%"
    },

    "탱크 빌드": {
        requires: ['체력 증가 x5', '가시 갑옷', '흡혈'],
        bonus: "받는 피해 -30%, 반사 피해 +50%"
    },

    "드론 군단": {
        requires: ['드론 소환 x3', '연사력 증가'],
        bonus: "드론 공격력 +100%, 드론 수 +2"
    }
};
```

### C. 업그레이드 선택 UI
```javascript
// 레벨업 시 게임 일시정지
function onLevelUp(playerLevel) {
    pauseGame();

    // 3개의 랜덤 Tome 제시
    const tomeChoices = generateRandomTomes(3, {
        playerLevel,
        currentBuild: player.tomes,
        rarityWeights: {
            COMMON: 0.6,
            RARE: 0.25,
            EPIC: 0.10,
            LEGENDARY: 0.05
        }
    });

    // UI 표시
    showTomeSelectionUI(tomeChoices);
}
```

---

## ⏱️ 5. 10분 생존 타임라인

```javascript
const SURVIVAL_TIMELINE = {
    duration: 600,  // 10분 (600초)

    phases: [
        {
            time: 0,
            name: "시작",
            difficulty: 1.0,
            spawnRate: 1.0,
            enemyTypes: ['runner', 'normal']
        },
        {
            time: 120,  // 2분
            name: "강화",
            difficulty: 1.5,
            spawnRate: 1.3,
            enemyTypes: ['runner', 'normal', 'tank'],
            event: "미니보스 1 스폰"
        },
        {
            time: 240,  // 4분
            name: "가속",
            difficulty: 2.0,
            spawnRate: 1.6,
            enemyTypes: ['runner', 'normal', 'tank', 'shooter'],
            event: "미니보스 2 스폰"
        },
        {
            time: 360,  // 6분
            name: "혼돈",
            difficulty: 2.5,
            spawnRate: 2.0,
            enemyTypes: ['runner', 'normal', 'tank', 'shooter'],
            event: "미니보스 3 스폰 (2마리)"
        },
        {
            time: 480,  // 8분
            name: "절망",
            difficulty: 3.0,
            spawnRate: 2.5,
            enemyTypes: ['all'],
            event: "경고: 최종 보스 접근 중"
        },
        {
            time: 540,  // 9분
            name: "최후의 물결",
            difficulty: 4.0,
            spawnRate: 3.0,
            enemyTypes: ['all'],
            event: "적 대량 스폰 시작"
        },
        {
            time: 600,  // 10분
            name: "보스전",
            difficulty: 5.0,
            spawnRate: 0,  // 일반 적 중단
            event: "최종 보스 스폰",
            boss: "MEGA_ZOMBIE_KING"
        }
    ]
};
```

### 난이도 스케일링
```javascript
function calculateDifficulty(elapsedTime) {
    const phase = getCurrentPhase(elapsedTime);

    return {
        enemyHealth: baseHealth * phase.difficulty,
        enemySpeed: baseSpeed * Math.min(phase.difficulty * 0.8, 2.5),
        enemyDamage: baseDamage * phase.difficulty,
        spawnInterval: baseInterval / phase.spawnRate,
        enemyCount: Math.floor(baseCount * phase.spawnRate)
    };
}
```

---

## 👾 6. 보스 시스템

### A. 미니보스 (2, 4, 6분)
```javascript
const MINI_BOSSES = [
    {
        name: "좀비 브루트",
        spawnTime: 120,
        type: 'tank',
        health: 2000,
        speed: 1.5,
        damage: 30,
        abilities: [
            'charge',      // 돌진 공격
            'ground_slam'  // 광역 충격파
        ],
        rewards: {
            xp: 500,
            guarantee: 'RARE_TOME'
        }
    },
    {
        name: "좀비 슈팅 스타",
        spawnTime: 240,
        type: 'shooter',
        health: 1500,
        speed: 2.0,
        damage: 25,
        abilities: [
            'rapid_fire',   // 연사
            'grenade_toss'  // 수류탄 투척
        ],
        rewards: {
            xp: 750,
            guarantee: 'EPIC_TOME'
        }
    }
];
```

### B. 최종 보스 (10분)
```javascript
const FINAL_BOSS = {
    name: "좀비 킹",
    health: 10000,
    speed: 2.5,
    damage: 50,

    phases: [
        {
            healthThreshold: 1.0,
            abilities: ['summon_minions', 'slam'],
            minionCount: 10
        },
        {
            healthThreshold: 0.5,
            abilities: ['summon_minions', 'slam', 'laser_sweep'],
            minionCount: 20,
            enrage: true
        },
        {
            healthThreshold: 0.2,
            abilities: ['all', 'final_blast'],
            minionCount: 30,
            berserk: true
        }
    ],

    rewards: {
        xp: 5000,
        victory: true,
        unlock: 'NEW_CHARACTER'
    }
};
```

---

## 📈 7. 메타 진행 시스템

### A. 언락 시스템
```javascript
const UNLOCKS = {
    characters: [
        { id: 1, name: "생존자", unlocked: true },
        { id: 2, name: "군인", requirement: "5분 생존" },
        { id: 3, name: "의무병", requirement: "헬스팩 50개 수집" },
        { id: 4, name: "엔지니어", requirement: "10000 XP 획득" },
        { id: 5, name: "스나이퍼", requirement: "헤드샷 100회" }
    ],

    weapons: [
        { name: "피스톨", unlocked: true },
        { name: "샷건", requirement: "레벨 5 도달" },
        { name: "SMG", requirement: "적 100 처치" },
        { name: "스나이퍼", requirement: "보스 처치" },
        { name: "미니건", requirement: "10분 생존" }
    ],

    tomes: [
        // 기본 Tome은 항상 사용 가능
        // 고급 Tome은 조건 달성 시 언락
    ]
};
```

### B. 퀘스트 시스템
```javascript
const QUESTS = [
    {
        id: 1,
        name: "첫 걸음",
        description: "첫 좀비 처치",
        reward: "XP +100",
        condition: { type: 'kill', count: 1 }
    },
    {
        id: 2,
        name: "학살자",
        description: "좀비 100마리 처치",
        reward: "새 캐릭터 언락",
        condition: { type: 'kill', count: 100 }
    },
    {
        id: 3,
        name: "생존의 달인",
        description: "5분 생존",
        reward: "새 무기 언락",
        condition: { type: 'survive', time: 300 }
    },
    {
        id: 4,
        name: "보스 킬러",
        description: "미니보스 처치",
        reward: "레어 Tome 언락",
        condition: { type: 'boss_kill', bossType: 'mini' }
    }
];
```

---

## 🎨 8. UI/UX 개선

### A. 게임 중 HUD
```
┌─────────────────────────────────────────┐
│ ❤️ 100/100    ⭐ Lv.15    ⏱️ 5:23      │
│ 💀 234       🏆 12,500 XP               │
│                                         │
│          [미니맵]                       │
│         ┌────────┐                      │
│         │  ▲ P   │                      │
│         │ ●  ●   │  ● = 적              │
│         │   ●    │  ⚠️ = 보스           │
│         └────────┘                      │
│                                         │
│ Active Tomes:                           │
│ 🔥 폭발탄  ⚡ 연쇄  💨 스피드x3         │
└─────────────────────────────────────────┘
```

### B. 레벨업 화면
```
┌─────────────────────────────────────────┐
│          🎉 LEVEL UP! 🎉                │
│                                         │
│    레벨 15 → 16                         │
│                                         │
│   업그레이드를 선택하세요:               │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ 🔫       │  │ 💨       │  │ ❤️     ││
│  │ 더블배럴  │  │ 대시     │  │ 흡혈   ││
│  │ COMMON   │  │ RARE     │  │ EPIC   ││
│  │          │  │          │  │        ││
│  │ 발사체+1  │  │쿨타임5초 │  │피해5%  ││
│  │          │  │무적0.5초 │  │회복    ││
│  └──────────┘  └──────────┘  └────────┘│
│                                         │
│      [1]         [2]         [3]        │
└─────────────────────────────────────────┘
```

---

## 🔧 9. 구현 우선순위

### Phase 1: 기본 시스템 (1-2주)
1. ✅ 자동 공격 시스템
2. ✅ XP 드롭 및 수집
3. ✅ 레벨업 기본 로직
4. ✅ 큰 맵 생성 (단순 버전)

### Phase 2: 코어 메커니즘 (2-3주)
1. ✅ Tome 업그레이드 시스템
2. ✅ UI 구현 (HUD, 레벨업 화면)
3. ✅ 10분 타임라인 및 난이도
4. ✅ 미니보스 시스템

### Phase 3: 콘텐츠 확장 (3-4주)
1. ✅ 최종 보스
2. ✅ 다양한 Tome 추가 (50+)
3. ✅ 시너지 시스템
4. ✅ 프로시저럴 맵 개선

### Phase 4: 메타 진행 (4-5주)
1. ✅ 언락 시스템
2. ✅ 퀘스트 시스템
3. ✅ 캐릭터 선택
4. ✅ 통계 및 리더보드

---

## 💡 10. 추가 아이디어

### A. 특수 이벤트
- **혈전 지역**: 적 대량 스폰 + 레어 아이템
- **보급 낙하**: 무작위 위치에 파워업 드롭
- **적 대이동**: 적 무리가 한 방향으로 이동
- **엘리트 몹**: 강화된 능력의 적 등장

### B. 챌린지 모드
- **속도전**: 최대한 빨리 레벨 20 달성
- **최소주의**: 5개 Tome만으로 생존
- **보스 러시**: 연속 보스전
- **무한 모드**: 10분 이후 계속 진행

### C. 멀티플레이어 (선택)
- **Co-op 2-4인**: 협동 생존
- **경쟁 모드**: 누가 더 오래 생존하나
- **레이드 보스**: 초대형 보스 공략

---

## 📝 기술 스펙

### 성능 목표
- 동시 적 수: 200+
- FPS: 60 (일반) / 30+ (저사양)
- 맵 크기: 200x200
- 청크 로딩: 실시간

### 사용 기술
- Babylon.js (3D 엔진)
- 프로시저럴 생성 알고리즘
- 객체 풀링 (적, 투사체)
- 공간 분할 (쿼드트리)

---

## 🎯 성공 지표

1. **플레이어 유지율**: 평균 플레이 시간 > 30분
2. **난이도 밸런스**: 10분 생존율 20-30%
3. **빌드 다양성**: 최소 10개 유효 빌드
4. **재플레이성**: 같은 빌드 확률 < 5%

---

**다음 단계**: 어떤 부분부터 구현을 시작할까요?
- 자동 공격 시스템?
- 맵 확장?
- Tome 업그레이드?
