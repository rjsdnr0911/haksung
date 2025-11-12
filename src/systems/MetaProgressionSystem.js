/**
 * MetaProgressionSystem - Manages meta-progression
 * Currency, unlocks, shop, and build control tools
 */

import { SaveSystem } from './SaveSystem.js';

export class MetaProgressionSystem {
    constructor() {
        this.saveSystem = new SaveSystem();
        this.data = this.saveSystem.load();

        // Current run tracking
        this.currentRunData = {
            silverEarned: 0,
            kills: 0,
            survivalTime: 0,
            startTime: Date.now()
        };

        console.log('[MetaProgression] Initialized with data:', this.data);
    }

    // ========== Currency ==========

    /**
     * Add silver to player's total
     */
    addSilver(amount) {
        this.data.silver += amount;
        this.currentRunData.silverEarned += amount;
        console.log(`[MetaProgression] +${amount} silver (Total: ${this.data.silver})`);
    }

    /**
     * Spend silver (returns true if successful)
     */
    spendSilver(amount) {
        if (this.data.silver >= amount) {
            this.data.silver -= amount;
            console.log(`[MetaProgression] -${amount} silver (Remaining: ${this.data.silver})`);
            return true;
        }
        console.warn(`[MetaProgression] Not enough silver (Need: ${amount}, Have: ${this.data.silver})`);
        return false;
    }

    getSilver() {
        return this.data.silver;
    }

    // ========== Run Tracking ==========

    /**
     * Record a kill (for statistics)
     */
    recordKill() {
        this.currentRunData.kills++;
        this.data.stats.totalKills++;
    }

    /**
     * End current run and update statistics
     */
    endRun(playerLevel) {
        const survivalTime = Math.floor((Date.now() - this.currentRunData.startTime) / 1000);
        this.currentRunData.survivalTime = survivalTime;

        // Update stats
        this.data.stats.totalRuns++;
        this.data.stats.totalPlayTime += survivalTime;

        if (survivalTime > this.data.stats.bestSurvivalTime) {
            this.data.stats.bestSurvivalTime = survivalTime;
        }

        if (playerLevel > this.data.stats.highestLevel) {
            this.data.stats.highestLevel = playerLevel;
        }

        // Save progress
        this.save();

        console.log('[MetaProgression] Run ended:', this.currentRunData);

        return {
            ...this.currentRunData,
            survivalTime
        };
    }

    /**
     * Start new run
     */
    startNewRun() {
        this.currentRunData = {
            silverEarned: 0,
            kills: 0,
            survivalTime: 0,
            startTime: Date.now()
        };

        // Reset banished tomes for new run
        this.data.currentRun.banishedTomes = [];

        console.log('[MetaProgression] New run started');
    }

    // ========== Unlocks ==========

    /**
     * Check if weapon is unlocked
     */
    isWeaponUnlocked(weaponId) {
        return this.data.unlocks.weapons.includes(weaponId);
    }

    /**
     * Unlock a weapon
     */
    unlockWeapon(weaponId, cost) {
        if (this.isWeaponUnlocked(weaponId)) {
            console.warn(`[MetaProgression] Weapon ${weaponId} already unlocked`);
            return false;
        }

        if (this.spendSilver(cost)) {
            this.data.unlocks.weapons.push(weaponId);
            this.save();
            console.log(`[MetaProgression] Unlocked weapon: ${weaponId}`);
            return true;
        }

        return false;
    }

    /**
     * Check if tome is unlocked
     */
    isTomeUnlocked(tomeId) {
        return this.data.unlocks.tomes.includes(tomeId);
    }

    /**
     * Unlock a tome
     */
    unlockTome(tomeId, cost) {
        if (this.isTomeUnlocked(tomeId)) {
            console.warn(`[MetaProgression] Tome ${tomeId} already unlocked`);
            return false;
        }

        if (this.spendSilver(cost)) {
            this.data.unlocks.tomes.push(tomeId);
            this.save();
            console.log(`[MetaProgression] Unlocked tome: ${tomeId}`);
            return true;
        }

        return false;
    }

    /**
     * Get list of unlocked weapons
     */
    getUnlockedWeapons() {
        return this.data.unlocks.weapons;
    }

    /**
     * Get list of unlocked tomes
     */
    getUnlockedTomes() {
        return this.data.unlocks.tomes;
    }

    // ========== Build Control Tools ==========

    /**
     * Check if tool is unlocked
     */
    isToolUnlocked(toolName) {
        return this.data.unlocks.tools[toolName] === true;
    }

    /**
     * Unlock a build control tool
     */
    unlockTool(toolName, cost) {
        if (this.isToolUnlocked(toolName)) {
            console.warn(`[MetaProgression] Tool ${toolName} already unlocked`);
            return false;
        }

        if (this.spendSilver(cost)) {
            this.data.unlocks.tools[toolName] = true;
            this.save();
            console.log(`[MetaProgression] Unlocked tool: ${toolName}`);
            return true;
        }

        return false;
    }

