/**
 * EffectSystem.js - 시각 효과 관리 시스템
 * 파티클, 데미지 숫자, 화면 효과 등을 관리
 */

export class EffectSystem {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;

        // Damage numbers (floating text)
        this.damageNumbers = [];

        // Screen effects
        this.screenShakeIntensity = 0;
        this.screenShakeDuration = 0;

        console.log('[EffectSystem] Initialized');
    }

    // ========== Muzzle Flash Effects ==========

    createMuzzleFlash(position, color, size = 0.3) {
        const flash = BABYLON.MeshBuilder.CreateSphere(
            'flash',
            { diameter: size, segments: 8 },
            this.scene
        );
        flash.position = position.clone();

        const material = new BABYLON.StandardMaterial('flashMat', this.scene);
        material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.5); // 50% 강도로 감소
        material.disableLighting = true;
        flash.material = material;

        // Animate and dispose
        let alpha = 0.8;
        const fadeInterval = setInterval(() => {
            alpha -= 0.2;
            material.alpha = alpha;

            if (alpha <= 0) {
                clearInterval(fadeInterval);
                flash.dispose();
            }
        }, 16); // ~60fps
    }

    // ========== Weapon Trail Effects ==========

    createProjectileTrail(projectile, color) {
        // Create particle system for projectile trail (간소화)
        const particleSystem = new BABYLON.ParticleSystem(
            'projectileTrail',
            20, // 50 -> 20으로 감소
            this.scene
        );

        // Texture (simple white circle)
        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        // Emitter
        particleSystem.emitter = projectile.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

        // Colors (투명도 낮춤)
        const color3 = BABYLON.Color3.FromHexString(color);
        particleSystem.color1 = new BABYLON.Color4(color3.r, color3.g, color3.b, 0.6); // 1 -> 0.6
        particleSystem.color2 = new BABYLON.Color4(color3.r, color3.g, color3.b, 0.3); // 0.5 -> 0.3
        particleSystem.colorDead = new BABYLON.Color4(color3.r, color3.g, color3.b, 0);

        // Size (크기 감소)
        particleSystem.minSize = 0.05; // 0.1 -> 0.05
        particleSystem.maxSize = 0.15; // 0.3 -> 0.15

        // Life time
        particleSystem.minLifeTime = 0.1;
        particleSystem.maxLifeTime = 0.2; // 0.3 -> 0.2

        // Emission rate (감소)
        particleSystem.emitRate = 30; // 100 -> 30

        // Blend mode (NORMAL로 변경해서 덜 밝게)
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Speed
        particleSystem.minEmitPower = 0;
        particleSystem.maxEmitPower = 0;
        particleSystem.updateSpeed = 0.01;

        // Start
        particleSystem.start();

        // Store reference to stop later
        projectile.particleSystem = particleSystem;
    }

    stopProjectileTrail(projectile) {
        if (projectile.particleSystem) {
            projectile.particleSystem.stop();
            setTimeout(() => {
                projectile.particleSystem.dispose();
            }, 500);
        }
    }

    // ========== Explosion Effects ==========

    createExplosionParticles(position, color, radius) {
        // Explosion flash (간소화)
        const flash = BABYLON.MeshBuilder.CreateSphere(
            'explosionFlash',
            { diameter: radius * 2, segments: 12 }, // 3 -> 2, segments 16 -> 12
            this.scene
        );
        flash.position = position.clone();

        const flashMat = new BABYLON.StandardMaterial('explosionFlashMat', this.scene);
        flashMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.2).scale(0.6); // 강도 감소
        flashMat.alpha = 0.5; // 0.8 -> 0.5
        flash.material = flashMat;

        // Animate flash
        let scale = 0.1;
        let alpha = 0.5;
        const flashInterval = setInterval(() => {
            scale += 0.3;
            alpha -= 0.15;
            flash.scaling = new BABYLON.Vector3(scale, scale, scale);
            flashMat.alpha = alpha;

            if (alpha <= 0) {
                clearInterval(flashInterval);
                flash.dispose();
            }
        }, 40); // 30 -> 40으로 느리게

        // Particle system for debris (대폭 감소)
        const particleSystem = new BABYLON.ParticleSystem(
            'explosion',
            60, // 200 -> 60으로 감소
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);

        // Colors - orange to red to black (투명도 감소)
        particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0.2, 0.7); // 1 -> 0.7
        particleSystem.color2 = new BABYLON.Color4(1, 0.3, 0, 0.5); // 0.8 -> 0.5
        particleSystem.colorDead = new BABYLON.Color4(0.2, 0.2, 0.2, 0);

        // Size (크기 감소)
        particleSystem.minSize = 0.2; // 0.3 -> 0.2
        particleSystem.maxSize = 0.5; // 0.8 -> 0.5

        // Life time
        particleSystem.minLifeTime = 0.2; // 0.3 -> 0.2
        particleSystem.maxLifeTime = 0.4; // 0.6 -> 0.4

        // Emission rate (대폭 감소)
        particleSystem.emitRate = 150; // 500 -> 150
        particleSystem.manualEmitCount = 60; // 200 -> 60

        // Blend mode
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE; // ADD -> ONEONE

        // Speed
        particleSystem.minEmitPower = radius * 4;
        particleSystem.maxEmitPower = radius * 8;
        particleSystem.updateSpeed = 0.02;

        // Direction
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);

        // Gravity
        particleSystem.gravity = new BABYLON.Vector3(0, -20, 0);

        // Start and dispose
        particleSystem.start();
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
            }, 800);
        }, 80);
    }

    // ========== Hit Effects ==========

    createHitEffect(position, isCrit = false) {
        const color = isCrit ? new BABYLON.Color3(1, 0.8, 0) : new BABYLON.Color3(1, 0.3, 0.3);
        const size = isCrit ? 0.8 : 0.4;

        // Hit flash
        const flash = BABYLON.MeshBuilder.CreateSphere(
            'hitFlash',
            { diameter: size, segments: 8 },
            this.scene
        );
        flash.position = position.clone();

        const material = new BABYLON.StandardMaterial('hitFlashMat', this.scene);
        material.emissiveColor = color;
        material.alpha = 1.0;
        flash.material = material;

        // Animate
        let alpha = 1.0;
        let scale = 1.0;
        const hitInterval = setInterval(() => {
            alpha -= 0.2;
            scale += 0.4;
            material.alpha = alpha;
            flash.scaling = new BABYLON.Vector3(scale, scale, scale);

            if (alpha <= 0) {
                clearInterval(hitInterval);
                flash.dispose();
            }
        }, 30);

        // Particles for critical hits
        if (isCrit) {
            this.createCriticalParticles(position);
        }
    }

    createCriticalParticles(position) {
        const particleSystem = new BABYLON.ParticleSystem(
            'critical',
            15, // 30 -> 15로 감소
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);

        // Gold color for crits (투명도 감소)
        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 0.7); // 1 -> 0.7
        particleSystem.color2 = new BABYLON.Color4(1, 0.8, 0, 0.5); // 0.8 -> 0.5
        particleSystem.colorDead = new BABYLON.Color4(1, 0.5, 0, 0);

        particleSystem.minSize = 0.15; // 0.2 -> 0.15
        particleSystem.maxSize = 0.3; // 0.4 -> 0.3

        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.4; // 0.5 -> 0.4

        particleSystem.emitRate = 50; // 100 -> 50
        particleSystem.manualEmitCount = 15; // 30 -> 15

        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE; // ADD -> ONEONE

        particleSystem.minEmitPower = 3;
        particleSystem.maxEmitPower = 6;

        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);

        particleSystem.gravity = new BABYLON.Vector3(0, -10, 0);

        particleSystem.start();
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
            }, 1000);
        }, 100);
    }

    // ========== Damage Numbers (Floating Text) ==========

    createDamageNumber(position, damage, isCrit = false, isHeal = false) {
        // Create a plane for the text
        const plane = BABYLON.MeshBuilder.CreatePlane(
            'damageNumber',
            { size: 1 },
            this.scene
        );
        plane.position = position.clone();
        plane.position.y += 2; // Start above the hit point
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        // Create dynamic texture for text
        const texture = new BABYLON.DynamicTexture(
            'damageText',
            512,
            this.scene,
            false
        );

        const material = new BABYLON.StandardMaterial('damageTextMat', this.scene);
        material.diffuseTexture = texture;
        material.emissiveTexture = texture;
        material.opacityTexture = texture;
        material.disableLighting = true;
        plane.material = material;

        // Draw text
        const ctx = texture.getContext();
        const fontSize = isCrit ? 80 : 60;
        const text = Math.floor(damage).toString();

        ctx.clearRect(0, 0, 512, 512);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Color based on type
        if (isHeal) {
            ctx.fillStyle = '#00ff00';
            ctx.strokeStyle = '#004400';
        } else if (isCrit) {
            ctx.fillStyle = '#ffff00';
            ctx.strokeStyle = '#ff8800';
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
        }

        ctx.lineWidth = 6;
        ctx.strokeText(text, 256, 256);
        ctx.fillText(text, 256, 256);

        texture.update();

        // Animate floating upward
        const damageData = {
            mesh: plane,
            startY: plane.position.y,
            time: 0,
            lifetime: 1.0 // 1 second
        };

        this.damageNumbers.push(damageData);
    }

    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dmg = this.damageNumbers[i];
            dmg.time += deltaTime;

            // Float upward
            dmg.mesh.position.y = dmg.startY + dmg.time * 2;

            // Fade out
            const alpha = 1 - (dmg.time / dmg.lifetime);
            dmg.mesh.material.alpha = alpha;

            // Scale animation
            const scale = 1 + Math.sin(dmg.time * 5) * 0.2;
            dmg.mesh.scaling = new BABYLON.Vector3(scale, scale, scale);

            // Remove when expired
            if (dmg.time >= dmg.lifetime) {
                dmg.mesh.dispose();
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    // ========== Level Up Effect ==========

    createLevelUpEffect(position) {
        // Ring expanding outward
        const ring = BABYLON.MeshBuilder.CreateTorus(
            'levelUpRing',
            { diameter: 2, thickness: 0.2, tessellation: 32 },
            this.scene
        );
        ring.position = position.clone();
        ring.position.y = 0.1;

        const ringMat = new BABYLON.StandardMaterial('levelUpRingMat', this.scene);
        ringMat.emissiveColor = new BABYLON.Color3(0, 1, 1).scale(0.6); // 강도 60%로 감소
        ringMat.alpha = 0.8; // 1.0 -> 0.8
        ring.material = ringMat;

        // Animate ring
        let scale = 1;
        let alpha = 0.8; // 1 -> 0.8로 시작
        const ringInterval = setInterval(() => {
            scale += 0.5;
            alpha -= 0.1;
            ring.scaling = new BABYLON.Vector3(scale, 1, scale);
            ringMat.alpha = alpha;

            if (alpha <= 0) {
                clearInterval(ringInterval);
                ring.dispose();
            }
        }, 50);

        // Particle burst (간소화)
        const particleSystem = new BABYLON.ParticleSystem(
            'levelUp',
            40, // 100 -> 40
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);

        particleSystem.color1 = new BABYLON.Color4(0, 1, 1, 0.6); // 1 -> 0.6
        particleSystem.color2 = new BABYLON.Color4(0, 0.5, 1, 0.5); // 0.8 -> 0.5
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.5, 0);

        particleSystem.minSize = 0.2; // 0.3 -> 0.2
        particleSystem.maxSize = 0.4; // 0.6 -> 0.4

        particleSystem.minLifeTime = 0.4; // 0.5 -> 0.4
        particleSystem.maxLifeTime = 0.8; // 1.0 -> 0.8

        particleSystem.emitRate = 80; // 200 -> 80
        particleSystem.manualEmitCount = 40; // 100 -> 40

        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE; // ADD -> ONEONE

        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 10;

        particleSystem.direction1 = new BABYLON.Vector3(-1, 2, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 3, 1);

        particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

        particleSystem.start();
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
            }, 2000);
        }, 200);
    }

    // ========== Update ==========

    update(deltaTime) {
        // Update damage numbers
        this.updateDamageNumbers(deltaTime);

        // Update screen shake
        if (this.screenShakeDuration > 0) {
            this.screenShakeDuration -= deltaTime;
            this.updateScreenShake();
        }
    }

    // ========== Screen Shake ==========

    addScreenShake(intensity, duration) {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
        this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
    }

    updateScreenShake() {
        if (!this.game.camera) return;

        const intensity = this.screenShakeIntensity * (this.screenShakeDuration / 0.3);
        const offsetX = (Math.random() - 0.5) * intensity * 2;
        const offsetY = (Math.random() - 0.5) * intensity * 2;

        // Apply offset to camera (very small values)
        this.game.camera.position.x += offsetX * 0.01;
        this.game.camera.position.y += offsetY * 0.01;
    }

    // ========== XP Orb Effects ==========

    createXPOrbEffect(position) {
        // Small sparkle particles around XP orb
        const particleSystem = new BABYLON.ParticleSystem(
            'xpOrbSparkle',
            8, // Small number
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);

        // Green sparkles
        particleSystem.color1 = new BABYLON.Color4(0.2, 1, 0.2, 0.6);
        particleSystem.color2 = new BABYLON.Color4(0.5, 1, 0.5, 0.3);
        particleSystem.colorDead = new BABYLON.Color4(0, 0.5, 0, 0);

        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.15;

        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.6;

        particleSystem.emitRate = 10; // Continuous low rate
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1.0;

        particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);

        particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);

        particleSystem.start();

        // Store for cleanup
        return particleSystem;
    }

    createXPCollectEffect(position) {
        // Burst when XP is collected
        const particleSystem = new BABYLON.ParticleSystem(
            'xpCollect',
            20,
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);

        // Bright green
        particleSystem.color1 = new BABYLON.Color4(0.5, 1, 0.5, 0.8);
        particleSystem.color2 = new BABYLON.Color4(0.8, 1, 0.3, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0.2, 0.5, 0, 0);

        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.25;

        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.5;

        particleSystem.emitRate = 100;
        particleSystem.manualEmitCount = 20;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 4;

        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);

        particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);

        particleSystem.start();

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
            }, 1000);
        }, 100);
    }

    // ========== Enemy Death Effects ==========

    createEnemyDeathEffect(position, enemySize = 1.0) {
        // Death particles
        const particleSystem = new BABYLON.ParticleSystem(
            'enemyDeath',
            30,
            this.scene
        );

        particleSystem.particleTexture = new BABYLON.Texture(
            'https://playground.babylonjs.com/textures/flare.png',
            this.scene
        );

        particleSystem.emitter = position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, 0, -0.3);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 0.5, 0.3);

        // Dark red/orange death
        particleSystem.color1 = new BABYLON.Color4(0.8, 0.2, 0.1, 0.7);
        particleSystem.color2 = new BABYLON.Color4(0.5, 0.1, 0.0, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0.2, 0.1, 0.0, 0);

        particleSystem.minSize = 0.15 * enemySize;
        particleSystem.maxSize = 0.35 * enemySize;

        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.7;

        particleSystem.emitRate = 100;
        particleSystem.manualEmitCount = 30;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 4;

        particleSystem.direction1 = new BABYLON.Vector3(-1, 0.5, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1.5, 1);

        particleSystem.gravity = new BABYLON.Vector3(0, -8, 0);

        particleSystem.start();

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
            }, 1500);
        }, 100);
    }

    // ========== Cleanup ==========

    dispose() {
        // Clean up all damage numbers
        for (const dmg of this.damageNumbers) {
            dmg.mesh.dispose();
        }
        this.damageNumbers = [];
    }
}
