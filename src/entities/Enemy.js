import { Config } from '../core/Config.js';

export class Enemy {
    constructor(scene, position, type = 'normal') {
        this.scene = scene;
        this.position = position.clone();
        this.type = type;
        this.isDead = false;
        this.isMarkedForRemoval = false;

        // Get stats from config
        const stats = Config.enemies.types[type];
        this.maxHealth = stats.health;
        this.health = this.maxHealth;
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.size = stats.size;
        this.color = stats.color;
        this.xpValue = stats.xpValue;

        // Target (player)
        this.target = null;

        // Movement tracking for predictive aiming
        this.velocity = BABYLON.Vector3.Zero();

        this.createMesh();
    }

    createMesh() {
        // Main body
        this.mesh = BABYLON.MeshBuilder.CreateBox(
            'enemy_' + this.type,
            { size: this.size * 2, height: this.size * 2 },
            this.scene
        );
        this.mesh.position = this.position.clone();
        this.mesh.position.y = this.size;

        // Material
        const material = new BABYLON.StandardMaterial('enemyMat_' + this.type, this.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString(this.color);
        material.emissiveColor = BABYLON.Color3.FromHexString(this.color).scale(0.3);
        this.mesh.material = material;

        // Hitbox (invisible, for precise collision)
        this.hitbox = BABYLON.MeshBuilder.CreateBox(
            'hitbox',
            {
                width: this.size * 2.2,
                height: this.size * 2.2,
                depth: this.size * 2.2
            },
            this.scene
        );
        this.hitbox.parent = this.mesh;
        this.hitbox.position.y = 0;
        this.hitbox.isVisible = false;
        this.hitbox.isPickable = true;

        // Store reference back to enemy
        this.hitbox.enemyRef = this;
        this.mesh.enemyRef = this;

        this.mesh.checkCollisions = false;
    }

    update(deltaTime) {
        if (this.isDead) return;

        // Move towards target
        if (this.target) {
            const direction = this.target.position.subtract(this.position);
            const distance = direction.length();

            if (distance > 0.1) {
                direction.normalize();

                // Calculate movement
                const movement = direction.scale(this.speed * deltaTime);

                // Update velocity for predictive aiming
                this.velocity = direction.scale(this.speed);

                // Move towards player
                this.position = this.position.add(movement);

                // Update mesh position
                this.mesh.position.x = this.position.x;
                this.mesh.position.z = this.position.z;

                // Rotate to face player
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
            } else {
                // Not moving, zero velocity
                this.velocity = BABYLON.Vector3.Zero();
            }

            // Check if touching player (simple distance check)
            if (distance < this.size + Config.player.radius) {
                this.attackPlayer();
            }
        }

        // Slight bobbing animation
        const bobAmount = 0.1;
        const bobSpeed = 3;
        this.mesh.position.y = this.size + Math.sin(Date.now() / 1000 * bobSpeed) * bobAmount;
    }

    attackPlayer() {
        if (!this.target || this.isDead) return;

        // Deal damage to player
        this.target.takeDamage(this.damage);

        // Push back slightly (simple knockback)
        const direction = this.position.subtract(this.target.position);
        if (direction.length() > 0) {
            direction.normalize();
            this.position = this.position.add(direction.scale(0.5));
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;

        // Flash effect
        this.flashDamage();

        if (this.health <= 0) {
            this.die();
        }
    }

    flashDamage() {
        // Briefly change color to white
        const originalColor = BABYLON.Color3.FromHexString(this.color);
        const material = this.mesh.material;

        material.emissiveColor = BABYLON.Color3.White();

        setTimeout(() => {
            material.emissiveColor = originalColor.scale(0.3);
        }, 100);
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        console.log(`[Enemy] ${this.type} died at`, this.position);

        // Trigger death animation (simple scale down)
        const animation = new BABYLON.Animation(
            'deathAnim',
            'scaling',
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [
            { frame: 0, value: this.mesh.scaling.clone() },
            { frame: 10, value: new BABYLON.Vector3(0.1, 0.1, 0.1) }
        ];

        animation.setKeys(keys);
        this.mesh.animations = [animation];

        this.scene.beginAnimation(this.mesh, 0, 10, false, 2, () => {
            this.isMarkedForRemoval = true;
        });

        // Return XP value for spawning XP orb
        return this.xpValue;
    }

    setTarget(target) {
        this.target = target;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        if (this.hitbox) {
            this.hitbox.dispose();
        }
    }
}
