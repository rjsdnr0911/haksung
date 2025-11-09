// ==================== Game State ====================
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PERK_SELECT: 'perk_select',
    LEVEL_UP: 'level_up',
    GAME_OVER: 'game_over'
};

const GameMode = {
    WAVE_DEFENSE: 'wave_defense',
    SURVIVAL: 'survival'
};

let currentState = GameState.MENU;
let currentMode = null;
let scene, engine, camera;
let canvas;

// Player stats
let player = {
    health: 100,
    maxHealth: 100,
    position: new BABYLON.Vector3(0, 1.6, 0),
    moveSpeed: 5,
    weapon: {
        damage: 20,
        fireRate: 10, // shots per second
        maxAmmo: 30,
        currentAmmo: 30,
        reloadTime: 2000,
        isReloading: false,
        lastShotTime: 0
    }
};

// Wave system
let wave = {
    current: 1,
    enemiesTotal: 0,
    enemiesAlive: 0,
    enemies: []
};

// Perk system
let perks = [];
const perkDatabase = [
    // Basic perks
    {
        id: 'damage_up',
        name: '화력 강화',
        description: '무기 데미지 +50%',
        type: 'weapon',
        effect: () => { player.weapon.damage *= 1.5; }
    },
    {
        id: 'fire_rate',
        name: '빠른 손',
        description: '연사 속도 +50%',
        type: 'weapon',
        effect: () => { player.weapon.fireRate *= 1.5; }
    },
    {
        id: 'big_mag',
        name: '대용량 탄창',
        description: '최대 탄약 +100%',
        type: 'weapon',
        effect: () => {
            player.weapon.maxAmmo *= 2;
            player.weapon.currentAmmo = player.weapon.maxAmmo;
        }
    },
    {
        id: 'health_up',
        name: '체력 강화',
        description: '최대 체력 +50',
        type: 'survival',
        effect: () => {
            player.maxHealth += 50;
            player.health += 50;
        }
    },
    {
        id: 'regen',
        name: '재생',
        description: '초당 5 HP 회복',
        type: 'survival',
        effect: () => {
            player.hasRegen = true;
        }
    },

    // Special effect perks
    {
        id: 'flame_rounds',
        name: '🔥 화염탄',
        description: '적을 불태워 3초간 추가 피해',
        type: 'special',
        effect: () => {
            player.weapon.hasFlame = true;
        }
    },
    {
        id: 'freeze_rounds',
        name: '❄️ 동결탄',
        description: '적을 느리게 만듦 (50% 감속)',
        type: 'special',
        effect: () => {
            player.weapon.hasFreeze = true;
        }
    },
    {
        id: 'explosive_rounds',
        name: '💥 폭발탄',
        description: '범위 피해 (반경 3m)',
        type: 'special',
        effect: () => {
            player.weapon.hasExplosive = true;
        }
    },
    {
        id: 'pierce_rounds',
        name: '🎯 관통탄',
        description: '최대 3명의 적 관통',
        type: 'special',
        effect: () => {
            player.weapon.hasPierce = true;
            player.weapon.pierceCount = 3;
        }
    },
    {
        id: 'chain_lightning',
        name: '⚡ 체인 라이트닝',
        description: '적 명중 시 주변 2명에게 연쇄 피해',
        type: 'special',
        effect: () => {
            player.weapon.hasChain = true;
            player.weapon.chainCount = 2;
        }
    },
    {
        id: 'life_steal',
        name: '🩸 흡혈',
        description: '피해의 25%만큼 체력 회복',
        type: 'special',
        effect: () => {
            player.weapon.hasLifeSteal = true;
            player.weapon.lifeStealPercent = 0.25;
        }
    },
    {
        id: 'critical_hit',
        name: '💢 치명타',
        description: '25% 확률로 2배 피해',
        type: 'special',
        effect: () => {
            player.weapon.hasCritical = true;
            player.weapon.critChance = 0.25;
            player.weapon.critMultiplier = 2;
        }
    }
];

// Arena setup
const ARENA_RADIUS = 15;
let arena;

// Weapon visuals
let weaponModel;
let laserSight;

// Survival mode weapon models
let leftWeaponModel;
let rightWeaponModel;

// Input handling
let keys = {};
let isPointerLocked = false;

// Mobile controls
let isMobile = false;
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
let touchLookStart = null;
let isShooting = false;
let isShootingRight = false;

// ==================== Survival Mode Variables ====================
let survival = {
    // Player stats
    level: 1,
    xp: 0,
    xpToNextLevel: 10,
    killCount: 0,

    // Timer
    timeElapsed: 0,
    maxTime: 1200, // 20 minutes = 1200 seconds

    // Weapons (dual wielding)
    leftWeapon: null,
    rightWeapon: null,

    // Auto-attack items
    items: [],

    // Map
    mapSize: 80
};

// Item meshes storage
let itemMeshes = [];

// Damage numbers storage
let damageNumbers = [];

// ==================== Initialization ====================
window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    // Create scene
    scene = createScene();

    // UI event listeners
    document.getElementById('waveDefenseBtn').addEventListener('click', () => {
        currentMode = GameMode.WAVE_DEFENSE;
        startWaveDefenseMode();
    });
    document.getElementById('survivalBtn').addEventListener('click', () => {
        currentMode = GameMode.SURVIVAL;
        startSurvivalMode();
    });
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        toggleFullscreen();
    });

    // Detect mobile
    detectMobile();

    // Input listeners
    setupInputHandlers();

    if (isMobile) {
        setupMobileControls();
    }

    // Render loop
    engine.runRenderLoop(function() {
        if (currentState === GameState.PLAYING) {
            updateGame();
        }
        scene.render();
    });

    window.addEventListener('resize', function() {
        engine.resize();
    });
});

// ==================== Scene Creation ====================
function createScene() {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    scene.collisionsEnabled = true;

    // Camera (FPS style)
    camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvas, false);
    camera.speed = 0; // We'll handle movement manually
    camera.angularSensibility = 1000;
    camera.minZ = 0.1;
    camera.checkCollisions = true;
    camera.applyGravity = false;

    // Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.5;

    // Create arena (circular platform)
    arena = BABYLON.MeshBuilder.CreateCylinder("arena", {
        diameter: ARENA_RADIUS * 2,
        height: 1,
        tessellation: 32
    }, scene);
    arena.position.y = -0.5;

    const arenaMaterial = new BABYLON.StandardMaterial("arenaMat", scene);
    arenaMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    arenaMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    arena.material = arenaMaterial;
    arena.checkCollisions = true;

    // Arena edge (visual indicator)
    const edgeTorus = BABYLON.MeshBuilder.CreateTorus("edge", {
        diameter: ARENA_RADIUS * 2,
        thickness: 0.3,
        tessellation: 64
    }, scene);
    edgeTorus.position.y = 0.2;
    const edgeMat = new BABYLON.StandardMaterial("edgeMat", scene);
    edgeMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
    edgeTorus.material = edgeMat;

    // Sky
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    skybox.material = skyboxMaterial;

    // Create weapon model
    createWeaponModel(scene);

    // Create laser sight
    createLaserSight(scene);

    return scene;
}

