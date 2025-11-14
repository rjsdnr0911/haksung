# Megabonk Clone - Development Plan

## 🎯 프로젝트 목표
Megabonk 스타일의 탑다운 3D 로그라이크 슈팅 게임 제작

## ✅ Phase 1: 핵심 게임플레이 (완료)

### 구현 완료 항목
- [x] 탑다운 3D 카메라 시스템 (ArcRotateCamera)
- [x] 카메라 상대 이동 (WASD)
- [x] 프로시저럴 플레이어 캐릭터 (몸통, 머리, 팔, 방향 화살표)
- [x] 자동 조준 시스템 (가장 가까운 적 타겟팅)
- [x] 자동 발사 시스템 (사거리 15 유닛)
- [x] 적 스폰 시스템 (3가지 타입: normal, fast, tank)
- [x] 적 AI (플레이어 추적)
- [x] 충돌 감지 및 데미지 시스템
- [x] XP 오브 드롭 및 자석 수집
- [x] 레벨업 시스템 (XP 기반)
- [x] 프로시저럴 그리드 맵 (100x100)
- [x] 기본 UI (메뉴, HUD, HP/XP 바, 레벨 표시)

### 현재 밸런스
- **플레이어**: HP 100, 이동속도 8, 무기 데미지 15, 연사속도 3/s
- **적**: Normal(HP 30), Fast(HP 20, 속도↑), Tank(HP 100, 데미지↑)
- **스폰**: 2초마다, 최대 50마리
- **XP**: 레벨업마다 1.2배씩 증가

---

## 🚀 Phase 2: 업그레이드 시스템 (완료)

### 목표
Megabonk의 핵심인 **Tome 업그레이드 선택 시스템** 구현 ✅

### 구현 항목

#### 2.1 레벨업 UI ✅
- [x] 게임 일시정지 시스템
- [x] 레벨업 시 선택 화면 표시
- [x] 3개의 랜덤 업그레이드 카드 표시
- [x] 카드 선택 애니메이션 (hover effects)
- [x] 선택 후 게임 재개
- [x] HUD 업데이트 (HP, XP, Level, Time)

#### 2.2 Tome (업그레이드) 시스템 ✅
**무기 업그레이드 (구현 완료)**
- [x] 데미지 증가 (+15% per stack, max 5)
- [x] 연사속도 증가 (+20% per stack, max 5)
- [x] 사거리 증가 (+30% per stack, max 3)
- [x] 투사체 속도 증가 (+25% per stack, max 3)
- [x] 다중 발사 (+1 projectile per stack, 10-20도 퍼짐, max 3)

**방어 업그레이드 (구현 완료)**
- [x] 최대 HP 증가 (+20 per stack, max 10)
- [x] 체력 회복 (50 HP, unlimited)
- [x] 이동속도 증가 (+15% per stack, max 5)
- [x] XP 획득 범위 증가 (+50% per stack, max 3)

**특수 업그레이드 (구현 완료)**
- [x] 경험치 배수 (+25% per stack, max 4)

**미구현 (Phase 3+에서 추가 예정)**
- [ ] 추가 무기 슬롯 (Phase 3)
- [ ] 폭발 탄환 (Phase 3)
- [ ] 관통 탄환 (Phase 3)
- [ ] 자동 회복 (Phase 6)

#### 2.3 구현된 Tome 목록
총 11개 Tome 구현:
1. **damage_boost** (Common) - 무기 데미지 +15%
2. **fire_rate_boost** (Common) - 연사속도 +20%
3. **range_boost** (Common) - 사거리 +30%
4. **projectile_speed** (Common) - 투사체 가속 +25%
5. **max_health_boost** (Common) - 최대 HP +20
6. **heal** (Common) - 즉시 회복 50 HP
7. **speed_boost** (Rare) - 이동속도 +15%
8. **xp_magnet** (Rare) - XP 자석 범위 +50%
9. **xp_boost** (Rare) - 경험치 획득량 +25%
10. **multi_shot** (Epic) - 다중 발사 +1발 (10도 퍼짐)

### 기술 구현
- **TomeSystem.js**: Tome 정의 및 선택 로직
- **WeaponSystem.js**: Multi-shot 지원 (spread 계산)
- **Game.js**: 레벨업 UI 표시/선택/적용 로직
- **HUD 실시간 업데이트**: HP, XP, Level, Enemy Count, Time
- **Rarity 시스템**: Common, Rare, Epic (색상/효과 구분)

---

## 🎮 Phase 3: 다양한 무기 시스템 (완료)

### 목표
여러 무기를 동시에 사용 가능한 시스템 ✅

### 구현 항목
- [x] 무기 슬롯 시스템 (최대 6개)
- [x] 각 무기가 독립적으로 조준 및 발사
- [x] 예측 사격 시스템 (작은 적 명중률 개선)
- [x] 무기 타입별 구현 (5개)
  - [x] Pistol (균형잡힌 기본 무기)
  - [x] Shotgun (근거리 산탄, 6발, spread 25도)
  - [x] SMG (빠른 연사 8/s, spread 5도)
  - [x] Laser (관통, 연사 5/s, 사거리 20)
  - [x] Rocket (폭발 AOE, 범위 3, 데미지 50)

