import { Config } from '../core/Config.js';

export class Player {
    constructor(scene, position = BABYLON.Vector3.Zero(), camera = null) {
        this.scene = scene;
        this.camera = camera;
        this.position = position.clone();
        this.rotation = 0;
        this.velocity = BABYLON.Vector3.Zero();

        // Stats
        this.maxHealth = Config.player.maxHealth;
        this.health = this.maxHealth;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = Config.progression.baseXPRequired;

        // Input
        this.moveInput = { x: 0, z: 0 };

        // Jump mechanics
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.groundLevel = 0; // Ground height at current position

        // Animation
        this.animationGroups = null;
        this.currentAnimation = null;
        this.isMoving = false;

        console.log('[Player] Created at', position);
    }

    async init() {
        await this.createMesh();
        console.log('[Player] Initialized');
    }

    async createMesh() {
        // Create parent container
        const container = new BABYLON.TransformNode('playerContainer', this.scene);
        this.mesh = container;

        try {
            // Load the GLB model
            // Try vampire first, fallback to character-soldier for testing
            let modelFile = 'd8dae9e60016_A_stylized_3D_vampire_charac_0_glb.glb';
            let modelPath = 'assets/models/characters/';

            // Check if vampire file exists, otherwise use character-soldier for testing
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                '',
                modelPath,
                modelFile,
                this.scene
            ).catch(async () => {
                console.log('[Player] Vampire model not found, trying character-soldier.glb');
                return await BABYLON.SceneLoader.ImportMeshAsync(
                    '',
                    modelPath,
                    'character-soldier.glb',
                    this.scene
                );
            });

            console.log('[Player] GLB model loaded successfully');
            console.log('[Player] Meshes loaded:', result.meshes.length);
            console.log('[Player] Animation groups:', result.animationGroups.length);

            // Parent all loaded meshes to the container
            result.meshes.forEach((mesh, index) => {
                console.log(`[Player] Mesh ${index}: ${mesh.name}, visible: ${mesh.isVisible}`);
                if (mesh !== result.meshes[0]) { // Skip root mesh
                    mesh.parent = container;
                    // Ensure mesh is visible
                    mesh.isVisible = true;

                    // Fix material if needed
                    if (mesh.material) {
                        mesh.material.backFaceCulling = false;
                        if (mesh.material.alpha !== undefined) {
                            mesh.material.alpha = 1.0;
                        }
                        console.log(`[Player] Material for ${mesh.name}:`, mesh.material.name);
                    }
                }
            });

            // Store animation groups
            this.animationGroups = result.animationGroups;

            // Scale the model to match player size
            const scaleFactor = Config.player.height / 2; // Adjust as needed
            container.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);

            console.log('[Player] Model scaled by factor:', scaleFactor);