// ==================== Weapon Visuals ====================
function createWeaponModel(scene) {
    // Create weapon parent (to group all parts)
    weaponModel = new BABYLON.TransformNode("weaponModel", scene);

    // Gun body (main part)
    const body = BABYLON.MeshBuilder.CreateBox("gunBody", {
        width: 0.15,
        height: 0.15,
        depth: 0.8
    }, scene);
    body.position = new BABYLON.Vector3(0.3, -0.2, 0.5);

    const bodyMat = new BABYLON.StandardMaterial("bodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    bodyMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    body.material = bodyMat;
    body.parent = weaponModel;

    // Barrel
    const barrel = BABYLON.MeshBuilder.CreateCylinder("barrel", {
        diameter: 0.08,
        height: 0.5,
        tessellation: 16
    }, scene);
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new BABYLON.Vector3(0.3, -0.15, 0.75);

    const barrelMat = new BABYLON.StandardMaterial("barrelMat", scene);
    barrelMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    barrelMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    barrel.material = barrelMat;
    barrel.parent = weaponModel;

    // Handle
    const handle = BABYLON.MeshBuilder.CreateBox("handle", {
        width: 0.1,
        height: 0.25,
        depth: 0.15
    }, scene);
    handle.position = new BABYLON.Vector3(0.3, -0.35, 0.3);

    const handleMat = new BABYLON.StandardMaterial("handleMat", scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    handle.material = handleMat;
    handle.parent = weaponModel;

    // Magazine
    const magazine = BABYLON.MeshBuilder.CreateBox("magazine", {
        width: 0.08,
        height: 0.2,
        depth: 0.1
    }, scene);
    magazine.position = new BABYLON.Vector3(0.3, -0.42, 0.35);

    const magMat = new BABYLON.StandardMaterial("magMat", scene);
    magMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    magazine.material = magMat;
    magazine.parent = weaponModel;

    // Attach weapon to camera
    weaponModel.parent = camera;
    weaponModel.position = new BABYLON.Vector3(0, 0, 0);
}

function createLaserSight(scene) {
    // Create a thin line that extends from the gun
    laserSight = BABYLON.MeshBuilder.CreateLines("laserSight", {
        points: [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 100)
        ],
        updatable: true
    }, scene);

    laserSight.color = new BABYLON.Color3(1, 0, 0); // Red laser
    laserSight.alpha = 0.6;
    laserSight.isPickable = false;
}

function updateLaserSight() {
    if (!laserSight || !camera) return;

    // Raycast from camera
    const ray = camera.getForwardRay(100);
    const hit = scene.pickWithRay(ray, (mesh) => {
        return mesh !== arena && !wave.enemies.includes(mesh) && mesh.name !== 'skyBox';
    });

    // Start from gun barrel position
    const startPos = camera.position.add(new BABYLON.Vector3(0.3, -0.15, 0.5));
    let endPos;

    if (hit.pickedPoint) {
        endPos = hit.pickedPoint;
    } else {
        endPos = ray.origin.add(ray.direction.scale(100));
    }

    // Update laser line
    laserSight = BABYLON.MeshBuilder.CreateLines("laserSight", {
        points: [startPos, endPos],
        instance: laserSight
    });
}

// ==================== Individual Weapon Models ====================
function createPistolModel(scene, side) {
    // side: 'left' or 'right'
    const weaponParent = new BABYLON.TransformNode("pistolModel_" + side, scene);

    // Pistol body (smaller, compact)
    const body = BABYLON.MeshBuilder.CreateBox("pistolBody", {
        width: 0.12,
        height: 0.12,
        depth: 0.4
    }, scene);
    const xPos = side === 'left' ? -0.25 : 0.25;
    body.position = new BABYLON.Vector3(xPos, -0.25, 0.4);

    const bodyMat = new BABYLON.StandardMaterial("pistolBodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    bodyMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    body.material = bodyMat;
    body.parent = weaponParent;

    // Short barrel
    const barrel = BABYLON.MeshBuilder.CreateCylinder("pistolBarrel", {
        diameter: 0.06,
        height: 0.25,
        tessellation: 16
    }, scene);
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new BABYLON.Vector3(xPos, -0.22, 0.55);

    const barrelMat = new BABYLON.StandardMaterial("pistolBarrelMat", scene);
    barrelMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    barrelMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    barrel.material = barrelMat;
    barrel.parent = weaponParent;

    // Handle (grip)
    const handle = BABYLON.MeshBuilder.CreateBox("pistolHandle", {
        width: 0.08,
        height: 0.2,
        depth: 0.12
    }, scene);
    handle.position = new BABYLON.Vector3(xPos, -0.4, 0.25);

    const handleMat = new BABYLON.StandardMaterial("pistolHandleMat", scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.1, 0.05, 0.05);
    handle.material = handleMat;
    handle.parent = weaponParent;

    // Magazine (smaller)
    const magazine = BABYLON.MeshBuilder.CreateBox("pistolMag", {
        width: 0.06,
        height: 0.15,
        depth: 0.08
    }, scene);
    magazine.position = new BABYLON.Vector3(xPos, -0.45, 0.3);

    const magMat = new BABYLON.StandardMaterial("pistolMagMat", scene);
    magMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.12);
    magazine.material = magMat;
    magazine.parent = weaponParent;

    weaponParent.parent = camera;
    return weaponParent;
}

function createRifleModel(scene, side) {
    // side: 'left' or 'right'
    const weaponParent = new BABYLON.TransformNode("rifleModel_" + side, scene);

    // Rifle body (longer)
    const body = BABYLON.MeshBuilder.CreateBox("rifleBody", {
        width: 0.15,
        height: 0.15,
        depth: 0.8
    }, scene);
    const xPos = side === 'left' ? -0.25 : 0.25;
    body.position = new BABYLON.Vector3(xPos, -0.2, 0.5);

    const bodyMat = new BABYLON.StandardMaterial("rifleBodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    bodyMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    body.material = bodyMat;
    body.parent = weaponParent;

    // Long barrel
    const barrel = BABYLON.MeshBuilder.CreateCylinder("rifleBarrel", {
        diameter: 0.08,
        height: 0.5,
        tessellation: 16
    }, scene);
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new BABYLON.Vector3(xPos, -0.15, 0.75);

    const barrelMat = new BABYLON.StandardMaterial("rifleBarrelMat", scene);
    barrelMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    barrelMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    barrel.material = barrelMat;
    barrel.parent = weaponParent;

    // Stock (back part)
    const stock = BABYLON.MeshBuilder.CreateBox("rifleStock", {
        width: 0.12,
        height: 0.1,
        depth: 0.3
    }, scene);
    stock.position = new BABYLON.Vector3(xPos, -0.15, 0.1);

    const stockMat = new BABYLON.StandardMaterial("rifleStockMat", scene);
    stockMat.diffuseColor = new BABYLON.Color3(0.15, 0.1, 0.05);
    stock.material = stockMat;
    stock.parent = weaponParent;

    // Handle
    const handle = BABYLON.MeshBuilder.CreateBox("rifleHandle", {
        width: 0.1,
        height: 0.25,
        depth: 0.15
    }, scene);
    handle.position = new BABYLON.Vector3(xPos, -0.35, 0.3);

    const handleMat = new BABYLON.StandardMaterial("rifleHandleMat", scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    handle.material = handleMat;
    handle.parent = weaponParent;

    // Magazine (long)
    const magazine = BABYLON.MeshBuilder.CreateBox("rifleMag", {
        width: 0.08,
        height: 0.25,
        depth: 0.1
    }, scene);
    magazine.position = new BABYLON.Vector3(xPos, -0.45, 0.35);

    const magMat = new BABYLON.StandardMaterial("rifleMagMat", scene);
    magMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    magazine.material = magMat;
    magazine.parent = weaponParent;

    weaponParent.parent = camera;
    return weaponParent;
}

function createShotgunModel(scene, side) {
    // side: 'left' or 'right'
    const weaponParent = new BABYLON.TransformNode("shotgunModel_" + side, scene);

    // Shotgun body (thicker)
    const body = BABYLON.MeshBuilder.CreateBox("shotgunBody", {
        width: 0.18,
        height: 0.18,
        depth: 0.7
    }, scene);
    const xPos = side === 'left' ? -0.25 : 0.25;
    body.position = new BABYLON.Vector3(xPos, -0.2, 0.45);

    const bodyMat = new BABYLON.StandardMaterial("shotgunBodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.25, 0.15, 0.05);
    bodyMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    body.material = bodyMat;
    body.parent = weaponParent;

    // Wide barrel
    const barrel = BABYLON.MeshBuilder.CreateCylinder("shotgunBarrel", {
        diameter: 0.12,
        height: 0.4,
        tessellation: 16
    }, scene);
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new BABYLON.Vector3(xPos, -0.15, 0.7);

    const barrelMat = new BABYLON.StandardMaterial("shotgunBarrelMat", scene);
    barrelMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.12);
    barrelMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    barrel.material = barrelMat;
    barrel.parent = weaponParent;

    // Pump (under barrel)
    const pump = BABYLON.MeshBuilder.CreateBox("shotgunPump", {
        width: 0.08,
        height: 0.08,
        depth: 0.25
    }, scene);
    pump.position = new BABYLON.Vector3(xPos, -0.28, 0.55);

    const pumpMat = new BABYLON.StandardMaterial("shotgunPumpMat", scene);
    pumpMat.diffuseColor = new BABYLON.Color3(0.2, 0.12, 0.05);
    pump.material = pumpMat;
    pump.parent = weaponParent;

    // Stock
    const stock = BABYLON.MeshBuilder.CreateBox("shotgunStock", {
        width: 0.15,
        height: 0.12,
        depth: 0.35
    }, scene);
    stock.position = new BABYLON.Vector3(xPos, -0.15, 0.05);

    const stockMat = new BABYLON.StandardMaterial("shotgunStockMat", scene);
    stockMat.diffuseColor = new BABYLON.Color3(0.2, 0.12, 0.05);
    stock.material = stockMat;
    stock.parent = weaponParent;

    // Handle
    const handle = BABYLON.MeshBuilder.CreateBox("shotgunHandle", {
        width: 0.1,
        height: 0.22,
        depth: 0.12
    }, scene);
    handle.position = new BABYLON.Vector3(xPos, -0.35, 0.3);

    const handleMat = new BABYLON.StandardMaterial("shotgunHandleMat", scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.15, 0.1, 0.05);
    handle.material = handleMat;
    handle.parent = weaponParent;

    weaponParent.parent = camera;
    return weaponParent;
}

function createSMGModel(scene, side) {
    // side: 'left' or 'right'
    const weaponParent = new BABYLON.TransformNode("smgModel_" + side, scene);

    // SMG body (compact and boxy)
    const body = BABYLON.MeshBuilder.CreateBox("smgBody", {
        width: 0.13,
        height: 0.13,
        depth: 0.5
    }, scene);
    const xPos = side === 'left' ? -0.25 : 0.25;
    body.position = new BABYLON.Vector3(xPos, -0.22, 0.4);

    const bodyMat = new BABYLON.StandardMaterial("smgBodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.18, 0.18, 0.18);
    bodyMat.specularColor = new BABYLON.Color3(0.35, 0.35, 0.35);
    body.material = bodyMat;
    body.parent = weaponParent;

    // Barrel (shorter than rifle)
    const barrel = BABYLON.MeshBuilder.CreateCylinder("smgBarrel", {
        diameter: 0.07,
        height: 0.35,
        tessellation: 16
    }, scene);
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new BABYLON.Vector3(xPos, -0.18, 0.6);

    const barrelMat = new BABYLON.StandardMaterial("smgBarrelMat", scene);
    barrelMat.diffuseColor = new BABYLON.Color3(0.13, 0.13, 0.13);
    barrelMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    barrel.material = barrelMat;
    barrel.parent = weaponParent;

    // Top rail
    const rail = BABYLON.MeshBuilder.CreateBox("smgRail", {
        width: 0.06,
        height: 0.04,
        depth: 0.4
    }, scene);
    rail.position = new BABYLON.Vector3(xPos, -0.12, 0.45);

    const railMat = new BABYLON.StandardMaterial("smgRailMat", scene);
    railMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    rail.material = railMat;
    rail.parent = weaponParent;

    // Handle
    const handle = BABYLON.MeshBuilder.CreateBox("smgHandle", {
        width: 0.08,
        height: 0.2,
        depth: 0.12
    }, scene);
    handle.position = new BABYLON.Vector3(xPos, -0.38, 0.3);

    const handleMat = new BABYLON.StandardMaterial("smgHandleMat", scene);
    handleMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.08);
    handle.material = handleMat;
    handle.parent = weaponParent;

    // Magazine (long, bottom-loading)
    const magazine = BABYLON.MeshBuilder.CreateBox("smgMag", {
        width: 0.1,
        height: 0.3,
        depth: 0.08
    }, scene);
    magazine.position = new BABYLON.Vector3(xPos, -0.5, 0.35);

    const magMat = new BABYLON.StandardMaterial("smgMagMat", scene);
    magMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    magazine.material = magMat;
    magazine.parent = weaponParent;

    weaponParent.parent = camera;
    return weaponParent;
}

// Helper to create weapon model based on type
function createWeaponModelByType(type, side, scene) {
    switch (type) {
        case 'pistol':
            return createPistolModel(scene, side);
        case 'rifle':
            return createRifleModel(scene, side);
        case 'shotgun':
            return createShotgunModel(scene, side);
        case 'smg':
            return createSMGModel(scene, side);
        default:
            return createPistolModel(scene, side);
    }
}

// ==================== Game Logic ====================
function startWaveDefenseMode() {
    currentState = GameState.PLAYING;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('waveHud').classList.remove('hidden');

    // Show mobile controls if on mobile
    if (isMobile) {
        document.getElementById('mobileControls').classList.add('active');
        // Show/hide appropriate buttons for wave defense mode
        document.getElementById('shootButton').style.display = 'flex';
        document.getElementById('shootRightButton').style.display = 'none';
        document.getElementById('reloadButton').style.display = 'flex';
    } else {
        // Request pointer lock for desktop
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    }

    // Show wave defense weapon model
    if (weaponModel) {
        weaponModel.setEnabled(true);
    }

    // Hide survival weapon models if they exist
    if (leftWeaponModel) {
        leftWeaponModel.setEnabled(false);
    }
    if (rightWeaponModel) {
        rightWeaponModel.setEnabled(false);
    }

    // Start first wave
    startWave(1);
}

function startSurvivalMode() {
    currentState = GameState.PLAYING;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('survivalHud').classList.remove('hidden');

    // Show mobile controls if on mobile
    if (isMobile) {
        document.getElementById('mobileControls').classList.add('active');
        // Show/hide appropriate buttons for survival mode
        document.getElementById('shootButton').style.display = 'flex';
        document.getElementById('shootRightButton').style.display = 'flex';
        document.getElementById('reloadButton').style.display = 'none';
    } else {
        // Request pointer lock for desktop
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    }

    // Initialize survival mode
    survival.level = 1;
    survival.xp = 0;
    survival.xpToNextLevel = 10;
    survival.killCount = 0;
    survival.timeElapsed = 0;
    survival.items = [];

    // Clean up old item meshes
    for (const mesh of itemMeshes) {
        if (mesh) mesh.dispose();
    }
    itemMeshes = [];

    // Initialize dual weapons (basic starting weapons)
    survival.leftWeapon = createWeapon('pistol');
    survival.rightWeapon = createWeapon('rifle');

    // Hide wave defense weapon model
    if (weaponModel) {
        weaponModel.setEnabled(false);
    }

    // Create dual weapon models for survival mode
    leftWeaponModel = createWeaponModelByType(survival.leftWeapon.type, 'left', scene);
    rightWeaponModel = createWeaponModelByType(survival.rightWeapon.type, 'right', scene);

    // Update weapon UI
    updateSurvivalWeaponUI();

    // Create large map
    createSurvivalMap();

    // Start survival timer
    startSurvivalTimer();

    // Start spawning enemies
    startSurvivalSpawner();
}

function startWave(waveNumber) {
    wave.current = waveNumber;
    wave.enemiesTotal = 5 + (waveNumber - 1) * 3;
    wave.enemiesAlive = wave.enemiesTotal;
    wave.enemies = [];

    updateWaveUI();

    // Spawn enemies over time
    let spawnedCount = 0;
    const spawnInterval = setInterval(() => {
        if (spawnedCount < wave.enemiesTotal) {
            spawnEnemy();
            spawnedCount++;
        } else {
            clearInterval(spawnInterval);
        }
    }, 1000);
}

function spawnEnemy() {
    // Random position on arena edge
    const angle = Math.random() * Math.PI * 2;
    const distance = ARENA_RADIUS - 2;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    // Determine enemy type based on wave and randomness
    let enemyType = 'normal';

    // Boss wave (every 5 waves)
    if (wave.current % 5 === 0 && wave.enemiesAlive === wave.enemiesTotal - 1) {
        enemyType = 'boss';
    } else if (wave.current >= 3) {
        // After wave 3, introduce special enemies
        const rand = Math.random();
        if (rand < 0.2) enemyType = 'runner';
        else if (rand < 0.4) enemyType = 'tank';
        else if (rand < 0.5 && wave.current >= 5) enemyType = 'shooter';
    }

    createEnemyByType(enemyType, x, z);
}

function createEnemyByType(type, x, z) {
    let enemy, enemyMat;
    const waveMultiplier = wave.current - 1;

    switch(type) {
        case 'runner':
            // Fast but weak
            enemy = BABYLON.MeshBuilder.CreateBox("enemy", {
                width: 1, height: 1, depth: 1
            }, scene);
            enemy.position = new BABYLON.Vector3(x, 0.5, z);

            enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
            enemyMat.diffuseColor = new BABYLON.Color3(1, 1, 0.2); // Yellow
            enemyMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0);
            enemy.material = enemyMat;

            enemy.enemyType = 'runner';
            enemy.health = 25 + waveMultiplier * 10;
            enemy.maxHealth = enemy.health;
            enemy.speed = 5 + waveMultiplier * 0.5;
            enemy.damage = 5 + waveMultiplier * 3;
            break;

        case 'tank':
            // Slow but strong
            enemy = BABYLON.MeshBuilder.CreateBox("enemy", {
                width: 2, height: 2, depth: 2
            }, scene);
            enemy.position = new BABYLON.Vector3(x, 1, z);

            enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
            enemyMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gray
            enemyMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            enemy.material = enemyMat;

            enemy.enemyType = 'tank';
            enemy.health = 150 + waveMultiplier * 40;
            enemy.maxHealth = enemy.health;
            enemy.speed = 1 + waveMultiplier * 0.1;
            enemy.damage = 20 + waveMultiplier * 8;
            break;

        case 'shooter':
            // Ranged attacker
            enemy = BABYLON.MeshBuilder.CreateCylinder("enemy", {
                diameter: 1.2, height: 1.5, tessellation: 6
            }, scene);
            enemy.position = new BABYLON.Vector3(x, 0.75, z);

            enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
            enemyMat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2); // Green
            enemyMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
            enemy.material = enemyMat;

            enemy.enemyType = 'shooter';
            enemy.health = 40 + waveMultiplier * 15;
            enemy.maxHealth = enemy.health;
            enemy.speed = 1.5 + waveMultiplier * 0.2;
            enemy.damage = 15 + waveMultiplier * 5;
            enemy.shootRange = 10;
            enemy.lastShootTime = 0;
            enemy.shootCooldown = 2000;
            break;

        case 'boss':
            // Boss enemy - large and powerful
            enemy = BABYLON.MeshBuilder.CreateSphere("enemy", {
                diameter: 4, segments: 16
            }, scene);
            enemy.position = new BABYLON.Vector3(x, 2, z);

            enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
            enemyMat.diffuseColor = new BABYLON.Color3(0.8, 0, 0.8); // Purple
            enemyMat.emissiveColor = new BABYLON.Color3(0.4, 0, 0.4);
            enemy.material = enemyMat;

            enemy.enemyType = 'boss';
            enemy.health = 500 + waveMultiplier * 200;
            enemy.maxHealth = enemy.health;
            enemy.speed = 1.5 + waveMultiplier * 0.15;
            enemy.damage = 30 + waveMultiplier * 10;
            enemy.isBoss = true;
            break;

        default:
            // Normal enemy
            enemy = BABYLON.MeshBuilder.CreateBox("enemy", { size: 1.5 }, scene);
            enemy.position = new BABYLON.Vector3(x, 0.75, z);

            enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
            enemyMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2); // Red
            enemyMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
            enemy.material = enemyMat;

            enemy.enemyType = 'normal';
            enemy.health = 50 + waveMultiplier * 20;
            enemy.maxHealth = enemy.health;
            enemy.speed = 2 + waveMultiplier * 0.3;
            enemy.damage = 10 + waveMultiplier * 5;
    }

    enemy.lastAttackTime = 0;
    enemy.attackCooldown = 1000;

    wave.enemies.push(enemy);
}

