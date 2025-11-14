# Calcium 캐릭터 3D 모델 적용 가이드

## ✅ 구현 완료 사항

Calcium 캐릭터에 3D GLB 모델과 속도 기반 애니메이션 시스템이 완전히 구현되었습니다!

### 주요 기능

1. **3D GLB 모델 로딩**
   - Walking 애니메이션 모델 로드
   - Running 애니메이션 모델 로드
   - 자동 스켈레톤 연결

2. **속도 기반 애니메이션 전환**
   - 기본 속도: Walking 애니메이션
   - 빠른 속도 (10 이상): Running 애니메이션
   - Calcium의 Speed Demon 패시브로 속도 증가 시 자동 전환
   - 정지 시 애니메이션 일시정지
   - 이동 속도에 따른 애니메이션 재생 속도 자동 조절 (0.5x ~ 2.0x)

3. **폴백 시스템**
   - GLB 파일이 없어도 게임 정상 작동 (기존 procedural 모델 사용)
   - 로딩 실패 시 자동으로 fallback

---

## 📁 GLB 파일 위치

다음 두 파일을 아래 경로에 추가하세요:

```
C:\Users\rjsdn\Desktop\haksung\assets\models\characters\
├── Animation_Walking_withSkin.glb
└── Animation_Running_withSkin.glb
```

### 파일 요구사항

- **Animation_Walking_withSkin.glb**: 걷기 애니메이션이 포함된 Calcium 모델
- **Animation_Running_withSkin.glb**: 달리기 애니메이션이 포함된 Calcium 모델
- 두 모델은 같은 스켈레톤 구조를 가져야 애니메이션 전환이 부드럽습니다

---

## 🎮 테스트 방법

1. **GLB 파일 추가 후**:
   ```bash
   cd C:\Users\rjsdn\Desktop\haksung
   npm start  # 또는 python -m http.server 8000
   ```

2. **브라우저에서 확인**:
   - http://localhost:8000 접속
   - Calcium 캐릭터 선택
   - 게임 시작

3. **동작 확인**:
   - WASD로 이동 → Walking 애니메이션 재생
   - 적에게 피해를 받지 않고 계속 이동 → Speed Demon 패시브로 속도 증가
   - 속도 증가 시 → Running 애니메이션으로 자동 전환
   - 정지 시 → 애니메이션 일시정지
   - F12 콘솔에서 로딩 및 애니메이션 전환 로그 확인

---

## ⚙️ 설정 조정

### 애니메이션 전환 속도 임계값 변경

`src/entities/Player.js:65`에서 조정:

```javascript
this.runningSpeedThreshold = 10; // 기본값 10
```

- **값을 낮추면**: 더 빨리 Running 애니메이션으로 전환
- **값을 높이면**: 더 느리게 전환 (더 빠른 속도에서만 Running)

### 모델 스케일 조정

`src/entities/Player.js:264`에서 조정:

```javascript
const modelScale = this.sizeMultiplier * 0.5; // 기본값 0.5
```

- 모델이 너무 크면 `0.5`를 `0.3` 정도로 줄이기
- 모델이 너무 작으면 `0.5`를 `0.8` 정도로 늘리기

### 애니메이션 재생 속도 범위 조정

`src/entities/Player.js:412`에서 조정:

```javascript
anim.speedRatio = Math.max(0.5, Math.min(2.0, speedRatio));
```

- 첫 번째 값(0.5): 최소 재생 속도
- 두 번째 값(2.0): 최대 재생 속도

---

## 🔍 디버깅 팁

### 콘솔 로그 확인

게임 실행 시 F12 개발자 도구에서 다음 로그 확인:

```
[Player] Created as Calcium 💀 at ...
[Player] Loading Calcium 3D model...
[Player] Walking model loaded successfully
[Player] Walking animation loaded
[Player] Running animation loaded
[Player] Running animation transferred to main model
[Player] Procedural meshes hidden, using 3D model
[Player] Playing animation: walking
```

### 에러 발생 시

**"Failed to load Calcium 3D model"** 에러:
- GLB 파일 경로 확인: `assets/models/characters/`
- 파일 이름 확인: `Animation_Walking_withSkin.glb`
- 콘솔에서 404 에러 확인
- 파일이 없으면 procedural 모델로 자동 fallback됨

**애니메이션이 전환되지 않을 때**:
- 콘솔에서 현재 속도 확인
- `runningSpeedThreshold` 값 조정
- Speed Demon 패시브가 작동 중인지 확인 (적에게 맞지 않아야 함)

---

## 📝 구현 세부사항

### 코드 구조

- **`loadCalciumModel()`**: GLB 파일 로드 및 애니메이션 그룹 저장
- **`playAnimation()`**: 특정 애니메이션 재생 (walking/running)
- **`updateAnimation()`**: 현재 속도에 따라 애니메이션 전환
- **`hideProceduralMeshes()`**: 3D 모델 로드 성공 시 procedural 모델 숨김
- **`update()`**: 매 프레임 속도 계산 및 애니메이션 업데이트

### Speed Demon 패시브와의 연동

Calcium의 Speed Demon 패시브:
- 적에게 피해를 받지 않으면 2초마다 속도 +2% (최대 +100%)
- 속도가 증가하면 자동으로 Running 애니메이션으로 전환
- 피해를 받으면 속도가 50%로 리셋되어 다시 Walking으로 전환

---

## 🎯 다음 단계 (선택사항)

1. **추가 애니메이션**:
   - Idle 애니메이션 (정지 시)
   - Attack 애니메이션 (공격 시)
   - Damaged 애니메이션 (피격 시)

2. **다른 캐릭터 지원**:
   - Dicehead, Garlic Boi 등 다른 캐릭터에도 3D 모델 적용

3. **이펙트 추가**:
   - Running 시 먼지 파티클
   - 속도 증가 시 잔상 효과

---

## ✅ 완료 체크리스트

- [x] GLB 로더 시스템 구현
- [x] Walking 애니메이션 로드
- [x] Running 애니메이션 로드
- [x] 속도 기반 애니메이션 전환 로직
- [x] 애니메이션 재생 속도 동적 조절
- [x] Fallback 시스템 (GLB 없어도 작동)
- [x] Speed Demon 패시브와 연동
- [ ] GLB 파일 추가 (사용자 작업)
- [ ] 실제 테스트 (GLB 파일 추가 후)

---

**마지막 업데이트**: 2025-01-15
**구현자**: Claude Code
**프로젝트**: Megabonk Clone - Calcium Character 3D Model
