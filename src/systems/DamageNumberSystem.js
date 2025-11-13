// Damage Number System - Shows floating damage numbers in 3D space
export class DamageNumberSystem {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.damageNumbers = [];

        // Create a GUI manager for 3D text
        this.advancedTexture = null;
        this.initGUI();

        console.log('[DamageNumberSystem] Initialized');
    }

    initGUI() {
        // Create a full screen UI for displaying damage numbers
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            'DamageNumberUI',
            true,
            this.scene
        );
    }

    /**
     * Show a damage number at a 3D position
     * @param {number} damage - Damage amount
     * @param {BABYLON.Vector3} position - 3D position
     * @param {boolean} isCritical - Whether this is a critical hit
     */
    showDamageNumber(damage, position, isCritical = false) {
        if (!this.advancedTexture) return;

        // Create text block
        const text = new BABYLON.GUI.TextBlock();
        text.text = Math.floor(damage).toString();
        text.color = isCritical ? '#ffff00' : '#ffffff';
        text.fontSize = isCritical ? 32 : 24;
        text.fontWeight = 'bold';
        text.outlineWidth = 3;
        text.outlineColor = 'black';

        // Add to UI
        this.advancedTexture.addControl(text);

        // Track this damage number
        const damageNum = {
            textBlock: text,
            worldPosition: position.clone().add(new BABYLON.Vector3(0, 1, 0)), // Start above target
            velocity: new BABYLON.Vector3(
                (Math.random() - 0.5) * 2, // Random X drift
                3, // Rise up
                0
            ),
            lifetime: 0,
            maxLifetime: 1.5, // Seconds
            alpha: 1
        };

        this.damageNumbers.push(damageNum);
    }

    update(deltaTime) {
        const camera = this.game.camera;
        if (!camera) return;

        // Update each damage number
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dmg = this.damageNumbers[i];

            // Update lifetime
            dmg.lifetime += deltaTime;

            if (dmg.lifetime >= dmg.maxLifetime) {
                // Remove expired damage number
                this.advancedTexture.removeControl(dmg.textBlock);
                this.damageNumbers.splice(i, 1);
                continue;
            }

            // Update world position (float upward)
            dmg.worldPosition.addInPlace(dmg.velocity.scale(deltaTime));

            // Decelerate upward velocity
            dmg.velocity.y *= 0.95;
            dmg.velocity.x *= 0.98;

            // Fade out
            const lifetimePercent = dmg.lifetime / dmg.maxLifetime;
            dmg.alpha = 1 - lifetimePercent;
            dmg.textBlock.alpha = dmg.alpha;

            // Slightly scale up and down
            const scale = 1 + Math.sin(lifetimePercent * Math.PI) * 0.2;
            dmg.textBlock.scaleX = scale;
            dmg.textBlock.scaleY = scale;

            // Convert 3D world position to 2D screen position
            const screenPos = BABYLON.Vector3.Project(
                dmg.worldPosition,
                BABYLON.Matrix.Identity(),
                this.scene.getTransformMatrix(),
                camera.viewport.toGlobal(
                    this.scene.getEngine().getRenderWidth(),
                    this.scene.getEngine().getRenderHeight()
                )
            );

            // Update text block position
            dmg.textBlock.left = screenPos.x - this.scene.getEngine().getRenderWidth() / 2;
            dmg.textBlock.top = screenPos.y - this.scene.getEngine().getRenderHeight() / 2;
        }
    }

    dispose() {
        // Clean up all damage numbers
        for (const dmg of this.damageNumbers) {
            if (dmg.textBlock) {
                this.advancedTexture.removeControl(dmg.textBlock);
            }
        }
        this.damageNumbers = [];

        if (this.advancedTexture) {
            this.advancedTexture.dispose();
        }

        console.log('[DamageNumberSystem] Disposed');
    }
}
