import { Config } from '../core/Config.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.maxSlots = 2; // Megabonk style: start with 2 slots
        this.unlockedSlots = 2; // Can be increased to 4 in shop
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

        if (!Config.weaponUpgrades[weaponType]) {
            console.error('[WeaponSystem] No upgrade config for:', weaponType);
            return false;
        }

        // Initialize upgrade levels for all available stats
        const upgradeConfig = Config.weaponUpgrades[weaponType];
        const upgradeLevels = {};
        for (const statName in upgradeConfig) {
            upgradeLevels[statName] = 0; // Start at level 0
        }

        // Create slot with level system
        const slot = {
            type: weaponType,
            level: 0, // Total weapon level (sum of all upgrades)
            upgradeLevels: upgradeLevels, // Individual stat levels
            weapon: null, // Will be calculated
            currentTarget: null,
            lastFireTime: 0,
            fireInterval: 1000
        };

        // Calculate initial weapon stats
        this.calculateWeaponStats(slot);

        this.weaponSlots.push(slot);
        console.log('[WeaponSystem] Added weapon:', Config.weapons[weaponType].name, '- Slot', this.weaponSlots.length);
        return true;
    }

    // Calculate weapon stats based on upgrade levels (Megabonk style)
    calculateWeaponStats(slot) {
        const weaponType = slot.type;
        const baseWeapon = Config.weapons[weaponType];
        const upgradeConfig = Config.weaponUpgrades[weaponType];

        // Start with a copy of base weapon
        const calculatedWeapon = JSON.parse(JSON.stringify(baseWeapon));

        // Apply each upgrade level
        for (const statName in slot.upgradeLevels) {
            const level = slot.upgradeLevels[statName];
            const upgrade = upgradeConfig[statName];

            if (!upgrade) continue;

            // Calculate stat value: base + (level * perLevel)
            let value = upgrade.base + (level * upgrade.perLevel);

            // Apply max cap
            if (upgrade.max !== undefined) {
                if (upgrade.perLevel < 0) {
                    // For negative growth (e.g., spread reduction), max is minimum
                    value = Math.max(value, upgrade.max);
                } else {
                    value = Math.min(value, upgrade.max);
                }
            }

            // Apply to weapon
            if (statName === 'critChance') {
                calculatedWeapon.critChance = value;
            } else if (statName === 'pelletCount') {
                calculatedWeapon.projectilesPerShot = Math.floor(value);
            } else if (statName === 'pierceCount') {
                calculatedWeapon.pierceCount = Math.floor(value);
            } else {
                // Direct mapping (damage, fireRate, range, spread, explosionRadius, etc.)
                calculatedWeapon[statName] = value;
            }
        }

        // Update fire interval based on fire rate
        slot.fireInterval = 1000 / calculatedWeapon.fireRate;

        slot.weapon = calculatedWeapon;

        console.log(`[WeaponSystem] Calculated stats for ${weaponType} Lv.${slot.level}:`, calculatedWeapon);
    }

    // Upgrade a specific stat of a weapon (Megabonk style)
    upgradeWeaponStat(slotIndex, statName) {
        const slot = this.weaponSlots[slotIndex];
        if (!slot) {
            console.error('[WeaponSystem] Invalid slot index:', slotIndex);
            return false;
        }

        const upgradeConfig = Config.weaponUpgrades[slot.type][statName];
        if (!upgradeConfig) {
            console.error('[WeaponSystem] Invalid stat name:', statName);
            return false;
        }

        // Check if already at max level
        const currentLevel = slot.upgradeLevels[statName];
        const currentValue = upgradeConfig.base + (currentLevel * upgradeConfig.perLevel);
        const nextValue = upgradeConfig.base + ((currentLevel + 1) * upgradeConfig.perLevel);

        // Check max cap
        if (upgradeConfig.max !== undefined) {
            if (upgradeConfig.perLevel < 0) {
                if (currentValue <= upgradeConfig.max) {
                    console.warn('[WeaponSystem] Stat already at max:', statName);
                    return false;
                }
            } else {
                if (currentValue >= upgradeConfig.max) {
                    console.warn('[WeaponSystem] Stat already at max:', statName);
                    return false;
                }
            }
        }

        // Upgrade!
        slot.upgradeLevels[statName]++;
        slot.level++; // Increase total level

        // Recalculate weapon stats
        this.calculateWeaponStats(slot);

        console.log(`[WeaponSystem] Upgraded ${slot.type} ${statName}: Lv.${currentLevel} → Lv.${slot.upgradeLevels[statName]}`);
        return true;
    }

    // Unlock an additional weapon slot (shop feature)
    unlockSlot() {
        if (this.maxSlots >= 4) {
            console.warn('[WeaponSystem] Already at max slots (4)');
            return false;
        }
        this.maxSlots++;
        console.log('[WeaponSystem] Unlocked slot! Now:', this.maxSlots);
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

        // Apply character multipliers to weapon stats
        const damageMult = slot.characterDamageMult || 1.0;
        const sizeMult = slot.characterSizeMult || 1.0;

        // Create modified weapon data with multipliers
        const enhancedWeapon = {
            ...slot.weapon,
            damage: Math.floor(slot.weapon.damage * damageMult), // Apply damage multiplier
            projectileSize: (slot.weapon.projectileSize || 0.3) * sizeMult // Apply size multiplier
        };

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

            // Create projectile with enhanced stats
            this.createProjectile(startPos, projDirection, enhancedWeapon);
        }

        // Create muzzle flash effect
        this.createMuzzleFlash(startPos, slot.weapon.color);
    }

    createProjectile(position, direction, weapon) {
        // Visual projectile (apply size multiplier)
        const diameter = weapon.projectileSize || 0.3;
        const projectile = BABYLON.MeshBuilder.CreateSphere(
            'projectile',
            { diameter: diameter, segments: 8 },
            this.game.scene
        );
        projectile.position = position.clone();

        // Material
        const material = new BABYLON.StandardMaterial('projectileMat', this.game.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString(weapon.color);
        material.emissiveColor = BABYLON.Color3.FromHexString(weapon.color);
        projectile.material = material;

        // Projectile data
        const projectileData = {
            mesh: projectile,
            position: position.clone(),
            direction: direction.clone(),
            speed: weapon.projectileSpeed,
            damage: weapon.damage,
            maxDistance: weapon.range,
            distanceTraveled: 0,
            isActive: true,
            piercing: weapon.piercing || false,
            pierceCount: weapon.pierceCount || (weapon.piercing ? 999 : 0), // Megabonk style pierce count
            piercesRemaining: weapon.pierceCount || (weapon.piercing ? 999 : 0),
            explosive: weapon.explosive || false,
            explosionRadius: weapon.explosionRadius || 0,
            critChance: weapon.critChance || 0, // Crit chance from weapon
            color: weapon.color
        };

        this.game.projectiles.push(projectileData);
    }

    createMuzzleFlash(position, color) {
        const flash = BABYLON.MeshBuilder.CreateSphere(
            'flash',
            { diameter: 0.5, segments: 8 },
            this.game.scene
        );
        flash.position = position.clone();

        const material = new BABYLON.StandardMaterial('flashMat', this.game.scene);
        material.emissiveColor = BABYLON.Color3.FromHexString(color);
        flash.material = material;

        // Fade out and dispose
        setTimeout(() => {
            flash.dispose();
        }, 50);
    }

    updateProjectiles(deltaTime) {
        for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
            const proj = this.game.projectiles[i];

            if (!proj.isActive) {
                proj.mesh.dispose();
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
                // Calculate damage with critical hit chance
                let finalDamage = projectile.damage;
                let isCrit = false;

                if (projectile.critChance && Math.random() < projectile.critChance) {
                    // Critical hit! Double damage
                    finalDamage *= 2;
                    isCrit = true;
                    console.log('[WeaponSystem] CRITICAL HIT! Damage:', finalDamage);
                }

                // Apply damage
                console.log('[WeaponSystem] Hit enemy! Distance:', distance, 'Hitbox radius:', hitRadius, 'Damage:', finalDamage);
                enemy.takeDamage(finalDamage);
                hitCount++;

                // Check if enemy died
                if (enemy.isDead) {
                    this.onEnemyKilled(enemy);
                }

                // Handle explosive projectiles
                if (projectile.explosive) {
                    // Create explosion at impact
                    this.createExplosion(projectile.position, projectile.explosionRadius, projectile.damage * 0.5);
                    projectile.isActive = false;
                    break;
                }

                // Handle piercing projectiles (Megabonk style)
                if (projectile.piercing || projectile.piercesRemaining > 0) {
                    projectile.piercesRemaining--;

                    if (projectile.piercesRemaining <= 0) {
                        // Used all pierces
                        projectile.isActive = false;
                        break;
                    }

                    // Piercing projectile continues, but reduce damage slightly
                    projectile.damage *= 0.9;
                } else {
                    // Normal projectile stops after first hit
                    projectile.isActive = false;
                    break;
                }
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
        }
        this.game.projectiles = [];
    }
}
