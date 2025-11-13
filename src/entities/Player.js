import { Config } from '../core/Config.js';

export class Player {
    constructor(scene, position = BABYLON.Vector3.Zero(), camera = null, characterData = null) {
        this.scene = scene;
        this.camera = camera;
        this.position = position.clone();
        this.rotation = 0;
        this.velocity = BABYLON.Vector3.Zero();

        // Character reference (for passive abilities)
        this.character = characterData;

        // Stats - Apply character data if provided
        this.maxHealth = characterData ? characterData.stats.maxHP : Config.player.maxHealth;
        this.health = this.maxHealth;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = Config.progression.baseXPRequired;

        // Movement speed modifier from character
        this.speedMultiplier = characterData ? (characterData.stats.speed / 6) : 1.0; // 6 is default speed

        // Size modifier from character
        this.sizeMultiplier = characterData ? characterData.stats.size : 1.0;

        // Passive ability tracking
        this.passiveTimers = {
            lastHitTime: 0,          // For Speed Demon
            lastGamblerTime: 0,      // For Gambler's Curse
            lastOverdriveUpdate: 0   // For Overdrive
        };
        this.passiveEffects = {
            speedBonus: 0,           // Speed Demon speed bonus
            damageBonus: 0,          // Speed Demon damage bonus
            gamblerEffect: null,     // Current gambler effect
            critChance: 0            // Overdrive crit chance
        };

        // Input
        this.moveInput = { x: 0, z: 0 };

        // Jump mechanics
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.groundLevel = 0; // Ground height at current position

        this.createMesh();

        if (characterData) {
            console.log(`[Player] Created as ${characterData.name} ${characterData.icon} at`, position);
            console.log(`[Player] Stats: HP=${this.maxHealth}, Speed=${characterData.stats.speed}, Size=${characterData.stats.size}`);
        } else {
            console.log('[Player] Created at', position);
        }
    }

    createMesh() {
        // Create parent container
        const container = new BABYLON.TransformNode('playerContainer', this.scene);
        this.mesh = container;

        // Apply character size multiplier
        const radius = Config.player.radius * this.sizeMultiplier;
        const height = Config.player.height * this.sizeMultiplier;

        // Main body (capsule-like cylinder)
        const body = BABYLON.MeshBuilder.CreateCylinder(
            'playerBody',
            {
                diameter: radius * 2,
                height: height,
                tessellation: 16
            },
            this.scene
        );
        body.parent = container;
        body.position.y = height / 2;

        // Material
        const bodyMat = new BABYLON.StandardMaterial('playerBodyMat', this.scene);
        bodyMat.diffuseColor = BABYLON.Color3.FromHexString(Config.player.color);
        bodyMat.emissiveColor = BABYLON.Color3.FromHexString(Config.player.color).scale(0.3);
        body.material = bodyMat;

        // Head (sphere on top)
        const head = BABYLON.MeshBuilder.CreateSphere(
            'playerHead',
            { diameter: radius * 1.2, segments: 12 },
            this.scene
        );
        head.parent = container;
        head.position.y = height + radius * 0.6;
        const headMat = new BABYLON.StandardMaterial('playerHeadMat', this.scene);
        headMat.diffuseColor = BABYLON.Color3.FromHexString('#ffcc88'); // Skin tone
        headMat.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        head.material = headMat;

        // Direction indicator (cone/arrow)
        const arrow = BABYLON.MeshBuilder.CreateCylinder(
            'dirArrow',
            {
                diameterTop: 0,
                diameterBottom: radius * 0.8,
                height: 0.8 * this.sizeMultiplier,
                tessellation: 8
            },
            this.scene
        );
        arrow.parent = container;
        arrow.position.y = height / 2;
        arrow.position.z = radius * 1.2; // In front
        arrow.rotation.x = Math.PI / 2; // Point forward
        const arrowMat = new BABYLON.StandardMaterial('arrowMat', this.scene);
        arrowMat.diffuseColor = BABYLON.Color3.White();
        arrowMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        arrow.material = arrowMat;

        // Arms (simple boxes)
        const armWidth = 0.15 * this.sizeMultiplier;
        const armLength = 0.6 * this.sizeMultiplier;

        // Left arm
        const leftArm = BABYLON.MeshBuilder.CreateBox(
            'leftArm',
            { width: armWidth, height: armLength, depth: armWidth },
            this.scene
        );
        leftArm.parent = container;
        leftArm.position.x = -radius * 0.9;
        leftArm.position.y = height * 0.7;
        leftArm.material = bodyMat;

        // Right arm
        const rightArm = BABYLON.MeshBuilder.CreateBox(
            'rightArm',
            { width: armWidth, height: armLength, depth: armWidth },
            this.scene
        );
        rightArm.parent = container;
        rightArm.position.x = radius * 0.9;
        rightArm.position.y = height * 0.7;
        rightArm.material = bodyMat;

        // Position container
        container.position = this.position.clone();
        container.position.y = 0;
        container.rotation.y = this.rotation;

        container.checkCollisions = false;

        console.log('[Player] Procedural character created');
    }

