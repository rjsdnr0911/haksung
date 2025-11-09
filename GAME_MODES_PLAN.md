# 게임 모드 개발 계획서

## 🎮 Mega Bonk 게임 분석

### 핵심 특징
**장르**: 3D Survivor-like (Vampire Survivors + Risk of Rain 2)
**시점**: 3인칭 탑다운 (Top-down 3D)
**성공**: 2주만에 100만 카피 판매, Steam 압도적 긍정 평가

### 게임플레이 메커니즘

#### 1. 기본 시스템
- **자동 공격**: 캐릭터가 자동으로 가장 가까운 적 공격
- **이동만 조작**: WASD로 이동, 마우스는 카메라 회전 (선택적)
- **XP 수집**: 죽은 적이 XP 크리스탈 드랍 → 수집하면 레벨업
- **10분 런**: 10분 생존이 목표, 마지막에 보스 등장

#### 2. 진행 구조
```
시작 → 적 무리 등장 → 자동 공격으로 처치 → XP 수집 → 레벨업
     ↓
업그레이드 선택 (Tomes) → 더 강한 적 → 중간 보스 (2-3분마다)
     ↓
골드 수집 → 상점에서 아이템 구매 → 신전에서 버프 획득
     ↓
10분 경과 → 최종 보스 등장 → 승리 or 사망
```

#### 3. 핵심 요소

**환경 상호작용**:
- 신전(Shrines): 임시 파워 부스트
- 상점(Shops): 골드로 아이템 구매
- 지형: 언덕, 낭떠러지 (낙하 데미지)
- 3D 지형 활용: 높낮이, 장애물

**빌드 시스템**:
- 20개 캐릭터
- 70개 이상 아이템
- 무기: 최대 레벨 40
- Tomes(패시브): 최대 레벨 99
- 크리티컬 + 오버크릿 (100% 넘으면 다중 크리티컬)

**적 시스템**:
- 적 무리(Swarm) 메커닉: 겹친 적들을 효율적으로 처리
- 미니보스 (2-3분마다)
- 최종 보스 (10분)
- 난이도 지속 증가

#### 4. 카메라 & 컨트롤
- **3인칭 탑다운**: 캐릭터를 위에서 바라봄
- **고정 또는 회전 가능**: 플레이어 선택
- **자동 조준**: 가장 가까운 적 자동 타겟팅
- **이동 중심**: 위치 선정이 전략의 핵심

---

## 📋 두 모드 비교

### 모드 1: 웨이브 디펜스 FPS
```
시점: 1인칭 (FPS)
조작: WASD 이동 + 마우스 조준 + 클릭 사격
진행: 웨이브 → 특전 선택 → 다음 웨이브
난이도: 웨이브별 증가
목표: 최대한 많은 웨이브 클리어
```

**기존 코드 활용도**: ⭐⭐⭐⭐⭐ (90%)
- 이미 FPS 시스템 구현됨
- 카메라, 조준, 사격 완성
- 웨이브 시스템 코드 존재 (제거했지만 복원 가능)

### 모드 2: Mega Bonk 스타일 (3D Survivor-like)
```
시점: 3인칭 탑다운
조작: WASD 이동만 (자동 공격)
진행: 10분 생존 → 골드 & XP → 레벨업 → 보스
난이도: 시간에 따라 증가
목표: 10분 생존 + 보스 처치
```

**기존 코드 활용도**: ⭐⭐⭐ (40%)
- 레벨업/XP 시스템 재사용 가능
- 적 스폰 시스템 재사용 가능
- 카메라 완전 재구현 필요
- 자동 공격 시스템 새로 구현

---

## 🎯 개발 우선순위 추천

### 추천: 웨이브 디펜스 먼저 개발

#### 이유 1: 기술적 용이성
```
현재 코드베이스        웨이브 디펜스       Mega Bonk 스타일
      |                    |                    |
   FPS 시스템 ------> 약간 수정 -----> 완전 재구현
   듀얼 무기 --------> 단일 무기 -----> 자동 공격
   레벨업 -----------> 그대로 -------> 그대로
   카메라 -----------> 그대로 -------> 탑다운으로 변경

개발 시간: 2-3일              개발 시간: 1-2주
```

#### 이유 2: 점진적 학습
- 웨이브 디펜스 → Babylon.js 익히기
- Mega Bonk 스타일 → 새로운 시점/메커닉 도전

#### 이유 3: 테스트 용이성
- 웨이브 디펜스: 기존 시스템 검증
- Mega Bonk: 완전히 새로운 경험

#### 이유 4: 유저 피드백
- 먼저 웨이브 완성 → 테스트
- 피드백 반영 → Mega Bonk 개발 시 적용

### 개발 순서 제안

