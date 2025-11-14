import { Config } from './Config.js';
import { Player } from '../entities/Player.js';
import { InputSystem } from '../systems/InputSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { TomeSystem } from '../systems/TomeSystem.js';

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

        // Systems
        this.inputSystem = null;
        this.spawnSystem = null;
        this.weaponSystem = null;
        this.tomeSystem = null;

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

        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround(
            'ground',
            { width: mapSize, height: mapSize, subdivisions: 32 },
            this.scene
        );
        ground.position.y = 0;

        // Ground material with grid
        const groundMat = new BABYLON.StandardMaterial('groundMat', this.scene);
        const gridTexture = this.createGridTexture();
        groundMat.diffuseTexture = gridTexture;
        groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = groundMat;
        ground.checkCollisions = false;

        // Create terrain features
        this.createTerrainFeatures(mapSize);

        console.log('[Game] Map created:', mapSize + 'x' + mapSize);
    }

    createTerrainFeatures(mapSize) {
        const halfMap = mapSize / 2;

        // Material for hills
        const hillMat = new BABYLON.StandardMaterial('hillMat', this.scene);
        hillMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.2); // Green
        hillMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Material for rocks
        const rockMat = new BABYLON.StandardMaterial('rockMat', this.scene);
        rockMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Gray
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
            mountainMat.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3); // Brown
            mountainMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            mountain.material = mountainMat;
            mountain.checkCollisions = true;
        }

        console.log('[Game] Terrain features created:', hillCount, 'hills,', rockCount, 'rocks,', mountainCount, 'mountains');
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

        // Initialize systems
        this.inputSystem = new InputSystem(this);
        this.spawnSystem = new SpawnSystem(this);
        this.weaponSystem = new WeaponSystem(this);
        this.tomeSystem = new TomeSystem(this);

        // Apply initial character stats to player and weapons
        this.tomeSystem.applyToPlayer();

        // Get UI elements
        this.levelUpMenu = document.getElementById('levelUpMenu');
        this.hudElements.healthFill = document.getElementById('healthFill');
        this.hudElements.healthText = document.getElementById('healthText');
        this.hudElements.xpFill = document.getElementById('xpFill');
        this.hudElements.xpText = document.getElementById('xpText');
        this.hudElements.levelText = document.getElementById('levelText');
        this.hudElements.enemyCount = document.getElementById('enemyCount');
        this.hudElements.timeText = document.getElementById('timeText');

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
        console.log('[Game] Showing level up UI (Megabonk style)');

        // Pause game
        this.isPaused = true;

        // Generate upgrade choices (weapon upgrades + tomes + new weapons)
        const upgradeChoices = this.generateUpgradeChoices(4);

        if (upgradeChoices.length === 0) {
            console.warn('[Game] No upgrades available, resuming game');
            this.isPaused = false;
            return;
        }

        // Create upgrade cards
        const tomeCardsContainer = document.getElementById('tomeCards');
        tomeCardsContainer.innerHTML = ''; // Clear previous cards

        upgradeChoices.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = `tome-card ${upgrade.rarity}`;

            if (upgrade.type === 'weapon') {
                // Weapon upgrade card
                card.innerHTML = `
                    <div class="tome-rarity ${upgrade.rarity}">${upgrade.rarity}</div>
                    <div class="tome-icon">${upgrade.weaponIcon}</div>
                    <div class="tome-name">${upgrade.weaponName} Lv.${upgrade.weaponLevel}</div>
                    <div class="tome-description">${upgrade.upgradeText}</div>
                    <div class="upgrade-preview">${upgrade.preview}</div>
                `;
            } else if (upgrade.type === 'newWeapon') {
                // New weapon card
                card.innerHTML = `
                    <div class="tome-rarity ${upgrade.rarity}">${upgrade.rarity}</div>
                    <div class="tome-icon">${upgrade.icon}</div>
                    <div class="tome-name">${upgrade.name}</div>
                    <div class="tome-description">${upgrade.description}</div>
                    <div class="upgrade-preview">${upgrade.preview}</div>
                `;
            } else {
                // Tome card
                card.innerHTML = `
                    <div class="tome-rarity ${upgrade.rarity}">${upgrade.rarity}</div>
                    <div class="tome-icon">${upgrade.icon}</div>
                    <div class="tome-name">${upgrade.name}</div>
                    <div class="tome-description">${upgrade.description}</div>
                    <div class="upgrade-preview">${upgrade.preview || ''}</div>
                `;
            }

            // Add click handler
            card.addEventListener('click', () => {
                this.selectUpgrade(upgrade);
            });

            tomeCardsContainer.appendChild(card);
        });

        // Show menu
        this.levelUpMenu.style.display = 'flex';
    }

    generateUpgradeChoices(count) {
        const choices = [];

        // Generate weapon upgrade choices (2-4 options)
        const weaponUpgrades = this.generateWeaponUpgrades();

        // Generate tome choices (2-4 options)
        const tomeUpgrades = this.tomeSystem.getRandomTomes(4);

        // Convert tomes to upgrade format
        const tomeChoices = tomeUpgrades.map(tome => {
            const statLevel = this.tomeSystem.characterStats.getLevel(tome.stat);
            const displayStr = this.tomeSystem.characterStats.getDisplayString(tome.stat);

            return {
                type: 'tome',
                tome: tome,
                rarity: tome.rarity,
                icon: tome.icon,
                name: tome.name,
                description: tome.description,
                preview: displayStr
            };
        });

        // Generate new weapon choices (if slots available)
        const newWeaponChoices = this.generateNewWeaponChoices();

        // Apply weighted selection (무기 70%, Tome 25%, 새 무기 5%)
        const weightedPool = [
            ...weaponUpgrades.map(w => ({ ...w, weight: 0.70 })),
            ...tomeChoices.map(t => ({ ...t, weight: 0.25 })),
            ...newWeaponChoices.map(n => ({ ...n, weight: 0.05 }))
        ];

        // Weighted random selection
        const selected = [];
        const pool = [...weightedPool];

        for (let i = 0; i < count && pool.length > 0; i++) {
            // Calculate total weight
            const totalWeight = pool.reduce((sum, choice) => sum + choice.weight, 0);

            // Random selection based on weight
            let random = Math.random() * totalWeight;
            let selectedIndex = 0;

            for (let j = 0; j < pool.length; j++) {
                random -= pool[j].weight;
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }

            // Add selected choice and remove from pool
            const choice = pool.splice(selectedIndex, 1)[0];
            delete choice.weight; // Remove weight property
            selected.push(choice);
        }

        return selected;
    }

    generateWeaponUpgrades() {
        const upgrades = [];

        // For each weapon slot
        for (let slotIndex = 0; slotIndex < this.weaponSystem.weaponSlots.length; slotIndex++) {
            const slot = this.weaponSystem.weaponSlots[slotIndex];
            const upgradeConfig = Config.weaponUpgrades[slot.type];

            // Get available stats for this weapon
            const availableStats = Object.keys(upgradeConfig);

            // Randomly select 1-2 stats
            const numStats = Math.random() < 0.5 ? 1 : 2;
            const selectedStats = [];

            for (let i = 0; i < numStats && selectedStats.length < availableStats.length; i++) {
                const remaining = availableStats.filter(s => !selectedStats.includes(s));
                if (remaining.length === 0) break;

                const randomStat = remaining[Math.floor(Math.random() * remaining.length)];
                selectedStats.push(randomStat);
            }

            // Create upgrade choice for these stats
            if (selectedStats.length > 0) {
                const upgradeTexts = selectedStats.map(statName => {
                    const stat = upgradeConfig[statName];
                    const currentLevel = slot.upgradeLevels[statName];
                    const currentValue = stat.base + (currentLevel * stat.perLevel);
                    const nextValue = stat.base + ((currentLevel + 1) * stat.perLevel);

                    let valueStr;
                    if (stat.perLevel >= 1) {
                        // Integer values
                        valueStr = `${Math.floor(currentValue)} → ${Math.floor(nextValue)}`;
                    } else {
                        // Decimal values
                        valueStr = `${currentValue.toFixed(2)} → ${nextValue.toFixed(2)}`;
                    }

                    return `${stat.desc} ${valueStr}`;
                }).join('\n');

                const previewText = selectedStats.map(statName => {
                    const stat = upgradeConfig[statName];
                    const currentLevel = slot.upgradeLevels[statName];
                    return `${stat.desc} Lv.${currentLevel} → Lv.${currentLevel + 1}`;
                }).join(', ');

                // Determine rarity based on number of stats
                const rarity = selectedStats.length === 1 ? 'common' : 'rare';

                upgrades.push({
                    type: 'weapon',
                    slotIndex: slotIndex,
                    stats: selectedStats,
                    weaponIcon: Config.weapons[slot.type].icon,
                    weaponName: Config.weapons[slot.type].name,
                    weaponLevel: slot.level,
                    upgradeText: upgradeTexts,
                    preview: previewText,
                    rarity: rarity
                });
            }
        }

        return upgrades;
    }

    generateNewWeaponChoices() {
        const choices = [];

        // Check if we have available slots
        if (this.weaponSystem.weaponSlots.length >= this.weaponSystem.maxSlots) {
            return choices; // No slots available
        }

        // Get weapons we don't have yet
        const allWeaponTypes = Object.keys(Config.weapons);
        const ownedWeaponTypes = this.weaponSystem.weaponSlots.map(slot => slot.type);
        const availableWeapons = allWeaponTypes.filter(type => !ownedWeaponTypes.includes(type));

        // Randomly select 1-2 weapons to offer (if available)
        const numToOffer = Math.min(2, availableWeapons.length);
        const shuffledWeapons = [...availableWeapons].sort(() => Math.random() - 0.5);
        const weaponsToOffer = shuffledWeapons.slice(0, numToOffer);

        for (const weaponType of weaponsToOffer) {
            const weaponConfig = Config.weapons[weaponType];
            const upgradeConfig = Config.weaponUpgrades[weaponType];

            // Get first 2-3 stat descriptions to preview
            const statDescriptions = Object.entries(upgradeConfig)
                .slice(0, 3)
                .map(([statName, stat]) => {
                    let valueStr;
                    if (stat.perLevel >= 1) {
                        valueStr = Math.floor(stat.base);
                    } else {
                        valueStr = stat.base.toFixed(2);
                    }
                    return `${stat.desc}: ${valueStr}`;
                })
                .join('\n');

            choices.push({
                type: 'newWeapon',
                weaponType: weaponType,
                rarity: 'epic', // New weapons are epic rarity
                icon: weaponConfig.icon,
                name: `새 무기: ${weaponConfig.name}`,
                description: statDescriptions,
                preview: '무기 슬롯에 추가됩니다'
            });
        }

        return choices;
    }

    selectUpgrade(upgrade) {
        console.log('[Game] Upgrade selected:', upgrade);

        if (upgrade.type === 'weapon') {
            // Apply weapon upgrade
            for (const statName of upgrade.stats) {
                this.weaponSystem.upgradeWeaponStat(upgrade.slotIndex, statName);
            }
        } else if (upgrade.type === 'tome') {
            // Apply tome
            this.tomeSystem.applyTome(upgrade.tome);
        } else if (upgrade.type === 'newWeapon') {
            // Add new weapon
            const success = this.weaponSystem.addWeapon(upgrade.weaponType);
            if (success) {
                console.log('[Game] New weapon acquired:', upgrade.name);
            } else {
                console.error('[Game] Failed to add weapon:', upgrade.weaponType);
            }
        }

        // Hide menu
        this.levelUpMenu.style.display = 'none';

        // Resume game
        this.isPaused = false;
        this.lastTime = performance.now();

        console.log('[Game] Game resumed');
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
