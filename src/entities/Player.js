import { Config } from '../core/Config.js';

export class Player {
    constructor(scene, position = BABYLON.Vector3.Zero(), camera = null, characterData = null, game = null) {
        this.scene = scene;
        this.camera = camera;
        this.game = game; // Reference to game for accessing enemies
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
            lastOverdriveUpdate: 0,  // For Overdrive
            lastGarlicTick: 0        // For Garlic Aura
        };
        this.passiveEffects = {
            speedBonus: 0,           // Speed Demon speed bonus
            damageBonus: 0,          // Speed Demon damage bonus
            gamblerEffect: null,     // Current gambler effect
            critChance: 0            // Overdrive crit chance
        };

        // Visual effect elements for passives
        this.passiveVisuals = {
            speedDemonGlow: null,    // Glow effect for Speed Demon
            gamblerIndicator: null,  // Indicator for Gambler's Curse
            overdriveGauge: null     // Visual gauge for Overdrive
        };

        // Input
        this.moveInput = { x: 0, z: 0 };

        // Jump mechanics
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.groundLevel = 0; // Ground height at current position

        // 3D Model and Animation System (for Calcium)
        this.glbModel = null;
        this.animationGroups = {
            walking: null,
            running: null
        };
        this.currentAnimation = null;
        this.currentSpeed = 0; // Track current movement speed
        this.runningSpeedThreshold = 10; // Speed threshold to switch to running animation

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

        // Get character colors or use defaults
        const visual = this.character?.visual;
        const bodyColor = visual?.bodyColor || Config.player.color;
        const headColor = visual?.headColor || '#ffcc88';
        const emissiveScale = visual?.emissiveScale || 0.3;
        const accentColor = visual?.accentColor;

        // For Calcium character, try to load 3D GLB model
        if (this.character?.id === 'calcium') {
            this.loadCalciumModel(container, radius, height);
            // Still create fallback procedural mesh (will be hidden if GLB loads successfully)
        }

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

        // Material - store reference for passive effects
        this.bodyMaterial = new BABYLON.StandardMaterial('playerBodyMat', this.scene);
        this.bodyMaterial.diffuseColor = BABYLON.Color3.FromHexString(bodyColor);
        this.bodyMaterial.emissiveColor = BABYLON.Color3.FromHexString(bodyColor).scale(emissiveScale);
        body.material = this.bodyMaterial;

        // Head (sphere on top)
        const head = BABYLON.MeshBuilder.CreateSphere(
            'playerHead',
            { diameter: radius * 1.2, segments: 12 },
            this.scene
        );
        head.parent = container;
        head.position.y = height + radius * 0.6;
        this.headMaterial = new BABYLON.StandardMaterial('playerHeadMat', this.scene);
        this.headMaterial.diffuseColor = BABYLON.Color3.FromHexString(headColor);
        this.headMaterial.emissiveColor = BABYLON.Color3.FromHexString(headColor).scale(emissiveScale * 0.5);
        head.material = this.headMaterial;

        // Character-specific accent elements
        if (accentColor) {
            // For Amog: Cyan visor on head
            if (this.character?.id === 'amog') {
                const visor = BABYLON.MeshBuilder.CreateBox(
                    'visor',
                    { width: radius * 1.8, height: radius * 0.4, depth: radius * 0.2 },
                    this.scene
                );
                visor.parent = container;
                visor.position.y = height + radius * 0.6; // Same height as head
                visor.position.z = radius * 0.5; // In front of head
                const visorMat = new BABYLON.StandardMaterial('visorMat', this.scene);
                visorMat.diffuseColor = BABYLON.Color3.FromHexString(accentColor);
                visorMat.emissiveColor = BABYLON.Color3.FromHexString(accentColor).scale(0.6);
                visor.material = visorMat;
            }
            // For CL4NK: Cyan circuit lines on body
            else if (this.character?.id === 'cl4nk') {
                const circuit = BABYLON.MeshBuilder.CreateBox(
                    'circuit',
                    { width: radius * 0.2, height: height * 0.8, depth: radius * 0.2 },
                    this.scene
                );
                circuit.parent = container;
                circuit.position.y = height / 2;
                circuit.position.z = radius * 0.9; // Front of body
                const circuitMat = new BABYLON.StandardMaterial('circuitMat', this.scene);
                circuitMat.diffuseColor = BABYLON.Color3.FromHexString(accentColor);
                circuitMat.emissiveColor = BABYLON.Color3.FromHexString(accentColor).scale(0.8);
                circuit.material = circuitMat;
            }
            // For Vlad: Blood accent on arms/body
            else if (this.character?.id === 'vlad') {
                const bloodAccent = BABYLON.MeshBuilder.CreateBox(
                    'bloodAccent',
                    { width: radius * 1.5, height: radius * 0.3, depth: radius * 0.3 },
                    this.scene
                );
                bloodAccent.parent = container;
                bloodAccent.position.y = height * 0.4; // Lower body
                const bloodMat = new BABYLON.StandardMaterial('bloodMat', this.scene);
                bloodMat.diffuseColor = BABYLON.Color3.FromHexString(accentColor);
                bloodMat.emissiveColor = BABYLON.Color3.FromHexString(accentColor).scale(0.5);
                bloodAccent.material = bloodMat;
            }
        }

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
        leftArm.material = this.bodyMaterial;

