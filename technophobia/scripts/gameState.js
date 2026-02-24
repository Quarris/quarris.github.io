// Global game state
import {getAreasAt} from "./map.js";

export const gameState = {
    keys: {},
    mousePos: { x: 0, y: 0 },
    gameOver: false
};

// Update UI elements
export function updateUI(map, player, zoom) {
    document.getElementById('sanity').textContent = `${Math.floor(player.sanity)}`;
    document.getElementById('position').textContent =
        `${Math.floor(player.x)}, ${Math.floor(player.y)}`;
    let staminaElement = document.getElementById('stamina');
    staminaElement.textContent = `${Math.floor(player.stamina)}`;
    staminaElement.classList.remove('exhausted')
    if (player.exhausted) {
        staminaElement.classList.add('exhausted');
    }

    // Update current area
    const currentAreas = getAreasAt(map, player.x, player.y).map(val => {
        return val.charAt(0).toUpperCase() + val.slice(1);
    });
    document.getElementById('area').textContent = currentAreas;

    // Update zoom level
    if (zoom !== undefined) {
        document.getElementById('zoom').textContent = zoom.toFixed(2);
    }
}

// Reset game state
export function resetGame() {
    gameState.gameOver = false;
}