function updateGame() {
    const deltaTime = engine.getDeltaTime() / 1000;

    // Player movement
    handlePlayerMovement(deltaTime);

    // Update enemies
    updateEnemies(deltaTime);

    // Update enemy projectiles
    updateEnemyProjectiles(deltaTime);

    // Update special effects
    updateBurnEffects(deltaTime);
    updateFreezeEffects(deltaTime);

    // Update laser sight
    updateLaserSight();

    // Update damage numbers
    updateDamageNumbers(deltaTime);

    // Mode-specific updates
    if (currentMode === GameMode.SURVIVAL) {
        updateSurvivalMode(deltaTime);
        updateSurvivalHealthUI();
    } else if (currentMode === GameMode.WAVE_DEFENSE) {
        // Regeneration perk
        if (player.hasRegen) {
            player.health = Math.min(player.maxHealth, player.health + 5 * deltaTime);
            updateHealthUI();
        }

        // Check wave clear
        if (wave.enemiesAlive === 0 && currentState === GameState.PLAYING) {
            onWaveClear();
        }
    }
}

function handlePlayerMovement(deltaTime) {
    const forward = camera.getDirection(BABYLON.Axis.Z);
    const right = camera.getDirection(BABYLON.Axis.X);

    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    let movement = BABYLON.Vector3.Zero();

    // Keyboard input
    if (keys['w'] || keys['W']) movement.addInPlace(forward);
    if (keys['s'] || keys['S']) movement.subtractInPlace(forward);
    if (keys['d'] || keys['D']) movement.addInPlace(right);
    if (keys['a'] || keys['A']) movement.subtractInPlace(right);

    // Mobile joystick input
    if (isMobile && joystickActive) {
        movement.addInPlace(forward.scale(joystickVector.y));
        movement.addInPlace(right.scale(joystickVector.x));
    }

    if (movement.length() > 0) {
        movement.normalize();
        const newPos = camera.position.add(movement.scale(player.moveSpeed * deltaTime));

        // Keep player within arena bounds
        const distFromCenter = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
        if (distFromCenter < ARENA_RADIUS - 1) {
            camera.position = newPos;
        }
    }
}

