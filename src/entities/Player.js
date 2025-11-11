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

        this.createMesh();

        console.log('[Player] Created at', position);
    }

    createMesh() {
        // Create temporary placeholder while model loads
        this.mesh = BABYLON.MeshBuilder.CreateCylinder(
            'player',
            {
                diameter: Config.player.radius * 2,
                height: Config.player.height,
                tessellation: 16
            },
            this.scene
        );
        this.mesh.position = this.position.clone();
        this.mesh.position.y = Config.player.height / 2;

        // Material
        const material = new BABYLON.StandardMaterial('playerMat', this.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString(Config.player.color);
        material.emissiveColor = BABYLON.Color3.FromHexString(Config.player.color).scale(0.2);
        this.mesh.material = material;

        this.mesh.checkCollisions = false;

        // Load 3D model
        this.loadModel();
    }

    async loadModel() {
        try {
            console.log('[Player] Loading 3D model...');

            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                '',
                'assets/models/characters/',
                'character_sam.gltf',
                this.scene
            );

            if (result.meshes.length > 0) {
                console.log('[Player] Model loaded successfully');

                // Store old placeholder
                const oldMesh = this.mesh;

                // Create parent container for proper rotation
                const container = new BABYLON.TransformNode('playerContainer', this.scene);
                this.mesh = container;

                // Get root mesh and parent it to container
                const rootMesh = result.meshes[0];
                rootMesh.parent = container;

                // Fix model orientation (standing upright)
                rootMesh.rotation.x = -Math.PI / 2; // Rotate to stand up
                rootMesh.rotation.y = 0;
                rootMesh.rotation.z = 0;

                // Position and scale
                container.position = this.position.clone();
                container.position.y = 0;
                container.rotation.y = this.rotation;
                rootMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

                // Make all child meshes non-collidable
                result.meshes.forEach(mesh => {
                    mesh.checkCollisions = false;
                });

                // Dispose old placeholder
                if (oldMesh) {
                    oldMesh.dispose();
                }

                console.log('[Player] 3D model applied and standing upright');
            }
        } catch (error) {
            console.warn('[Player] Failed to load 3D model, using placeholder:', error);
            // Keep using placeholder cylinder
        }
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

            this.position = newPos;

            // Update rotation to face movement direction
            this.rotation = Math.atan2(movement.x, movement.z);
        }

        // Update mesh position and rotation
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = this.rotation;
    }

    setMoveInput(x, z) {
        this.moveInput.x = x;
        this.moveInput.z = z;
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
