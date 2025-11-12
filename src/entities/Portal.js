import { Config } from '../core/Config.js';

/**
 * Portal entity - Gateway to next biome
 */
export class Portal {
    constructor(scene, position, targetBiome) {
        this.scene = scene;
        this.position = position;
        this.targetBiome = targetBiome;
        this.activated = false;

        this.createMesh();
    }

    createMesh() {
        // Create portal ring (torus)
        const ring = BABYLON.MeshBuilder.CreateTorus(
            'portal_ring',
            {
                diameter: Config.portal.radius * 2,
                thickness: 0.3,
                tessellation: 32
            },
            this.scene
        );
        ring.position = this.position.clone();
        ring.position.y += Config.portal.height / 2;
        ring.rotation.x = Math.PI / 2; // Make it vertical

        // Portal ring material (glowing cyan)
        const ringMat = new BABYLON.StandardMaterial('portalRingMat', this.scene);
        ringMat.emissiveColor = BABYLON.Color3.FromHexString(Config.portal.color);
        ringMat.diffuseColor = BABYLON.Color3.FromHexString(Config.portal.color);
        ring.material = ringMat;

        // Create portal inner surface (disc)
        const disc = BABYLON.MeshBuilder.CreateDisc(
            'portal_disc',
            {
                radius: Config.portal.radius * 0.9,
                tessellation: 32
            },
            this.scene
        );
        disc.position = this.position.clone();
        disc.position.y += Config.portal.height / 2;
        disc.rotation.x = Math.PI / 2;

        // Portal disc material (transparent swirling effect)
        const discMat = new BABYLON.StandardMaterial('portalDiscMat', this.scene);
        discMat.emissiveColor = BABYLON.Color3.FromHexString(Config.portal.color);
        discMat.alpha = 0.5;
        discMat.backFaceCulling = false; // Visible from both sides
        disc.material = discMat;

        // Create base cylinder
        const base = BABYLON.MeshBuilder.CreateCylinder(
            'portal_base',
            {
                diameter: Config.portal.radius * 2.5,
                height: 0.5,
                tessellation: 16
            },
            this.scene
        );
        base.position = this.position.clone();
        base.position.y += 0.25;

        const baseMat = new BABYLON.StandardMaterial('portalBaseMat', this.scene);
        baseMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        baseMat.emissiveColor = BABYLON.Color3.FromHexString(Config.portal.color).scale(0.2);
        base.material = baseMat;

        // Store meshes
        this.ring = ring;
        this.disc = disc;
        this.base = base;

        // Create interaction zone (invisible trigger)
        const trigger = BABYLON.MeshBuilder.CreateCylinder(
            'portal_trigger',
            {
                diameter: Config.portal.interactionRange * 2,
                height: Config.portal.height
            },
            this.scene
        );
        trigger.position = this.position.clone();
        trigger.position.y += Config.portal.height / 2;
        trigger.isVisible = false;
        trigger.checkCollisions = false;
        this.trigger = trigger;

        console.log(`[Portal] Created at (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}) -> ${this.targetBiome}`);
    }

    update(deltaTime) {
        if (!this.ring || !this.disc) return;

        // Rotate portal ring
        this.ring.rotation.z += Config.portal.rotationSpeed;

        // Pulse disc alpha
        const pulseSpeed = 2;
        const alpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.001 * pulseSpeed);
        this.disc.material.alpha = alpha;
    }

    checkPlayerInRange(playerPosition) {
        if (!this.trigger) return false;

        // Check distance to portal
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        return distance < Config.portal.interactionRange;
    }

    activate() {
        if (this.activated) return;
        this.activated = true;

        // Visual feedback - flash effect
        if (this.ring && this.ring.material) {
            this.ring.material.emissiveColor = BABYLON.Color3.White();
            setTimeout(() => {
                if (this.ring && this.ring.material) {
                    this.ring.material.emissiveColor = BABYLON.Color3.FromHexString(Config.portal.color);
                }
            }, 200);
        }

        console.log(`[Portal] Activated! Transitioning to ${this.targetBiome}`);
    }

    dispose() {
        if (this.ring) this.ring.dispose();
        if (this.disc) this.disc.dispose();
        if (this.base) this.base.dispose();
        if (this.trigger) this.trigger.dispose();
        console.log('[Portal] Disposed');
    }
}
