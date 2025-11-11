import { Config } from './Config.js';
import { Player } from '../entities/Player.js';
import { InputSystem } from '../systems/InputSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';

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

        console.log('[Game] Map created:', mapSize + 'x' + mapSize);
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

        // Create player
        this.player = new Player(this.scene, BABYLON.Vector3.Zero());

        // Initialize systems
        this.inputSystem = new InputSystem(this);
        this.spawnSystem = new SpawnSystem(this);
        this.weaponSystem = new WeaponSystem(this);

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
