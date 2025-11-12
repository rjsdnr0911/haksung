import { Game } from './core/Game.js';

let game = null;

async function init() {
    console.log('=== Megabonk Clone ===');
    console.log('Initializing game...');

    // Get canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }

    // Create game instance
    game = new Game(canvas);

    // Initialize game
    await game.init();

    // Show start button
    document.getElementById('loading').style.display = 'none';
    document.getElementById('startButton').style.display = 'block';

    console.log('Game ready! Click START to begin.');
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

// Setup button listener
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }

    // Initialize when page loads
    init();
});

// Make game accessible globally for debugging
window.game = game;
