export class InputSystem {
    constructor(game) {
        this.game = game;
        this.keys = {};

        // Mobile joystick
        this.joystickActive = false;
        this.joystickVector = { x: 0, z: 0 };

        this.setupKeyboardListeners();
        this.setupMobileControls();
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

    setupMobileControls() {
        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.style.display = 'block';
            }
        }

        const joystickContainer = document.getElementById('joystickContainer');
        const joystickStick = document.getElementById('joystickStick');
        const jumpButton = document.getElementById('jumpButton');

        if (!joystickContainer || !joystickStick) return;

        const handleJoystickMove = (touch) => {
            const rect = joystickContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let deltaX = touch.clientX - centerX;
            let deltaY = touch.clientY - centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 35;

            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }

            joystickStick.style.left = (35 + deltaX) + 'px';
            joystickStick.style.top = (35 + deltaY) + 'px';

            this.joystickVector.x = deltaX / maxDistance;
            this.joystickVector.z = -deltaY / maxDistance;
        };

        joystickContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            handleJoystickMove(e.touches[0]);
        });

        joystickContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystickActive) {
                handleJoystickMove(e.touches[0]);
            }
        });

        joystickContainer.addEventListener('touchend', () => {
            this.joystickActive = false;
            this.joystickVector = { x: 0, z: 0 };
            joystickStick.style.left = '35px';
            joystickStick.style.top = '35px';
        });

        if (jumpButton) {
            jumpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.game.player) {
                    this.game.player.jump();
                }
            });
        }
    }

    update() {
        if (!this.game.player) return;

        // Calculate movement input
        let moveX = 0;
        let moveZ = 0;

        // Keyboard input
        if (this.keys['w']) moveZ += 1;
        if (this.keys['s']) moveZ -= 1;
        if (this.keys['d']) moveX += 1;
        if (this.keys['a']) moveX -= 1;

        // Mobile joystick input
        if (this.joystickActive) {
            moveX = this.joystickVector.x;
            moveZ = this.joystickVector.z;
        }

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