### 특수 효과 구현
- [x] **Piercing (관통)**: 레이저가 여러 적 관통, 데미지 10% 감소/적
- [x] **Explosive (폭발)**: 로켓 충돌 시 범위 폭발 데미지
- [x] 히트박스 2.5배로 확대하여 명중률 개선

### 무기 언락 Tome 4개 추가
- [x] unlock_shotgun (Rare 💥)
- [x] unlock_smg (Rare 🔫)
- [x] unlock_laser (Epic ⚡)
- [x] unlock_rocket (Legendary 🚀)

### 기술 구현
- **WeaponSystem.js**: 슬롯 기반 다중 무기, 독립 타겟팅, 예측 사격
- **Config.js**: 5개 무기 타입 정의
- **TomeSystem.js**: 총 15개 Tome (11개 기존 + 4개 무기)
- **Enemy.js**: velocity 추적으로 예측 사격 지원

---

## 🗺️ Phase 4: 대형 맵 & 포탈 시스템 (완료)

### 목표
다양한 맵과 존을 탐험하는 시스템 ✅

### 구현 항목
- [x] 맵 크기 확대 (100x100 → 200x200)
- [x] 3D 지형 시스템
  - [x] 언덕 15개 (실린더 형태)
  - [x] 바위 25개 (구/박스 형태)
  - [x] 산 5개 (원뿔 형태)
- [x] 점프 시스템 (점프력 12, 중력 30)
- [x] 속도감 증가 (이동속도 8 → 15)
- [x] 적 속도 증가 (밸런스 조정)

---

## 💎 Phase 5: 메타 진행 시스템

### 목표
런 간의 진행 및 언락 시스템

### 구현 항목
- [ ] 화폐 시스템 (실버/골드)
- [ ] 런 종료 후 보상 화면
- [ ] 영구 업그레이드 상점
  - [ ] 시작 HP 증가
  - [ ] 시작 데미지 증가
  - [ ] 시작 이동속도 증가
  - [ ] XP 획득량 증가
- [ ] 캐릭터 언락 (3-5개)
- [ ] 무기 언락 시스템
- [ ] Tome 언락 시스템
- [ ] LocalStorage 세이브/로드

---

## 🎨 Phase 6: 폴리시 & 효과 (완료)

### 목표
게임의 완성도 향상 ✅

### 구현 항목
- [x] 파티클 시스템
  - [x] 총구 화염
  - [x] 적 피격 효과
  - [x] 레벨업 효과
  - [x] 폭발 효과 (로켓)
- [x] 사운드 시스템
  - [x] 총소리
  - [x] 적 피격/죽음 소리
  - [x] 레벨업 소리
  - [x] 배경음악
- [x] 화면 효과
  - [x] 피격 시 화면 흔들림
  - [x] 데미지 표시
- [x] UI 개선
  - [x] 킬 카운터
  - [x] 타이머 (HUD)
  - [x] 개선된 HUD

---

## 🔄 Phase 7: Megabonk 시스템 재설계

### 목표
실제 Megabonk 게임 시스템을 정확히 반영한 3계층 업그레이드 구조 구현

### 배경
현재 시스템은 Vampire Survivors에 가깝고, Megabonk의 핵심 차별점을 놓치고 있음:
- ❌ 무기별 독립 업그레이드 없음
- ❌ Tome이 전역 효과만 제공
- ❌ 아이템 시스템(제2의 패시브) 없음
- ❌ 골드/실버 이중 화폐 시스템 없음

### Phase 7.1: 무기 시스템 재설계 (3-4시간)
- [ ] WeaponSlot에 레벨/업그레이드 시스템 추가
- [ ] 무기 타입별 특화 스탯 정의 (5가지 × 4-5개)
  - [ ] Sword: Damage, Knockback, Size, Duration
  - [ ] Pistol: Damage, Fire Rate, Range, Crit Chance
  - [ ] Shotgun: Damage, Pellet Count, Spread, Range
  - [ ] Laser: Damage, Fire Rate, Pierce, Duration
  - [ ] Rocket: Damage, Explosion Radius, Fire Rate, Range
- [ ] 무기별 독립 레벨업 로직 (최대 Lv.40)
- [ ] 레어도 시스템 (Common 1x ~ Legendary 2x)
- [ ] 무기 슬롯 언락 (2개 시작 → 상점에서 4개까지)

### Phase 7.2: Tome 시스템 재설계 (2-3시간)
- [ ] CharacterStats 클래스 생성
- [ ] 20개 Tome 정의
  - [ ] 기본 13개: Damage, Cooldown, HP, Regen, Shield, Agility, Size, Knockback, Projectile, Precision, Evasion, Gold, Silver
  - [ ] 언락 7개: Thorns, Quantity, Lifesteal, Attraction, Armor, Duration, Luck, XP
- [ ] 레벨 기반 효과 계산 (최대 Lv.99)
- [ ] 누적 효과 감소 (Diminishing returns)
- [ ] Tome이 캐릭터 전체에 영향 주는 방식