function updateEnemies(deltaTime) {
    const now = Date.now();

    for (let i = wave.enemies.length - 1; i >= 0; i--) {
        const enemy = wave.enemies[i];

        if (!enemy || enemy.isDisposed()) {
            wave.enemies.splice(i, 1);
            continue;
        }

        // Move towards player
        const direction = camera.position.subtract(enemy.position);
        const distance = direction.length();
        direction.normalize();

        // Shooter behavior - ranged attack
        if (enemy.enemyType === 'shooter') {
            if (distance < enemy.shootRange && distance > 5) {
                // Stay at range and shoot
                if (now - enemy.lastShootTime > enemy.shootCooldown) {
                    enemyShoot(enemy);
                    enemy.lastShootTime = now;
                }
                // Strafe slightly
                const strafeDir = new BABYLON.Vector3(-direction.z, 0, direction.x);
                enemy.position.addInPlace(strafeDir.scale(enemy.speed * deltaTime * 0.5));
            } else if (distance > enemy.shootRange) {
                // Move closer
                enemy.position.addInPlace(direction.scale(enemy.speed * deltaTime));
            } else {
                // Too close, back away
                enemy.position.subtractInPlace(direction.scale(enemy.speed * deltaTime));
            }
        } else {
            // Melee behavior
            if (distance < 2) {
                // Attack if close enough
                if (now - enemy.lastAttackTime > enemy.attackCooldown) {
                    damagePlayer(enemy.damage);
                    enemy.lastAttackTime = now;
                }
            } else {
                // Move towards player
                enemy.position.addInPlace(direction.scale(enemy.speed * deltaTime));
            }
        }

        // Keep enemy on platform (adjust Y based on type)
        if (enemy.enemyType === 'runner') {
            enemy.position.y = 0.5;
        } else if (enemy.enemyType === 'tank') {
            enemy.position.y = 1;
        } else if (enemy.enemyType === 'boss') {
            enemy.position.y = 2;
        } else {
            enemy.position.y = 0.75;
        }
    }
}

function enemyShoot(enemy) {
    const direction = camera.position.subtract(enemy.position);
    direction.normalize();

    // Create projectile
    const projectile = BABYLON.MeshBuilder.CreateSphere("projectile", {
        diameter: 0.3
    }, scene);
    projectile.position = enemy.position.clone();
    projectile.position.y += 1;

    const projMat = new BABYLON.StandardMaterial("projMat", scene);
    projMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
    projectile.material = projMat;

    projectile.velocity = direction.scale(8); // Projectile speed
    projectile.damage = enemy.damage;
    projectile.lifetime = 0;
    projectile.isEnemyProjectile = true;

    // Add to a projectiles array (we need to create this)
    if (!scene.enemyProjectiles) scene.enemyProjectiles = [];
    scene.enemyProjectiles.push(projectile);
}

function updateEnemyProjectiles(deltaTime) {
    if (!scene.enemyProjectiles) return;

    for (let i = scene.enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = scene.enemyProjectiles[i];

        if (!proj || proj.isDisposed()) {
            scene.enemyProjectiles.splice(i, 1);
            continue;
        }

        // Move projectile
        proj.position.addInPlace(proj.velocity.scale(deltaTime));
        proj.lifetime += deltaTime;

        // Check collision with player
        const distToPlayer = BABYLON.Vector3.Distance(proj.position, camera.position);
        if (distToPlayer < 1) {
            damagePlayer(proj.damage);
            proj.dispose();
            scene.enemyProjectiles.splice(i, 1);
            continue;
        }

        // Remove if too old or out of bounds
        if (proj.lifetime > 5 || proj.position.length() > ARENA_RADIUS + 5) {
            proj.dispose();
            scene.enemyProjectiles.splice(i, 1);
        }
    }
}

function shoot() {
    const now = Date.now();
    const timeSinceLastShot = now - player.weapon.lastShotTime;
    const shotDelay = 1000 / player.weapon.fireRate;

    if (player.weapon.isReloading) return;
    if (timeSinceLastShot < shotDelay) return;
    if (player.weapon.currentAmmo <= 0) {
        reload();
        return;
    }

    player.weapon.currentAmmo--;
    player.weapon.lastShotTime = now;
    updateAmmoUI();

    // Weapon recoil animation
    if (weaponModel) {
        const originalZ = weaponModel.position.z;
        weaponModel.position.z -= 0.1;
        setTimeout(() => {
            if (weaponModel) weaponModel.position.z = originalZ;
        }, 100);
    }

    // Calculate damage with critical hit
    let damage = player.weapon.damage;
    let isCrit = false;
    if (player.weapon.hasCritical && Math.random() < player.weapon.critChance) {
        damage *= player.weapon.critMultiplier;
        isCrit = true;
    }

    // Raycast from camera
    const ray = camera.getForwardRay(100);

    // Calculate muzzle position (gun barrel tip)
    const muzzleOffset = new BABYLON.Vector3(0.3, -0.15, 1.0);
    const muzzlePos = camera.position.add(muzzleOffset);

    // Visual bullet trace from muzzle (change color for special effects)
    if (player.weapon.hasFlame) {
        createBulletTrace(muzzlePos, ray.direction, new BABYLON.Color3(1, 0.5, 0)); // Orange
    } else if (player.weapon.hasFreeze) {
        createBulletTrace(muzzlePos, ray.direction, new BABYLON.Color3(0, 0.8, 1)); // Cyan
    } else if (player.weapon.hasChain) {
        createBulletTrace(muzzlePos, ray.direction, new BABYLON.Color3(0.5, 0.5, 1)); // Electric blue
    } else {
        createBulletTrace(muzzlePos, ray.direction);
    }

    // Create muzzle flash
    createMuzzleFlash(muzzlePos);

    // Pierce rounds - hit multiple enemies
    if (player.weapon.hasPierce) {
        const hits = scene.multiPickWithRay(ray, (mesh) => {
            return wave.enemies.includes(mesh);
        });

        let hitCount = 0;
        for (const hit of hits) {
            if (hitCount >= player.weapon.pierceCount) break;
            if (hit.pickedMesh) {
                applyWeaponEffects(hit.pickedMesh, damage, isCrit);
                hitCount++;
            }
        }
    } else {
        // Normal single-target shot
        const hit = scene.pickWithRay(ray, (mesh) => {
            return wave.enemies.includes(mesh);
        });

        if (hit.pickedMesh) {
            applyWeaponEffects(hit.pickedMesh, damage, isCrit);
        }
    }
}

function applyWeaponEffects(enemy, damage, isCrit) {
    // Apply damage
    const actualDamage = damage;
    damageEnemy(enemy, actualDamage, isCrit);

    // Life steal
    if (player.weapon.hasLifeSteal) {
        const healAmount = actualDamage * player.weapon.lifeStealPercent;
        player.health = Math.min(player.maxHealth, player.health + healAmount);
        updateHealthUI();
    }

    // Flame effect - DoT
    if (player.weapon.hasFlame) {
        applyBurnEffect(enemy);
    }

    // Freeze effect
    if (player.weapon.hasFreeze) {
        applyFreezeEffect(enemy);
    }

    // Explosive rounds
    if (player.weapon.hasExplosive) {
        createExplosion(enemy.position, damage * 0.5);
    }

    // Chain lightning
    if (player.weapon.hasChain) {
        applyChainLightning(enemy, damage * 0.5);
    }
}

function createBulletTrace(origin, direction, color = new BABYLON.Color3(1, 1, 0)) {
    const end = origin.add(direction.scale(100));
    const trace = BABYLON.MeshBuilder.CreateLines("trace", {
        points: [origin, end]
    }, scene);
    trace.color = color;

    setTimeout(() => {
        trace.dispose();
    }, 50);
}

function createMuzzleFlash(position) {
    const flash = BABYLON.MeshBuilder.CreateSphere("muzzleFlash", {
        diameter: 0.3
    }, scene);
    flash.position = position.clone();

    const flashMat = new BABYLON.StandardMaterial("flashMat", scene);
    flashMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
    flash.material = flashMat;

    setTimeout(() => {
        flash.dispose();
    }, 50);
}

function damageEnemy(enemy, damage, isCrit = false) {
    enemy.health -= damage;

    // Show damage number
    showDamageNumber(enemy.position, damage, isCrit);

    // Visual feedback
    if (isCrit) {
        enemy.material.emissiveColor = new BABYLON.Color3(1, 1, 0); // Yellow for crit
    } else {
        enemy.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    }

    setTimeout(() => {
        if (!enemy.isDisposed()) {
            // Restore original color based on type
            if (enemy.enemyType === 'runner') {
                enemy.material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0);
            } else if (enemy.enemyType === 'tank') {
                enemy.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            } else if (enemy.enemyType === 'shooter') {
                enemy.material.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
            } else if (enemy.enemyType === 'boss') {
                enemy.material.emissiveColor = new BABYLON.Color3(0.4, 0, 0.4);
            } else {
                enemy.material.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
            }
        }
    }, 100);

    if (enemy.health <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    const index = wave.enemies.indexOf(enemy);
    if (index > -1) {
        wave.enemies.splice(index, 1);
    }

    // Update based on game mode
    if (currentMode === GameMode.WAVE_DEFENSE) {
        wave.enemiesAlive--;
        updateWaveUI();
    } else if (currentMode === GameMode.SURVIVAL) {
        survival.killCount++;
        addXP(5); // Add XP in survival mode
        updateKillCountUI();
    }

    enemy.dispose();
}

