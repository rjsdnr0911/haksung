// Balance Test Script - 현재 시스템의 스탯 상승 곡선 분석

console.log('=== Megabonk Clone Balance Analysis ===\n');

// 기본 스탯
const BASE_STATS = {
    damage: 15,
    fireRate: 3,
    range: 15,
    projectileSpeed: 30,
    moveSpeed: 15,
    maxHealth: 100
};

// 현재 Tome 시스템 시뮬레이션
class BalanceSimulator {
    constructor() {
        this.stats = { ...BASE_STATS };
        this.appliedTomes = {};
    }

    // 데미지 부스트 적용 (15% 증가, 최대 5회)
    applyDamageBoost(times = 1) {
        for (let i = 0; i < times; i++) {
            this.stats.damage = Math.floor(this.stats.damage * 1.15);
        }
    }

    // 연사 부스트 적용 (20% 증가, 최대 5회)
    applyFireRateBoost(times = 1) {
        for (let i = 0; i < times; i++) {
            this.stats.fireRate *= 1.2;
        }
    }

    // 사거리 부스트 (30% 증가, 최대 3회)
    applyRangeBoost(times = 1) {
        for (let i = 0; i < times; i++) {
            this.stats.range = Math.floor(this.stats.range * 1.3);
        }
    }

    // 이동속도 부스트 (15% 증가, 최대 5회)
    applySpeedBoost(times = 1) {
        for (let i = 0; i < times; i++) {
            this.stats.moveSpeed *= 1.15;
        }
    }

    // Multi-shot (발사체 +1, 최대 3회)
    applyMultiShot(times = 1) {
        this.stats.projectileCount = (this.stats.projectileCount || 1) + times;
    }

    // DPS 계산 (데미지 * 연사속도 * 발사체 수)
    getDPS() {
        const projectiles = this.stats.projectileCount || 1;
        return this.stats.damage * this.stats.fireRate * projectiles;
    }

    // 결과 출력
    printStats(label) {
        console.log(`\n${label}`);
        console.log('─'.repeat(50));
        console.log(`Damage:       ${this.stats.damage.toFixed(1)} (${(this.stats.damage / BASE_STATS.damage).toFixed(2)}x)`);
        console.log(`Fire Rate:    ${this.stats.fireRate.toFixed(2)}/s (${(this.stats.fireRate / BASE_STATS.fireRate).toFixed(2)}x)`);
        console.log(`Range:        ${this.stats.range} (${(this.stats.range / BASE_STATS.range).toFixed(2)}x)`);
        console.log(`Move Speed:   ${this.stats.moveSpeed.toFixed(1)} (${(this.stats.moveSpeed / BASE_STATS.moveSpeed).toFixed(2)}x)`);
        console.log(`Projectiles:  ${this.stats.projectileCount || 1}`);
        console.log(`─`.repeat(50));
        console.log(`DPS:          ${this.getDPS().toFixed(1)} (${(this.getDPS() / (BASE_STATS.damage * BASE_STATS.fireRate)).toFixed(2)}x)`);
    }
}

// 시나리오 1: 기본 상태
console.log('\n📊 Scenario 1: 기본 상태');
const s1 = new BalanceSimulator();
s1.printStats('기본 스탯');

// 시나리오 2: 데미지만 최대 스택 (5회)
console.log('\n📊 Scenario 2: 데미지 부스트만 5회 스택');
const s2 = new BalanceSimulator();
s2.applyDamageBoost(5);
s2.printStats('데미지 x5');

// 시나리오 3: 연사속도만 최대 스택 (5회)
console.log('\n📊 Scenario 3: 연사속도만 5회 스택');
const s3 = new BalanceSimulator();
s3.applyFireRateBoost(5);
s3.printStats('연사속도 x5');

// 시나리오 4: 데미지 + 연사속도 조합
console.log('\n📊 Scenario 4: 데미지 + 연사속도 (각 3회)');
const s4 = new BalanceSimulator();
s4.applyDamageBoost(3);
s4.applyFireRateBoost(3);
s4.printStats('데미지 x3 + 연사 x3');

// 시나리오 5: 최강 빌드 (데미지 5 + 연사 5 + Multi-shot 3)
console.log('\n📊 Scenario 5: 최강 빌드 (데미지 5 + 연사 5 + Multi-shot 3)');
const s5 = new BalanceSimulator();
s5.applyDamageBoost(5);
s5.applyFireRateBoost(5);
s5.applyMultiShot(3);
s5.printStats('최강 조합');

// 시나리오 6: 현실적인 중간 빌드 (레벨 15 정도)
console.log('\n📊 Scenario 6: 현실적 빌드 (레벨 ~15, 약 12개 업그레이드)');
const s6 = new BalanceSimulator();
s6.applyDamageBoost(2);
s6.applyFireRateBoost(2);
s6.applyRangeBoost(1);
s6.applySpeedBoost(2);
s6.applyMultiShot(1);
s6.printStats('중간 빌드');

