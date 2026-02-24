import { gameState } from './gameState.js';

// Initialize input handlers
export function initInput(onZoom) {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
        gameState.mousePos.x = e.clientX;
        gameState.mousePos.y = e.clientY;
    });

    // Add scroll wheel zoom
    window.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Normalize scroll direction across different browsers/devices
        // Positive = zoom out, Negative = zoom in
        const delta = Math.sign(e.deltaY);

        if (onZoom) {
            onZoom(-delta); // Invert so scroll down zooms out
        }
    }, { passive: false });
}