        // Right arm
        const rightArm = BABYLON.MeshBuilder.CreateBox(
            'rightArm',
            { width: armWidth, height: armLength, depth: armWidth },
            this.scene
        );
        rightArm.parent = container;
        rightArm.position.x = radius * 0.9;
        rightArm.position.y = height * 0.7;
        rightArm.material = this.bodyMaterial;

        // Position container
        container.position = this.position.clone();
        container.position.y = 0;
        container.rotation.y = this.rotation;

        container.checkCollisions = false;

        // Create passive ability visual indicators
        this.createPassiveVisuals(container, radius, height);

        console.log('[Player] Procedural character created');
    }

    /**
     * Load Calcium 3D GLB model with Walking and Running animations
     */
    async loadCalciumModel(container, radius, height) {
        try {
            // Load Walking animation model
            const walkingPath = './assets/models/characters/Animation_Walking_withSkin.glb';
            const runningPath = './assets/models/characters/Animation_Running_withSkin.glb';

            console.log('[Player] Loading Calcium 3D model...');

            // Load Walking model (primary model)
            BABYLON.SceneLoader.ImportMesh(
                '',
                '',
                walkingPath,
                this.scene,
                (meshes, particleSystems, skeletons, animationGroups) => {
                    console.log('[Player] Walking model loaded successfully');

                    // Store the root mesh
                    if (meshes.length > 0) {
                        this.glbModel = meshes[0];
                        this.glbModel.parent = container;

                        // Scale the model to match character size
                        const modelScale = this.sizeMultiplier * 0.5; // Adjust scale factor as needed
                        this.glbModel.scaling = new BABYLON.Vector3(modelScale, modelScale, modelScale);

                        // Position model (adjust Y offset if needed)
                        this.glbModel.position.y = 0;

                        // Store walking animation
                        if (animationGroups.length > 0) {
                            this.animationGroups.walking = animationGroups[0];
                            this.animationGroups.walking.stop();
                            console.log('[Player] Walking animation loaded');
                        }

                        // Hide procedural meshes since we have 3D model
                        this.hideProceduralMeshes();
                    }

                    // Load Running animation model (for running animation only)
                    BABYLON.SceneLoader.ImportMesh(
                        '',
                        '',
                        runningPath,
                        this.scene,
                        (runMeshes, runParticleSystems, runSkeletons, runAnimationGroups) => {
                            console.log('[Player] Running animation loaded');

                            // Hide running model meshes (we only need the animation)
                            runMeshes.forEach(mesh => {
                                mesh.isVisible = false;
                            });

                            // Store running animation
                            if (runAnimationGroups.length > 0) {
                                this.animationGroups.running = runAnimationGroups[0];
                                this.animationGroups.running.stop();

                                // Transfer running animation to walking model's skeleton
                                if (skeletons.length > 0 && runSkeletons.length > 0) {
                                    // Link running animation to walking model's skeleton
                                    this.animationGroups.running.targetedAnimations.forEach(targetAnim => {
                                        targetAnim.target = skeletons[0].bones.find(
                                            bone => bone.name === targetAnim.target.name
                                        ) || targetAnim.target;
                                    });
                                }

                                console.log('[Player] Running animation transferred to main model');
                            }

                            // Start with walking animation
                            this.playAnimation('walking');
                        },
                        null,
                        (scene, message, exception) => {
                            console.warn('[Player] Failed to load running animation, using walking only:', message);
                        }
                    );
                },
                null,
                (scene, message, exception) => {
                    console.error('[Player] Failed to load Calcium 3D model:', message);
                    console.log('[Player] Using procedural fallback mesh');
                }
            );
        } catch (error) {
            console.error('[Player] Error loading Calcium model:', error);
            console.log('[Player] Using procedural fallback mesh');
        }
    }

    /**
     * Hide procedural meshes when 3D model is loaded
     */
    hideProceduralMeshes() {
        if (this.mesh) {
            this.mesh.getChildMeshes().forEach(child => {
                if (child.name !== 'playerContainer') {
                    child.isVisible = false;
                }
            });
            console.log('[Player] Procedural meshes hidden, using 3D model');
        }
    }

    /**
     * Play a specific animation (walking or running)
     */
    playAnimation(animName) {
        if (!this.animationGroups[animName]) {
            console.warn(`[Player] Animation '${animName}' not available`);
            return;
        }

        // Stop current animation
        if (this.currentAnimation && this.currentAnimation !== animName) {
            const prevAnim = this.animationGroups[this.currentAnimation];
            if (prevAnim) {
                prevAnim.stop();
            }
        }

        // Play new animation
        const anim = this.animationGroups[animName];
        if (!anim.isPlaying) {
            anim.start(true, 1.0, anim.from, anim.to, false); // Loop animation
            console.log(`[Player] Playing animation: ${animName}`);
        }

        this.currentAnimation = animName;
    }

    /**
     * Update animation based on current speed
     */
    updateAnimation() {
        if (!this.glbModel) return; // No 3D model loaded

        // If not moving, stop animation
        if (this.currentSpeed < 0.1) {
            if (this.currentAnimation) {
                const anim = this.animationGroups[this.currentAnimation];
                if (anim) {
                    anim.pause();
                }
            }
            return;
        }

        // Determine which animation to play based on speed
        const shouldRun = this.currentSpeed >= this.runningSpeedThreshold;
        const targetAnim = shouldRun ? 'running' : 'walking';

        // Switch animation if needed
        if (this.currentAnimation !== targetAnim) {
            this.playAnimation(targetAnim);
        } else {
            // Resume animation if it was paused
            const anim = this.animationGroups[this.currentAnimation];
            if (anim && !anim.isPlaying) {
                anim.play(true);
            }
        }

        // Adjust animation speed based on actual movement speed
        const baseSpeed = shouldRun ? 12 : 6; // Base speeds for running/walking
        const speedRatio = this.currentSpeed / baseSpeed;
        const anim = this.animationGroups[this.currentAnimation];
        if (anim) {
            anim.speedRatio = Math.max(0.5, Math.min(2.0, speedRatio)); // Clamp between 0.5x and 2.0x
        }
    }

    createPassiveVisuals(container, radius, height) {
        if (!this.character || !this.character.passive) return;

        const passiveType = this.character.passive.type;

        // Speed Demon: Glowing ring that intensifies with stacks
        if (passiveType === 'speed_demon') {
            const ring = BABYLON.MeshBuilder.CreateTorus(
                'speedDemonRing',
                { diameter: radius * 3, thickness: 0.08, tessellation: 24 },
                this.scene
            );
            ring.parent = container;
            ring.position.y = height * 0.3;
            ring.rotation.x = Math.PI / 2; // Horizontal

            const ringMat = new BABYLON.StandardMaterial('speedDemonMat', this.scene);
            ringMat.emissiveColor = new BABYLON.Color3(0.3, 0.8, 1.0); // Cyan
            ringMat.alpha = 0; // Start invisible
            ringMat.disableLighting = true;
            ring.material = ringMat;

            this.passiveVisuals.speedDemonGlow = { mesh: ring, material: ringMat };
        }

        // Gambler's Curse: Floating indicator above head
        else if (passiveType === 'gamblers_curse') {
            const indicator = BABYLON.MeshBuilder.CreateSphere(
                'gamblerIndicator',
                { diameter: radius * 0.6, segments: 12 },
                this.scene
            );
            indicator.parent = container;
            indicator.position.y = height + radius * 1.5; // Above head

            const indMat = new BABYLON.StandardMaterial('gamblerMat', this.scene);
            indMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Neutral gray
            indMat.alpha = 0; // Start invisible
            indMat.disableLighting = true;
            indicator.material = indMat;

            this.passiveVisuals.gamblerIndicator = { mesh: indicator, material: indMat };
        }

        // Overdrive (CL4NK): Charging bars on body
        else if (passiveType === 'critical_core') {
            const gauge = BABYLON.MeshBuilder.CreateBox(
                'overdriveGauge',
                { width: radius * 0.3, height: height * 0.6, depth: radius * 0.15 },
                this.scene
            );
            gauge.parent = container;
            gauge.position.y = height / 2;
            gauge.position.x = radius * 1.1; // Side of body
            gauge.scaling.y = 0; // Start at 0% filled

            const gaugeMat = new BABYLON.StandardMaterial('overdriveMat', this.scene);
            gaugeMat.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan
            gaugeMat.alpha = 0.7;
            gaugeMat.disableLighting = true;
            gauge.material = gaugeMat;

            this.passiveVisuals.overdriveGauge = { mesh: gauge, material: gaugeMat, maxHeight: height * 0.6 };
        }
    }

    update(deltaTime) {
        // Update passive abilities
        this.updatePassive(deltaTime);

        // Update passive visual effects
        this.updatePassiveVisuals();

        // Store previous position to calculate actual speed
        const prevPosition = this.position.clone();

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

        // Calculate current movement speed for animation
        const distanceMoved = BABYLON.Vector3.Distance(prevPosition, this.position);
        this.currentSpeed = deltaTime > 0 ? distanceMoved / deltaTime : 0;

        // Update animation based on speed (for Calcium 3D model)
        if (this.character?.id === 'calcium') {
            this.updateAnimation();
        }
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

        // Visual feedback: Flash red
        this.flashDamage();

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

    flashDamage() {
        // Flash the body red briefly
        if (!this.bodyMaterial) return;

        const originalEmissive = this.bodyMaterial.emissiveColor.clone();

        // Set to red
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);

        // Fade back to original over 200ms
        let elapsed = 0;
        const flashDuration = 200;
        const flashInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / flashDuration;

            if (progress >= 1) {
                this.bodyMaterial.emissiveColor = originalEmissive;
                clearInterval(flashInterval);
            } else {
                // Lerp between red and original
                this.bodyMaterial.emissiveColor = BABYLON.Color3.Lerp(
                    new BABYLON.Color3(1, 0.2, 0.2),
                    originalEmissive,
                    progress
                );
            }
        }, 16);
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

        // Play death animation before calling onDeath
        this.playDeathAnimation();

        // Delay onDeath callback to let animation play
        setTimeout(() => {
            this.onDeath();
        }, 1000);
    }

    playDeathAnimation() {
        if (!this.mesh) return;

        // Fade out and shrink animation
        let elapsed = 0;
        const duration = 1000; // 1 second

        const deathInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(deathInterval);
                // Completely hide the mesh
                this.mesh.scaling = new BABYLON.Vector3(0, 0, 0);
            } else {
                // Shrink and sink into ground
                const scale = 1 - progress;
                this.mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                this.mesh.position.y = this.position.y - (progress * 2); // Sink down

                // Fade materials
                if (this.bodyMaterial) {
                    this.bodyMaterial.alpha = 1 - progress;
                }
                if (this.headMaterial) {
                    this.headMaterial.alpha = 1 - progress;
                }

                // Rotate for dramatic effect
                this.mesh.rotation.x = progress * Math.PI;
            }
        }, 16);
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
            case 'garlic_aura':
                this.updateGarlicAura(now, passive);
                break;
            // Backstab is handled in WeaponSystem
            // Lifesteal is handled in blood_scythe weapon
        }
    }

    updatePassiveVisuals() {
        if (!this.character || !this.character.passive) return;

        const passiveType = this.character.passive.type;

        // Speed Demon: Update ring glow based on speed bonus
        if (passiveType === 'speed_demon' && this.passiveVisuals.speedDemonGlow) {
            const { material, mesh } = this.passiveVisuals.speedDemonGlow;
            const bonus = this.passiveEffects.speedBonus; // 0 to 1.0

            // Alpha fades in/out based on bonus level
            material.alpha = Math.min(bonus * 0.8, 0.6); // Max 60% alpha

            // Emissive intensity increases with bonus
            const intensity = 0.3 + bonus * 0.7; // 0.3 to 1.0
            material.emissiveColor = new BABYLON.Color3(0.3, 0.8, 1.0).scale(intensity);

            // Rotate the ring for visual effect
            mesh.rotation.z += 0.02;
        }

        // Gambler's Curse: Update indicator color based on current effect
        else if (passiveType === 'gamblers_curse' && this.passiveVisuals.gamblerIndicator) {
            const { material, mesh } = this.passiveVisuals.gamblerIndicator;
            const effect = this.passiveEffects.gamblerEffect;

            if (effect) {
                material.alpha = 0.8;

                // Good effects: Green
                if (effect.value > 0 || effect.type === 'invincible') {
                    material.emissiveColor = new BABYLON.Color3(0.2, 1.0, 0.2); // Green
                }
                // Bad effects: Red
                else {
                    material.emissiveColor = new BABYLON.Color3(1.0, 0.2, 0.2); // Red
                }

                // Bob up and down
                const time = Date.now() / 1000;
                mesh.position.y = (this.character.stats.size * Config.player.height) +
                                   (this.character.stats.size * Config.player.radius * 1.5) +
                                   Math.sin(time * 3) * 0.1;
            } else {
                material.alpha = 0; // Hide when no effect
            }
        }

        // Overdrive: Update gauge fill based on crit chance
        else if (passiveType === 'critical_core' && this.passiveVisuals.overdriveGauge) {
            const { mesh, material } = this.passiveVisuals.overdriveGauge;
            const critChance = this.passiveEffects.critChance; // 0 to 0.5
            const maxCritChance = this.character.passive.maxCritChance || 0.5;

            // Scale gauge fill based on crit chance percentage
            const fillPercent = critChance / maxCritChance; // 0 to 1
            mesh.scaling.y = fillPercent;

            // Color shifts from blue to yellow as it fills
            const r = fillPercent * 1.0;
            const g = 1.0;
            const b = 1.0 - fillPercent;
            material.emissiveColor = new BABYLON.Color3(r, g, b);
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

    updateGarlicAura(now, passive) {
        // Garlic Aura: Deal damage to all enemies within range every tickRate
        if (!this.game || !this.game.enemies) return;

        // Initialize timer if needed
        if (this.passiveTimers.lastGarlicTick === 0) {
            this.passiveTimers.lastGarlicTick = now;
            return;
        }

        // Check if enough time has passed for next tick
        const tickInterval = (passive.tickRate || 0.5) * 1000; // Convert to ms
        const timeSinceTick = now - this.passiveTimers.lastGarlicTick;

        if (timeSinceTick >= tickInterval) {
            this.passiveTimers.lastGarlicTick = now;

            // Calculate scaled range and damage
            const currentRange = passive.baseRange + (passive.rangePerLevel * this.level);
            const currentDamage = passive.baseDamage * (1 + passive.damagePerLevel * this.level);

            // Find and damage enemies within range
            let hitCount = 0;
            this.game.enemies.forEach(enemy => {
                if (!enemy.mesh) return;

                const distance = BABYLON.Vector3.Distance(this.position, enemy.position);
                if (distance <= currentRange) {
                    enemy.takeDamage(currentDamage);
                    hitCount++;

                    // Optional: Add visual effect for aura hit
                    if (this.game.effectSystem) {
                        this.game.effectSystem.createHitEffect(enemy.position, '#e8d4ff');
                    }
                }
            });

            if (hitCount > 0) {
                console.log(`[Player] Garlic Aura: Hit ${hitCount} enemies for ${currentDamage.toFixed(1)} damage (range: ${currentRange.toFixed(1)})`);
            }
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