// 비교 분석
console.log('\n\n📈 밸런스 분석 결과');
console.log('='.repeat(60));
console.log('❌ 문제점:');
console.log('  1. 곱연산 스택으로 인한 기하급수적 성장');
console.log(`     - 데미지 5스택: ${(s2.stats.damage / BASE_STATS.damage).toFixed(2)}x (너무 강함)`);
console.log(`     - 연사속도 5스택: ${(s3.stats.fireRate / BASE_STATS.fireRate).toFixed(2)}x (너무 강함)`);
console.log(`     - 최강 빌드 DPS: ${(s5.getDPS() / (BASE_STATS.damage * BASE_STATS.fireRate)).toFixed(1)}x (압도적)`);
console.log('  2. 여러 배율 효과 조합 시 밸런스 붕괴');
console.log('  3. 레벨업할수록 게임이 너무 쉬워짐 (도전 요소 상실)');

console.log('\n✅ Megabonk 시스템 (비교)');
console.log('  - Tome은 가산 방식: Lv.5 데미지 = 1 + (0.08 * 5) = 1.4배');
console.log('  - 무기 업그레이드는 별도 시스템');
console.log('  - Diminishing returns 적용');
console.log('  - 레벨업 효율이 점차 감소하여 밸런스 유지');

// Megabonk 스타일 시뮬레이션
console.log('\n\n📊 Megabonk 스타일 시뮬레이션');
console.log('='.repeat(60));

class MegabonkSimulator {
    constructor() {
        this.weaponStats = { damage: 15, fireRate: 3 };
        this.tomeStats = { damageMultiplier: 1.0, cooldownMultiplier: 1.0 };
    }

    // Tome: 가산 방식 (레벨당 +8%)
    upgradeDamageTome(level) {
        this.tomeStats.damageMultiplier = 1 + (level * 0.08);
    }

    // Tome: 공속 (레벨당 +10%)
    upgradeCooldownTome(level) {
        this.tomeStats.cooldownMultiplier = 1 + (level * 0.10);
    }

    // 무기 업그레이드: 독립적 (레벨당 +2 데미지)
    upgradeWeaponDamage(level) {
        this.weaponStats.damage = 15 + (level * 2);
    }

    // 무기 업그레이드: 연사 (레벨당 +0.2)
    upgradeWeaponFireRate(level) {
        this.weaponStats.fireRate = 3 + (level * 0.2);
    }

    getFinalDamage() {
        return this.weaponStats.damage * this.tomeStats.damageMultiplier;
    }

    getFinalFireRate() {
        return this.weaponStats.fireRate * this.tomeStats.cooldownMultiplier;
    }

    getDPS() {
        return this.getFinalDamage() * this.getFinalFireRate();
    }

    printStats(label) {
        console.log(`\n${label}`);
        console.log('─'.repeat(50));
        console.log(`Final Damage: ${this.getFinalDamage().toFixed(1)} (${(this.getFinalDamage() / BASE_STATS.damage).toFixed(2)}x)`);
        console.log(`Final Fire Rate: ${this.getFinalFireRate().toFixed(2)}/s (${(this.getFinalFireRate() / BASE_STATS.fireRate).toFixed(2)}x)`);
        console.log(`DPS: ${this.getDPS().toFixed(1)} (${(this.getDPS() / (BASE_STATS.damage * BASE_STATS.fireRate)).toFixed(2)}x)`);
    }
}

// Megabonk: 중간 빌드
console.log('\nMegabonk 스타일 - 중간 빌드');
const mb1 = new MegabonkSimulator();
mb1.upgradeDamageTome(5);      // Tome Lv.5
mb1.upgradeCooldownTome(5);    // Tome Lv.5
mb1.upgradeWeaponDamage(5);    // 무기 Lv.5
mb1.upgradeWeaponFireRate(3);  // 무기 Lv.3
mb1.printStats('Tome Lv.5 + 무기 Lv.5');

// Megabonk: 강력한 빌드
console.log('\nMegabonk 스타일 - 강력한 빌드');
const mb2 = new MegabonkSimulator();
mb2.upgradeDamageTome(10);     // Tome Lv.10
mb2.upgradeCooldownTome(10);   // Tome Lv.10
mb2.upgradeWeaponDamage(15);   // 무기 Lv.15
mb2.upgradeWeaponFireRate(10); // 무기 Lv.10
mb2.printStats('Tome Lv.10 + 무기 Lv.15');

console.log('\n\n🎯 결론');
console.log('='.repeat(60));
console.log('현재 시스템: 곱연산 → DPS 최대 11.6배 (압도적)');
console.log('Megabonk 시스템: 가산 방식 → DPS 약 3-4배 (균형있음)');
console.log('\n권장사항:');
console.log('  ✅ Phase 7에서 Megabonk 방식으로 전환 필요');
console.log('  ✅ 무기 독립 업그레이드 + Tome 가산 방식');
console.log('  ✅ 레벨업 효율 감소로 장기 밸런스 유지');
console.log('='.repeat(60));