// ==================== Damage Number System ====================
function showDamageNumber(position, damage, isCrit = false) {
    // Create text plane for damage number
    const damageText = Math.round(damage).toString();

    // Create plane for text
    const plane = BABYLON.MeshBuilder.CreatePlane("damageNumber", {
        width: isCrit ? 1.5 : 1,
        height: isCrit ? 1.5 : 1
    }, scene);

    // Position slightly above and offset randomly
    plane.position = position.clone();
    plane.position.y += 1.5;
    plane.position.x += (Math.random() - 0.5) * 0.5;
    plane.position.z += (Math.random() - 0.5) * 0.5;

    // Make it always face camera
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    // Create dynamic texture for text
    const dynamicTexture = new BABYLON.DynamicTexture("damageText", 256, scene);
    const context = dynamicTexture.getContext();

    // Draw text
    const fontSize = isCrit ? 120 : 80;
    const font = `bold ${fontSize}px Arial`;
    dynamicTexture.drawText(damageText, null, null, font,
        isCrit ? "#FFFF00" : "#FFFFFF",
        "transparent", true, true);

    // Apply texture to plane
    const material = new BABYLON.StandardMaterial("damageMat", scene);
    material.diffuseTexture = dynamicTexture;
    material.emissiveTexture = dynamicTexture;
    material.opacityTexture = dynamicTexture;
    material.backFaceCulling = false;
    plane.material = material;

    // Store in damage numbers array
    damageNumbers.push({
        mesh: plane,
        lifetime: 0,
        maxLifetime: 1.0, // 1 second
        initialY: plane.position.y,
        isCrit: isCrit
    });
}

function updateDamageNumbers(deltaTime) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dmgNum = damageNumbers[i];

        if (!dmgNum.mesh || dmgNum.mesh.isDisposed()) {
            damageNumbers.splice(i, 1);
            continue;
        }

        dmgNum.lifetime += deltaTime;

        // Float upward
        dmgNum.mesh.position.y = dmgNum.initialY + dmgNum.lifetime * 2;

        // Fade out
        const alpha = 1 - (dmgNum.lifetime / dmgNum.maxLifetime);
        if (dmgNum.mesh.material) {
            dmgNum.mesh.material.alpha = alpha;
        }

        // Remove when expired
        if (dmgNum.lifetime >= dmgNum.maxLifetime) {
            dmgNum.mesh.dispose();
            damageNumbers.splice(i, 1);
        }
    }
}

// ==================== Item Inventory UI ====================
function getItemIcon(type) {
    const icons = {
        drone: '🔵',
        orbital: '🟠',
        thunderNova: '⚡',
        flameAura: '🔥',
        shockwave: '💨'
    };
    return icons[type] || '❓';
}

