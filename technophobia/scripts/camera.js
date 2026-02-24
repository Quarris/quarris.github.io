import { config } from './config.js';
import { clamp } from './math.js';
import {gameState} from "./gameState.js";

// Camera state
let currentZoom = config.defaultZoom;

// Update camera to follow player with zoom
export function updateCamera(world, player) {
    world.scale.set(currentZoom);
    world.x = config.width / 2 - (player.x + ((gameState.mousePos.x - config.width / 2) / config.width) * config.height / 4) * currentZoom;
    world.y = config.height / 2 - (player.y + ((gameState.mousePos.y - config.height / 2) / config.height) * config.width / 4) * currentZoom;
}

// Handle zoom changes
export function adjustZoom(delta) {
    const oldZoom = currentZoom;
    currentZoom = clamp(
        currentZoom + delta * config.zoomSpeed,
        config.minZoom,
        config.maxZoom
    );
    return currentZoom !== oldZoom; // Return true if zoom changed
}

// Get current zoom level
export function getCurrentZoom() {
    return currentZoom;
}

// Set zoom level directly
export function setZoom(zoom) {
    currentZoom = clamp(zoom, config.minZoom, config.maxZoom);
}

// Reset zoom to default
export function resetZoom() {
    currentZoom = config.defaultZoom;
}