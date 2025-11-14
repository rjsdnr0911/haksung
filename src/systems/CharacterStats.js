// Character Stats System (Megabonk style)
// Tome upgrades affect these global character stats

export class CharacterStats {
    constructor() {
        // Initialize all stats to base level (0)
        this.stats = {
            // Combat stats
            damage: { level: 0, base: 1.0, perLevel: 0.08 },        // Multiplicative: 1 + (level * 0.08)
            cooldown: { level: 0, base: 1.0, perLevel: 0.10 },      // Attack speed: 1 + (level * 0.10)
            critDamage: { level: 0, base: 1.5, perLevel: 0.10 },    // Crit multiplier: 1.5 + (level * 0.10)

            // Defense stats
            hp: { level: 0, base: 100, perLevel: 20 },              // Max HP: 100 + (level * 20)
            regen: { level: 0, base: 0, perLevel: 2 },              // HP regen per minute: level * 2
            shield: { level: 0, base: 0, perLevel: 10 },            // Shield amount: level * 10
            armor: { level: 0, base: 0, perLevel: 0.05 },           // Damage reduction: level * 0.05 (max 0.5)

            // Movement stats
            agility: { level: 0, base: 1.0, perLevel: 0.15 },       // Move speed multiplier: 1 + (level * 0.15)
            evasion: { level: 0, base: 0, perLevel: 0.03 },         // Dodge chance: level * 0.03 (max 0.5)

            // Utility stats
            size: { level: 0, base: 1.0, perLevel: 0.10 },          // Projectile/attack size: 1 + (level * 0.10)
            knockback: { level: 0, base: 1.0, perLevel: 0.15 },     // Knockback power: 1 + (level * 0.15)
            projectile: { level: 0, base: 1.0, perLevel: 0.15 },    // Projectile speed: 1 + (level * 0.15)
            attraction: { level: 0, base: 1.0, perLevel: 0.30 },    // XP magnet range: 1 + (level * 0.30)
            duration: { level: 0, base: 1.0, perLevel: 0.20 },      // Attack duration: 1 + (level * 0.20)

            // Progression stats
            gold: { level: 0, base: 1.0, perLevel: 0.15 },          // Gold gain: 1 + (level * 0.15)
            silver: { level: 0, base: 1.0, perLevel: 0.15 },        // Silver gain: 1 + (level * 0.15)
            xp: { level: 0, base: 1.0, perLevel: 0.10 },            // XP gain: 1 + (level * 0.10)
            luck: { level: 0, base: 0, perLevel: 0.05 },            // Better upgrade tiers: level * 0.05

            // Special stats (unlockable)
            thorns: { level: 0, base: 0, perLevel: 5 },             // Reflect damage: level * 5
            lifesteal: { level: 0, base: 0, perLevel: 0.03 },       // Heal on hit: level * 0.03 (max 0.3)
            quantity: { level: 0, base: 0, perLevel: 1 },           // Extra projectiles: level * 1
            precision: { level: 0, base: 0, perLevel: 0.05 }        // Crit chance: level * 0.05
        };
    }

    // Upgrade a stat (called when Tome is selected)
    upgrade(statName) {
        if (!this.stats[statName]) {
            console.error('[CharacterStats] Unknown stat:', statName);
            return false;
        }

        this.stats[statName].level++;
        console.log(`[CharacterStats] Upgraded ${statName}: Lv.${this.stats[statName].level}`);
        return true;
    }

    // Get current value of a stat
    getValue(statName) {
        const stat = this.stats[statName];
        if (!stat) return 0;

        // Calculate: base + (level * perLevel)
        return stat.base + (stat.level * stat.perLevel);
    }

    // Get multiplier for multiplicative stats (damage, cooldown, etc.)
    getMultiplier(statName) {
        const value = this.getValue(statName);

        // Multiplicative stats (base 1.0)
        const multiplicativeStats = ['damage', 'cooldown', 'agility', 'size', 'knockback', 'projectile', 'attraction', 'duration', 'gold', 'silver', 'xp'];

        if (multiplicativeStats.includes(statName)) {
            return value; // Already calculated as multiplier
        }

        return value; // Additive stat
    }

    // Get stat level
    getLevel(statName) {
        return this.stats[statName]?.level || 0;
    }

    // Get display string for a stat
    getDisplayString(statName) {
        const stat = this.stats[statName];
        if (!stat) return '';

        const value = this.getValue(statName);
        const level = stat.level;

        // Format based on stat type
        const multiplicativeStats = ['damage', 'cooldown', 'agility', 'size', 'knockback', 'projectile', 'attraction', 'duration', 'gold', 'silver', 'xp', 'critDamage'];

        if (multiplicativeStats.includes(statName)) {
            const percentage = ((value - stat.base) * 100).toFixed(0);
            return `Lv.${level} (+${percentage}%)`;
        } else if (statName === 'armor' || statName === 'evasion' || statName === 'precision' || statName === 'lifesteal') {
            const percentage = (value * 100).toFixed(1);
            return `Lv.${level} (${percentage}%)`;
        } else {
            return `Lv.${level} (${value.toFixed(0)})`;
        }
    }

    // Apply character stats to player
    applyToPlayer(player) {
        // Max HP
        const hpValue = this.getValue('hp');
        player.maxHealth = hpValue;
        player.health = Math.min(player.health, player.maxHealth);

        // Move speed (agility)
        const agilityMult = this.getMultiplier('agility');
        player.baseMoveSpeed = 15; // Base speed
        player.moveSpeed = player.baseMoveSpeed * agilityMult;

        console.log(`[CharacterStats] Applied to player - HP: ${hpValue}, Speed: ${player.moveSpeed.toFixed(1)}`);
    }

    // Reset all stats (for new run)
    reset() {
        for (const statName in this.stats) {
            this.stats[statName].level = 0;
        }
        console.log('[CharacterStats] Reset all stats');
    }

    // Get all stats summary
    getSummary() {
        const summary = {};
        for (const statName in this.stats) {
            const stat = this.stats[statName];
            summary[statName] = {
                level: stat.level,
                value: this.getValue(statName),
                display: this.getDisplayString(statName)
            };
        }
        return summary;
    }
}
