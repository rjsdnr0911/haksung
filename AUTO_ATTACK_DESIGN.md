# 자동 공격 시스템 설계 문서

## 목표
Survival 모드에서 Megabonk 스타일 완전 자동 공격 구현

---

## 1. 핵심 요구사항

### A. 자동 타겟팅
- 플레이어 주변 적 자동 감지
- 가장 위협적인 적 우선 타겟
- 사거리 내 적만 공격

### B. 완전 자동 발사
- 버튼 누를 필요 없음
- 타겟이 있으면 자동 발사
- 탄약 자동 관리

### C. 모드별 분리
- **Survival 모드**: 완전 자동 (새로운 기능)
- **Wave Defense 모드**: 수동 유지 (기존 유지)

---

## 2. 시스템 구조

### 기존 코드 활용
```javascript
// 기존 함수 (유지)
- shootWeapon(weapon, isLeft)  // 실제 발사 로직
- fireBullet(origin, direction, damage)  // 총알 발사
- wave.enemies  // 적 배열

// 기존 변수 (수정 필요)
- isShooting / isShootingRight  // → 자동 모드에서는 항상 true
```

### 새로운 구성요소
```javascript
// 1. 자동 공격 설정
const autoAttackConfig = {
    enabled: true,              // Survival 모드에서 자동 활성화
    targetingMode: 'NEAREST',   // 타겟 우선순위
    maxRange: 20,               // 최대 사거리
    updateInterval: 100         // 타겟 갱신 주기 (ms)
};

// 2. 타겟팅 시스템
function findBestTarget() {
    // 가장 가까운/위협적인 적 찾기
}

// 3. 자동 발사 루프
function autoAttackLoop() {
    // 매 프레임 타겟 확인 및 발사
}
```

---

## 3. 타겟팅 우선순위

### 우선순위 모드
1. **NEAREST** (기본): 가장 가까운 적
2. **LOWEST_HP**: 체력 낮은 적
3. **BOSS**: 보스 우선
4. **THREAT**: 위협도 계산 (거리 + 데미지)

### 타겟 선정 로직
```javascript
function calculateTargetPriority(enemy, mode) {
    const distance = getDistance(player, enemy);

    // 사거리 체크
    if (distance > autoAttackConfig.maxRange) {
        return -1;  // 사거리 밖
    }

    switch(mode) {
        case 'NEAREST':
            return -distance;  // 가까울수록 높은 우선순위

        case 'LOWEST_HP':
            return -(enemy.health / enemy.maxHealth);

        case 'BOSS':
            if (enemy.isBoss) return 1000;
            return -distance;

        case 'THREAT':
            // 위협도 = (데미지 / 거리)
            return enemy.damage / distance;
    }
}
```

---

## 4. 구현 단계 (점진적 개발)

### Step 1: 기본 타겟팅 (현재 단계)
- [x] 코드 분석 완료
- [ ] 가장 가까운 적 찾기 함수 구현
- [ ] 테스트: 콘솔에 타겟 정보 출력

### Step 2: 자동 조준
- [ ] 타겟 방향으로 카메라 회전
- [ ] 부드러운 회전 (lerp)
- [ ] 테스트: 시각적으로 확인

### Step 3: 자동 발사
- [ ] 타겟이 있을 때 자동 발사
- [ ] 기존 shootWeapon() 함수 활용
- [ ] 테스트: 적이 자동으로 공격받는지 확인

### Step 4: 세부 조정
- [ ] 사거리 조정
- [ ] 발사 속도 밸런싱
- [ ] 탄약 관리

---

## 5. 코드 통합 계획

### 수정할 파일
- `game.js`: 메인 로직

### 수정할 함수
```javascript
// 기존 함수 (최소 수정)
- shootWeapon()  // 타겟팅 적용
- fireBullet()   // 방향 계산 수정

// 새로운 함수
+ findNearestEnemy()
+ autoAimAtTarget()
+ autoAttackUpdate()  // updateGame()에서 호출
```

### 추가할 전역 변수
```javascript
let autoAttack = {
    enabled: true,
    currentTarget: null,
    lastTargetUpdate: 0
};
```

---

## 6. 테스트 계획

### 단계별 검증
1. **타겟팅 테스트**
   - 적 1마리: 정확히 타겟팅되는가?
   - 적 여러마리: 가장 가까운 적 선택되는가?
   - 사거리 밖: 타겟팅 안 되는가?

2. **발사 테스트**
   - 자동으로 발사되는가?
   - 탄약이 떨어지면 자동 재장전되는가?
   - 적이 죽으면 다음 타겟으로 전환되는가?

3. **성능 테스트**
   - 적 100마리: FPS 60 유지되는가?
   - 메모리 누수 없는가?

---

## 7. 예상되는 문제 및 해결책

### 문제 1: 카메라 회전이 어색함
**해결**: Lerp로 부드러운 회전
```javascript
camera.rotation.y = BABYLON.Scalar.Lerp(
    camera.rotation.y,
    targetAngle,
    0.1  // 부드러움 정도
);
```

### 문제 2: 너무 많은 적 처리
**해결**: 타겟 갱신 주기 조절 (100ms)
```javascript
if (now - autoAttack.lastTargetUpdate > 100) {
    autoAttack.currentTarget = findNearestEnemy();
    autoAttack.lastTargetUpdate = now;
}
```

### 문제 3: 양손 무기 동시 발사
**해결**: 각 무기별 독립 타겟팅
```javascript
autoAttack.leftTarget = findNearestEnemy();
autoAttack.rightTarget = findSecondNearestEnemy();
```

---

## 8. 다음 단계

이 설계가 확인되면:
1. `findNearestEnemy()` 함수 구현
2. 콘솔 로그로 테스트
3. 자동 조준 구현
4. 자동 발사 통합

---

**검토 포인트:**
- 이 설계가 합리적인가?
- 기존 코드와 충돌 없는가?
- 성능 문제 예상되는가?
- 추가로 고려할 사항은?
