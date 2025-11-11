export class InputSystem {
    constructor(game) {
        this.game = game;
        this.keys = {};

        this.setupKeyboardListeners();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleKeyDown(e) {
        // Handle special keys
        switch (e.key.toLowerCase()) {
            case 'escape':
                this.game.isPaused ? this.game.resume() : this.game.pause();
                break;
            case ' ': // Spacebar
                if (this.game.player) {
                    this.game.player.jump();
                }
                e.preventDefault(); // Prevent page scroll
                break;
        }
    }

    update() {
        if (!this.game.player) return;

        // Calculate movement input
        let moveX = 0;
        let moveZ = 0;

        if (this.keys['w']) moveZ += 1;
        if (this.keys['s']) moveZ -= 1;
        if (this.keys['d']) moveX += 1;
        if (this.keys['a']) moveX -= 1;

        // Update player movement
        this.game.player.setMoveInput(moveX, moveZ);
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    dispose() {
        // Remove event listeners if needed
        this.keys = {};
    }
}
