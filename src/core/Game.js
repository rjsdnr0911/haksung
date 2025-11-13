import { Config } from './Config.js';
import { Player } from '../entities/Player.js';
import { Portal } from '../entities/Portal.js';
import { InputSystem } from '../systems/InputSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { TomeSystem } from '../systems/TomeSystem.js';
import { MetaProgressionSystem } from '../systems/MetaProgressionSystem.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.camera = null;

        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.deltaTime = 0;
        this.lastTime = performance.now();

        // Entity tracking
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.xpOrbs = [];
        this.portal = null;

        // Biome system
        this.currentBiome = 'plains'; // Start with plains
        this.visitedBiomes = ['plains'];

        // Systems
        this.inputSystem = null;
        this.spawnSystem = null;
        this.weaponSystem = null;
        this.tomeSystem = null;
        this.metaProgressionSystem = null;

        // UI elements
        this.levelUpMenu = null;
        this.hudElements = {
            healthFill: null,
            healthText: null,
            xpFill: null,
            xpText: null,
            levelText: null,
            enemyCount: null,
            timeText: null
        };
        this.startTime = 0;
    }

    async init() {
        console.log('[Game] Initializing...');

        // Create Babylon.js engine
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        // Create scene
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);

        // Setup lighting
        this.setupLighting();

        // Create camera
        this.setupCamera();

        // Create map
        this.createMap();

        console.log('[Game] Initialization complete');
    }

    setupLighting() {
        // Hemisphere light for ambient lighting
        const hemiLight = new BABYLON.HemisphericLight(
            'hemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 0.6;
        hemiLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

        // Directional light for shadows
        const dirLight = new BABYLON.DirectionalLight(
            'dirLight',
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        dirLight.intensity = 0.5;
    }

    setupCamera() {
        this.camera = new BABYLON.ArcRotateCamera(
            'camera',
            0,
            Config.camera.angle,
            Config.camera.radius,
            BABYLON.Vector3.Zero(),
            this.scene
        );

        this.camera.lowerRadiusLimit = Config.camera.minRadius;
        this.camera.upperRadiusLimit = Config.camera.maxRadius;
        this.camera.attachControl(this.canvas, true);

        // Disable panning
        this.camera.panningSensibility = 0;

        // Limit rotation
        this.camera.lowerAlphaLimit = null;
        this.camera.upperAlphaLimit = null;
        this.camera.lowerBetaLimit = Config.camera.angle - 0.2;
        this.camera.upperBetaLimit = Config.camera.angle + 0.2;
    }

    createMap() {
        const mapSize = Config.map.size;
        const biome = Config.biomes[this.currentBiome];

        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround(
            'ground',
            { width: mapSize, height: mapSize, subdivisions: 32 },
            this.scene
        );
        ground.position.y = 0;

        // Ground material with biome-specific color
        const groundMat = new BABYLON.StandardMaterial('groundMat', this.scene);
        groundMat.diffuseColor = BABYLON.Color3.FromHexString(biome.groundColor);
        groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = groundMat;
        ground.checkCollisions = false;

        // Update scene background color to match biome sky
        this.scene.clearColor = BABYLON.Color3.FromHexString(biome.skyColor);

        // Store ground reference
        this.ground = ground;

        // Create terrain features
        this.createTerrainFeatures(mapSize);

        console.log(`[Game] Map created: ${mapSize}x${mapSize} (${biome.name} ${biome.icon})`);
    }

    createTerrainFeatures(mapSize) {
        const halfMap = mapSize / 2;
        const biome = Config.biomes[this.currentBiome];

        // Material for hills (biome-specific)
        const hillMat = new BABYLON.StandardMaterial('hillMat', this.scene);
        hillMat.diffuseColor = BABYLON.Color3.FromHexString(biome.terrainColors.hill);
        hillMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Material for rocks (biome-specific)
        const rockMat = new BABYLON.StandardMaterial('rockMat', this.scene);
        rockMat.diffuseColor = BABYLON.Color3.FromHexString(biome.terrainColors.rock);
        rockMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        // Create several hills (cylindrical mounds)
        const hillCount = 15;
        for (let i = 0; i < hillCount; i++) {
            const x = (Math.random() - 0.5) * mapSize * 0.8;
            const z = (Math.random() - 0.5) * mapSize * 0.8;
            const radius = 8 + Math.random() * 12;
            const height = 3 + Math.random() * 5;

            const hill = BABYLON.MeshBuilder.CreateCylinder(
                `hill_${i}`,
                {
                    diameter: radius * 2,
                    height: height,
                    tessellation: 16
                },
                this.scene
            );
            hill.position = new BABYLON.Vector3(x, height / 2, z);
            hill.material = hillMat;
            hill.checkCollisions = true;
        }

        // Create rocks/boulders (boxes and spheres)
        const rockCount = 25;
        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * mapSize * 0.85;
            const z = (Math.random() - 0.5) * mapSize * 0.85;
            const size = 2 + Math.random() * 4;

            let rock;
            if (Math.random() > 0.5) {
                // Sphere rocks
                rock = BABYLON.MeshBuilder.CreateSphere(
                    `rock_sphere_${i}`,
                    { diameter: size, segments: 8 },
                    this.scene
                );
            } else {
                // Box rocks
                rock = BABYLON.MeshBuilder.CreateBox(
                    `rock_box_${i}`,
                    { size: size },
                    this.scene
                );
                rock.rotation.y = Math.random() * Math.PI;
            }

            rock.position = new BABYLON.Vector3(x, size / 2, z);
            rock.material = rockMat;
            rock.checkCollisions = true;
        }

        // Create tall mountain-like structures
        const mountainCount = 5;
        for (let i = 0; i < mountainCount; i++) {
            const x = (Math.random() - 0.5) * mapSize * 0.7;
            const z = (Math.random() - 0.5) * mapSize * 0.7;
            const baseRadius = 15 + Math.random() * 10;
            const height = 10 + Math.random() * 15;

            const mountain = BABYLON.MeshBuilder.CreateCylinder(
                `mountain_${i}`,
                {
                    diameterTop: baseRadius * 0.3,
                    diameterBottom: baseRadius * 2,
                    height: height,
                    tessellation: 12
                },
                this.scene
            );
            mountain.position = new BABYLON.Vector3(x, height / 2, z);

            const mountainMat = new BABYLON.StandardMaterial(`mountainMat_${i}`, this.scene);
            mountainMat.diffuseColor = BABYLON.Color3.FromHexString(biome.terrainColors.mountain);
            mountainMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            mountain.material = mountainMat;
            mountain.checkCollisions = true;
        }

        console.log('[Game] Terrain features created:', hillCount, 'hills,', rockCount, 'rocks,', mountainCount, 'mountains');
    }

    createPortal() {
        const mapSize = Config.map.size;
        const biome = Config.biomes[this.currentBiome];

        // Choose random next biome from current biome's possible next zones
        const nextBiomes = biome.nextBiomes || ['plains'];
        const targetBiome = nextBiomes[Math.floor(Math.random() * nextBiomes.length)];

        // Portal position (random location away from center)
        const angle = Math.random() * Math.PI * 2;
        const distance = mapSize * 0.3 + Math.random() * mapSize * 0.2; // 30-50% from center
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        this.portal = new Portal(
            this.scene,
            new BABYLON.Vector3(x, 0, z),
            targetBiome
        );

        console.log(`[Game] Portal created at (${x.toFixed(1)}, ${z.toFixed(1)}) -> ${targetBiome}`);
    }

    createGridTexture() {
        const resolution = 512;
        const texture = new BABYLON.DynamicTexture(
            'gridTexture',
            resolution,
            this.scene,
            false
        );

        const ctx = texture.getContext();

        // Background
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(0, 0, resolution, resolution);

        // Grid lines
        const gridSize = Config.map.gridSize;
        const lines = 16;
        const spacing = resolution / lines;

        ctx.strokeStyle = '#1a1a2a';
        ctx.lineWidth = 2;

        for (let i = 0; i <= lines; i++) {
            const pos = i * spacing;
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, resolution);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(resolution, pos);
            ctx.stroke();
        }

        // Add some noise/variation
        ctx.fillStyle = '#333344';
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * resolution;
            const y = Math.random() * resolution;
            const size = 5 + Math.random() * 15;
            ctx.fillRect(x, y, size, size);
        }

        texture.update();
        return texture;
    }

    start() {
        console.log('[Game] Starting game...');
        this.isRunning = true;
        this.isPaused = false;

        // Create player (pass camera for proper movement direction)
        this.player = new Player(this.scene, BABYLON.Vector3.Zero(), this.camera);

        // Setup level up callback
        this.player.onLevelUp = () => {
            this.showLevelUpUI();
        };

        // Setup death callback
        this.player.onDeath = () => {
            this.handlePlayerDeath();
        };

        // Initialize systems
        this.inputSystem = new InputSystem(this);
        this.spawnSystem = new SpawnSystem(this);
        this.weaponSystem = new WeaponSystem(this);
        this.tomeSystem = new TomeSystem(this);
        this.metaProgressionSystem = new MetaProgressionSystem();

        // Start new run tracking
        this.metaProgressionSystem.startNewRun();

        // Get UI elements
        this.levelUpMenu = document.getElementById('levelUpMenu');
        this.hudElements.healthFill = document.getElementById('healthFill');
        this.hudElements.healthText = document.getElementById('healthText');
        this.hudElements.xpFill = document.getElementById('xpFill');
        this.hudElements.xpText = document.getElementById('xpText');
        this.hudElements.levelText = document.getElementById('levelText');
        this.hudElements.enemyCount = document.getElementById('enemyCount');
        this.hudElements.timeText = document.getElementById('timeText');

        // Create portal
        this.createPortal();

        // Record start time
        this.startTime = Date.now();

        // Start render loop
        this.engine.runRenderLoop(() => {
            if (this.isRunning && !this.isPaused) {
                this.update();
                this.scene.render();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        console.log('[Game] Game started');
    }

    showLevelUpUI() {
        console.log('[Game] Showing level up UI');

        // Pause game
        this.isPaused = true;

        // Reset rerolls for new level up
        this.tomeSystem.resetRerolls();

        // Show the UI
        this.renderLevelUpUI();
    }

    renderLevelUpUI() {
        // Get random tomes
        const tomes = this.tomeSystem.getRandomTomes(3);

        if (tomes.length === 0) {
            console.warn('[Game] No tomes available, resuming game');
            this.isPaused = false;
            return;
        }

        // Get UI elements
        const tomeCardsContainer = document.getElementById('tomeCards');
        const rerollButton = document.getElementById('rerollButton');
        const skipButton = document.getElementById('skipButton');

        // Clear previous cards
        tomeCardsContainer.innerHTML = '';

        // Create tome cards
        tomes.forEach(tome => {
            const card = document.createElement('div');
            card.className = `tome-card ${tome.rarity}`;

            let banishButton = '';
            if (this.tomeSystem.canBanish()) {
                banishButton = '<div class="tome-banish" data-tome-id="' + tome.id + '">🚫</div>';
            }

            card.innerHTML = `
                <div class="tome-rarity ${tome.rarity}">${tome.rarity}</div>
                <div class="tome-icon">${tome.icon}</div>
                <div class="tome-name">${tome.name}</div>
                <div class="tome-description">${tome.description}</div>
                ${banishButton}
            `;

            // Add click handler for selecting tome
            card.addEventListener('click', (e) => {
                // Don't select if clicking banish button
                if (e.target.classList.contains('tome-banish')) {
                    return;
                }
                this.selectTome(tome);
            });

            // Add banish handler
            const banishBtn = card.querySelector('.tome-banish');
            if (banishBtn) {
                banishBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.banishTome(tome);
                });
            }

            tomeCardsContainer.appendChild(card);
        });

        // Setup Reroll button
        if (this.tomeSystem.canReroll()) {
            rerollButton.style.display = 'inline-block';
            rerollButton.disabled = false;
            rerollButton.onclick = () => {
                if (this.tomeSystem.useReroll()) {
                    this.renderLevelUpUI(); // Re-render with new tomes
                }
            };
        } else {
            if (this.metaProgressionSystem && this.metaProgressionSystem.isToolUnlocked('reroll')) {
                // Show but disable if used up
                rerollButton.style.display = 'inline-block';
                rerollButton.disabled = true;
                rerollButton.textContent = '🔄 Reroll (Used)';
            } else {
                rerollButton.style.display = 'none';
            }
        }

        // Setup Skip button
        if (this.tomeSystem.canSkip()) {
            skipButton.style.display = 'inline-block';
            skipButton.onclick = () => {
                this.skipLevelUp();
            };
        } else {
            skipButton.style.display = 'none';
        }

        // Show menu
        this.levelUpMenu.style.display = 'flex';
    }

    selectTome(tome) {
        console.log('[Game] Tome selected:', tome.name);

        // Apply tome
        this.tomeSystem.applyTome(tome);

        // Hide menu
        this.levelUpMenu.style.display = 'none';

        // Resume game
        this.isPaused = false;
        this.lastTime = performance.now();

        console.log('[Game] Game resumed');
    }

    banishTome(tome) {
        console.log('[Game] Banishing tome:', tome.name);

        if (this.tomeSystem.banishTome(tome.id)) {
            // Refresh the UI
            this.renderLevelUpUI();
        }
    }

    skipLevelUp() {
        console.log('[Game] Skipping level up');

        // Hide menu
        this.levelUpMenu.style.display = 'none';

        // Resume game (level up will be saved for later)
        this.isPaused = false;
        this.lastTime = performance.now();

        // TODO: Implement actual skip logic (store level up for later)
        console.warn('[Game] Skip functionality not fully implemented yet');
    }

    update() {
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Update systems
        this.inputSystem.update();
        this.spawnSystem.update();
        this.weaponSystem.update(this.deltaTime);

        // Update game logic
        this.updatePlayer();
        this.updateEnemies();
        this.updateProjectiles();
        this.updateXPOrbs();
        this.updatePortal();
        this.updateCamera();
        this.updateHUD();

        // Clean up dead entities
        this.cleanupEntities();
    }

    updatePlayer() {
        if (!this.player) return;
        this.player.update(this.deltaTime);
    }

    updateEnemies() {
        for (const enemy of this.enemies) {
            enemy.update(this.deltaTime);
        }
    }

    updateProjectiles() {
        this.weaponSystem.updateProjectiles(this.deltaTime);
    }

    updateXPOrbs() {
        if (!this.player) return;

        const magnetRange = Config.progression.magnetRange;

        for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.xpOrbs[i];

            const distance = BABYLON.Vector3.Distance(
                this.player.position,
                orb.position
            );

            // Collect XP orb
            if (distance < Config.player.radius + 0.5) {
                this.player.gainXP(orb.xpValue);
                orb.mesh.dispose();
                this.xpOrbs.splice(i, 1);
                continue;
            }

            // Magnet effect
            if (distance < magnetRange) {
                const direction = this.player.position.subtract(orb.position);
                direction.normalize();
                const moveSpeed = 10;
                orb.position.addInPlace(direction.scale(moveSpeed * this.deltaTime));
                orb.mesh.position = orb.position;
            }

            // Floating animation
            orb.mesh.rotation.y += this.deltaTime * 3;
            orb.mesh.position.y = 0.5 + Math.sin(Date.now() / 300) * 0.2;
        }
    }

    updatePortal() {
        if (!this.portal || !this.player) return;

        // Update portal animation
        this.portal.update(this.deltaTime);

        // Check if player is in range
        if (this.portal.checkPlayerInRange(this.player.position)) {
            // Activate portal and transition
            this.portal.activate();
            this.transitionToBiome(this.portal.targetBiome);
        }
    }

    transitionToBiome(targetBiome) {
        console.log(`[Game] Transitioning to ${targetBiome}...`);

        // Store current biome
        this.currentBiome = targetBiome;
        if (!this.visitedBiomes.includes(targetBiome)) {
            this.visitedBiomes.push(targetBiome);
        }

        // Clear old portal
        if (this.portal) {
            this.portal.dispose();
            this.portal = null;
        }

        // Clear terrain (find and dispose all terrain meshes)
        const terrainMeshes = this.scene.meshes.filter(mesh =>
            mesh.name.startsWith('hill_') ||
            mesh.name.startsWith('rock_') ||
            mesh.name.startsWith('mountain_')
        );
        terrainMeshes.forEach(mesh => mesh.dispose());

        // Clear enemies
        this.enemies.forEach(enemy => enemy.dispose());
        this.enemies = [];

        // Update ground and sky colors
        const biome = Config.biomes[this.currentBiome];
        if (this.ground && this.ground.material) {
            this.ground.material.diffuseColor = BABYLON.Color3.FromHexString(biome.groundColor);
        }
        this.scene.clearColor = BABYLON.Color3.FromHexString(biome.skyColor);

        // Recreate terrain with new biome colors
        this.createTerrainFeatures(Config.map.size);

        // Create new portal
        this.createPortal();

        // Reset player position to center
        this.player.position = BABYLON.Vector3.Zero();
        this.player.mesh.position = this.player.position.clone();

        console.log(`[Game] Transitioned to ${biome.name} ${biome.icon}`);
    }

    cleanupEntities() {
        // Remove dead enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isMarkedForRemoval) {
                enemy.dispose();
                this.enemies.splice(i, 1);
            }
        }
    }

    updateCamera() {
        if (!this.player || !this.camera) return;

        // Smoothly follow player
        const targetPos = this.player.position.clone();
        const currentTarget = this.camera.target;

        this.camera.target = BABYLON.Vector3.Lerp(
            currentTarget,
            targetPos,
            Config.camera.smoothing
        );
    }

    updateHUD() {
        if (!this.player) return;

        // Update health
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        if (this.hudElements.healthFill) {
            this.hudElements.healthFill.style.width = healthPercent + '%';
        }
        if (this.hudElements.healthText) {
            this.hudElements.healthText.textContent = `${Math.floor(this.player.health)}/${this.player.maxHealth}`;
        }

        // Update XP
        const xpPercent = (this.player.xp / this.player.xpToNextLevel) * 100;
        if (this.hudElements.xpFill) {
            this.hudElements.xpFill.style.width = xpPercent + '%';
        }
        if (this.hudElements.xpText) {
            this.hudElements.xpText.textContent = `${Math.floor(this.player.xp)}/${this.player.xpToNextLevel}`;
        }

        // Update level
        if (this.hudElements.levelText) {
            this.hudElements.levelText.textContent = this.player.level;
        }

        // Update enemy count
        if (this.hudElements.enemyCount) {
            this.hudElements.enemyCount.textContent = this.enemies.length;
        }

        // Update time
        if (this.hudElements.timeText) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.hudElements.timeText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    pause() {
        this.isPaused = true;
        console.log('[Game] Paused');
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        console.log('[Game] Resumed');
    }

    handlePlayerDeath() {
        console.log('[Game] Player death - ending run');

        // Pause game
        this.isPaused = true;

        // End run and get statistics
        const runData = this.metaProgressionSystem.endRun(this.player.level);

        // Show run end screen
        this.showRunEndScreen(runData);
    }

    showRunEndScreen(runData) {
        console.log('[Game] Showing run end screen:', runData);

        // Get UI elements
        const runEndScreen = document.getElementById('runEndScreen');
        const runLevel = document.getElementById('runLevel');
        const runKills = document.getElementById('runKills');
        const runTime = document.getElementById('runTime');
        const runSilverEarned = document.getElementById('runSilverEarned');
        const runTotalSilver = document.getElementById('runTotalSilver');
        const shopButton = document.getElementById('shopButton');
        const playAgainButton = document.getElementById('playAgainButton');

        // Format time
        const minutes = Math.floor(runData.survivalTime / 60);
        const seconds = runData.survivalTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update values
        runLevel.textContent = this.player.level;
        runKills.textContent = runData.kills;
        runTime.textContent = timeString;
        runSilverEarned.textContent = runData.silverEarned;
        runTotalSilver.textContent = this.metaProgressionSystem.getSilver();

        // Show screen
        runEndScreen.style.display = 'flex';

        // Setup button handlers
        shopButton.onclick = () => {
            runEndScreen.style.display = 'none';
            this.showShop();
        };

        playAgainButton.onclick = () => {
            window.location.reload();
        };
    }

    showShop() {
        console.log('[Game] Showing shop');

        const shopMenu = document.getElementById('shopMenu');
        const shopSilver = document.getElementById('shopSilver');
        const shopCloseButton = document.getElementById('shopCloseButton');
        const startGameButton = document.getElementById('startGameButton');

        // Update silver display
        shopSilver.textContent = this.metaProgressionSystem.getSilver();

        // Populate shop items
        this.populateShopWeapons();
        this.populateShopTools();
        this.populateShopSlots();

        // Setup tab switching
        const tabs = document.querySelectorAll('.shop-tab');
        const sections = document.querySelectorAll('.shop-section');

        tabs.forEach(tab => {
            tab.onclick = () => {
                // Remove active from all
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                // Add active to clicked tab and section
                tab.classList.add('active');
                const tabName = tab.getAttribute('data-tab');
                document.getElementById(`shop-${tabName}`).classList.add('active');
            };
        });

        // Setup buttons
        shopCloseButton.onclick = () => {
            shopMenu.style.display = 'none';
        };

        startGameButton.onclick = () => {
            window.location.reload();
        };

        // Show shop
        shopMenu.style.display = 'flex';
    }

    populateShopWeapons() {
        const container = document.getElementById('weaponShopItems');
        container.innerHTML = '';

        const weapons = [
            {
                id: 'shotgun',
                name: 'Shotgun',
                icon: '💥',
                description: 'Close-range powerhouse. 6 pellets per shot.',
                price: Config.metaProgression.shop.weapons.shotgun
            },
            {
                id: 'smg',
                name: 'SMG',
                icon: '🔫',
                description: 'Rapid fire machine gun. 8 shots/sec.',
                price: Config.metaProgression.shop.weapons.smg
            },
            {
                id: 'laser',
                name: 'Laser',
                icon: '⚡',
                description: 'Piercing beam. Hits multiple enemies.',
                price: Config.metaProgression.shop.weapons.laser
            },
            {
                id: 'rocket',
                name: 'Rocket',
                icon: '🚀',
                description: 'Explosive AOE damage. Massive destruction.',
                price: Config.metaProgression.shop.weapons.rocket
            }
        ];

        weapons.forEach(weapon => {
            const isUnlocked = this.metaProgressionSystem.isWeaponUnlocked(weapon.id);
            const canAfford = this.metaProgressionSystem.getSilver() >= weapon.price;

            const item = document.createElement('div');
            item.className = 'shop-item';
            if (isUnlocked) {
                item.classList.add('unlocked');
            } else if (!canAfford) {
                item.classList.add('cant-afford');
            }

            item.innerHTML = `
                <div class="shop-item-icon">${weapon.icon}</div>
                <div class="shop-item-name">${weapon.name}</div>
                <div class="shop-item-description">${weapon.description}</div>
                ${isUnlocked
                    ? '<div class="shop-item-status">✓ UNLOCKED</div>'
                    : `<div class="shop-item-price">💰 ${weapon.price}</div>`
                }
            `;

            if (!isUnlocked) {
                item.onclick = () => {
                    if (this.metaProgressionSystem.unlockWeapon(weapon.id, weapon.price)) {
                        alert(`Unlocked ${weapon.name}!`);
                        this.showShop(); // Refresh
                    } else {
                        alert('Not enough silver!');
                    }
                };
            }

            container.appendChild(item);
        });
    }

    populateShopTools() {
        const container = document.getElementById('toolShopItems');
        container.innerHTML = '';

        const tools = [
            {
                id: 'reroll',
                name: 'Reroll',
                icon: '🔄',
                description: 'Reroll level up choices once per level.',
                price: Config.metaProgression.shop.tools.reroll
            },
            {
                id: 'skip',
                name: 'Skip',
                icon: '⏭️',
                description: 'Skip level ups to save them for later.',
                price: Config.metaProgression.shop.tools.skip
            },
            {
                id: 'banish',
                name: 'Banish',
                icon: '🚫',
                description: 'Remove unwanted tomes from this run.',
                price: Config.metaProgression.shop.tools.banish
            },
            {
                id: 'toggler',
                name: 'Toggler',
                icon: '🎛️',
                description: 'Toggle content on/off permanently.',
                price: Config.metaProgression.shop.tools.toggler
            }
        ];

        tools.forEach(tool => {
            const isUnlocked = this.metaProgressionSystem.isToolUnlocked(tool.id);
            const canAfford = this.metaProgressionSystem.getSilver() >= tool.price;

            const item = document.createElement('div');
            item.className = 'shop-item';
            if (isUnlocked) {
                item.classList.add('unlocked');
            } else if (!canAfford) {
                item.classList.add('cant-afford');
            }

            item.innerHTML = `
                <div class="shop-item-icon">${tool.icon}</div>
                <div class="shop-item-name">${tool.name}</div>
                <div class="shop-item-description">${tool.description}</div>
                ${isUnlocked
                    ? '<div class="shop-item-status">✓ UNLOCKED</div>'
                    : `<div class="shop-item-price">💰 ${tool.price}</div>`
                }
            `;

            if (!isUnlocked) {
                item.onclick = () => {
                    if (this.metaProgressionSystem.unlockTool(tool.id, tool.price)) {
                        alert(`Unlocked ${tool.name}!`);
                        this.showShop(); // Refresh
                    } else {
                        alert('Not enough silver!');
                    }
                };
            }

            container.appendChild(item);
        });
    }

    populateShopSlots() {
        const container = document.getElementById('slotShopItems');
        container.innerHTML = '';

        const currentSlots = this.metaProgressionSystem.getWeaponSlots();
        const maxSlots = 6;

        if (currentSlots >= maxSlots) {
            container.innerHTML = '<p style="text-align: center; color: #888;">Maximum weapon slots reached!</p>';
            return;
        }

        const price = Math.floor(
            Config.metaProgression.shop.weaponSlotBase *
            Math.pow(Config.metaProgression.shop.weaponSlotMultiplier, currentSlots - 2)
        );
        const canAfford = this.metaProgressionSystem.getSilver() >= price;

        const item = document.createElement('div');
        item.className = 'shop-item';
        if (!canAfford) {
            item.classList.add('cant-afford');
        }

        item.innerHTML = `
            <div class="shop-item-icon">📦</div>
            <div class="shop-item-name">Weapon Slot +1</div>
            <div class="shop-item-description">Increase weapon slots from ${currentSlots} to ${currentSlots + 1}</div>
            <div class="shop-item-price">💰 ${price}</div>
        `;

        item.onclick = () => {
            if (this.metaProgressionSystem.purchaseWeaponSlot(price)) {
                alert(`Weapon slots increased to ${currentSlots + 1}!`);
                this.showShop(); // Refresh
            } else {
                alert('Not enough silver!');
            }
        };

        container.appendChild(item);
    }

    // Called when enemy is killed (from WeaponSystem)
    onEnemyKilled(enemy) {
        // Award silver
        const silverReward = Config.metaProgression.silver.perKill;
        this.metaProgressionSystem.addSilver(silverReward);

        // Record kill
        this.metaProgressionSystem.recordKill();

        console.log(`[Game] Enemy killed, +${silverReward} silver`);
    }

    stop() {
        this.isRunning = false;
        console.log('[Game] Stopped');
    }

    dispose() {
        console.log('[Game] Disposing...');
        this.scene.dispose();
        this.engine.dispose();
    }
}
