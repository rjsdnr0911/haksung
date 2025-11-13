/**
 * MetaProgressionSystem - Manages meta-progression
 * Slot expansion, toggler, and currency system (simplified)
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

        console.log('[MetaProgression] New run started');
    }

    // ========== Slot Expansion ==========

    /**
     * Get current weapon slot count
     */
    getWeaponSlots() {
        return this.data.slots.weaponSlots;
    }

    /**
     * Get current tome slot count (level up choices)
     */
    getTomeSlots() {
        return this.data.slots.tomeSlots;
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

    /**
     * Purchase additional tome slot (level up choice)
     */
    purchaseTomeSlot(cost) {
        if (this.data.slots.tomeSlots >= 6) {
            console.warn('[MetaProgression] Maximum tome slots reached (6)');
            return false;
        }

        if (this.spendSilver(cost)) {
            this.data.slots.tomeSlots++;
            this.save();
            console.log(`[MetaProgression] Tome slots increased to ${this.data.slots.tomeSlots}`);
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

    // ========== Character Management ==========

    /**
     * Get selected character ID
     */
    getSelectedCharacter() {
        return this.data.selectedCharacter;
    }

    /**
     * Set selected character
     */
    selectCharacter(characterId) {
        this.data.selectedCharacter = characterId;
        this.save();
        console.log(`[MetaProgression] Selected character: ${characterId}`);
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

    resetProgress() {
        this.saveSystem.clearSave();
        this.data = this.saveSystem.load();
        console.log('[MetaProgression] Debug: Progress reset');
    }
}