### Phase 7.3: 아이템 시스템 구현 (4-5시간)
- [ ] ItemSystem 클래스 생성
- [ ] 15-20개 아이템 정의
  - [ ] 공속 증가
  - [ ] 버거 드랍 (체력 회복)
  - [ ] 보스버스터 (엘리트 데미지)
  - [ ] 선인장 (가시 반사)
  - [ ] 자석 (경험치 범위)
  - [ ] ... (추가 아이템)
- [ ] 상자 오픈 시스템
- [ ] 아이템 효과 적용 로직
- [ ] 아이템 UI 표시

### Phase 7.4: 화폐 시스템 (2시간)
- [ ] CurrencySystem 클래스
- [ ] 실버/골드 분리
  - [ ] 실버: 런 종료 후 획득, 영구 업그레이드
  - [ ] 골드: 런 중 획득, 상자 오픈
- [ ] 화폐 획득 로직
- [ ] 상점 시스템 (실버로 언락)

### Phase 7.5: 레벨업 UI 통합 (2-3시간)
- [ ] 무기 업그레이드 + Tome 혼합 선택지
- [ ] 레어도별 UI 디자인
- [ ] 업그레이드 미리보기 (현재 → 다음 레벨)
- [ ] 새 UI 레이아웃

### Phase 7.6: 밸런싱 & 테스트 (2-3시간)
- [ ] 무기별 스탯 밸런싱
- [ ] Tome 효과 조정
- [ ] 아이템 드랍률/효과 조정
- [ ] 플레이 테스트 및 조정

**상세 계획**: `MEGABONK_REDESIGN.md` 참조

---

## 🐛 Phase 8: 최적화 & 밸런싱

### 목표
성능 최적화 및 게임 밸런스 조정

### 구현 항목
- [ ] 적 풀링 시스템
- [ ] 투사체 풀링
- [ ] LOD 시스템
- [ ] 오클루전 컬링
- [ ] 밸런스 테스트
  - [ ] 적 난이도 곡선
  - [ ] 업그레이드 효과
  - [ ] 무기 밸런스
- [ ] 버그 수정

---

## 📊 현재 진행 상황

```
Phase 1: ████████████████████ 100% (완료) ✅
Phase 2: ████████████████████ 100% (완료) ✅
Phase 3: ████████████████████ 100% (완료) ✅
Phase 4: ████████████████████ 100% (완료) ✅
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0% (보류)
Phase 6: ████████████████████ 100% (완료) ✅
Phase 7: ░░░░░░░░░░░░░░░░░░░░   0% (시작 예정) 🔥
Phase 8: ░░░░░░░░░░░░░░░░░░░░   0%

전체 진행률: 63% (5/8 phases)
```

---

## 🎯 다음 작업: Phase 7 - Megabonk 시스템 재설계

### 개요
현재 시스템을 실제 Megabonk 게임 메커니즘에 맞게 전면 재설계합니다.

### 핵심 변경사항
1. **무기별 독립 업그레이드**: 각 무기가 자체 레벨과 특화 스탯 보유
2. **Tome 레벨 시스템**: 캐릭터 전체 스탯을 레벨업하는 비전서
3. **아이템 시스템**: 골드로 상자 열어서 획득하는 제2의 패시브
4. **이중 화폐**: 실버(영구 업그레이드) + 골드(런 중 소비)

### 우선순위
- 🔥 **High**: Phase 7.1 (무기 재설계), 7.2 (Tome 재설계)
- 📌 **Medium**: Phase 7.3 (아이템), 7.4 (화폐)
- ⭐ **Low**: Phase 7.5 (UI), 7.6 (밸런싱)

**상세 문서**: `MEGABONK_REDESIGN.md`

---

## 📝 개발 노트

### 아키텍처 장점
- ✅ 모듈화된 구조 (Entity-System 패턴)
- ✅ Config.js로 밸런스 조정 용이
- ✅ 확장 가능한 시스템 설계
- ✅ 100% Claude Code 자동화 가능

### 기술 스택
- **엔진**: Babylon.js 6.x
- **언어**: JavaScript (ES6 modules)
- **아키텍처**: Entity-Component-System
- **배포**: Static hosting (GitHub Pages)

### 변경 이력
- **2025-01-14**: Phase 7 계획 수립 - Megabonk 시스템 재설계 (무기/Tome/아이템 3계층)
- **2025-01-XX**: Phase 6 완료 - 파티클, 사운드, 화면 효과, UI 개선
- **2025-01-XX**: Phase 4 완료 - 200x200 맵, 3D 지형, 점프, 속도감
- **2025-01-XX**: Phase 3 완료 - 다중 무기 시스템, 예측 사격, 5개 무기, 특수 효과
- **2025-01-XX**: Phase 2 완료 - Tome 업그레이드 시스템 11개, HUD 업데이트, Multi-shot 구현
- **2025-01-XX**: Phase 1 완료 - 핵심 게임플레이 구현

### 다음 세션 목표
**Phase 7 시작**: Megabonk 시스템 재설계 (무기 독립 업그레이드, Tome 레벨 시스템, 아이템 시스템)