    update(deltaTime) {
        // Update passive abilities
        this.updatePassive(deltaTime);

        // Update position based on input
        if (this.moveInput.x !== 0 || this.moveInput.z !== 0) {
            // Apply passive speed bonus
            const totalSpeedMultiplier = this.speedMultiplier * (1 + this.passiveEffects.speedBonus);
            const moveSpeed = Config.player.moveSpeed * totalSpeedMultiplier;

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

        // Detect ground height at current position using raycast
        this.updateGroundHeight();

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

    updateGroundHeight() {
        // Cast ray downward from player position to detect terrain
        const rayOrigin = new BABYLON.Vector3(
            this.position.x,
            this.position.y + 50, // Start ray from above player
            this.position.z
        );
        const rayDirection = new BABYLON.Vector3(0, -1, 0); // Downward
        const rayLength = 100;

        const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);
        const pickInfo = this.scene.pickWithRay(ray, (mesh) => {
            // Only pick terrain meshes (hills, rocks, mountains, ground)
            return mesh.name.startsWith('hill_') ||
                   mesh.name.startsWith('rock_') ||
                   mesh.name.startsWith('mountain_') ||
                   mesh.name === 'ground';
        });

        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            // Set ground level to the picked point's Y coordinate
            this.groundLevel = pickInfo.pickedPoint.y;
        } else {
            // Fallback to default ground level
            this.groundLevel = 0;
        }
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

        // Update passive: Speed Demon resets on hit
        if (this.character && this.character.passive.type === 'speed_demon') {
            this.passiveTimers.lastHitTime = Date.now();
            // Reset to 50% bonus
            this.passiveEffects.speedBonus = this.character.passive.resetOnHit || 0;
            this.passiveEffects.damageBonus = this.character.passive.resetOnHit || 0;
            console.log('[Player] Speed Demon reset to 50%');
        }

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

    onDeath() {
        // Override this in game to handle death
        console.log('[Player] Death callback - override this');
    }

    die() {
        console.log('[Player] Died');
        this.onDeath();
    }

    getForwardDirection() {
        return new BABYLON.Vector3(
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        );
    }

    updatePassive(deltaTime) {
        if (!this.character || !this.character.passive) return;

        const passive = this.character.passive;
        const now = Date.now();

        switch (passive.type) {
            case 'speed_demon':
                this.updateSpeedDemon(now, passive);
                break;
            case 'gamblers_curse':
                this.updateGamblersCurse(now, passive);
                break;
            case 'overdrive':
                this.updateOverdrive(now, passive);
                break;
            // Backstab is handled in WeaponSystem
            // Repellent Aura is handled in garlic weapon
            // Lifesteal is handled in blood_scythe weapon
        }
    }

    updateSpeedDemon(now, passive) {
        // Check if player has been safe for tickInterval
        const timeSinceHit = now - this.passiveTimers.lastHitTime;

        // If just started, initialize lastHitTime
        if (this.passiveTimers.lastHitTime === 0) {
            this.passiveTimers.lastHitTime = now;
            return;
        }

        // Every tickInterval (2000ms), increase bonuses
        const ticksPassed = Math.floor(timeSinceHit / passive.tickInterval);

        if (ticksPassed > 0) {
            // Calculate current bonus based on ticks
            const bonusPerTick = passive.speedPerTick; // 0.02 = 2%
            const maxBonus = passive.maxBonus; // 1.0 = 100%

            this.passiveEffects.speedBonus = Math.min(ticksPassed * bonusPerTick, maxBonus);
            this.passiveEffects.damageBonus = Math.min(ticksPassed * bonusPerTick, maxBonus);
        }
    }

    updateGamblersCurse(now, passive) {
        // Check if it's time for a new gambler effect
        if (now - this.passiveTimers.lastGamblerTime >= passive.interval) {
            this.passiveTimers.lastGamblerTime = now;

            // Remove previous effect if any
            if (this.passiveEffects.gamblerEffect) {
                this.removeGamblerEffect(this.passiveEffects.gamblerEffect);
            }

            // Roll for good or bad effect
            const isGood = Math.random() < passive.goodChance; // 60% good
            const effectList = isGood ? passive.goodEffects : passive.badEffects;
            const effect = effectList[Math.floor(Math.random() * effectList.length)];

            // Apply new effect
            this.applyGamblerEffect(effect);
            console.log(`[Player] Gambler's Curse: ${isGood ? 'GOOD' : 'BAD'} effect - ${effect.type}`);
        }

        // Check if current effect has expired
        if (this.passiveEffects.gamblerEffect) {
            const effect = this.passiveEffects.gamblerEffect;
            if (now - effect.startTime >= effect.duration) {
                this.removeGamblerEffect(effect);
                this.passiveEffects.gamblerEffect = null;
            }
        }
    }

    applyGamblerEffect(effect) {
        const effectCopy = { ...effect, startTime: Date.now() };
        this.passiveEffects.gamblerEffect = effectCopy;

        // Effects are applied in real-time through getters
        // For invincibility, we'd need special handling
        if (effect.type === 'invincible') {
            this.isInvincible = true;
            setTimeout(() => {
                this.isInvincible = false;
            }, effect.duration);
        }
    }

    removeGamblerEffect(effect) {
        // Effects are removed by clearing gamblerEffect
        if (effect.type === 'invincible') {
            this.isInvincible = false;
        }
    }

    updateOverdrive(now, passive) {
        // Gradually increase crit chance over time (every 5 seconds)
        const timeSinceLastUpdate = now - this.passiveTimers.lastOverdriveUpdate;

        if (this.passiveTimers.lastOverdriveUpdate === 0) {
            this.passiveTimers.lastOverdriveUpdate = now;
        }

        if (timeSinceLastUpdate >= 5000) {
            this.passiveTimers.lastOverdriveUpdate = now;

            // Increase crit chance by 5% every 5 seconds, max 50%
            this.passiveEffects.critChance = Math.min(
                this.passiveEffects.critChance + 0.05,
                passive.maxCritChance || 0.5
            );

            console.log(`[Player] Overdrive: Crit chance ${(this.passiveEffects.critChance * 100).toFixed(0)}%`);
        }
    }

    // Get current damage multiplier (for WeaponSystem)
    getDamageMultiplier() {
        let multiplier = 1.0;

        // Speed Demon damage bonus
        multiplier += this.passiveEffects.damageBonus;

        // Gambler's Curse damage effects
        if (this.passiveEffects.gamblerEffect) {
            const effect = this.passiveEffects.gamblerEffect;
            if (effect.type === 'damage') {
                multiplier += effect.value;
            }
        }

        return multiplier;
    }

    // Get current fire rate multiplier (for WeaponSystem)
    getFireRateMultiplier() {
        let multiplier = 1.0;

        // Gambler's Curse fire rate effects
        if (this.passiveEffects.gamblerEffect) {
            const effect = this.passiveEffects.gamblerEffect;
            if (effect.type === 'fireRate') {
                multiplier += effect.value;
            }
        }

        return multiplier;
    }

    // Get current crit chance (for WeaponSystem)
    getCritChance() {
        return this.passiveEffects.critChance;
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
