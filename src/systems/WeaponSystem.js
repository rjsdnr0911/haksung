import { Config } from '../core/Config.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.maxSlots = 6;
        this.weaponSlots = []; // Array of weapon slot objects

        // Track active DoT effects (for poison clouds)
        this.activeDots = [];

        // Note: Starting weapon is now added by Game.addCharacterStartingWeapon()
    }

    addWeapon(weaponType) {
        if (this.weaponSlots.length >= this.maxSlots) {
            console.warn('[WeaponSystem] Max weapon slots reached');
            return false;
        }

        if (!Config.weapons[weaponType]) {
            console.error('[WeaponSystem] Unknown weapon type:', weaponType);
            return false;
        }

        // Create a copy of the weapon config
        const weaponConfig = JSON.parse(JSON.stringify(Config.weapons[weaponType]));

        const slot = {
            type: weaponType,
            weapon: weaponConfig,
            currentTarget: null,
            lastFireTime: 0,
            fireInterval: 1000 / weaponConfig.fireRate
        };

        this.weaponSlots.push(slot);
        console.log('[WeaponSystem] Added weapon:', weaponConfig.name, '- Slot', this.weaponSlots.length);
        return true;
    }

    update(deltaTime) {
        if (!this.game.player) return;

        // Update each weapon slot independently
        for (const slot of this.weaponSlots) {
            this.updateWeaponSlot(slot, deltaTime);
        }

        // Update DoT effects
        this.updateDotEffects(deltaTime);
    }

    updateWeaponSlot(slot, deltaTime) {
        // Special handling for aura weapons (garlic)
        if (slot.weapon.aura) {
            this.updateAuraWeapon(slot);
            return;
        }

        // Find target for this weapon
        this.findTarget(slot);

        // Auto-aim at target
        if (slot.currentTarget) {
            this.aimAtTarget(slot, deltaTime);
        }

        // Auto-fire
        this.tryFire(slot);
    }

    findTarget(slot) {
        if (!this.game.player || this.game.enemies.length === 0) {
            slot.currentTarget = null;
            return;
        }

        let nearestEnemy = null;
        let nearestDistance = slot.weapon.range;

        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;

            const distance = BABYLON.Vector3.Distance(
                this.game.player.position,
                enemy.position
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }

        slot.currentTarget = nearestEnemy;
    }

    aimAtTarget(slot, deltaTime) {
        if (!slot.currentTarget || !this.game.player) return;

        // Calculate direction to target
        const direction = slot.currentTarget.position.subtract(this.game.player.position);
        const targetAngle = Math.atan2(direction.x, direction.z);

        // Smoothly rotate player to face target (only for first weapon)
        // Other weapons just shoot in their calculated direction
        if (this.weaponSlots[0] === slot) {
            const lerpFactor = Math.min(deltaTime * 10, 1);
            this.game.player.rotation = this.lerpAngle(
                this.game.player.rotation,
                targetAngle,
                lerpFactor
            );
        }
    }

    lerpAngle(from, to, t) {
        // Handle angle wrapping
        let diff = to - from;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return from + diff * t;
    }

    calculatePredictiveAim(startPos, target, projectileSpeed) {
        // Get target's current position and velocity
        const targetPos = target.position.clone();
        const targetVelocity = target.velocity || BABYLON.Vector3.Zero();

        // Calculate distance to target (3D distance)
        const toTarget = targetPos.subtract(startPos);
        const distance = toTarget.length();

        // Calculate time for projectile to reach target
        const timeToReach = distance / projectileSpeed;

        // Predict where target will be
        const predictedMovement = targetVelocity.scale(timeToReach);
        const predictedPos = targetPos.add(predictedMovement);

        // Calculate direction to predicted position (keep Y component for 3D aiming)
        const direction = predictedPos.subtract(startPos);

        if (direction.length() > 0) {
            direction.normalize();
            return direction;
        } else {
            // Fallback to direct aim
            return this.game.player.getForwardDirection();
        }
    }

    tryFire(slot) {
        if (!slot.currentTarget || !this.game.player) return;

        const now = Date.now();

        // Apply fire rate multiplier from player passives
        let adjustedInterval = slot.fireInterval;
        if (this.game.player.getFireRateMultiplier) {
            const fireRateMult = this.game.player.getFireRateMultiplier();
            adjustedInterval = slot.fireInterval / fireRateMult; // Higher multiplier = faster firing
        }

        if (now - slot.lastFireTime < adjustedInterval) return;

        this.fire(slot);
        slot.lastFireTime = now;
    }

    fire(slot) {
        if (!this.game.player || !slot.currentTarget) return;

        const startPos = this.game.player.position.clone();
        startPos.y = this.game.player.position.y + 1.0; // Shoot from player's height + 1.0

        // Calculate predictive aim direction
        const direction = this.calculatePredictiveAim(
            startPos,
            slot.currentTarget,
            slot.weapon.projectileSpeed
        );

        // Fire multiple projectiles if multi-shot is enabled
        const projectileCount = slot.weapon.projectilesPerShot || 1;
        const spread = slot.weapon.spread || 0;

        for (let i = 0; i < projectileCount; i++) {
            let projDirection = direction.clone();

            // Apply spread if multiple projectiles
            if (projectileCount > 1 && spread > 0) {
                // Calculate spread offset for this projectile
                const spreadRad = (spread * Math.PI / 180); // Convert degrees to radians
                const offset = (i - (projectileCount - 1) / 2) * (spreadRad / (projectileCount - 1));

                // Rotate direction around Y axis
                const cos = Math.cos(offset);
                const sin = Math.sin(offset);
                projDirection = new BABYLON.Vector3(
                    direction.x * cos - direction.z * sin,
                    direction.y,
                    direction.x * sin + direction.z * cos
                );
            }

            // Create projectile
            this.createProjectile(startPos, projDirection, slot.weapon);
        }

        // Create muzzle flash effect with EffectSystem
        if (this.game.effectSystem) {
            this.game.effectSystem.createMuzzleFlash(startPos, slot.weapon.color);
        }
    }

    createProjectile(position, direction, weapon) {
        // Visual projectile
        const projectile = BABYLON.MeshBuilder.CreateSphere(
            'projectile',
            { diameter: 0.3, segments: 8 },
            this.game.scene
        );
        projectile.position = position.clone();

        // Material
        const material = new BABYLON.StandardMaterial('projectileMat', this.game.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString(weapon.color);
        material.emissiveColor = BABYLON.Color3.FromHexString(weapon.color);
        projectile.material = material;

        // Calculate damage (randomize if needed)
        let damage = weapon.damage;
        if (weapon.randomDamage) {
            damage = Math.floor(Math.random() * (weapon.damageMax - weapon.damageMin + 1)) + weapon.damageMin;
            console.log(`[WeaponSystem] Dice rolled: ${damage} damage`);
        }

        // Apply damage multiplier from player passives
        if (this.game.player.getDamageMultiplier) {
            const damageMult = this.game.player.getDamageMultiplier();
            damage = Math.floor(damage * damageMult);
        }

        // Roll for critical hit
        let isCrit = false;
        if (this.game.player.getCritChance) {
            const critChance = this.game.player.getCritChance();
            if (Math.random() < critChance) {
                isCrit = true;
                damage = Math.floor(damage * 2); // 2x damage on crit
                console.log(`[WeaponSystem] CRITICAL HIT! ${damage} damage`);
            }
        }

        // Projectile data
        const projectileData = {
            mesh: projectile,
            position: position.clone(),
            direction: direction.clone(),
            speed: weapon.projectileSpeed,
            damage: damage,
            isCrit: isCrit,
            maxDistance: weapon.range,
            distanceTraveled: 0,
            isActive: true,
            piercing: weapon.piercing || false,
            explosive: weapon.explosive || false,
            explosionRadius: weapon.explosionRadius || 0,
            color: weapon.color,
            // New special weapon properties
            boomerang: weapon.boomerang || false,
            returning: false, // For boomerang
            startPos: position.clone(), // For boomerang return
            lifesteal: weapon.lifesteal || 0,
            poisonCloud: weapon.poisonCloud || false,
            dotDamage: weapon.dotDamage || 0,
            dotDuration: weapon.dotDuration || 0,
            cloudRadius: weapon.cloudRadius || 0
        };

        this.game.projectiles.push(projectileData);

        // Add projectile trail effect
        if (this.game.effectSystem && !weapon.aura) {
            this.game.effectSystem.createProjectileTrail(projectileData, weapon.color);
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
            const proj = this.game.projectiles[i];

            if (!proj.isActive) {
                // Stop particle trail
                if (this.game.effectSystem) {
                    this.game.effectSystem.stopProjectileTrail(proj);
                }
                proj.mesh.dispose();
                this.game.projectiles.splice(i, 1);
                continue;
            }

            // Handle boomerang projectiles
            if (proj.boomerang) {
                // Check if reached max distance - start returning
                if (proj.distanceTraveled >= proj.maxDistance && !proj.returning) {
                    proj.returning = true;
                    console.log('[WeaponSystem] Bone boomeranging back');
                }

                // If returning, move towards start position
                if (proj.returning) {
                    const toStart = proj.startPos.subtract(proj.position);
                    const distance = toStart.length();

                    if (distance < 1.0) {
                        // Reached back to player
                        proj.isActive = false;
                        continue;
                    }

                    toStart.normalize();
                    proj.direction = toStart;
                }
            }

            // Move projectile
            const movement = proj.direction.scale(proj.speed * deltaTime);
            proj.position.addInPlace(movement);
            proj.mesh.position = proj.position;
            proj.distanceTraveled += movement.length();

            // Check if exceeded max distance (for non-boomerang)
            if (!proj.boomerang && proj.distanceTraveled >= proj.maxDistance) {
                proj.isActive = false;
                continue;
            }

            // Check collision with enemies
            this.checkProjectileCollision(proj);
        }
    }

    checkProjectileCollision(projectile) {
        let hitCount = 0;
        let totalDamageDealt = 0;

        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;

            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);

            // More generous hitbox: 2.5x enemy size for better hit detection
            const hitRadius = enemy.size * 2.5;

            if (distance < hitRadius) {
                // Check for Backstab passive (Amog)
                let finalDamage = projectile.damage;
                if (this.game.player && this.game.player.character &&
                    this.game.player.character.passive.type === 'backstab') {
                    // Check if attacking from behind
                    // If enemy is moving towards player, and we're shooting them, it's a backstab
                    const toPlayer = this.game.player.position.subtract(enemy.position);
                    toPlayer.normalize();

                    const projDir = projectile.direction.clone();
                    projDir.normalize();

                    // Dot product: if > 0.5, enemy is facing away from projectile direction (backstab)
                    const dot = toPlayer.x * projDir.x + toPlayer.z * projDir.z;

                    if (dot < -0.3) { // Enemy moving away from player = backstab
                        finalDamage = Math.floor(finalDamage * 2.5); // 2.5x backstab damage
                        console.log('[WeaponSystem] BACKSTAB! 2.5x damage');
                    }
                }

                // Hit!
                console.log('[WeaponSystem] Hit enemy! Distance:', distance, 'Hitbox radius:', hitRadius);
                enemy.takeDamage(finalDamage);
                totalDamageDealt += finalDamage;
                hitCount++;

                // Visual effects
                if (this.game.effectSystem) {
                    // Hit effect
                    this.game.effectSystem.createHitEffect(enemy.position, projectile.isCrit);
                    // Damage number
                    this.game.effectSystem.createDamageNumber(enemy.position, finalDamage, projectile.isCrit, false);
                }

                // Check if enemy died
                if (enemy.isDead) {
                    this.onEnemyKilled(enemy);
                }

                // Handle special projectile types

                // Lifesteal effect (blood scythe)
                if (projectile.lifesteal > 0 && this.game.player) {
                    const healAmount = Math.floor(finalDamage * projectile.lifesteal);
                    this.game.player.heal(healAmount);
                    console.log(`[WeaponSystem] Lifesteal: ${healAmount} HP`);

                    // Show heal number
                    if (this.game.effectSystem) {
                        this.game.effectSystem.createDamageNumber(this.game.player.position, healAmount, false, true);
                    }
                }

                // Poison cloud effect
                if (projectile.poisonCloud) {
                    this.createPoisonCloud(projectile.position, projectile.cloudRadius, projectile.dotDamage, projectile.dotDuration);
                }

                if (projectile.explosive) {
                    // Create explosion at impact
                    this.createExplosion(projectile.position, projectile.explosionRadius, projectile.damage * 0.5);

                    // Visual explosion effect
                    if (this.game.effectSystem) {
                        this.game.effectSystem.createExplosionParticles(
                            projectile.position,
                            projectile.color,
                            projectile.explosionRadius
                        );
                        // Screen shake
                        this.game.effectSystem.addScreenShake(0.3, 0.2);
                    }

                    // Railgun: explosive but still piercing
                    if (!projectile.piercing) {
                        projectile.isActive = false;
                        break;
                    }
                }

                if (!projectile.piercing && !projectile.boomerang) {
                    // Normal projectile stops after first hit
                    projectile.isActive = false;
                    break;
                } else if (projectile.piercing) {
                    // Piercing projectile continues, but reduce damage slightly
                    projectile.damage *= 0.9;
                }
                // Boomerang continues through enemies
            }
        }
    }

    createExplosion(position, radius, damage) {
        console.log('[WeaponSystem] Explosion at', position, 'radius:', radius);

        // Visual explosion effect
        const explosion = BABYLON.MeshBuilder.CreateSphere(
            'explosion',
            { diameter: radius * 2, segments: 16 },
            this.game.scene
        );
        explosion.position = position.clone();

        const material = new BABYLON.StandardMaterial('explosionMat', this.game.scene);
        material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
        material.alpha = 0.7;
        explosion.material = material;

        // Damage all enemies in radius
        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;

            const distance = BABYLON.Vector3.Distance(position, enemy.position);
            if (distance < radius) {
                // Damage falloff based on distance
                const damageFactor = 1 - (distance / radius);
                const actualDamage = Math.floor(damage * damageFactor);
                enemy.takeDamage(actualDamage);

                if (enemy.isDead) {
                    this.onEnemyKilled(enemy);
                }
            }
        }

        // Animate and remove explosion
        setTimeout(() => {
            explosion.dispose();
        }, 200);
    }

    onEnemyKilled(enemy) {
        // Spawn XP orb at enemy position
        this.spawnXPOrb(enemy.position, enemy.xpValue);

        // Notify game (for meta-progression tracking)
        if (this.game.onEnemyKilled) {
            this.game.onEnemyKilled(enemy);
        }
    }

    spawnXPOrb(position, xpValue) {
        const orb = BABYLON.MeshBuilder.CreateSphere(
            'xpOrb',
            { diameter: 0.5, segments: 8 },
            this.game.scene
        );

        // 적 위치에서 지면 높이 찾기 (raycast)
        const groundHeight = this.findGroundHeight(position);

        orb.position = position.clone();
        orb.position.y = groundHeight + 0.5; // 지면 위 0.5 유닛

        const material = new BABYLON.StandardMaterial('xpOrbMat', this.game.scene);
        material.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
        material.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.1);
        orb.material = material;

        const orbData = {
            mesh: orb,
            position: orb.position.clone(), // 실제 오브 위치 저장
            xpValue: xpValue,
            isActive: true
        };

        this.game.xpOrbs.push(orbData);
    }

    findGroundHeight(position) {
        // Cast ray downward from position to detect terrain
        const rayOrigin = new BABYLON.Vector3(
            position.x,
            position.y + 50, // Start ray from above
            position.z
        );
        const rayDirection = new BABYLON.Vector3(0, -1, 0); // Downward
        const rayLength = 100;

        const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);
        const pickInfo = this.game.scene.pickWithRay(ray, (mesh) => {
            // Only pick terrain meshes (hills, rocks, mountains, ground)
            return mesh.name.startsWith('hill_') ||
                   mesh.name.startsWith('rock_') ||
                   mesh.name.startsWith('mountain_') ||
                   mesh.name === 'ground';
        });

        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            // Return the ground height at this position
            return pickInfo.pickedPoint.y;
        } else {
            // Fallback to default ground level
            return 0;
        }
    }

    // Aura weapon handling (Garlic)
    updateAuraWeapon(slot) {
        if (!this.game.player || this.game.enemies.length === 0) return;

        const now = Date.now();
        if (now - slot.lastFireTime < slot.fireInterval) return;

        // Damage all enemies in range
        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;

            const distance = BABYLON.Vector3.Distance(this.game.player.position, enemy.position);

            if (distance < slot.weapon.range) {
                // Deal damage with multiplier
                let damage = slot.weapon.damage;
                if (this.game.player.getDamageMultiplier) {
                    damage = Math.floor(damage * this.game.player.getDamageMultiplier());
                }
                enemy.takeDamage(damage);

                // Apply knockback (push enemy away)
                if (slot.weapon.knockback) {
                    const pushDirection = enemy.position.subtract(this.game.player.position);
                    pushDirection.normalize();
                    const pushForce = slot.weapon.knockback;
                    enemy.position.addInPlace(pushDirection.scale(pushForce * 0.1));
                    if (enemy.mesh) {
                        enemy.mesh.position = enemy.position;
                    }
                }

                // Check if enemy died
                if (enemy.isDead) {
                    this.onEnemyKilled(enemy);
                }
            }
        }

        slot.lastFireTime = now;
    }

    // Create poison cloud effect
    createPoisonCloud(position, radius, dotDamage, duration) {
        console.log('[WeaponSystem] Creating poison cloud');

        // Visual cloud effect
        const cloud = BABYLON.MeshBuilder.CreateSphere(
            'poisonCloud',
            { diameter: radius * 2, segments: 16 },
            this.game.scene
        );
        cloud.position = position.clone();
        cloud.position.y = 0.5;

        const material = new BABYLON.StandardMaterial('cloudMat', this.game.scene);
        material.diffuseColor = new BABYLON.Color3(0, 1, 0.5);
        material.emissiveColor = new BABYLON.Color3(0, 0.5, 0.3);
        material.alpha = 0.4;
        cloud.material = material;

        // Track DoT effect
        const dotEffect = {
            mesh: cloud,
            position: position.clone(),
            radius: radius,
            damage: dotDamage,
            duration: duration,
            elapsedTime: 0,
            tickInterval: 500, // Tick every 0.5 seconds
            lastTickTime: Date.now()
        };

        this.activeDots.push(dotEffect);

        // Remove cloud after duration
        setTimeout(() => {
            cloud.dispose();
        }, duration);
    }

    // Update DoT effects
    updateDotEffects(deltaTime) {
        const now = Date.now();

        for (let i = this.activeDots.length - 1; i >= 0; i--) {
            const dot = this.activeDots[i];

            dot.elapsedTime += deltaTime * 1000;

            // Remove expired DoTs
            if (dot.elapsedTime >= dot.duration) {
                this.activeDots.splice(i, 1);
                continue;
            }

            // Apply damage on tick
            if (now - dot.lastTickTime >= dot.tickInterval) {
                for (const enemy of this.game.enemies) {
                    if (enemy.isDead) continue;

                    const distance = BABYLON.Vector3.Distance(dot.position, enemy.position);

                    if (distance < dot.radius) {
                        enemy.takeDamage(dot.damage);

                        if (enemy.isDead) {
                            this.onEnemyKilled(enemy);
                        }
                    }
                }

                dot.lastTickTime = now;
            }
        }
    }

    // Get a specific weapon slot for tome upgrades
    getWeaponSlot(index = 0) {
        return this.weaponSlots[index];
    }

    // Get all weapon slots
    getAllWeapons() {
        return this.weaponSlots;
    }

    dispose() {
        // Cleanup projectiles
        for (const proj of this.game.projectiles) {
            if (proj.mesh) {
                proj.mesh.dispose();
            }
        }
        this.game.projectiles = [];

        // Cleanup DoT effects
        for (const dot of this.activeDots) {
            if (dot.mesh) {
                dot.mesh.dispose();
            }
        }
        this.activeDots = [];
    }
}