```
1주차: 웨이브 디펜스 완성
  Day 1-2: 웨이브 시스템 복원 + 특전 시스템
  Day 3: 밸런싱 + 폴리싱
  Day 4: 테스트 + 버그 수정

2-3주차: Mega Bonk 스타일 개발
  Day 5-7: 탑다운 카메라 + 자동 공격
  Day 8-10: 골드/상점 시스템
  Day 11-12: 보스 시스템
  Day 13-14: 밸런싱 + 폴리싱
```

---

## 🎨 3D 게임 Assets 추가 방법 (Babylon.js)

### 현재 사용 중인 방법 (Procedural)

**장점**: 파일 없이 코드로 즉시 생성
**단점**: 단순한 도형만 가능

```javascript
// 현재 방식 - 코드로 생성
const enemy = BABYLON.MeshBuilder.CreateBox("enemy", {size: 1.5}, scene);
const sphere = BABYLON.MeshBuilder.CreateSphere("player", {diameter: 2}, scene);
```

---

### 방법 1: 3D 모델 파일 로드 (권장)

#### 지원 포맷
- **GLTF/GLB** ⭐⭐⭐⭐⭐ (가장 권장)
- **OBJ** ⭐⭐⭐⭐
- **FBX** ⭐⭐⭐ (플러그인 필요)
- **STL** ⭐⭐

#### 무료 3D 모델 사이트

**1. Sketchfab**
- URL: https://sketchfab.com
- 포맷: GLTF, FBX, OBJ
- 특징: 가장 많은 무료 모델, 상업적 사용 필터
```
검색어: "low poly character", "low poly enemy", "game asset"
필터: "Downloadable", "Free"
```

**2. Quaternius**
- URL: https://quaternius.com
- 포맷: GLTF, FBX
- 특징: 100% 무료, CC0 라이센스, 게임 최적화
- 추천: Ultimate Modular Characters, Ultimate Animated Animals

**3. Kenney Assets**
- URL: https://kenney.nl/assets
- 포맷: GLTF, OBJ
- 특징: Low-poly, 게임용, CC0
- 추천: Character Pack, Animated Characters

**4. Poly Pizza (구 Google Poly)**
- URL: https://poly.pizza
- 포맷: GLTF, OBJ
- 특징: Low-poly, 간단한 모델

**5. Mixamo**
- URL: https://www.mixamo.com
- 포맷: FBX (GLTF 변환 필요)
- 특징: 애니메이션 포함 캐릭터, Adobe 무료

#### Babylon.js에서 로드하기

```javascript
// GLTF/GLB 로드 (권장)
BABYLON.SceneLoader.ImportMesh(
    "",                                    // 특정 메시 이름 (빈 문자열 = 전부)
    "./assets/models/",                    // 폴더 경로
    "enemy.glb",                          // 파일 이름
    scene,                                 // 씬
    function (meshes) {                   // 콜백
        const enemy = meshes[0];
        enemy.position = new BABYLON.Vector3(0, 0, 10);
        enemy.scaling = new BABYLON.Vector3(2, 2, 2);
    }
);

// OBJ 로드
BABYLON.SceneLoader.ImportMesh(
    "",
    "./assets/models/",
    "character.obj",
    scene,
    function (meshes) {
        const player = meshes[0];
    }
);
```

#### 프로젝트 구조
```
haksung/
├── index.html
├── game.js
└── assets/
    ├── models/           ← 3D 모델
    │   ├── player.glb
    │   ├── enemy_zombie.glb
    │   ├── enemy_robot.glb
    │   └── boss.glb
    ├── textures/         ← 텍스처 이미지
    │   ├── ground.jpg
    │   ├── wall.png
    │   └── metal.jpg
    └── sounds/           ← 사운드 (나중에)
        ├── shoot.mp3
        └── bgm.mp3
```

---

### 방법 2: 텍스처로 꾸미기

#### 무료 텍스처 사이트

**1. Poly Haven**
- URL: https://polyhaven.com/textures
- 특징: PBR 텍스처, 4K 고품질, CC0

**2. Textures.com** (구 CGTextures)
- URL: https://www.textures.com
- 특징: 무료 계정 15장/일

**3. Kenney Textures**
- URL: https://kenney.nl/assets?q=2d
- 특징: Low-poly 스타일, 게임용

#### 텍스처 적용하기

```javascript
// 단순 텍스처
const material = new BABYLON.StandardMaterial("mat", scene);
material.diffuseTexture = new BABYLON.Texture("./assets/textures/brick.jpg", scene);
enemy.material = material;

// PBR 텍스처 (더 사실적)
const pbr = new BABYLON.PBRMaterial("pbr", scene);
pbr.albedoTexture = new BABYLON.Texture("./assets/textures/metal_albedo.jpg", scene);
pbr.metallicTexture = new BABYLON.Texture("./assets/textures/metal_metallic.jpg", scene);
pbr.bumpTexture = new BABYLON.Texture("./assets/textures/metal_normal.jpg", scene);
```

