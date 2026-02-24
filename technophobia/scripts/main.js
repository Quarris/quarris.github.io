import {config} from './config.js';
import {gameState, updateUI, resetGame} from './gameState.js';
import {initInput} from './input.js';
import {createMap} from './map.js';
import {createPlayer, updatePlayer, resetPlayer} from './player.js';
import {updateCamera, adjustZoom, getCurrentZoom} from './camera.js';
import {GhostManager} from './ghost.js';
import {initPathfinding, getGrid, getGridWidth, getGridHeight, getGridOffsetX, getGridOffsetY, getGridSize} from './pathfinding.js';
import {initPathfindingDebug, toggleDebug, drawPathfindingGrid, drawGhostPath, clearDebugGraphics} from './pathfindingDebug.js';
import {maps} from "./mapConfig.js";

function startGame() {
    // Check if PF is available
    if (typeof PF === 'undefined') {
        console.log('Waiting for PF library...');
        setTimeout(startGame, 100);
        return;
    }

    console.log('PF library loaded, starting game');

    // Create PixiJS application
    const app = new PIXI.Application({
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        antialias: true
    });
    document.body.appendChild(app.view);

    // Create container for game world (for camera movement)
    const world = new PIXI.Container();
    world.scale.set(1);
    app.stage.addChild(world);

    // Initialize input handlers with zoom callback
    initInput((delta) => {
        adjustZoom(delta);
        console.log(`Zoom: ${getCurrentZoom().toFixed(2)}x`);
    });

    // Create game entities
    let map;
    let player;
    let ghostManager;
    createMap(maps.bleasdale).then(createdMap => {
        world.addChild(createdMap);

        // Initialize pathfinding grid
        initPathfinding(createdMap);

        // Initialize pathfinding debug visualization
        initPathfindingDebug(world);
        player = createPlayer(createdMap);
        world.addChild(player);
        // Initialize ghost manager and spawn ghost in building

        ghostManager = new GhostManager(world);
        // ghostManager.spawnGhostInBuilding(createdMap);
        map = createdMap;
    })

    // Click to spawn additional ghosts (for testing)
    app.view.addEventListener('click', (e) => {
        if (gameState.gameOver) return;

        // Convert screen coordinates to world coordinates
        const zoom = getCurrentZoom();
        const worldX = (gameState.mousePos.x - world.x) / zoom;
        const worldY = (gameState.mousePos.y - world.y) / zoom;

        ghostManager.spawnGhost(worldX, worldY);
    });

    // Toggle debug visualization with P key
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
            toggleDebug();
        }
    });

    // Game reset function
    function resetGameState() {
        resetGame();
        resetPlayer(map, player);
        ghostManager.removeAll();
        // Respawn ghost in building after reset
        //ghostManager.spawnGhostInBuilding(map);
        console.log('Game reset!');
    }

    // Main game loop
    app.ticker.add((delta) => {
        if (!map) return;
        if (gameState.gameOver) return;

        const deltaTime = delta / 60; // Convert to seconds

        updatePlayer(player, map, deltaTime);
        ghostManager.update(player, map, deltaTime);
        updateCamera(world, player);
        updateUI(map, player, getCurrentZoom());

        // Update debug visualization
        clearDebugGraphics();
        drawPathfindingGrid(
            getGridOffsetX(),
            getGridOffsetY(),
            getGridWidth(),
            getGridHeight(),
            getGridSize(),
            getGrid()
        );

        // Draw paths for all ghosts
        const ghostDebugData = ghostManager.getDebugData(player);
        for (let ghostData of ghostDebugData) {
            if (ghostData.path) {
                drawGhostPath(
                    ghostData.path,
                    ghostData.x,
                    ghostData.y,
                    ghostData.targetX,
                    ghostData.targetY,
                    ghostData.state,
                    ghostData.hasSeenPlayer
                );
            }
        }

        // Check if ghost caught player
        if (ghostManager.checkCatches(player)) {
            gameState.gameOver = true;
            console.log('GAME OVER - Ghost caught you!');

            // Show game over message
            const gameOverText = document.getElementById('gameOverText');
            gameOverText.style.display = 'block';

            // Reset after 2 seconds
            setTimeout(() => {
                gameOverText.style.display = 'none';
                resetGameState();
            }, 2000);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        config.width = window.innerWidth;
        config.height = window.innerHeight;
    });

    console.log('Game initialized! Use WASD to move, Shift to sprint, Mouse Wheel to zoom. Ghost will wander until you enter building. Press P to toggle pathfinding debug.');
}

// Start the game
startGame();