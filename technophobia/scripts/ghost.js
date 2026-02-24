import {checkCollision, isInArea} from './map.js';
import {distance} from './math.js';
import {config} from "./config.js";
import {GRID_SIZE, PathFollower} from './pathfinding.js';

// Ghost AI states
const GhostState = {
    WANDERING: 'wandering',
    HUNTING: 'hunting',
    SEARCHING: 'searching' // Lost sight of player, checking last known position
};

// Check if ghost has line of sight to player
function hasLineOfSight(ghost, player, map) {
    const dx = player.x - ghost.x;
    const dy = player.y - ghost.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Maximum sight distance
    if (dist > config.ghostSightRange) {
        return false;
    }

    // Check points along the line between ghost and player
    const steps = Math.ceil(dist / config.ghostSightCheckInterval);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const checkX = ghost.x + dx * t;
        const checkY = ghost.y + dy * t;

        // If any point hits a wall, no line of sight
        if (checkCollision(map, checkX, checkY, 4)) {
            return false;
        }
    }

    return true;
}

// Create a ghost sprite
export function createGhost(x, y) {
    const ghost = new PIXI.Graphics();

    // Ghost body (circle with glow effect)
    ghost.beginFill(0xff0000, 0.7);
    ghost.drawCircle(0, 0, 14);
    ghost.endFill();

    // Outer glow
    ghost.lineStyle(2, 0xff0000, 0.3);
    ghost.drawCircle(0, 0, 18);

    ghost.x = x;
    ghost.y = y;
    ghost.speed = config.ghostSpeed;
    ghost.active = true;
    ghost.state = GhostState.WANDERING;

    // Wandering behavior properties
    ghost.wanderTarget = { x: x, y: y };
    ghost.wanderTimer = 0;
    ghost.wanderCooldown = 2; // Time between picking new wander targets (in seconds)

    // Line of sight properties
    ghost.hasSeenPlayer = false;
    ghost.lastKnownPlayerPos = { x: 0, y: 0 };
    ghost.searchTimer = 0;
    ghost.searchDuration = config.ghostSearchDuration; // How long to search after losing sight

    // Pathfinding
    ghost.pathFollower = new PathFollower();

    return ghost;
}

// Pick a random wander target within the building
function pickWanderTarget(map, ghost) {
    // Building bounds from mapData
    const buildingBounds = map.mapType === 'image' ? map.imageMapLoader.roomDataCache.building.bounds : map.config.areas.building.bounds;

    ghost.wanderTarget.x = buildingBounds.x + Math.random() * buildingBounds.width;
    ghost.wanderTarget.y = buildingBounds.y + Math.random() * buildingBounds.height;
}

// Move ghost toward a target position using pathfinding
function moveTowardsTarget(ghost, targetX, targetY, map, delta) {
    // Get next waypoint from pathfinder
    const waypoint = ghost.pathFollower.update(ghost.x, ghost.y, targetX, targetY, map, delta);

    const dx = waypoint.x - ghost.x;
    const dy = waypoint.y - ghost.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Calculate new position
    const speed = ghost.speed * delta;
    const newX = ghost.x + dirX * speed;
    const newY = ghost.y + dirY * speed;

    // Move directly toward waypoint (pathfinding already avoids walls)
    if (!checkCollision(map, newX, newY, GRID_SIZE)) {
        ghost.x = newX;
        ghost.y = newY;
    } else {
        // If somehow we hit a wall, do simple sliding
        if (!checkCollision(map, newX, ghost.y, GRID_SIZE)) {
            ghost.x = newX;
        }
        if (!checkCollision(map, ghost.x, newY, GRID_SIZE)) {
            ghost.y = newY;
        }
    }

    const dtx = targetX - ghost.x;
    const dty = targetY - ghost.y;
    const targetDist = Math.sqrt(dtx * dtx + dty * dty);

    if (targetDist < 5) return true; // Reached target

    return false; // Not yet reached
}

