import {checkCollision, isInArea} from './map.js';

// Pathfinding wrapper using pathfinding.js library
// The library is loaded globally as PF from the CDN

let grid = null;
let gridWidth = 0;
let gridHeight = 0;
let gridOffsetX = 0; // World X coordinate where grid starts
let gridOffsetY = 0; // World Y coordinate where grid starts
export const GRID_SIZE = 16; // Size of each grid cell in pixels

// Getter functions for debug visualization
export function getGrid() { return grid; }
export function getGridWidth() { return gridWidth; }
export function getGridHeight() { return gridHeight; }
export function getGridOffsetX() { return gridOffsetX; }
export function getGridOffsetY() { return gridOffsetY; }
export function getGridSize() { return GRID_SIZE; }

// Initialize the pathfinding grid based on the building area only
export function initPathfinding(map) {
    // Check if PF library is loaded
    if (typeof PF === 'undefined') {
        console.error('PF library not loaded!');
        return;
    }

    // Get building bounds from mapData
    const buildingBounds = map.mapType === 'image' ? map.imageMapLoader.roomDataCache.building.bounds : map.areas.building.bounds;

    // Grid should cover the building area
    gridOffsetX = buildingBounds.x;
    gridOffsetY = buildingBounds.y;
    gridWidth = Math.ceil(buildingBounds.width / GRID_SIZE);
    gridHeight = Math.ceil(buildingBounds.height / GRID_SIZE);

    console.log(`Creating pathfinding grid for building: ${gridWidth}x${gridHeight}`);
    console.log(`Grid offset: (${gridOffsetX}, ${gridOffsetY})`);

    try {
        // Create the pathfinding grid
        grid = new PF.Grid(gridWidth, gridHeight);

        // Set the walkability of each node based on collision detection
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                // Convert grid coordinates to world coordinates
                const worldX = gridOffsetX + (x * GRID_SIZE) + (GRID_SIZE / 2);
                const worldY = gridOffsetY + (y * GRID_SIZE) + (GRID_SIZE / 2);

                // Check if this cell is blocked by a wall
                const isBlocked = !isInArea(map, worldX, worldY, 'building') || checkCollision(map, worldX, worldY, GRID_SIZE);

                if (isBlocked) {
                    grid.setWalkableAt(x, y, false);
                }
            }
        }

        console.log('Pathfinding grid initialized successfully');
    } catch (error) {
        console.error('Error creating PF.Grid:', error);
    }
}

// Convert world coordinates to grid coordinates
function worldToGrid(worldX, worldY) {
    return {
        x: Math.floor((worldX - gridOffsetX) / GRID_SIZE),
        y: Math.floor((worldY - gridOffsetY) / GRID_SIZE)
    };
}

// Convert grid coordinates to world coordinates (center of cell)
function gridToWorld(gridX, gridY) {
    return {
        x: gridOffsetX + (gridX * GRID_SIZE) + (GRID_SIZE / 2),
        y: gridOffsetY + (gridY * GRID_SIZE) + (GRID_SIZE / 2)
    };
}

// Find a path using A* algorithm
export function findPath(startX, startY, endX, endY) {
    if (!grid) {
        console.warn('Pathfinding grid not initialized');
        return null;
    }

    // Convert world coordinates to grid coordinates
    const start = worldToGrid(startX, startY);
    const end = worldToGrid(endX, endY);

    // Clamp to grid bounds
    start.x = Math.max(0, Math.min(gridWidth - 1, start.x));
    start.y = Math.max(0, Math.min(gridHeight - 1, start.y));
    end.x = Math.max(0, Math.min(gridWidth - 1, end.x));
    end.y = Math.max(0, Math.min(gridHeight - 1, end.y));

    // Clone the grid (library modifies it during search)
    const gridClone = grid.clone();

    // Create A* finder (allows diagonal movement)
    const finder = new PF.AStarFinder({
        allowDiagonal: true,
        dontCrossCorners: true
    });

    try {
        // Find the path
        const gridPath = finder.findPath(start.x, start.y, end.x, end.y, gridClone);

        if (!gridPath || gridPath.length === 0) {
            return null;
        }

        // Convert grid path back to world coordinates
        const worldPath = gridPath.map(([x, y]) => gridToWorld(x, y));

        return worldPath;
    } catch (error) {
        console.error('Error finding path:', error);
        console.log('Start:', start, 'End:', end, 'Grid:', gridWidth, 'x', gridHeight);
        return null;
    }
}

// Path follower class for smooth movement along a path
export class PathFollower {
    constructor() {
        this.path = null;
        this.currentIndex = 0;
        this.recalculateTimer = 0;
        this.recalculateInterval = 1; // Recalculate path every second
    }

    // Update and get next target position
    update(currentX, currentY, targetX, targetY, map, delta) {
        this.recalculateTimer -= delta;

        // Recalculate path periodically or if no path exists
        if (!this.path || this.recalculateTimer <= 0) {
            this.path = findPath(currentX, currentY, targetX, targetY);
            this.currentIndex = 0;
            this.recalculateTimer = this.recalculateInterval;

            if (!this.path) {
                // No path found - return direct target
                return { x: targetX, y: targetY };
            }
        }

        // If we have a path, follow it
        if (this.path && this.currentIndex < this.path.length) {
            const waypoint = this.path[this.currentIndex];

            // Check if we've reached current waypoint
            const dx = waypoint.x - currentX;
            const dy = waypoint.y - currentY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                // Move to next waypoint
                this.currentIndex++;

                if (this.currentIndex >= this.path.length) {
                    // Reached end of path
                    return { x: targetX, y: targetY };
                }
            }

            return waypoint;
        }

        // Fallback to direct target
        return { x: targetX, y: targetY };
    }

    // Get current path for visualization
    getPath() {
        return this.path;
    }

    reset() {
        this.path = null;
        this.currentIndex = 0;
    }
}