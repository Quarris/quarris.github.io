// Pathfinding debug visualization

let debugGraphics = null;
let isDebugEnabled = false; // Toggle this to show/hide debug visuals

export function initPathfindingDebug(worldContainer) {
    debugGraphics = new PIXI.Graphics();
    worldContainer.addChild(debugGraphics);

    console.log('Pathfinding debug visualization enabled. Press "P" to toggle.');
}

export function toggleDebug() {
    isDebugEnabled = !isDebugEnabled;
    if (!isDebugEnabled && debugGraphics) {
        debugGraphics.clear();
    }
    console.log('Pathfinding debug:', isDebugEnabled ? 'ON' : 'OFF');
}

export function drawPathfindingGrid(gridOffsetX, gridOffsetY, gridWidth, gridHeight, gridSize, grid) {
    if (!debugGraphics || !isDebugEnabled) return;

    debugGraphics.clear();

    // Draw grid cells
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const worldX = gridOffsetX + (x * gridSize);
            const worldY = gridOffsetY + (y * gridSize);

            // Check if cell is walkable
            const isWalkable = grid && grid.isWalkableAt(x, y);

            // Draw cell
            if (isWalkable) {
                // Walkable cells - light green, semi-transparent
                debugGraphics.lineStyle(1, 0x00ff00, 0.2);
                debugGraphics.beginFill(0x00ff00, 0.05);
            } else {
                // Blocked cells - red, semi-transparent
                debugGraphics.lineStyle(1, 0xff0000, 0.3);
                debugGraphics.beginFill(0xff0000, 0.1);
            }

            debugGraphics.drawRect(worldX, worldY, gridSize, gridSize);
            debugGraphics.endFill();
        }
    }
}

export function drawGhostPath(path, ghostX, ghostY, targetX, targetY, ghostState, hasSeenPlayer) {
    if (!debugGraphics || !isDebugEnabled || !path) return;

    // Draw path line with color based on state
    let pathColor = 0xffff00; // Default yellow for wandering
    if (ghostState === 'hunting') {
        pathColor = 0xff0000; // Red for hunting
    } else if (ghostState === 'searching') {
        pathColor = 0xff8800; // Orange for searching
    }

    debugGraphics.lineStyle(3, pathColor, 0.8);
    debugGraphics.moveTo(ghostX, ghostY);

    for (let waypoint of path) {
        debugGraphics.lineTo(waypoint.x, waypoint.y);
    }

    // Draw waypoint markers
    for (let i = 0; i < path.length; i++) {
        const waypoint = path[i];

        // Draw waypoint circle
        if (i === 0) {
            // First waypoint (next target) - bright
            debugGraphics.beginFill(pathColor, 0.8);
        } else {
            // Other waypoints - dimmer
            debugGraphics.beginFill(pathColor, 0.4);
        }
        debugGraphics.drawCircle(waypoint.x, waypoint.y, 4);
        debugGraphics.endFill();
    }

    // Draw line of sight line from ghost to target
    if (ghostState === 'hunting' || ghostState === 'searching') {
        const losColor = ghostState === 'hunting' ? 0x00ff00 : 0xff0000; // Green if hunting, red if searching
        debugGraphics.lineStyle(2, losColor, 0.5);
        debugGraphics.moveTo(ghostX, ghostY);
        debugGraphics.lineTo(targetX, targetY);
    }

    // Draw ghost current position with state indicator
    debugGraphics.lineStyle(2, pathColor, 1);
    debugGraphics.beginFill(pathColor, 0.5);
    debugGraphics.drawCircle(ghostX, ghostY, 8);
    debugGraphics.endFill();

    // Draw target position
    debugGraphics.lineStyle(2, 0x00ffff, 1);
    debugGraphics.beginFill(0x00ffff, 0.5);
    debugGraphics.drawCircle(targetX, targetY, 6);
    debugGraphics.endFill();
}

export function clearDebugGraphics() {
    if (debugGraphics) {
        debugGraphics.clear();
    }
}