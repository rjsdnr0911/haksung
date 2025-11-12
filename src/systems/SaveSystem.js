/**
 * SaveSystem - Manages LocalStorage for meta-progression
 * Handles save/load of player progress, unlocks, and settings
 */

export class SaveSystem {
    constructor() {
        this.SAVE_KEY = 'megabonk_save';
        this.defaultData = this.getDefaultSaveData();
    }

    getDefaultSaveData() {
        return {
            // Currency
            silver: 0,

            // Statistics
            stats: {
                totalKills: 0,
                totalRuns: 0,
                totalPlayTime: 0, // seconds
                bestSurvivalTime: 0, // seconds
                highestLevel: 1
            },

            // Unlocked content
            unlocks: {
                // Weapons (pistol is default)
                weapons: ['pistol'],
                // Tomes (basic tomes are default)
                tomes: [
                    'damage_boost',
                    'fire_rate_boost',
                    'range_boost',
                    'max_health_boost',
                    'heal'
                ],
                // Build control tools
                tools: {
                    reroll: false,      // Can reroll level up choices
                    skip: false,        // Can skip level ups
                    banish: false,      // Can banish tomes from run
                    toggler: false      // Can toggle content on/off permanently
                }
            },

            // Slot expansions
            slots: {
                weaponSlots: 2,  // Start with 2 weapon slots
                tomeSlots: 1     // Tomes don't have slots, but track unlocks
            },

            // Toggler settings (disabled content)
            toggler: {
                disabledWeapons: [],
                disabledTomes: []
            },

            // Current run state (for banish)
            currentRun: {
                banishedTomes: []
            }
        };
    }

    /**
     * Load save data from LocalStorage
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.SAVE_KEY);
            if (!savedData) {
                console.log('[SaveSystem] No save data found, using defaults');
                return this.defaultData;
            }

            const data = JSON.parse(savedData);

            // Merge with defaults to handle version updates
            const mergedData = this.mergeWithDefaults(data);

            console.log('[SaveSystem] Loaded save data:', mergedData);
            return mergedData;
        } catch (error) {
            console.error('[SaveSystem] Error loading save data:', error);
            return this.defaultData;
        }
    }

    /**
     * Save data to LocalStorage
     */
    save(data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, jsonData);
            console.log('[SaveSystem] Save data saved successfully');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Error saving data:', error);
            return false;
        }
    }

    /**
     * Merge saved data with defaults (for version compatibility)
     */
    mergeWithDefaults(savedData) {
        const defaultData = this.getDefaultSaveData();

        return {
            silver: savedData.silver || 0,

            stats: {
                ...defaultData.stats,
                ...savedData.stats
            },

            unlocks: {
                weapons: savedData.unlocks?.weapons || defaultData.unlocks.weapons,
                tomes: savedData.unlocks?.tomes || defaultData.unlocks.tomes,
                tools: {
                    ...defaultData.unlocks.tools,
                    ...savedData.unlocks?.tools
                }
            },

            slots: {
                ...defaultData.slots,
                ...savedData.slots
            },

            toggler: {
                disabledWeapons: savedData.toggler?.disabledWeapons || [],
                disabledTomes: savedData.toggler?.disabledTomes || []
            },

            currentRun: {
                banishedTomes: []  // Always reset banished tomes
            }
        };
    }

    /**
     * Clear all save data (for testing or reset)
     */
    clearSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
            console.log('[SaveSystem] Save data cleared');
            return true;
        } catch (error) {
            console.error('[SaveSystem] Error clearing save data:', error);
            return false;
        }
    }

    /**
     * Export save data as JSON string (for backup)
     */
    exportSave() {
        const data = this.load();
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import save data from JSON string
     */
    importSave(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            return this.save(data);
        } catch (error) {
            console.error('[SaveSystem] Error importing save data:', error);
            return false;
        }
    }
}
