// Game configuration constants
export const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1a1a,
    playerSpeed: 150, // pixels per second
    tileSize: 64,

    // Stamina system
    maxStamina: 100,
    minStamina: 50, // Required stamina to start sprinting again after exhaustion
    staminaDrain: 30, // Stamina per second while sprinting
    staminaRegen: 15, // Stamina per second while not sprinting

    // Ghost settings
    ghostSpeed: 170, // Slower than player base speed, faster than walking
    ghostSightRange: 2000, // Maximum distance ghost can see player (in pixels)
    ghostSightCheckInterval: 10, // Distance between ray check points (lower = more accurate)
    ghostSearchDuration: 5, // How long ghost searches after losing sight (in seconds)

    // Camera zoom settings
    minZoom: 0.2,   // Maximum zoom out
    maxZoom: 2.0,   // Maximum zoom in
    defaultZoom: 1.0,
    zoomSpeed: 0.1  // How much to zoom per scroll tick
};