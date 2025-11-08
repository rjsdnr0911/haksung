// ==================== Game State ====================
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PERK_SELECT: 'perk_select',
    GAME_OVER: 'game_over'
};

let currentState = GameState.MENU;
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
            // This will be handled in update loop
            player.hasRegen = true;
        }
    }
];

// Arena setup
const ARENA_RADIUS = 15;
let arena;

// Input handling
let keys = {};
let isPointerLocked = false;

// ==================== Initialization ====================
window.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    // Create scene
    scene = createScene();

    // UI event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });

    // Input listeners
    setupInputHandlers();

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

    return scene;
}

// ==================== Game Logic ====================
function startGame() {
    currentState = GameState.PLAYING;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    // Request pointer lock
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.requestPointerLock();

    // Start first wave
    startWave(1);
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

    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", { size: 1.5 }, scene);
    enemy.position = new BABYLON.Vector3(x, 0.75, z);

    const enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
    enemyMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    enemyMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
    enemy.material = enemyMat;

    // Enemy properties
    enemy.health = 50 + (wave.current - 1) * 20;
    enemy.maxHealth = enemy.health;
    enemy.speed = 2 + (wave.current - 1) * 0.3;
    enemy.damage = 10 + (wave.current - 1) * 5;
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

function handlePlayerMovement(deltaTime) {
    const forward = camera.getDirection(BABYLON.Axis.Z);
    const right = camera.getDirection(BABYLON.Axis.X);

    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    let movement = BABYLON.Vector3.Zero();

    if (keys['w'] || keys['W']) movement.addInPlace(forward);
    if (keys['s'] || keys['S']) movement.subtractInPlace(forward);
    if (keys['d'] || keys['D']) movement.addInPlace(right);
    if (keys['a'] || keys['A']) movement.subtractInPlace(right);

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

        // Attack if close enough
        if (distance < 2) {
            if (now - enemy.lastAttackTime > enemy.attackCooldown) {
                damagePlayer(enemy.damage);
                enemy.lastAttackTime = now;
            }
        } else {
            // Move towards player
            enemy.position.addInPlace(direction.scale(enemy.speed * deltaTime));
        }

        // Keep enemy on platform
        enemy.position.y = 0.75;
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

    // Raycast from camera
    const ray = camera.getForwardRay(100);
    const hit = scene.pickWithRay(ray, (mesh) => {
        return wave.enemies.includes(mesh);
    });

    // Visual bullet trace
    createBulletTrace(camera.position, ray.direction);

    if (hit.pickedMesh) {
        const enemy = hit.pickedMesh;
        damageEnemy(enemy, player.weapon.damage);
    }
}

function createBulletTrace(origin, direction) {
    const end = origin.add(direction.scale(100));
    const trace = BABYLON.MeshBuilder.CreateLines("trace", {
        points: [origin, end]
    }, scene);
    trace.color = new BABYLON.Color3(1, 1, 0);

    setTimeout(() => {
        trace.dispose();
    }, 50);
}

function damageEnemy(enemy, damage) {
    enemy.health -= damage;

    // Visual feedback
    enemy.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    setTimeout(() => {
        if (!enemy.isDisposed()) {
            enemy.material.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
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

    wave.enemiesAlive--;
    updateWaveUI();

    enemy.dispose();
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
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    canvas.addEventListener('click', () => {
        if (currentState === GameState.PLAYING) {
            if (!isPointerLocked) {
                canvas.requestPointerLock();
            } else {
                shoot();
            }
        }
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
