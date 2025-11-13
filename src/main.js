import { Game } from './core/Game.js';
import { MetaProgressionSystem } from './systems/MetaProgressionSystem.js';
import { CHARACTERS, CHARACTER_IDS } from './entities/Characters.js';

let game = null;
let metaSystem = null;
let selectedCharacterId = null;

async function init() {
    console.log('=== Megabonk Clone ===');
    console.log('Initializing game...');

    // Get canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }

    // Load meta progression data
    metaSystem = new MetaProgressionSystem();

    // Update main menu with meta info
    updateMainMenu();

    // Create game instance
    game = new Game(canvas);

    // Initialize game
    await game.init();

    // Show start button
    document.getElementById('loading').style.display = 'none';
    document.getElementById('menuButtons').style.display = 'flex';

    console.log('Game ready! Click START to begin.');
}

function updateMainMenu() {
    // Show meta progress
    document.getElementById('metaProgress').style.display = 'block';

    // Update silver
    document.getElementById('menuSilver').textContent = metaSystem.getSilver();

    // Update slot counts
    const weaponSlots = metaSystem.getWeaponSlots();
    const tomeSlots = metaSystem.getTomeSlots();
    document.getElementById('menuSlots').textContent = `${weaponSlots} Weapons / ${tomeSlots} Tomes`;
}

function showCharacterSelect() {
    if (!game) {
        console.error('Game not initialized!');
        return;
    }

    // Hide menu
    document.getElementById('menu').style.display = 'none';

    // Show character select
    showCharacterSelectScreen();
}

function showCharacterSelectScreen() {
    console.log('[Main] Showing character select');

    const characterSelect = document.getElementById('characterSelect');
    const characterGrid = document.getElementById('characterGrid');
    const characterBackButton = document.getElementById('characterBackButton');
    const characterConfirmButton = document.getElementById('characterConfirmButton');

    // Clear grid
    characterGrid.innerHTML = '';

    // Get saved character
    const savedCharacter = metaSystem.getSelectedCharacter();
    selectedCharacterId = savedCharacter;

    // Create character cards
    CHARACTER_IDS.forEach(charId => {
        const char = CHARACTERS[charId];

        const card = document.createElement('div');
        card.className = 'character-card';
        if (charId === selectedCharacterId) {
            card.classList.add('selected');
        }
        if (!char.unlocked) {
            card.classList.add('locked');
        }

        card.innerHTML = `
            <div class="character-header">
                <div class="character-icon">${char.icon}</div>
                <div class="character-info">
                    <h3 class="character-name">${char.name}</h3>
                    <p class="character-description">${char.description}</p>
                </div>
            </div>

            <div class="character-stats">
                <div class="character-stat">
                    <span class="stat-value">${char.stats.maxHP}</span>
                    <span class="stat-label">HP</span>
                </div>
                <div class="character-stat">
                    <span class="stat-value">${char.stats.speed}</span>
                    <span class="stat-label">SPEED</span>
                </div>
                <div class="character-stat">
                    <span class="stat-value">${char.startingSlots}</span>
                    <span class="stat-label">SLOTS</span>
                </div>
            </div>

            <div class="character-passive">
                <h4 class="passive-name">${char.passive.name}</h4>
                <p class="passive-description">${char.passive.description}</p>
            </div>
        `;

        // Click handler
        if (char.unlocked) {
            card.onclick = () => {
                // Deselect all
                document.querySelectorAll('.character-card').forEach(c => {
                    c.classList.remove('selected');
                });

                // Select this
                card.classList.add('selected');
                selectedCharacterId = charId;
                console.log('[Main] Selected character:', charId);
            };
        }

        characterGrid.appendChild(card);
    });

    // Button handlers
    characterBackButton.onclick = () => {
        characterSelect.style.display = 'none';
        document.getElementById('menu').style.display = 'flex';
    };

    characterConfirmButton.onclick = () => {
        confirmCharacterSelection();
    };

    // Show character select
    characterSelect.style.display = 'flex';
}

function confirmCharacterSelection() {
    if (!selectedCharacterId) {
        console.error('[Main] No character selected!');
        return;
    }

    // Save selection
    metaSystem.selectCharacter(selectedCharacterId);

    // Hide character select
    document.getElementById('characterSelect').style.display = 'none';

    // Show HUD
    document.getElementById('hud').style.display = 'block';

    // Start game with selected character
    game.start(selectedCharacterId);

    console.log('[Main] Game started with character:', selectedCharacterId);
}

function showShopFromMenu() {
    if (!game) {
        console.error('Game not initialized!');
        return;
    }

    // Hide menu
    document.getElementById('menu').style.display = 'none';

    // Show shop (using game's shop method, but modified for menu access)
    showShopMenu();
}

function showShopMenu() {
    console.log('[Main] Showing shop from menu');

    const shopMenu = document.getElementById('shopMenu');
    const shopSilver = document.getElementById('shopSilver');
    const shopCloseButton = document.getElementById('shopCloseButton');
    const startGameButton = document.getElementById('startGameButton');

    // Update silver display
    shopSilver.textContent = metaSystem.getSilver();

    // Populate shop items using game's methods if available
    if (game && game.populateShopWeapons) {
        game.metaProgressionSystem = metaSystem; // Share meta system
        game.populateShopWeapons();
        game.populateShopTools();
        game.populateShopSlots();
    }

    // Setup tab switching
    const tabs = document.querySelectorAll('.shop-tab');
    const sections = document.querySelectorAll('.shop-section');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`shop-${tabName}`).classList.add('active');
        };
    });

    // Setup buttons
    shopCloseButton.onclick = () => {
        shopMenu.style.display = 'none';
        document.getElementById('menu').style.display = 'flex';
        updateMainMenu(); // Refresh menu data
    };

    startGameButton.onclick = () => {
        shopMenu.style.display = 'none';
        showCharacterSelect();
    };

    // Show shop
    shopMenu.style.display = 'flex';
}

// Setup button listener
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', showCharacterSelect);
    }

    const shopMenuButton = document.getElementById('shopMenuButton');
    if (shopMenuButton) {
        shopMenuButton.addEventListener('click', showShopFromMenu);
    }

    // Initialize when page loads
    init();
});

// Make game accessible globally for debugging
window.game = game;
window.metaSystem = metaSystem;
