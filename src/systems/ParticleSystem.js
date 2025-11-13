// Particle Effect System
export class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.particleSystems = [];

        console.log('[ParticleSystem] Initialized');
    }

    /**
     * Create muzzle flash effect when weapon fires
     * @param {BABYLON.Vector3} position - Position to spawn particles
     * @param {BABYLON.Vector3} direction - Direction of the shot
     * @param {string} color - Weapon color
     */
    createMuzzleFlash(position, direction, color = '#ffff00') {
        const particleSystem = new BABYLON.ParticleSystem(
            'muzzleFlash',
            50,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission
        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        // Direction - emit in the shooting direction (cone)
        particleSystem.direction1 = direction.clone().scale(0.5);
        particleSystem.direction2 = direction.clone().scale(1.5);

        // Size
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.6;

        // Lifetime
        particleSystem.minLifeTime = 0.05;
        particleSystem.maxLifeTime = 0.15;

        // Emission rate
        particleSystem.emitRate = 500;

        // Speed
        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 10;
        particleSystem.updateSpeed = 0.01;

        // Color
        const baseColor = BABYLON.Color3.FromHexString(color);
        particleSystem.color1 = new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 1);
        particleSystem.color2 = new BABYLON.Color4(baseColor.r * 0.8, baseColor.g * 0.8, baseColor.b * 0.8, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0.2, 0.2, 0.2, 0);

        // Blending
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Gravity
        particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 0.1;
        particleSystem.start();

        // Clean up after done
        setTimeout(() => {
            particleSystem.dispose();
        }, 500);
    }

    /**
     * Create hit/impact particles when projectile hits enemy
     * @param {BABYLON.Vector3} position - Impact position
     * @param {string} color - Particle color
     */
    createHitEffect(position, color = '#ff0000') {
        const particleSystem = new BABYLON.ParticleSystem(
            'hitEffect',
            100,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission
        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        // Direction - emit in all directions (sphere)
        particleSystem.createSphereEmitter(1);

        // Size
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;

        // Lifetime
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.4;

        // Emission rate
        particleSystem.emitRate = 300;

        // Speed
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.01;

        // Color - blood red or energy spark
        const baseColor = BABYLON.Color3.FromHexString(color);
        particleSystem.color1 = new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 1);
        particleSystem.color2 = new BABYLON.Color4(baseColor.r * 0.5, baseColor.g * 0.5, baseColor.b * 0.5, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        // Blending
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Gravity
        particleSystem.gravity = new BABYLON.Vector3(0, -10, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 0.1;
        particleSystem.start();

        // Clean up
        setTimeout(() => {
            particleSystem.dispose();
        }, 600);
    }

    /**
     * Create explosion effect for rockets and AOE
     * @param {BABYLON.Vector3} position - Explosion center
     * @param {number} radius - Explosion radius
     */
    createExplosion(position, radius = 3) {
        const particleSystem = new BABYLON.ParticleSystem(
            'explosion',
            500,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission
        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        // Direction - radial explosion
        particleSystem.createSphereEmitter(radius);

        // Size - larger particles for explosion
        particleSystem.minSize = 0.5;
        particleSystem.maxSize = 1.5;

        // Lifetime
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.6;

        // Emission rate
        particleSystem.emitRate = 1000;

        // Speed
        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 15;
        particleSystem.updateSpeed = 0.015;

        // Color - fiery explosion (orange/yellow to black)
        particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1); // Bright yellow
        particleSystem.color2 = new BABYLON.Color4(1, 0.3, 0, 0.8); // Orange
        particleSystem.colorDead = new BABYLON.Color4(0.2, 0.1, 0, 0); // Dark smoke

        // Blending
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Gravity
        particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 0.15;
        particleSystem.start();

        // Also create smoke effect
        this.createSmoke(position, radius);

        // Clean up
        setTimeout(() => {
            particleSystem.dispose();
        }, 1000);
    }

    /**
     * Create smoke particles for explosions
     * @param {BABYLON.Vector3} position
     * @param {number} radius
     */
    createSmoke(position, radius = 3) {
        const particleSystem = new BABYLON.ParticleSystem(
            'smoke',
            200,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission
        particleSystem.emitter = position.clone();
        particleSystem.emitter.y += 0.5; // Slightly elevated
        particleSystem.minEmitBox = new BABYLON.Vector3(-radius * 0.5, 0, -radius * 0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(radius * 0.5, 0, radius * 0.5);

        // Direction - upward
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 2, 0.5);

        // Size - large smoke clouds
        particleSystem.minSize = 1;
        particleSystem.maxSize = 2.5;

        // Lifetime
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.0;

        // Emission rate
        particleSystem.emitRate = 150;

        // Speed
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.02;

        // Color - dark smoke
        particleSystem.color1 = new BABYLON.Color4(0.3, 0.3, 0.3, 0.6);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.2, 0.2, 0.4);
        particleSystem.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);

        // Blending - standard for smoke
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

        // Gravity - smoke rises
        particleSystem.gravity = new BABYLON.Vector3(0, 2, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 0.3;
        particleSystem.start();

        // Clean up
        setTimeout(() => {
            particleSystem.dispose();
        }, 1500);
    }

    /**
     * Create level up effect around the player
     * @param {BABYLON.Vector3} position - Player position
     */
    createLevelUpEffect(position) {
        const particleSystem = new BABYLON.ParticleSystem(
            'levelUp',
            500,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission - cylinder around player
        particleSystem.emitter = position.clone();
        particleSystem.createCylinderEmitter(2, 3, 0, 0); // radius, height

        // Size
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.8;

        // Lifetime
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 1.5;

        // Emission rate
        particleSystem.emitRate = 200;

        // Speed - rise upward
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.02;

        // Direction - upward spiral
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, 2, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 4, 0.5);

        // Color - golden/magical
        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1); // Gold
        particleSystem.color2 = new BABYLON.Color4(1, 0.8, 0.2, 0.8); // Orange-gold
        particleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0); // Fade to white

        // Blending
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Gravity - rise up
        particleSystem.gravity = new BABYLON.Vector3(0, 3, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 1.0;
        particleSystem.start();

        // Clean up
        setTimeout(() => {
            particleSystem.dispose();
        }, 3000);
    }

    /**
     * Create XP orb collection sparkle effect
     * @param {BABYLON.Vector3} position - Orb position
     */
    createXPCollectEffect(position) {
        const particleSystem = new BABYLON.ParticleSystem(
            'xpCollect',
            30,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission
        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        // Direction - small burst
        particleSystem.createSphereEmitter(0.5);

        // Size
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;

        // Lifetime
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.4;

        // Emission rate
        particleSystem.emitRate = 100;

        // Speed
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;

        // Color - cyan/blue (XP color)
        particleSystem.color1 = new BABYLON.Color4(0, 1, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0, 0.5, 1, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);

        // Blending
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Gravity
        particleSystem.gravity = new BABYLON.Vector3(0, 5, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 0.1;
        particleSystem.start();

        // Clean up
        setTimeout(() => {
            particleSystem.dispose();
        }, 500);
    }

    /**
     * Create death explosion when enemy dies
     * @param {BABYLON.Vector3} position
     * @param {string} color - Enemy color
     */
    createDeathEffect(position, color = '#ff0000') {
        const particleSystem = new BABYLON.ParticleSystem(
            'death',
            150,
            this.scene
        );

        // Texture
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://assets.babylonjs.com/particles/flare.png',
            this.scene
        );

        // Emission
        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        // Direction - explode outward
        particleSystem.createSphereEmitter(1.5);

        // Size
        particleSystem.minSize = 0.2;
        particleSystem.maxSize = 0.6;

        // Lifetime
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.7;

        // Emission rate
        particleSystem.emitRate = 400;

        // Speed
        particleSystem.minEmitPower = 3;
        particleSystem.maxEmitPower = 8;
        particleSystem.updateSpeed = 0.015;

        // Color - use enemy color
        const baseColor = BABYLON.Color3.FromHexString(color);
        particleSystem.color1 = new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 1);
        particleSystem.color2 = new BABYLON.Color4(baseColor.r * 0.5, baseColor.g * 0.5, baseColor.b * 0.5, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        // Blending
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Gravity
        particleSystem.gravity = new BABYLON.Vector3(0, -10, 0);

        // Start and auto-stop
        particleSystem.targetStopDuration = 0.15;
        particleSystem.start();

        // Clean up
        setTimeout(() => {
            particleSystem.dispose();
        }, 1000);
    }

    dispose() {
        // Clean up all particle systems
        this.particleSystems.forEach(ps => {
            if (ps && !ps.isDisposed()) {
                ps.dispose();
            }
        });
        this.particleSystems = [];
        console.log('[ParticleSystem] Disposed');
    }
}
