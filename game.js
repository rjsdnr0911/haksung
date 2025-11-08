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

// Input handling
let keys = {};
let isPointerLocked = false;

// Mobile controls
let isMobile = false;
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
let touchLookStart = null;
let isShooting = false;

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

// ==================== Game Logic ====================
function startGame() {
    currentState = GameState.PLAYING;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    // Show mobile controls if on mobile
    if (isMobile) {
        document.getElementById('mobileControls').classList.add('active');
    } else {
        // Request pointer lock for desktop
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    }

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

    wave.enemiesAlive--;
    updateWaveUI();

    enemy.dispose();
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

        if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
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

    // Shoot button
    shootButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isShooting = true;
        startAutoShoot();
    });

    shootButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        isShooting = false;
    });

    // Reload button
    reloadButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        reload();
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

function startAutoShoot() {
    if (!isShooting || currentState !== GameState.PLAYING) return;

    shoot();

    // Continue shooting while button is held
    setTimeout(() => {
        if (isShooting) {
            startAutoShoot();
        }
    }, 100);
}
