import {config} from './config.js';
import {gameState} from './gameState.js';
import {checkCollision, isInArea} from './map.js';
import {clamp} from "./math.js";

const size = 4

// Create the player sprite
export function createPlayer(map) {
    const player = new PIXI.Graphics();

    // Body (circle)
    player.beginFill(0x3498db);
    player.drawCircle(0, 0, 16);
    player.endFill();

    // Direction indicator (triangle)
    player.beginFill(0x2980b9);
    player.moveTo(20, 0);
    player.lineTo(12, -6);
    player.lineTo(12, 6);
    player.lineTo(20, 0);
    player.endFill();

    const spawn = map.config.spawn;
    player.x = spawn.x;
    player.y = spawn.y;
    player.stamina = config.maxStamina;
    player.sanity = 100;

    return player;
}

// Update player rotation to face mouse cursor
export function updatePlayerRotation(player) {
    const worldMouseX = gameState.mousePos.x - (config.width / 2) + player.x;
    const worldMouseY = gameState.mousePos.y - (config.height / 2) + player.y;

    player.rotation = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
}

// Update player movement based on input
export function updatePlayer(player, map, delta) {
    let isSprinting = !player.exhausted && gameState.keys['shift'];
    let speed = config.playerSpeed * delta;
    let dx = 0;
    let dy = 0;

    if (gameState.keys['w']) dy -= 1;
    if (gameState.keys['s']) dy += 1;
    if (gameState.keys['a']) dx -= 1;
    if (gameState.keys['d']) dx += 1;
    if (isSprinting) {
        speed *= 2;
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Calculate new position
    const newX = player.x + dx * speed;
    const newY = player.y + dy * speed;
    let moved = false

    // Check collision and move
    if (!checkCollision(map, newX, player.y)) {
        player.x = newX;
        moved = true;
    }
    if (!checkCollision(map, player.x, newY)) {
        player.y = newY;
        moved = true;
    }

    if (moved && isSprinting) {
        player.stamina = clamp(player.stamina - config.staminaDrain * delta, 0, config.maxStamina)
        if (player.stamina <= 0) {
            player.exhausted = true;
        }
    }

    if (!isSprinting) {
        player.stamina = clamp(player.stamina + config.staminaRegen * delta, 0, config.maxStamina)
        if (player.stamina >= config.minStamina) {
            player.exhausted = false;
        }
    }

    updatePlayerRotation(player);
    if (isInArea(map, player.x, player.y, "building")) {
        player.sanity = Math.max(0, player.sanity - delta * 0.5);
    }
}

// Reset player to starting position
export function resetPlayer(map, player) {
    const spawn = map.config.spawn;
    player.x = spawn.x;
    player.y = spawn.y;
    player.stamina = config.maxStamina;
    player.exhausted = false;
}