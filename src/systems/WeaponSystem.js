import { Config } from '../core/Config.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.currentTarget = null;
        this.lastFireTime = 0;

        // Weapon stats
        this.weaponType = 'pistol';
        this.weapon = Config.weapons[this.weaponType];
        this.fireInterval = 1000 / this.weapon.fireRate; // Convert to ms
    }

    update(deltaTime) {
        if (!this.game.player) return;

        // Find nearest enemy
        this.findTarget();

        // Auto-aim at target
        if (this.currentTarget) {
            this.aimAtTarget(deltaTime);
        }

        // Auto-fire
        this.tryFire();
    }

    findTarget() {
        if (!this.game.player || this.game.enemies.length === 0) {
            this.currentTarget = null;
            return;
        }

        let nearestEnemy = null;
        let nearestDistance = this.weapon.range;

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

        this.currentTarget = nearestEnemy;
    }

    aimAtTarget(deltaTime) {
        if (!this.currentTarget || !this.game.player) return;

        // Calculate direction to target
        const direction = this.currentTarget.position.subtract(this.game.player.position);
        const targetAngle = Math.atan2(direction.x, direction.z);

        // Smoothly rotate player to face target
        const lerpFactor = Math.min(deltaTime * 10, 1);
        this.game.player.rotation = this.lerpAngle(
            this.game.player.rotation,
            targetAngle,
            lerpFactor
        );
    }

    lerpAngle(from, to, t) {
        // Handle angle wrapping
        let diff = to - from;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return from + diff * t;
    }

    tryFire() {
        if (!this.currentTarget || !this.game.player) return;

        const now = Date.now();
        if (now - this.lastFireTime < this.fireInterval) return;

        this.fire();
        this.lastFireTime = now;
    }

    fire() {
        if (!this.game.player || !this.currentTarget) return;

        const startPos = this.game.player.position.clone();
        startPos.y = 1.0; // Fixed height for shooting

        const direction = this.game.player.getForwardDirection();

        console.log('[WeaponSystem] Firing from:', startPos, 'direction:', direction);

        // Fire multiple projectiles if multi-shot is enabled
        const projectileCount = this.weapon.projectilesPerShot || 1;
        const spread = this.weapon.spread || 0;

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
            this.createProjectile(startPos, projDirection);
        }

        // Create muzzle flash effect
        this.createMuzzleFlash(startPos);
    }

    createProjectile(position, direction) {
        // Visual projectile
        const projectile = BABYLON.MeshBuilder.CreateSphere(
            'projectile',
            { diameter: 0.3, segments: 8 },
            this.game.scene
        );
        projectile.position = position.clone();

        // Material
        const material = new BABYLON.StandardMaterial('projectileMat', this.game.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString(this.weapon.color);
        material.emissiveColor = BABYLON.Color3.FromHexString(this.weapon.color);
        projectile.material = material;

        // Projectile data
        const projectileData = {
            mesh: projectile,
            position: position.clone(),
            direction: direction.clone(),
            speed: this.weapon.projectileSpeed,
            damage: this.weapon.damage,
            maxDistance: this.weapon.range,
            distanceTraveled: 0,
            isActive: true
        };

        this.game.projectiles.push(projectileData);
    }

    createMuzzleFlash(position) {
        const flash = BABYLON.MeshBuilder.CreateSphere(
            'flash',
            { diameter: 0.5, segments: 8 },
            this.game.scene
        );
        flash.position = position.clone();

        const material = new BABYLON.StandardMaterial('flashMat', this.game.scene);
        material.emissiveColor = BABYLON.Color3.White();
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
        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;

            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);

            if (distance < enemy.size * 1.5) { // Slightly larger hitbox
                // Hit!
                console.log('[WeaponSystem] Hit enemy! Distance:', distance, 'Enemy size:', enemy.size);
                enemy.takeDamage(projectile.damage);
                projectile.isActive = false;

                // Check if enemy died
                if (enemy.isDead) {
                    this.onEnemyKilled(enemy);
                }

                break;
            }
        }
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
