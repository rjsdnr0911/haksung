# Assets 폴더

게임에 사용되는 3D 모델, 텍스처, 사운드 파일들을 저장하는 폴더입니다.

## 📁 폴더 구조

### `models/`
3D 모델 파일 (.glb 또는 .gltf)
- **GLTF/GLB 포맷만 사용**
- 적 모델, 무기 모델, 환경 오브젝트 등

예시 구조:
```
models/
├── enemies/
│   ├── enemy_basic.glb
│   ├── enemy_runner.glb
│   ├── enemy_tank.glb
│   └── boss.glb
├── weapons/
│   ├── pistol.glb
│   └── rifle.glb
└── environment/
    └── props.glb
```

### `textures/`
텍스처 이미지 파일 (.png, .jpg)
- 필요한 경우 추가 텍스처
- GLTF에 포함되지 않은 별도 텍스처

### `sounds/`
사운드 이펙트, 배경음악 (.mp3, .wav)
- 사격 소리, 폭발음 등

## 🎯 사용 방법

### 1. GLTF 모델 추가
다운로드한 에셋에서 **gltf 폴더 내용만** 이곳에 복사하세요.
- ❌ blends, fbx, obj 폴더는 필요 없음
- ✅ gltf 폴더만 사용

### 2. 게임 코드에서 로드
```javascript
BABYLON.SceneLoader.ImportMesh("", "assets/models/enemies/", "enemy_basic.glb", scene,
    (meshes) => {
        const enemy = meshes[0];
        // 사용...
    }
);
```

## ⚠️ 주의사항

- **파일 크기**: 단일 파일 100MB 이하 (GitHub 제한)
- **경로**: 파일명과 경로의 대소문자 정확히 확인
- **포맷**: GLB (권장) 또는 GLTF 사용
