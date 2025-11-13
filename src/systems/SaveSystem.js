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

            // Selected character
            selectedCharacter: 'calcium', // Default character

            // Statistics
            stats: {
                totalKills: 0,
                totalRuns: 0,
                totalPlayTime: 0, // seconds
                bestSurvivalTime: 0, // seconds
                highestLevel: 1
            },

            // Slot expansions (only purchasable upgrades)
            slots: {
                weaponSlots: 2,  // Start with 2 weapon slots (max 6)
                tomeSlots: 3     // Start with 3 tome choices (max 6)
            },

            // Toggler settings (disabled content)
            toggler: {
                disabledWeapons: [],  // Disabled weapon IDs
                disabledTomes: []     // Disabled tome IDs
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
            selectedCharacter: savedData.selectedCharacter || defaultData.selectedCharacter,

            stats: {
                ...defaultData.stats,
                ...savedData.stats
            },

            slots: {
                ...defaultData.slots,
                ...savedData.slots
            },

            toggler: {
                disabledWeapons: savedData.toggler?.disabledWeapons || [],
                disabledTomes: savedData.toggler?.disabledTomes || []
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
