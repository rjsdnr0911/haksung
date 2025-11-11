import { Config } from '../core/Config.js';
import { Enemy } from '../entities/Enemy.js';

export class SpawnSystem {
    constructor(game) {
        this.game = game;
        this.lastSpawnTime = 0;
        this.spawnInterval = Config.enemies.spawnInterval;
        this.maxEnemies = Config.enemies.maxCount;
        this.spawnDistance = Config.map.size / 2 - 5; // Spawn at edge of map
    }

    update() {
        const now = Date.now();

        // Check if we should spawn
        if (now - this.lastSpawnTime >= this.spawnInterval) {
            if (this.game.enemies.length < this.maxEnemies) {
                this.spawnEnemy();
                this.lastSpawnTime = now;
            }
        }
    }

    spawnEnemy() {
        if (!this.game.player) return;

        // Choose random enemy type
        const types = Object.keys(Config.enemies.types);
        const weights = [0.7, 0.2, 0.1]; // normal, fast, tank
        const randomType = this.weightedRandomChoice(types, weights);

        // Spawn at random position around the player
        const angle = Math.random() * Math.PI * 2;
        const distance = this.spawnDistance;

        const spawnPos = new BABYLON.Vector3(
            this.game.player.position.x + Math.cos(angle) * distance,
            0,
            this.game.player.position.z + Math.sin(angle) * distance
        );

        // Clamp to map bounds
        const halfMapSize = Config.map.size / 2 - 2;
        spawnPos.x = Math.max(-halfMapSize, Math.min(halfMapSize, spawnPos.x));
        spawnPos.z = Math.max(-halfMapSize, Math.min(halfMapSize, spawnPos.z));

        // Create enemy
        const enemy = new Enemy(this.game.scene, spawnPos, randomType);
        enemy.setTarget(this.game.player);

        this.game.enemies.push(enemy);

        console.log(`[SpawnSystem] Spawned ${randomType} enemy at`, spawnPos, `(${this.game.enemies.length}/${this.maxEnemies})`);
    }

    weightedRandomChoice(items, weights) {
        const total = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * total;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        return items[0];
    }

    increaseSpawnRate(factor = 0.9) {
        this.spawnInterval = Math.max(500, this.spawnInterval * factor);
        console.log('[SpawnSystem] Spawn interval:', this.spawnInterval);
    }

    dispose() {
        // Cleanup if needed
    }
}
