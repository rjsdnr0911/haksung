import { Config } from '../core/Config.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.maxSlots = 6;
        this.weaponSlots = []; // Array of weapon slot objects

        // Add starter weapon (pistol)
        this.addWeapon('pistol');
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
        if (!this.game.player || this.game.enemies.length === 0) return;

        // Update each weapon slot independently
        for (const slot of this.weaponSlots) {
            this.updateWeaponSlot(slot, deltaTime);
        }
    }

    updateWeaponSlot(slot, deltaTime) {
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

        // Calculate distance to target
        const toTarget = targetPos.subtract(startPos);
        toTarget.y = 0; // Keep aim on XZ plane
        const distance = toTarget.length();

        // Calculate time for projectile to reach target
        const timeToReach = distance / projectileSpeed;

        // Predict where target will be
        const predictedMovement = targetVelocity.scale(timeToReach);
        const predictedPos = targetPos.add(predictedMovement);

        // Calculate direction to predicted position
        const direction = predictedPos.subtract(startPos);
        direction.y = 0; // Keep on XZ plane

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
        if (now - slot.lastFireTime < slot.fireInterval) return;

        this.fire(slot);
        slot.lastFireTime = now;
    }

    fire(slot) {
        if (!this.game.player || !slot.currentTarget) return;

        const startPos = this.game.player.position.clone();
        startPos.y = 1.0; // Fixed height for shooting

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

        // Create muzzle flash particle effect
        if (this.game.particleSystem) {
            this.game.particleSystem.createMuzzleFlash(startPos, direction, slot.weapon.color);
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

        // Create trail effect
        const trail = new BABYLON.TrailMesh(
            'trail',
            projectile,
            this.game.scene,
            0.15, // Diameter
            30, // Length (number of segments)
            true // Auto-start
        );

        // Trail material
        const trailMaterial = new BABYLON.StandardMaterial('trailMat', this.game.scene);
        const baseColor = BABYLON.Color3.FromHexString(weapon.color);
        trailMaterial.emissiveColor = baseColor;
        trailMaterial.alpha = 0.6;
        trailMaterial.backFaceCulling = false;
        trail.material = trailMaterial;

        // Projectile data
        const projectileData = {
            mesh: projectile,
            trail: trail,
            position: position.clone(),
            direction: direction.clone(),
            speed: weapon.projectileSpeed,
            damage: weapon.damage,
            maxDistance: weapon.range,
            distanceTraveled: 0,
            isActive: true,
            piercing: weapon.piercing || false,
            explosive: weapon.explosive || false,
            explosionRadius: weapon.explosionRadius || 0,
            color: weapon.color
        };

        this.game.projectiles.push(projectileData);
    }

    updateProjectiles(deltaTime) {
        for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
            const proj = this.game.projectiles[i];

            if (!proj.isActive) {
                proj.mesh.dispose();
                if (proj.trail) {
                    proj.trail.dispose();
                }
                this.game.projectiles.splice(i, 1);
                continue;
            }

            // Move projectile
            const movement = proj.direction.scale(proj.speed * deltaTime);
            proj.position.addInPlace(movement);
            proj.mesh.position = proj.position;
            proj.distanceTraveled += movement.length();

            // Check if exceeded max distance
            if (proj.distanceTraveled >= proj.maxDistance) {
                proj.isActive = false;
                continue;
            }

            // Check collision with enemies
            this.checkProjectileCollision(proj);
        }
    }

    checkProjectileCollision(projectile) {
        let hitCount = 0;

        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;

            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);

            // More generous hitbox: 2.5x enemy size for better hit detection
            const hitRadius = enemy.size * 2.5;

            if (distance < hitRadius) {
                // Hit!
                console.log('[WeaponSystem] Hit enemy! Distance:', distance, 'Hitbox radius:', hitRadius);
                enemy.takeDamage(projectile.damage);
                hitCount++;

                // Create hit particle effect
                if (this.game.particleSystem) {
                    this.game.particleSystem.createHitEffect(projectile.position, projectile.color);
                }

                // Show damage number
                if (this.game.damageNumberSystem) {
                    this.game.damageNumberSystem.showDamageNumber(projectile.damage, enemy.position);
                }

                // Check if enemy died
                if (enemy.isDead) {
                    this.onEnemyKilled(enemy);
                }

                // Handle special projectile types
                if (projectile.explosive) {
                    // Create explosion at impact
                    this.createExplosion(projectile.position, projectile.explosionRadius, projectile.damage * 0.5);
                    projectile.isActive = false;
                    break;
                }

                if (!projectile.piercing) {
                    // Normal projectile stops after first hit
                    projectile.isActive = false;
                    break;
                } else {
                    // Piercing projectile continues, but reduce damage slightly
                    projectile.damage *= 0.9;
                }
            }
        }
    }

    createExplosion(position, radius, damage) {
        console.log('[WeaponSystem] Explosion at', position, 'radius:', radius);

        // Create explosion particle effect
        if (this.game.particleSystem) {
            this.game.particleSystem.createExplosion(position, radius);
        }

        // Visual explosion flash (quick sphere)
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

                // Show damage number for explosion
                if (this.game.damageNumberSystem && actualDamage > 0) {
                    this.game.damageNumberSystem.showDamageNumber(actualDamage, enemy.position);
                }

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
    }

    spawnXPOrb(position, xpValue) {
        const orb = BABYLON.MeshBuilder.CreateSphere(
            'xpOrb',
            { diameter: 0.5, segments: 8 },
            this.game.scene
        );
        orb.position = position.clone();
        orb.position.y = 0.5;

        const material = new BABYLON.StandardMaterial('xpOrbMat', this.game.scene);
        material.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
        material.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.1);
        orb.material = material;

        const orbData = {
            mesh: orb,
            position: position.clone(),
            xpValue: xpValue,
            isActive: true
        };

        this.game.xpOrbs.push(orbData);
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
            if (proj.trail) {
                proj.trail.dispose();
            }
        }
        this.game.projectiles = [];
    }
}
