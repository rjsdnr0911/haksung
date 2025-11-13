import { Game } from './core/Game.js';
import { MetaProgressionSystem } from './systems/MetaProgressionSystem.js';

let game = null;
let metaSystem = null;

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

function startGame() {
    if (!game) {
        console.error('Game not initialized!');
        return;
    }

    // Hide menu
    document.getElementById('menu').style.display = 'none';

    // Show HUD
    document.getElementById('hud').style.display = 'block';

    // Start game
    game.start();

    console.log('Game started!');
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
        startGame();
    };

    // Show shop
    shopMenu.style.display = 'flex';
}

// Setup button listener
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startGame);
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