// Update ghost AI based on state
export function updateGhost(ghost, player, map, delta) {
    if (!ghost.active) return;

    // Check if player is in the building (ghost's hunting zone)
    const playerInBuilding = isInArea(map, player.x, player.y, "building");

    // Check line of sight if player is in building
    const canSeePlayer = playerInBuilding && hasLineOfSight(ghost, player, map);

    // State machine logic
    if (canSeePlayer) {
        // Can see player - start or continue hunting
        if (ghost.state !== GhostState.HUNTING) {
            ghost.state = GhostState.HUNTING;
            ghost.pathFollower.reset();
            console.log('Ghost spotted player! Starting hunt...');
        }
        ghost.hasSeenPlayer = true;
        ghost.lastKnownPlayerPos.x = player.x;
        ghost.lastKnownPlayerPos.y = player.y;
        ghost.searchTimer = ghost.searchDuration; // Reset search timer

    } else if (ghost.hasSeenPlayer && ghost.searchTimer > 0) {
        // Lost sight but recently saw player - search last known position
        if (ghost.state !== GhostState.SEARCHING) {
            ghost.state = GhostState.SEARCHING;
            ghost.pathFollower.reset();
            console.log('Ghost lost sight of player. Searching last known position...');
        }
        ghost.searchTimer -= delta;

    } else {
        // Haven't seen player or search timer expired - wander
        if (ghost.state !== GhostState.WANDERING) {
            ghost.state = GhostState.WANDERING;
            ghost.pathFollower.reset();
            ghost.hasSeenPlayer = false;
            console.log('Ghost returning to wandering state.');
        }
    }

    // Execute behavior based on current state
    if (ghost.state === GhostState.WANDERING) {
        // Wandering behavior
        ghost.wanderTimer -= delta;

        if (ghost.wanderTimer <= 0) {
            pickWanderTarget(map, ghost);
            ghost.wanderTimer = ghost.wanderCooldown;
            ghost.pathFollower.reset(); // Force recalculation for new target
        }

        moveTowardsTarget(ghost, ghost.wanderTarget.x, ghost.wanderTarget.y, map, delta);

    } else if (ghost.state === GhostState.HUNTING) {
        // Hunting behavior - chase the player with pathfinding
        moveTowardsTarget(ghost, player.x, player.y, map, delta);

    } else if (ghost.state === GhostState.SEARCHING) {
        // Searching behavior - go to last known player position
        const reached = moveTowardsTarget(ghost, ghost.lastKnownPlayerPos.x, ghost.lastKnownPlayerPos.y, map, delta);

        // If reached last known position and still can't see player, search timer will expire
        if (reached) {
            ghost.searchTimer = Math.min(ghost.searchTimer, 0.5); // Speed up giving up
        }
    }
}

// Check if ghost has caught the player
export function checkGhostCatch(ghost, player) {
    if (!ghost.active) return false;

    // Can catch in both hunting and searching states
    if (ghost.state !== GhostState.HUNTING && ghost.state !== GhostState.SEARCHING) return false;

    const dist = distance(ghost.x, ghost.y, player.x, player.y);
    const catchRadius = 30; // Combined radius for catching

    return dist < catchRadius;
}

// Create ghosts array for managing multiple ghosts
export class GhostManager {
    constructor(worldContainer) {
        this.ghosts = [];
        this.worldContainer = worldContainer;
    }

    spawnGhost(x, y) {
        const ghost = createGhost(x, y);
        this.ghosts.push(ghost);
        this.worldContainer.addChild(ghost);
        console.log(`Ghost spawned at (${Math.floor(x)}, ${Math.floor(y)})`);
        return ghost;
    }

    // Spawn ghost at predefined location in building
    spawnGhostInBuilding(map) {
        // Get building bounds based on map type
        const buildingBounds = map.mapType === 'image'
            ? map.imageMapLoader.roomDataCache.building.bounds
            : map.config.areas.building.bounds;

        // Center of building
        const x = buildingBounds.x + buildingBounds.width / 2;
        const y = buildingBounds.y + buildingBounds.height / 2;
        return this.spawnGhost(x, y);
    }

    update(player, map, delta) {
        for (let ghost of this.ghosts) {
            updateGhost(ghost, player, map, delta);
        }
    }

    // Get visualization data for all ghosts
    getDebugData(player) {
        return this.ghosts.map(ghost => {
            let targetX, targetY;

            if (ghost.state === GhostState.HUNTING) {
                targetX = player.x;
                targetY = player.y;
            } else if (ghost.state === GhostState.SEARCHING) {
                targetX = ghost.lastKnownPlayerPos.x;
                targetY = ghost.lastKnownPlayerPos.y;
            } else {
                targetX = ghost.wanderTarget.x;
                targetY = ghost.wanderTarget.y;
            }

            return {
                x: ghost.x,
                y: ghost.y,
                targetX: targetX,
                targetY: targetY,
                path: ghost.pathFollower.getPath(),
                state: ghost.state,
                hasSeenPlayer: ghost.hasSeenPlayer
            };
        });
    }

    checkCatches(player) {
        for (let ghost of this.ghosts) {
            if (checkGhostCatch(ghost, player)) {
                return true;
            }
        }
        return false;
    }

    removeAll() {
        for (let ghost of this.ghosts) {
            this.worldContainer.removeChild(ghost);
            ghost.destroy();
        }
        this.ghosts = [];
    }
}