---

### 방법 3: 지형/환경 만들기

#### 현재: 평평한 원형 플랫폼
```javascript
// game.js에 있는 현재 아레나
arena = BABYLON.MeshBuilder.CreateCylinder("arena", {
    diameter: ARENA_RADIUS * 2,
    height: 1
}, scene);
```

#### 개선: 3D 지형 추가

**옵션 A: HeightMap으로 언덕 만들기**
```javascript
// 흑백 이미지로 높낮이 표현
const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "./assets/textures/heightmap.png",  // 흑백 이미지
    {
        width: 100,
        height: 100,
        subdivisions: 50,
        minHeight: 0,
        maxHeight: 10
    },
    scene
);
```

**옵션 B: 직접 지형 디자인**
```javascript
// 언덕
const hill = BABYLON.MeshBuilder.CreateSphere("hill", {
    diameter: 10,
    segments: 16
}, scene);
hill.scaling.y = 0.5;  // 반구 형태
hill.position = new BABYLON.Vector3(20, 0, 20);

// 장애물 (바위)
const rock = BABYLON.MeshBuilder.CreatePolyhedron("rock", {
    type: 0,  // 랜덤 모양
    size: 3
}, scene);
rock.position = new BABYLON.Vector3(10, 1.5, -10);
```

**옵션 C: 모델로 맵 만들기**
```javascript
// Blender 등에서 만든 맵 로드
BABYLON.SceneLoader.ImportMesh(
    "",
    "./assets/maps/",
    "desert_map.glb",
    scene,
    function (meshes) {
        // 맵의 각 부분에 충돌 설정
        meshes.forEach(mesh => {
            mesh.checkCollisions = true;
        });
    }
);
```

---

### 방법 4: 3D 모델 직접 만들기 (선택)

#### 무료 3D 모델링 툴

**1. Blender** (가장 강력)
- URL: https://www.blender.org
- 난이도: 높음
- 특징: 전문가급 기능
- 내보내기: GLTF 기본 지원

**2. Blockbench** (게임용)
- URL: https://www.blockbench.net
- 난이도: 쉬움
- 특징: Minecraft 스타일 low-poly
- 내보내기: GLTF, OBJ

**3. Tinkercad** (초보자용)
- URL: https://www.tinkercad.com
- 난이도: 매우 쉬움
- 특징: 온라인, 블록 조립 방식
- 내보내기: OBJ, STL

---

## 💡 추천 Assets 패키지 (Mega Bonk 스타일용)

### 캐릭터
```
Quaternius - Ultimate Modular Characters
- Low-poly 캐릭터
- 애니메이션 포함
- 무료 (CC0)
```

### 적
```
Kenney - Character Pack
+ Mixamo - Zombie Pack
- 다양한 적 타입
- 애니메이션 포함
```

### 환경
```
Kenney - Nature Kit
+ Quaternius - Ultimate Nature Pack
- 나무, 바위, 풀
- Low-poly 스타일
```

### UI 아이콘
```
Kenney - Game Icons
- 무기, 아이템 아이콘
- PNG 2048x2048
```

---

## 🚀 빠른 시작 가이드

### 1단계: 폴더 생성
```bash
mkdir -p assets/models assets/textures assets/maps
```

### 2단계: 첫 모델 다운로드
1. Quaternius.com 접속
2. "Ultimate Modular Characters" 다운로드
3. GLTF 파일을 assets/models/에 복사

### 3단계: 코드에 로드
```javascript
// game.js에 추가
BABYLON.SceneLoader.ImportMesh(
    "",
    "./assets/models/",
    "character.glb",
    scene,
    function (meshes) {
        const player = meshes[0];
        player.position.y = 1;
        console.log("캐릭터 로드 완료!");
    }
);
```

---

## 📊 최종 추천

### 개발 순서
1. **웨이브 디펜스** (2-3일)
   - 기존 코드 활용
   - 빠른 완성
   - FPS 장르 경험

2. **Mega Bonk 스타일** (1-2주)
   - Assets 수집 및 적용
   - 새로운 카메라/컨트롤
   - 더 큰 도전

### Assets 전략
- **웨이브 디펜스**: 현재 코드 유지 (Procedural)
- **Mega Bonk**: 무료 모델 활용 (Quaternius + Kenney)

---

**결론**: 웨이브 디펜스부터 시작하세요. 완성 후 Mega Bonk 스타일로 확장하는 것이 학습 곡선과 동기 부여 면에서 최적입니다.