            // Start playing the walking animation
            if (this.animationGroups && this.animationGroups.length > 0) {
                this.animationGroups.forEach(ag => {
                    ag.stop();
                });
                // Play the first animation (should be walking)
                this.currentAnimation = this.animationGroups[0];
                this.currentAnimation.start(true, 1.0, 0, this.currentAnimation.to, false);
                console.log('[Player] Walking animation started');
            }

        } catch (error) {
            console.error('[Player] Failed to load GLB model:', error);

            // Fallback to procedural character
            this.createProceduralMesh(container);
        }

        // Position container
        container.position = this.position.clone();
        container.position.y = 0;
        container.rotation.y = this.rotation;

        container.checkCollisions = false;

        console.log('[Player] Character created');
    }

    createProceduralMesh(container) {
        // Fallback procedural character (original code)
        // Main body (capsule-like cylinder)
        const body = BABYLON.MeshBuilder.CreateCylinder(
            'playerBody',
            {
                diameter: Config.player.radius * 2,
                height: Config.player.height,
                tessellation: 16
            },
            this.scene
        );
        body.parent = container;
        body.position.y = Config.player.height / 2;

        // Material
        const bodyMat = new BABYLON.StandardMaterial('playerBodyMat', this.scene);
        bodyMat.diffuseColor = BABYLON.Color3.FromHexString(Config.player.color);
        bodyMat.emissiveColor = BABYLON.Color3.FromHexString(Config.player.color).scale(0.3);
        body.material = bodyMat;

        // Head (sphere on top)
        const head = BABYLON.MeshBuilder.CreateSphere(
            'playerHead',
            { diameter: Config.player.radius * 1.2, segments: 12 },
            this.scene
        );
        head.parent = container;
        head.position.y = Config.player.height + Config.player.radius * 0.6;
        const headMat = new BABYLON.StandardMaterial('playerHeadMat', this.scene);
        headMat.diffuseColor = BABYLON.Color3.FromHexString('#ffcc88'); // Skin tone
        headMat.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        head.material = headMat;

        // Direction indicator (cone/arrow)
        const arrow = BABYLON.MeshBuilder.CreateCylinder(
            'dirArrow',
            {
                diameterTop: 0,
                diameterBottom: Config.player.radius * 0.8,
                height: 0.8,
                tessellation: 8
            },
            this.scene
        );
        arrow.parent = container;
        arrow.position.y = Config.player.height / 2;
        arrow.position.z = Config.player.radius * 1.2; // In front
        arrow.rotation.x = Math.PI / 2; // Point forward
        const arrowMat = new BABYLON.StandardMaterial('arrowMat', this.scene);
        arrowMat.diffuseColor = BABYLON.Color3.White();
        arrowMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        arrow.material = arrowMat;

        // Arms (simple boxes)
        const armWidth = 0.15;
        const armLength = 0.6;

        // Left arm
        const leftArm = BABYLON.MeshBuilder.CreateBox(
            'leftArm',
            { width: armWidth, height: armLength, depth: armWidth },
            this.scene
        );
        leftArm.parent = container;
        leftArm.position.x = -Config.player.radius * 0.9;
        leftArm.position.y = Config.player.height * 0.7;
        leftArm.material = bodyMat;

        // Right arm
        const rightArm = BABYLON.MeshBuilder.CreateBox(
            'rightArm',
            { width: armWidth, height: armLength, depth: armWidth },
            this.scene
        );
        rightArm.parent = container;
        rightArm.position.x = Config.player.radius * 0.9;
        rightArm.position.y = Config.player.height * 0.7;
        rightArm.material = bodyMat;

        console.log('[Player] Procedural character created as fallback');
    }

    update(deltaTime) {
        // Update position based on input
        if (this.moveInput.x !== 0 || this.moveInput.z !== 0) {
            const moveSpeed = Config.player.moveSpeed;

            let movement;

            if (this.camera) {
                // Get camera's forward direction (projected on XZ plane)
                const cameraForward = this.camera.getDirection(BABYLON.Axis.Z);
                cameraForward.y = 0; // Flatten to XZ plane
                cameraForward.normalize();

                // Get camera's right direction (projected on XZ plane)
                const cameraRight = this.camera.getDirection(BABYLON.Axis.X);
                cameraRight.y = 0; // Flatten to XZ plane
                cameraRight.normalize();

                // Calculate movement based on input and camera orientation
                // W/S controls forward/backward relative to camera
                // A/D controls left/right relative to camera
                movement = cameraForward.scale(this.moveInput.z)
                    .add(cameraRight.scale(this.moveInput.x));
            } else {
                // Fallback: world-space movement
                movement = new BABYLON.Vector3(
                    this.moveInput.x,
                    0,
                    this.moveInput.z
                );
            }

            // Normalize diagonal movement
            if (movement.length() > 0) {
                movement.normalize();
            }

            // Apply movement
            const newPos = this.position.add(movement.scale(moveSpeed * deltaTime));

            // Boundary check
            const halfMapSize = Config.map.size / 2 - Config.player.radius;
            newPos.x = Math.max(-halfMapSize, Math.min(halfMapSize, newPos.x));
            newPos.z = Math.max(-halfMapSize, Math.min(halfMapSize, newPos.z));

            this.position.x = newPos.x;
            this.position.z = newPos.z;

            // Update rotation to face movement direction
            this.rotation = Math.atan2(movement.x, movement.z);
        }

        // Apply gravity and vertical movement
        if (!this.isGrounded) {
            this.verticalVelocity -= Config.player.gravity * deltaTime;
        }

        // Update vertical position
        this.position.y += this.verticalVelocity * deltaTime;

        // Check ground collision
        if (this.position.y <= this.groundLevel) {
            this.position.y = this.groundLevel;
            this.verticalVelocity = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Update mesh position and rotation
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = this.rotation;
    }

    setMoveInput(x, z) {
        this.moveInput.x = x;
        this.moveInput.z = z;
    }

    jump() {
        if (this.isGrounded) {
            this.verticalVelocity = Config.player.jumpForce;
            this.isGrounded = false;
            console.log('[Player] Jump!');
        }
    }

    setGroundLevel(height) {
        this.groundLevel = height;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        console.log(`[Player] Took ${amount} damage, health: ${this.health}/${this.maxHealth}`);

        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    gainXP(amount) {
        this.xp += amount;
        console.log(`[Player] Gained ${amount} XP (${this.xp}/${this.xpToNextLevel})`);

        // Check for level up
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(
            Config.progression.baseXPRequired * Math.pow(Config.progression.xpScaling, this.level - 1)
        );

        console.log(`[Player] LEVEL UP! Now level ${this.level}`);
        console.log(`[Player] XP to next level: ${this.xpToNextLevel}`);

        // Heal on level up
        this.heal(this.maxHealth * 0.5);

        // Trigger level up event (to be handled by UI)
        this.onLevelUp();
    }

    onLevelUp() {
        // Override this in game to show upgrade UI
        console.log('[Player] Level up callback - override this');
    }

    die() {
        console.log('[Player] Died');
        // Trigger game over
    }

    getForwardDirection() {
        return new BABYLON.Vector3(
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        );
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        if (this.directionCone) {
            this.directionCone.dispose();
        }
    }
}