    // ========== Slot Expansion ==========

    /**
     * Get current weapon slot count
     */
    getWeaponSlots() {
        return this.data.slots.weaponSlots;
    }

    /**
     * Purchase additional weapon slot
     */
    purchaseWeaponSlot(cost) {
        if (this.data.slots.weaponSlots >= 6) {
            console.warn('[MetaProgression] Maximum weapon slots reached (6)');
            return false;
        }

        if (this.spendSilver(cost)) {
            this.data.slots.weaponSlots++;
            this.save();
            console.log(`[MetaProgression] Weapon slots increased to ${this.data.slots.weaponSlots}`);
            return true;
        }

        return false;
    }

    // ========== Toggler System ==========

    /**
     * Check if weapon is disabled by toggler
     */
    isWeaponDisabled(weaponId) {
        return this.data.toggler.disabledWeapons.includes(weaponId);
    }

    /**
     * Toggle weapon on/off
     */
    toggleWeapon(weaponId) {
        const index = this.data.toggler.disabledWeapons.indexOf(weaponId);

        if (index >= 0) {
            // Re-enable
            this.data.toggler.disabledWeapons.splice(index, 1);
            console.log(`[MetaProgression] Enabled weapon: ${weaponId}`);
        } else {
            // Disable
            this.data.toggler.disabledWeapons.push(weaponId);
            console.log(`[MetaProgression] Disabled weapon: ${weaponId}`);
        }

        this.save();
    }

    /**
     * Check if tome is disabled by toggler
     */
    isTomeDisabled(tomeId) {
        return this.data.toggler.disabledTomes.includes(tomeId);
    }

    /**
     * Toggle tome on/off
     */
    toggleTome(tomeId) {
        const index = this.data.toggler.disabledTomes.indexOf(tomeId);

        if (index >= 0) {
            // Re-enable
            this.data.toggler.disabledTomes.splice(index, 1);
            console.log(`[MetaProgression] Enabled tome: ${tomeId}`);
        } else {
            // Disable
            this.data.toggler.disabledTomes.push(tomeId);
            console.log(`[MetaProgression] Disabled tome: ${tomeId}`);
        }

        this.save();
    }

    // ========== Banish System (Per-Run) ==========

    /**
     * Check if tome is banished in current run
     */
    isTomeBanished(tomeId) {
        return this.data.currentRun.banishedTomes.includes(tomeId);
    }

    /**
     * Banish tome for current run only
     */
    banishTome(tomeId) {
        if (!this.isTomeBanished(tomeId)) {
            this.data.currentRun.banishedTomes.push(tomeId);
            console.log(`[MetaProgression] Banished tome for this run: ${tomeId}`);
        }
    }

    /**
     * Get list of banished tomes for current run
     */
    getBanishedTomes() {
        return this.data.currentRun.banishedTomes;
    }

    // ========== Filtering ==========

    /**
     * Filter tomes based on unlocks, toggler, and banish
     */
    getAvailableTomes(allTomes) {
        return allTomes.filter(tome => {
            // Must be unlocked
            if (!this.isTomeUnlocked(tome.id)) return false;

            // Must not be disabled by toggler
            if (this.isTomeDisabled(tome.id)) return false;

            // Must not be banished in current run
            if (this.isTomeBanished(tome.id)) return false;

            return true;
        });
    }

    /**
     * Filter weapons based on unlocks and toggler
     */
    getAvailableWeapons(allWeapons) {
        return allWeapons.filter(weapon => {
            // Must be unlocked
            if (!this.isWeaponUnlocked(weapon.id)) return false;

            // Must not be disabled by toggler
            if (this.isWeaponDisabled(weapon.id)) return false;

            return true;
        });
    }

    // ========== Save/Load ==========

    save() {
        return this.saveSystem.save(this.data);
    }

    load() {
        this.data = this.saveSystem.load();
        return this.data;
    }

    // ========== Debug ==========

    addDebugSilver(amount = 1000) {
        this.addSilver(amount);
        this.save();
        console.log(`[MetaProgression] Debug: Added ${amount} silver`);
    }

    unlockAll() {
        // Unlock all weapons
        this.data.unlocks.weapons = ['pistol', 'shotgun', 'smg', 'laser', 'rocket'];

        // Unlock all tomes (you'll need to add all tome IDs here)
        this.data.unlocks.tomes = [
            'damage_boost', 'fire_rate_boost', 'range_boost', 'projectile_speed',
            'max_health_boost', 'heal', 'speed_boost', 'xp_magnet', 'xp_boost',
            'multi_shot', 'unlock_shotgun', 'unlock_smg', 'unlock_laser', 'unlock_rocket'
        ];

        // Unlock all tools
        this.data.unlocks.tools = {
            reroll: true,
            skip: true,
            banish: true,
            toggler: true
        };

        // Max weapon slots
        this.data.slots.weaponSlots = 6;

        this.save();
        console.log('[MetaProgression] Debug: Unlocked everything');
    }
}
