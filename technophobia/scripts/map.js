import { config } from './config.js';
import { ImageMapLoader } from './imageMapLoader.js';

let currentMapLoader = null;
let currentMapType = 'coordinate'; // 'image' or 'coordinate'

// Create the game map - supports both image and coordinate-based maps
export async function createMap(mapConfig = null) {
    const mapContainer = new PIXI.Container();

    // If map config provided, use image-based system
    if (mapConfig && mapConfig.type === 'image') {
        return await createImageMap(mapContainer, mapConfig);
    }

    // Otherwise use coordinate-based system (current default)
    return createCoordinateMap(mapContainer, mapConfig);
}

// Create map from images
async function createImageMap(mapContainer, mapConfig) {
    currentMapType = 'image';
    currentMapLoader = new ImageMapLoader();

    await currentMapLoader.loadMap({
        displayLayer: mapConfig.layers.display,
        collisionLayer: mapConfig.layers.collision,
        roomLayers: mapConfig.layers.rooms
    });

    // Cache data for performance
    currentMapLoader.cacheCollisionData();
    currentMapLoader.cacheRoomData();

    // Add display sprite
    const displaySprite = currentMapLoader.createDisplaySprite();
    if (displaySprite) {
        mapContainer.addChild(displaySprite);
    }

    // Store reference for collision detection
    mapContainer.imageMapLoader = currentMapLoader;
    mapContainer.mapType = 'image';
    mapContainer.config = mapConfig;

    return mapContainer;
}

// Create map from coordinates (existing system)
function createCoordinateMap(mapContainer, mapConfig) {
    currentMapType = 'coordinate';

    const bounds = mapConfig.worldBounds;

    // Outside floor (everything is outside by default)
    const floor = new PIXI.Graphics();
    floor.beginFill(0x2a4a2a); // Green-ish outdoor color
    floor.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
    floor.endFill();
    mapContainer.addChild(floor);

    // Grid lines (for visibility)
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x2a2a2a, 0.3);
    for (let x = bounds.x; x <= bounds.x + bounds.width; x += config.tileSize) {
        grid.moveTo(x, bounds.y);
        grid.lineTo(x, bounds.y + bounds.height);
    }
    for (let y = bounds.y; y <= bounds.y + bounds.height; y += config.tileSize) {
        grid.moveTo(bounds.x, y);
        grid.lineTo(bounds.x + bounds.width, y);
    }
    mapContainer.addChild(grid);

    // Draw area floors (buildings and truck interior)
    for (let areaKey in mapConfig.areas) {
        const area = mapConfig.areas[areaKey];

        const areaBg = new PIXI.Graphics();
        const bgColor = area.color;
        areaBg.beginFill(bgColor);
        areaBg.drawRect(area.bounds.x, area.bounds.y, area.bounds.width, area.bounds.height);
        areaBg.endFill();
        mapContainer.addChild(areaBg);
    }

    // Draw all walls
    const walls = new PIXI.Graphics();
    walls.beginFill(0x4a4a4a);

    for (let areaKey in mapConfig.areas) {
        const area = mapConfig.areas[areaKey];
        for (let wall of area.walls) {
            walls.drawRect(wall.x, wall.y, wall.width, wall.height);
        }
    }

    walls.endFill();
    mapContainer.addChild(walls);

    // Store wall rectangles for collision detection
    mapContainer.wallBounds = getAllWalls(mapConfig);
    mapContainer.mapType = 'coordinate';
    mapContainer.config = mapConfig;

    return mapContainer;
}

function getAllWalls(map) {
    const walls = [];

    for (let areaKey in map.areas) {
        const area = map.areas[areaKey];
        for (let wall of area.walls) {
            walls.push(new PIXI.Rectangle(wall.x, wall.y, wall.width, wall.height));
        }
    }

    return walls;
}

// Check if position collides with walls (works for both map types)
export function checkCollision(map, x, y, radius = 16) {
    if (map.mapType === 'image') {
        // Image-based collision
        const loader = map.imageMapLoader;
        if (!loader) return false;

        // Check a circle of points around the position
        const checkPoints = 8;
        for (let i = 0; i < checkPoints; i++) {
            const angle = (i / checkPoints) * Math.PI * 2;
            const checkX = x + Math.cos(angle) * radius;
            const checkY = y + Math.sin(angle) * radius;

            if (!loader.isWalkableCached(checkX, checkY)) {
                return true; // Collision detected
            }
        }

        // Also check center point
        return !loader.isWalkableCached(x, y);
    }

    // Coordinate-based collision (existing system)
    const playerBounds = new PIXI.Rectangle(x - radius, y - radius, radius * 2, radius * 2);

    for (let wall of map.wallBounds) {
        if (wall.x < playerBounds.x + playerBounds.width &&
            wall.x + wall.width > playerBounds.x &&
            wall.y < playerBounds.y + playerBounds.height &&
            wall.y + wall.height > playerBounds.y) {
            return true;
        }
    }
    return false;
}

// Check if position is in a specific area/room (works for both map types)
export function isInArea(map, x, y, areaName) {
    if (map.mapType === 'image') {
        const loader = map.imageMapLoader;
        return loader ? loader.isInRoomCached(x, y, areaName) : false;
    }

    // Coordinate-based (existing system)
    const area = map.areas[areaName];
    if (!area) return false;

    const bounds = area.bounds;
    return x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height;
}

// Get all areas at a position (works for both map types)
export function getAreasAt(map, x, y) {
    if (map.mapType === 'image') {
        const loader = map.imageMapLoader;
        return loader ? loader.getRoomsAtCached(x, y) : ['outside'];
    }

    // Coordinate-based (existing system)
    const areas = [];
    for (let areaKey in map.areas) {
        if (isInArea(map, x, y, areaKey)) {
            areas.push(areaKey);
        }
    }
    return areas.length > 0 ? areas : ['outside'];
}

export function getMapLoader() {
    return currentMapLoader;
}

export function getMapType() {
    return currentMapType;
}