function updateItemInventoryUI() {
    const container = document.getElementById('itemInventory');
    if (!container) return;

    container.innerHTML = '';

    for (const item of survival.items) {
        const slot = document.createElement('div');
        slot.className = 'item-slot';

        const icon = getItemIcon(item.type);

        slot.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-level">Lv. ${item.level}</div>
            </div>
        `;

        container.appendChild(slot);
    }
}

// ==================== Special Effect Functions ====================
function applyBurnEffect(enemy) {
    if (enemy.isBurning) return; // Don't stack

    enemy.isBurning = true;
    enemy.burnDuration = 3; // 3 seconds
    enemy.burnDPS = player.weapon.damage * 0.3; // 30% of damage per second
    enemy.burnTickRate = 0.5; // Tick every 0.5 seconds
    enemy.burnLastTick = Date.now();
}

function updateBurnEffects(deltaTime) {
    const now = Date.now();

    for (const enemy of wave.enemies) {
        if (enemy.isBurning) {
            enemy.burnDuration -= deltaTime;

            if (now - enemy.burnLastTick > enemy.burnTickRate * 1000) {
                damageEnemy(enemy, enemy.burnDPS * enemy.burnTickRate);
                enemy.burnLastTick = now;

                // Visual effect
                if (!enemy.isDisposed()) {
                    enemy.material.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
                }
            }

            if (enemy.burnDuration <= 0) {
                enemy.isBurning = false;
            }
        }
    }
}

function applyFreezeEffect(enemy) {
    if (enemy.isFrozen) return;

    enemy.isFrozen = true;
    enemy.freezeDuration = 2; // 2 seconds
    enemy.originalSpeed = enemy.speed;
    enemy.speed *= 0.5; // 50% slow

    // Visual effect
    if (!enemy.isDisposed()) {
        enemy.material.specularColor = new BABYLON.Color3(0.5, 0.5, 1);
    }
}

function updateFreezeEffects(deltaTime) {
    for (const enemy of wave.enemies) {
        if (enemy.isFrozen) {
            enemy.freezeDuration -= deltaTime;

            if (enemy.freezeDuration <= 0) {
                enemy.isFrozen = false;
                enemy.speed = enemy.originalSpeed;
                if (!enemy.isDisposed()) {
                    enemy.material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
                }
            }
        }
    }
}

function createExplosion(position, damage) {
    // Visual explosion
    const explosion = BABYLON.MeshBuilder.CreateSphere("explosion", {
        diameter: 6
    }, scene);
    explosion.position = position.clone();

    const expMat = new BABYLON.StandardMaterial("expMat", scene);
    expMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    expMat.alpha = 0.5;
    explosion.material = expMat;

    setTimeout(() => {
        explosion.dispose();
    }, 200);

    // Apply damage to nearby enemies
    for (const enemy of wave.enemies) {
        const distance = BABYLON.Vector3.Distance(enemy.position, position);
        if (distance < 3) {
            damageEnemy(enemy, damage * (1 - distance / 3)); // Falloff damage
        }
    }
}

function applyChainLightning(sourceEnemy, damage) {
    let currentTarget = sourceEnemy;
    let chainedEnemies = [sourceEnemy];
    let chainCount = 0;

    while (chainCount < player.weapon.chainCount) {
        let closestEnemy = null;
        let closestDistance = Infinity;

        // Find nearest unchained enemy
        for (const enemy of wave.enemies) {
            if (chainedEnemies.includes(enemy)) continue;

            const distance = BABYLON.Vector3.Distance(enemy.position, currentTarget.position);
            if (distance < 8 && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (!closestEnemy) break;

        // Create lightning visual
        const lightning = BABYLON.MeshBuilder.CreateLines("lightning", {
            points: [currentTarget.position, closestEnemy.position]
        }, scene);
        lightning.color = new BABYLON.Color3(0.5, 0.5, 1);

        setTimeout(() => {
            lightning.dispose();
        }, 100);

        // Apply damage
        damageEnemy(closestEnemy, damage * 0.7); // Reduced damage per chain

        chainedEnemies.push(closestEnemy);
        currentTarget = closestEnemy;
        chainCount++;
    }
}

function damagePlayer(damage) {
    player.health -= damage;
    updateHealthUI();

    if (player.health <= 0) {
        gameOver();
    }
}

function reload() {
    if (player.weapon.isReloading) return;
    if (player.weapon.currentAmmo === player.weapon.maxAmmo) return;

    player.weapon.isReloading = true;

    setTimeout(() => {
        player.weapon.currentAmmo = player.weapon.maxAmmo;
        player.weapon.isReloading = false;
        updateAmmoUI();
    }, player.weapon.reloadTime);
}

function onWaveClear() {
    currentState = GameState.PERK_SELECT;
    showPerkSelection();
}

function showPerkSelection() {
    // Exit pointer lock to show cursor
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }

    document.getElementById('perkScreen').style.display = 'flex';

    // Select 3 random perks
    const availablePerks = [...perkDatabase];
    const selectedPerks = [];

    for (let i = 0; i < 3 && availablePerks.length > 0; i++) {
        const index = Math.floor(Math.random() * availablePerks.length);
        selectedPerks.push(availablePerks.splice(index, 1)[0]);
    }

    // Display perks
    const container = document.getElementById('perkContainer');
    container.innerHTML = '';

    selectedPerks.forEach(perk => {
        const card = document.createElement('div');
        card.className = 'perk-card';
        card.innerHTML = `
            <span class="perk-type">${perk.type === 'weapon' ? '무기' : '생존'}</span>
            <h3>${perk.name}</h3>
            <p>${perk.description}</p>
        `;
        card.addEventListener('click', () => selectPerk(perk));
        container.appendChild(card);
    });
}

function selectPerk(perk) {
    // Apply perk effect
    perk.effect();
    perks.push(perk);

    // Hide perk screen
    document.getElementById('perkScreen').style.display = 'none';

    // Re-enable pointer lock for desktop
    if (!isMobile) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    }

    // Start next wave
    currentState = GameState.PLAYING;
    startWave(wave.current + 1);
}

function gameOver() {
    currentState = GameState.GAME_OVER;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalWave').textContent = wave.current;

    // Exit pointer lock
    document.exitPointerLock();
}

// ==================== Input Handlers ====================
function setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;

        if (e.key === 'r' || e.key === 'R') {
            reload();
        }

        if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (currentState === GameState.PLAYING) {
            if (!isPointerLocked && !isMobile) {
                canvas.requestPointerLock();
            } else {
                // Survival mode: dual weapons
                if (currentMode === GameMode.SURVIVAL) {
                    if (e.button === 0) { // Left click
                        shootWeapon(survival.leftWeapon, true);
                    } else if (e.button === 2) { // Right click
                        shootWeapon(survival.rightWeapon, false);
                    }
                } else {
                    // Wave defense mode: single weapon
                    if (e.button === 0) {
                        shoot();
                    }
                }
            }
        }
    });

    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === canvas;
    });
}

// ==================== UI Updates ====================
function updateHealthUI() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent =
        Math.ceil(player.health) + '/' + player.maxHealth;
}

function updateAmmoUI() {
    document.getElementById('currentAmmo').textContent = player.weapon.currentAmmo;
    document.getElementById('maxAmmo').textContent = player.weapon.maxAmmo;
}

function updateWaveUI() {
    document.getElementById('waveNumber').textContent = wave.current;
    document.getElementById('enemyCount').textContent = wave.enemiesAlive;
}

// ==================== Fullscreen ====================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ==================== Mobile Controls ====================
function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window);
}

function setupMobileControls() {
    const joystickArea = document.getElementById('joystickArea');
    const joystickStick = document.getElementById('joystickStick');
    const shootButton = document.getElementById('shootButton');
    const reloadButton = document.getElementById('reloadButton');

    // Joystick controls
    let joystickTouchId = null;
    let joystickCenter = { x: 0, y: 0 };
    const joystickRadius = 75;

    joystickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickTouchId !== null) return;

        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;

        const rect = joystickArea.getBoundingClientRect();
        joystickCenter.x = rect.left + rect.width / 2;
        joystickCenter.y = rect.top + rect.height / 2;

        joystickActive = true;
        updateJoystick(touch.clientX, touch.clientY, joystickCenter, joystickRadius);
    });

    joystickArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                updateJoystick(touch.clientX, touch.clientY, joystickCenter, joystickRadius);
                break;
            }
        }
    });

    joystickArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                joystickTouchId = null;
                joystickActive = false;
                joystickVector = { x: 0, y: 0 };
                joystickStick.style.transform = 'translate(-50%, -50%)';
                break;
            }
        }
    });

    // Shoot button (Left weapon in survival, single weapon in wave defense)
    shootButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isShooting = true;
        startAutoShoot('left');
    });

    shootButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        isShooting = false;
    });

    // Right weapon button (Survival mode only)
    const shootRightButton = document.getElementById('shootRightButton');

    shootRightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isShootingRight = true;
        startAutoShoot('right');
    });

    shootRightButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        isShootingRight = false;
    });

    // Reload button (Wave defense mode only)
    reloadButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentMode === GameMode.WAVE_DEFENSE) {
            reload();
        }
    });

    // Touch camera rotation (right side of screen)
    let lookTouchId = null;
    let lastTouchPos = { x: 0, y: 0 };

    canvas.addEventListener('touchstart', (e) => {
        // Only use touches on right half of screen for looking
        for (let touch of e.changedTouches) {
            if (touch.clientX > window.innerWidth / 2) {
                lookTouchId = touch.identifier;
                lastTouchPos.x = touch.clientX;
                lastTouchPos.y = touch.clientY;
                break;
            }
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === lookTouchId) {
                const deltaX = touch.clientX - lastTouchPos.x;
                const deltaY = touch.clientY - lastTouchPos.y;

                // Rotate camera
                camera.rotation.y += deltaX * 0.003;
                camera.rotation.x += deltaY * 0.003;

                // Clamp vertical rotation
                camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

                lastTouchPos.x = touch.clientX;
                lastTouchPos.y = touch.clientY;
                break;
            }
        }
    });

    canvas.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === lookTouchId) {
                lookTouchId = null;
                break;
            }
        }
    });
}

function updateJoystick(touchX, touchY, center, radius) {
    const deltaX = touchX - center.x;
    const deltaY = touchY - center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let x = deltaX;
    let y = deltaY;

    if (distance > radius) {
        x = (deltaX / distance) * radius;
        y = (deltaY / distance) * radius;
    }

    // Update visual
    const joystickStick = document.getElementById('joystickStick');
    joystickStick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

    // Update vector for movement (normalize to -1 to 1)
    joystickVector.x = x / radius;
    joystickVector.y = -y / radius; // Invert Y for forward/backward
}

function startAutoShoot(side = 'left') {
    // Check which button is being held
    const isActive = (side === 'left') ? isShooting : isShootingRight;

    if (!isActive || currentState !== GameState.PLAYING) return;

    // Shoot based on game mode
    if (currentMode === GameMode.SURVIVAL) {
        if (side === 'left') {
            shootWeapon(survival.leftWeapon, true);
        } else {
            shootWeapon(survival.rightWeapon, false);
        }
    } else {
        // Wave defense mode
        shoot();
    }

    // Continue shooting while button is held
    setTimeout(() => {
        if (side === 'left' && isShooting) {
            startAutoShoot('left');
        } else if (side === 'right' && isShootingRight) {
            startAutoShoot('right');
        }
    }, 100);
}
// ==================== Survival Mode Functions ====================

// Weapon creation
function createWeapon(type) {
    const weapons = {
        pistol: {
            name: '권총',
            damage: 20,  // 중간 데미지
            fireRate: 5,  // 낮은 연사
            maxAmmo: 12,
            currentAmmo: 12,
            reloadTime: 1200,
            spread: 0.01
        },
        rifle: {
            name: '라이플',
            damage: 15,  // 낮은 데미지
            fireRate: 10, // 빠른 연사
            maxAmmo: 30,
            currentAmmo: 30,
            reloadTime: 2000,
            spread: 0.02
        },
        shotgun: {
            name: '샷건',
            damage: 50,
            fireRate: 2,
            maxAmmo: 8,
            currentAmmo: 8,
            reloadTime: 2500,
            spread: 0.1,
            pellets: 6
        },
        smg: {
            name: 'SMG',
            damage: 12,
            fireRate: 15,
            maxAmmo: 40,
            currentAmmo: 40,
            reloadTime: 1500,
            spread: 0.03
        }
    };

    const weapon = { ...weapons[type] };
    weapon.type = type;
    weapon.isReloading = false;
    weapon.lastShotTime = 0;
    weapon.level = 1;

    return weapon;
}

// Create large survival map
function createSurvivalMap() {
    // Remove old arena if exists
    if (arena) arena.dispose();

    // Create large ground plane
    const ground = BABYLON.MeshBuilder.CreateGround("survivalGround", {
        width: survival.mapSize,
        height: survival.mapSize
    }, scene);
    ground.position.y = 0;

    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.2);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;
    ground.checkCollisions = true;

    arena = ground;

    // Add boundary walls (invisible)
    const halfSize = survival.mapSize / 2;
    // Just use the ground bounds for collision detection
}

// Start survival timer
function startSurvivalTimer() {
    // Timer will update in updateSurvivalMode()
}

// Start enemy spawner for survival
function startSurvivalSpawner() {
    // Spawning will be handled in updateSurvivalMode()
}

// Update survival mode
function updateSurvivalMode(deltaTime) {
    // Update timer
    survival.timeElapsed += deltaTime;
    updateTimerUI();

    // Check victory
    if (survival.timeElapsed >= survival.maxTime) {
        victoryScreen();
        return;
    }

    // Spawn enemies based on time
    spawnSurvivalEnemies(deltaTime);

    // Update player weapons
    if (survival.leftWeapon) {
        updateWeaponCooldown(survival.leftWeapon, deltaTime);
    }
    if (survival.rightWeapon) {
        updateWeaponCooldown(survival.rightWeapon, deltaTime);
    }

    // Update auto-attack items
    updateSurvivalItems(deltaTime);

    // Update drone bullets
    updateDroneBullets(deltaTime);

    // Keep player within bounds
    const halfSize = survival.mapSize / 2 - 2;
    if (Math.abs(camera.position.x) > halfSize) {
        camera.position.x = Math.sign(camera.position.x) * halfSize;
    }
    if (Math.abs(camera.position.z) > halfSize) {
        camera.position.z = Math.sign(camera.position.z) * halfSize;
    }
}

function updateWeaponCooldown(weapon, deltaTime) {
    if (weapon.isReloading) {
        // Reloading is handled by timeout
    }
}

let enemySpawnTimer = 0;
let enemySpawnRate = 1.0; // seconds between spawns

function spawnSurvivalEnemies(deltaTime) {
    enemySpawnTimer += deltaTime;

    // Spawn rate increases over time
    const timeMinutes = survival.timeElapsed / 60;
    enemySpawnRate = Math.max(0.2, 1.0 - timeMinutes * 0.05);

    if (enemySpawnTimer >= enemySpawnRate) {
        enemySpawnTimer = 0;

        // Spawn enemy at random position on map edge
        const halfSize = survival.mapSize / 2 - 2;
        const side = Math.floor(Math.random() * 4);
        let x, z;

        switch (side) {
            case 0: // top
                x = (Math.random() - 0.5) * survival.mapSize;
                z = halfSize;
                break;
            case 1: // right
                x = halfSize;
                z = (Math.random() - 0.5) * survival.mapSize;
                break;
            case 2: // bottom
                x = (Math.random() - 0.5) * survival.mapSize;
                z = -halfSize;
                break;
            case 3: // left
                x = -halfSize;
                z = (Math.random() - 0.5) * survival.mapSize;
                break;
        }

        // Determine enemy type based on time
        let enemyType = 'normal';
        if (timeMinutes > 10) {
            const rand = Math.random();
            if (rand < 0.3) enemyType = 'runner';
            else if (rand < 0.5) enemyType = 'tank';
            else if (rand < 0.7) enemyType = 'shooter';
        } else if (timeMinutes > 5) {
            const rand = Math.random();
            if (rand < 0.2) enemyType = 'runner';
            else if (rand < 0.4) enemyType = 'tank';
        }

        createEnemyByType(enemyType, x, z);
    }
}

function updateSurvivalItems(deltaTime) {
    for (const item of survival.items) {
        if (item.type === 'drone') {
            updateDrone(item, deltaTime);
        } else if (item.type === 'orbital') {
            updateOrbital(item, deltaTime);
        } else if (item.type === 'thunderNova') {
            updateThunderNova(item, deltaTime);
        } else if (item.type === 'flameAura') {
            updateFlameAura(item, deltaTime);
        } else if (item.type === 'shockwave') {
            updateShockwave(item, deltaTime);
        }
    }
}

// ==================== Auto-Attack Items ====================

// Add item to player
function addItem(itemType) {
    const item = createItem(itemType);
    survival.items.push(item);

    // Create visual mesh for item
    if (item.type === 'drone') {
        createDroneMesh(item);
    } else if (item.type === 'orbital') {
        createOrbitalMesh(item);
    } else if (item.type === 'flameAura') {
        createFlameAuraMesh(item);
    }
    // Thunder Nova and Shockwave don't have persistent meshes

    // Update UI
    updateItemInventoryUI();
}

// Create item data
function createItem(type) {
    const items = {
        drone: {
            type: 'drone',
            name: '드론',
            level: 1,
            damage: 30,
            fireRate: 2, // shots per second
            range: 15,
            orbitRadius: 3,
            orbitSpeed: 1,
            angle: Math.random() * Math.PI * 2,
            lastShotTime: 0
        },
        orbital: {
            type: 'orbital',
            name: '오비탈',
            level: 1,
            damage: 10,
            orbitRadius: 2.5,
            orbitSpeed: 3,
            angle: Math.random() * Math.PI * 2,
            lastHitTime: 0,
            hitCooldown: 0.5 // hits per second
        },
        thunderNova: {
            type: 'thunderNova',
            name: '썬더 노바',
            level: 1,
            damage: 50,
            radius: 8,
            cooldown: 5, // seconds
            lastTriggerTime: 0
        },
        flameAura: {
            type: 'flameAura',
            name: '플레임 오라',
            level: 1,
            damage: 15, // DPS
            radius: 4,
            tickRate: 0.5 // damage tick every 0.5 seconds
        },
        shockwave: {
            type: 'shockwave',
            name: '충격파',
            level: 1,
            damage: 20,
            radius: 6,
            knockback: 5,
            cooldown: 6, // seconds
            lastTriggerTime: 0
        }
    };

    return { ...items[type] };
}

// Create drone visual mesh
function createDroneMesh(item) {
    const drone = BABYLON.MeshBuilder.CreateSphere("drone", {
        diameter: 0.5,
        segments: 8
    }, scene);

    const droneMat = new BABYLON.StandardMaterial("droneMat", scene);
    droneMat.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
    droneMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8);
    drone.material = droneMat;

    item.mesh = drone;
    itemMeshes.push(drone);
}

// Create orbital visual mesh
function createOrbitalMesh(item) {
    const orbital = BABYLON.MeshBuilder.CreateSphere("orbital", {
        diameter: 0.4,
        segments: 8
    }, scene);

    const orbitalMat = new BABYLON.StandardMaterial("orbitalMat", scene);
    orbitalMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    orbitalMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0);
    orbital.material = orbitalMat;

    // Add trail effect
    const trail = BABYLON.MeshBuilder.CreateSphere("orbitalTrail", {
        diameter: 0.6,
        segments: 8
    }, scene);
    const trailMat = new BABYLON.StandardMaterial("orbitalTrailMat", scene);
    trailMat.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
    trailMat.alpha = 0.3;
    trail.material = trailMat;
    trail.parent = orbital;

    item.mesh = orbital;
    itemMeshes.push(orbital);
}

// Create flame aura visual mesh
function createFlameAuraMesh(item) {
    const aura = BABYLON.MeshBuilder.CreateTorus("flameAura", {
        diameter: item.radius * 2,
        thickness: 0.3,
        tessellation: 32
    }, scene);

    const auraMat = new BABYLON.StandardMaterial("flameAuraMat", scene);
    auraMat.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
    auraMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    auraMat.alpha = 0.4;
    aura.material = auraMat;

    // Rotate to be flat on ground
    aura.rotation.x = Math.PI / 2;

    item.mesh = aura;
    itemMeshes.push(aura);
}

// Update drone behavior
function updateDrone(item, deltaTime) {
    // Orbit around player
    item.angle += item.orbitSpeed * deltaTime;
    const x = Math.cos(item.angle) * item.orbitRadius;
    const z = Math.sin(item.angle) * item.orbitRadius;

    const dronePos = new BABYLON.Vector3(
        camera.position.x + x,
        camera.position.y,
        camera.position.z + z
    );

    if (item.mesh) {
        item.mesh.position = dronePos;
    }

    // Auto-shoot at nearest enemy
    const now = Date.now();
    if (now - item.lastShotTime > 1000 / item.fireRate) {
        const nearestEnemy = findNearestEnemy(dronePos, item.range);
        if (nearestEnemy) {
            shootFromDrone(dronePos, nearestEnemy, item.damage);
            item.lastShotTime = now;
        }
    }
}

// Update orbital behavior
function updateOrbital(item, deltaTime) {
    // Orbit around player faster
    item.angle += item.orbitSpeed * deltaTime;
    const x = Math.cos(item.angle) * item.orbitRadius;
    const z = Math.sin(item.angle) * item.orbitRadius;

    const orbitalPos = new BABYLON.Vector3(
        camera.position.x + x,
        camera.position.y,
        camera.position.z + z
    );

    if (item.mesh) {
        item.mesh.position = orbitalPos;
    }

    // Check collision with enemies
    const now = Date.now();
    if (now - item.lastHitTime > item.hitCooldown * 1000) {
        for (const enemy of wave.enemies) {
            const distance = BABYLON.Vector3.Distance(orbitalPos, enemy.position);
            if (distance < 1.5) {
                damageEnemy(enemy, item.damage);
                item.lastHitTime = now;
                break; // Only hit one enemy at a time
            }
        }
    }
}

// Update thunder nova behavior
function updateThunderNova(item, deltaTime) {
    const now = Date.now() / 1000; // Convert to seconds

    if (now - item.lastTriggerTime >= item.cooldown) {
        item.lastTriggerTime = now;
        triggerThunderNova(item);
    }
}

function triggerThunderNova(item) {
    const playerPos = camera.position;

    // Visual effect - expanding lightning sphere
    const nova = BABYLON.MeshBuilder.CreateSphere("thunderNova", {
        diameter: item.radius * 2,
        segments: 16
    }, scene);
    nova.position = playerPos.clone();

    const novaMat = new BABYLON.StandardMaterial("thunderNovaMat", scene);
    novaMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);
    novaMat.alpha = 0.6;
    nova.material = novaMat;

    // Animate expansion
    let scale = 0.1;
    const expandInterval = setInterval(() => {
        scale += 0.15;
        nova.scaling = new BABYLON.Vector3(scale, scale, scale);
        novaMat.alpha = 0.6 * (1 - scale / 2);

        if (scale >= 1) {
            clearInterval(expandInterval);
            setTimeout(() => nova.dispose(), 100);
        }
    }, 30);

    // Damage all enemies in radius
    for (const enemy of wave.enemies) {
        const distance = BABYLON.Vector3.Distance(playerPos, enemy.position);
        if (distance < item.radius) {
            damageEnemy(enemy, item.damage);

            // Lightning visual from player to enemy
            createLightningBolt(playerPos, enemy.position);
        }
    }
}

function createLightningBolt(from, to) {
    const bolt = BABYLON.MeshBuilder.CreateLines("lightning", {
        points: [from, to]
    }, scene);
    bolt.color = new BABYLON.Color3(0.5, 0.5, 1);

    setTimeout(() => bolt.dispose(), 100);
}

// Update flame aura behavior
function updateFlameAura(item, deltaTime) {
    const playerPos = camera.position;

    // Update mesh position
    if (item.mesh) {
        item.mesh.position = new BABYLON.Vector3(playerPos.x, 0.3, playerPos.z);

        // Rotate for visual effect
        item.mesh.rotation.y += deltaTime * 2;
    }

    // Initialize tick timer
    if (!item.tickTimer) item.tickTimer = 0;
    item.tickTimer += deltaTime;

    // Damage enemies in radius every tick
    if (item.tickTimer >= item.tickRate) {
        item.tickTimer = 0;

        for (const enemy of wave.enemies) {
            const distance = BABYLON.Vector3.Distance(playerPos, enemy.position);
            if (distance < item.radius) {
                damageEnemy(enemy, item.damage * item.tickRate);
            }
        }
    }
}

// Update shockwave behavior
function updateShockwave(item, deltaTime) {
    const now = Date.now() / 1000;

    if (now - item.lastTriggerTime >= item.cooldown) {
        item.lastTriggerTime = now;
        triggerShockwave(item);
    }
}

function triggerShockwave(item) {
    const playerPos = camera.position;

    // Visual effect - expanding ring
    const wave = BABYLON.MeshBuilder.CreateTorus("shockwave", {
        diameter: item.radius * 2,
        thickness: 0.5,
        tessellation: 32
    }, scene);
    wave.position = playerPos.clone();
    wave.position.y = 0.5;
    wave.rotation.x = Math.PI / 2;

    const waveMat = new BABYLON.StandardMaterial("shockwaveMat", scene);
    waveMat.emissiveColor = new BABYLON.Color3(1, 1, 0.5);
    waveMat.alpha = 0.7;
    wave.material = waveMat;

    // Animate expansion
    let scale = 0.1;
    const expandInterval = setInterval(() => {
        scale += 0.2;
        wave.scaling = new BABYLON.Vector3(scale, scale, scale);
        waveMat.alpha = 0.7 * (1 - scale / 1.5);

        if (scale >= 1) {
            clearInterval(expandInterval);
            setTimeout(() => wave.dispose(), 50);
        }
    }, 30);

    // Damage and knockback enemies
    for (const enemy of wave.enemies) {
        const distance = BABYLON.Vector3.Distance(playerPos, enemy.position);
        if (distance < item.radius) {
            damageEnemy(enemy, item.damage);

            // Knockback
            const direction = enemy.position.subtract(playerPos);
            direction.normalize();
            enemy.position.addInPlace(direction.scale(item.knockback));
        }
    }
}

// Find nearest enemy to a position
function findNearestEnemy(position, maxRange) {
    let nearest = null;
    let nearestDist = maxRange;

    for (const enemy of wave.enemies) {
        const dist = BABYLON.Vector3.Distance(position, enemy.position);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = enemy;
        }
    }

    return nearest;
}

// Shoot projectile from drone
function shootFromDrone(origin, target, damage) {
    const direction = target.position.subtract(origin);
    direction.normalize();

    // Visual bullet
    const bullet = BABYLON.MeshBuilder.CreateSphere("droneBullet", {
        diameter: 0.2
    }, scene);
    bullet.position = origin.clone();

    const bulletMat = new BABYLON.StandardMaterial("droneBulletMat", scene);
    bulletMat.emissiveColor = new BABYLON.Color3(0, 1, 1);
    bullet.material = bulletMat;

    // Bullet data
    bullet.velocity = direction.scale(20);
    bullet.damage = damage;
    bullet.lifetime = 0;
    bullet.maxLifetime = 2;
    bullet.isDroneBullet = true;

    // Add to tracking array
    if (!scene.droneBullets) scene.droneBullets = [];
    scene.droneBullets.push(bullet);

    // Create bullet trace
    createBulletTrace(origin, direction, new BABYLON.Color3(0, 1, 1));
}

// Update drone bullets
function updateDroneBullets(deltaTime) {
    if (!scene.droneBullets) return;

    for (let i = scene.droneBullets.length - 1; i >= 0; i--) {
        const bullet = scene.droneBullets[i];

        if (!bullet || bullet.isDisposed()) {
            scene.droneBullets.splice(i, 1);
            continue;
        }

        // Move bullet
        bullet.position.addInPlace(bullet.velocity.scale(deltaTime));
        bullet.lifetime += deltaTime;

        // Check collision with enemies
        let hit = false;
        for (const enemy of wave.enemies) {
            const dist = BABYLON.Vector3.Distance(bullet.position, enemy.position);
            if (dist < 1) {
                damageEnemy(enemy, bullet.damage);
                hit = true;
                break;
            }
        }

        // Remove bullet if hit or expired
        if (hit || bullet.lifetime > bullet.maxLifetime) {
            bullet.dispose();
            scene.droneBullets.splice(i, 1);
        }
    }
}

// Shoot with left or right weapon
function shootWeapon(weapon, isLeft) {
    if (!weapon) return;

    const now = Date.now();
    const shotDelay = 1000 / weapon.fireRate;
    if (now - weapon.lastShotTime < shotDelay) return;
    if (weapon.isReloading) return;
    if (weapon.currentAmmo <= 0) {
        reloadWeapon(weapon, isLeft);
        return;
    }

    weapon.currentAmmo--;
    weapon.lastShotTime = now;
    updateSurvivalWeaponUI();

    // Shoot
    const ray = camera.getForwardRay(100);
    const muzzlePos = camera.position.add(new BABYLON.Vector3(isLeft ? -0.3 : 0.3, -0.15, 1.0));

    // Shotgun fires multiple pellets
    if (weapon.type === 'shotgun') {
        for (let i = 0; i < weapon.pellets; i++) {
            const spread = weapon.spread;
            const spreadX = (Math.random() - 0.5) * spread;
            const spreadY = (Math.random() - 0.5) * spread;
            const spreadDir = ray.direction.clone();
            spreadDir.x += spreadX;
            spreadDir.y += spreadY;
            spreadDir.normalize();

            fireBullet(muzzlePos, spreadDir, weapon.damage);
        }
    } else {
        fireBullet(muzzlePos, ray.direction, weapon.damage);
    }

    createMuzzleFlash(muzzlePos);
}

function fireBullet(origin, direction, damage) {
    createBulletTrace(origin, direction);

    const ray = new BABYLON.Ray(origin, direction, 100);
    const hit = scene.pickWithRay(ray, (mesh) => {
        return wave.enemies.includes(mesh);
    });

    if (hit.pickedMesh) {
        damageEnemy(hit.pickedMesh, damage);
    }
}

function reloadWeapon(weapon, isLeft) {
    if (weapon.isReloading) return;
    if (weapon.currentAmmo === weapon.maxAmmo) return;

    weapon.isReloading = true;
    setTimeout(() => {
        weapon.currentAmmo = weapon.maxAmmo;
        weapon.isReloading = false;
        updateSurvivalWeaponUI();
    }, weapon.reloadTime);
}

// XP system
function addXP(amount) {
    survival.xp += amount;

    while (survival.xp >= survival.xpToNextLevel) {
        survival.xp -= survival.xpToNextLevel;
        survival.level++;
        survival.xpToNextLevel = Math.floor(10 * Math.pow(1.2, survival.level - 1));
        levelUp();
    }

    updateXPUI();
}

function levelUp() {
    currentState = GameState.LEVEL_UP;
    showLevelUpScreen();
}

function showLevelUpScreen() {
    // Exit pointer lock to show cursor
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }

    document.getElementById('levelUpScreen').classList.remove('hidden');

    // Generate 3 random upgrades
    const upgrades = generateUpgrades();
    const container = document.getElementById('levelUpContainer');
    container.innerHTML = '';

    upgrades.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = 'perk-card';
        card.innerHTML = `
            <span class="perk-type">${upgrade.type}</span>
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
        `;
        card.addEventListener('click', () => applyUpgrade(upgrade));
        container.appendChild(card);
    });
}

function generateUpgrades() {
    // Check existing items for level-up options
    const existingDrone = survival.items.find(item => item.type === 'drone');
    const existingOrbital = survival.items.find(item => item.type === 'orbital');
    const existingThunderNova = survival.items.find(item => item.type === 'thunderNova');
    const existingFlameAura = survival.items.find(item => item.type === 'flameAura');
    const existingShockwave = survival.items.find(item => item.type === 'shockwave');

    // Simple upgrade pool
    const allUpgrades = [
        // Weapon upgrades
        { type: '무기', name: '데미지 증가', description: '모든 무기 데미지 +20%', effect: () => {
            if (survival.leftWeapon) survival.leftWeapon.damage *= 1.2;
            if (survival.rightWeapon) survival.rightWeapon.damage *= 1.2;
        }},
        { type: '무기', name: '연사 속도', description: '모든 무기 연사속도 +20%', effect: () => {
            if (survival.leftWeapon) survival.leftWeapon.fireRate *= 1.2;
            if (survival.rightWeapon) survival.rightWeapon.fireRate *= 1.2;
        }},

        // Survival upgrades
        { type: '생존', name: '체력 증가', description: '최대 HP +50', effect: () => {
            player.maxHealth += 50;
            player.health += 50;
            updateSurvivalHealthUI();
        }},
        { type: '생존', name: '이동 속도', description: '이동 속도 +20%', effect: () => {
            player.moveSpeed *= 1.2;
        }},

        // Auto-attack items
        {
            type: '아이템',
            name: existingDrone ? '드론 강화' : '🔵 드론',
            description: existingDrone ? `드론 데미지 +30% (Lv.${existingDrone.level + 1})` : '주변을 돌며 자동 공격하는 드론 획득',
            effect: () => {
                if (existingDrone) {
                    existingDrone.level++;
                    existingDrone.damage *= 1.3;
                    existingDrone.fireRate *= 1.1;
                    updateItemInventoryUI();
                } else {
                    addItem('drone');
                }
            }
        },
        {
            type: '아이템',
            name: existingOrbital ? '오비탈 강화' : '🟠 오비탈',
            description: existingOrbital ? `오비탈 데미지 +30% (Lv.${existingOrbital.level + 1})` : '플레이어 주위를 돌며 접촉 피해를 주는 오비탈 획득',
            effect: () => {
                if (existingOrbital) {
                    existingOrbital.level++;
                    existingOrbital.damage *= 1.3;
                    existingOrbital.orbitSpeed *= 1.05;
                    updateItemInventoryUI();
                } else {
                    addItem('orbital');
                }
            }
        },

        // AoE items
        {
            type: '아이템',
            name: existingThunderNova ? '썬더 노바 강화' : '⚡ 썬더 노바',
            description: existingThunderNova ? `노바 데미지 +30% (Lv.${existingThunderNova.level + 1})` : '5초마다 주변에 번개 폭발',
            effect: () => {
                if (existingThunderNova) {
                    existingThunderNova.level++;
                    existingThunderNova.damage *= 1.3;
                    existingThunderNova.radius *= 1.1;
                    updateItemInventoryUI();
                } else {
                    addItem('thunderNova');
                }
            }
        },
        {
            type: '아이템',
            name: existingFlameAura ? '플레임 오라 강화' : '🔥 플레임 오라',
            description: existingFlameAura ? `오라 데미지 +30% (Lv.${existingFlameAura.level + 1})` : '주변에 지속 화염 피해 영역',
            effect: () => {
                if (existingFlameAura) {
                    existingFlameAura.level++;
                    existingFlameAura.damage *= 1.3;
                    existingFlameAura.radius *= 1.1;
                    updateItemInventoryUI();
                } else {
                    addItem('flameAura');
                }
            }
        },
        {
            type: '아이템',
            name: existingShockwave ? '충격파 강화' : '💨 충격파',
            description: existingShockwave ? `충격파 데미지 +30% (Lv.${existingShockwave.level + 1})` : '6초마다 적을 밀어내는 충격파',
            effect: () => {
                if (existingShockwave) {
                    existingShockwave.level++;
                    existingShockwave.damage *= 1.3;
                    existingShockwave.radius *= 1.1;
                    existingShockwave.knockback *= 1.15;
                    updateItemInventoryUI();
                } else {
                    addItem('shockwave');
                }
            }
        },
    ];

    // Pick 3 random
    const shuffled = allUpgrades.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

function applyUpgrade(upgrade) {
    upgrade.effect();
    document.getElementById('levelUpScreen').classList.add('hidden');

    // Re-enable pointer lock for desktop
    if (!isMobile) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    }

    currentState = GameState.PLAYING;
}

// UI updates
function updateTimerUI() {
    const minutes = Math.floor(survival.timeElapsed / 60);
    const seconds = Math.floor(survival.timeElapsed % 60);
    const totalMinutes = Math.floor(survival.maxTime / 60);
    const totalSeconds = Math.floor(survival.maxTime % 60);

    document.getElementById('timer').textContent =
        `${pad(minutes)}:${pad(seconds)} / ${pad(totalMinutes)}:${pad(totalSeconds)}`;
}

function pad(num) {
    return num < 10 ? '0' + num : num;
}

function updateXPUI() {
    const percent = (survival.xp / survival.xpToNextLevel) * 100;
    document.getElementById('xpFill').style.width = percent + '%';
    document.getElementById('playerLevel').textContent = survival.level;
}

function updateSurvivalHealthUI() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('survivalHealthFill').style.width = healthPercent + '%';
    document.getElementById('survivalHealthText').textContent =
        Math.ceil(player.health) + '/' + player.maxHealth;
}

function updateSurvivalWeaponUI() {
    if (survival.leftWeapon) {
        document.getElementById('leftWeaponName').textContent = survival.leftWeapon.name;
        document.getElementById('leftWeaponAmmo').textContent =
            survival.leftWeapon.currentAmmo + '/' + survival.leftWeapon.maxAmmo;
    }

    if (survival.rightWeapon) {
        document.getElementById('rightWeaponName').textContent = survival.rightWeapon.name;
        document.getElementById('rightWeaponAmmo').textContent =
            survival.rightWeapon.currentAmmo + '/' + survival.rightWeapon.maxAmmo;
    }
}

function victoryScreen() {
    currentState = GameState.GAME_OVER;
    document.getElementById('survivalHud').classList.add('hidden');
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('gameOverScreen').querySelector('h1').textContent = '승리!';
    document.getElementById('finalWave').textContent = `생존 시간: 20:00`;

    document.exitPointerLock();
}
