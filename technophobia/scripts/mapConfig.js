// Map configuration
// This file defines map layouts using image layers

export const maps = {
    // Example map using the old coordinate-based system
    // You can create new maps using images instead
    bleasdale: {
        type: 'image', // 'image' or 'coordinate'
        
        // Spawn position (in world coordinates)
        spawn: { x: 2510, y: 2260 },
        
        // Image paths for different layers
        layers: {
            display: 'maps/bleasdale/display.png',      // Visual representation
            collision: 'maps/bleasdale/collision.png',  // Transparent = walkable
            rooms: {
                building: 'maps/bleasdale/room-building.png',
                bathroom: 'maps/bleasdale/room-bathroom.png',
                conservatory: 'maps/bleasdale/room-conservatory.png',
                diningRoom: 'maps/bleasdale/room-dining-room.png',
                garden: 'maps/bleasdale/room-garden.png',
                hallway: 'maps/bleasdale/room-hallway.png',
                kitchen: 'maps/bleasdale/room-kitchen.png',
                livingRoom: 'maps/bleasdale/room-living-room.png',
                lobby: 'maps/bleasdale/room-lobby.png',
                shed: 'maps/bleasdale/room-shed.png',
                storage: 'maps/bleasdale/room-storage.png',
                teaRoom: 'maps/bleasdale/room-tea-room.png'
            }
        }
    },
    
    // Current coordinate-based map (fallback/example)
    currentMap: {
        type: 'coordinate',
        spawn: { x: 100, y: 100 },
        worldBounds: {
            x: 0,
            y: 0,
            width: 1400,
            height: 800
        },
        areas: {
            truck: {
                bounds: { x: 50, y: 50, width: 200, height: 150 },
                color: 0x3a5a7a,
                walls: [
                    // Truck walls (leaving bottom open as exit)
                    { x: 50, y: 50, width: 200, height: 32 },      // Top
                    { x: 50, y: 50, width: 32, height: 150 },      // Left
                    { x: 218, y: 50, width: 32, height: 150 },     // Right
                    // Bottom wall with gap for door
                    { x: 50, y: 168, width: 60, height: 32 },      // Bottom left
                    { x: 190, y: 168, width: 60, height: 32 }      // Bottom right
                    // Gap from x:110 to x:190 is the exit
                ]
            },

            building: {
                bounds: { x: 700, y: 250, width: 500, height: 400 },
                color: 0x2a2a2a,
                walls: [
                    // Building outer walls
                    { x: 700, y: 250, width: 16 * 32, height: 32 },    // Top
                    { x: 700, y: 250 + 12 * 32, width: 16 * 32, height: 32 },    // Bottom
                    { x: 700 + 15 * 32, y: 250, width: 32, height: 13 * 32 },   // Right

                    // Left wall with entrance gap
                    { x: 700, y: 250, width: 32, height: 5 * 32 },    // Top part of left wall
                    { x: 700, y: 250 + 7 * 32, width: 32, height: 6 * 32 }     // Bottom part of left wall
                    // Gap from y:400 to y:500 is the entrance
                ]
            },

            room: {
                bounds: { x: 700, y: 250, width: 11 * 32, height: 5 * 32 },
                color: 0x301e1e,
                walls: [
                    // Building outer walls
                    { x: 700 + 3 * 32, y: 250 + 4 * 32, width: 9 * 32, height: 32 },    // Bottom
                    { x: 700 + 11 * 32, y: 250, width: 32, height: 5 * 32 },   // Right
                ]
            }
        }
    }
};

// Instructions for creating image-based maps:
/*
To create a new map:

1. Create a folder: /maps/your-map-name/

2. Create these images (all same dimensions):
   
   a) display.png - What the map looks like
      - Draw your map visually
      - This is what players see
   
   b) collision.png - Collision data
      - Transparent pixels (alpha = 0) = walkable
      - Any other color/opacity = blocked/wall
      - Draw walls, obstacles, etc. in any color
   
   c) room-[name].png - Room boundaries (one per room)
      - Transparent = not in this room
      - Any color/opacity = inside this room
      - Create separate files for each room:
        * room-truck.png
        * room-hallway.png
        * room-bedroom.png
        etc.

3. Add configuration to this file:
   {
       type: 'image',
       spawn: { x: 100, y: 100 },
       layers: {
           display: 'maps/your-map-name/display.png',
           collision: 'maps/your-map-name/collision.png',
           rooms: {
               truck: 'maps/your-map-name/room-truck.png',
               bedroom: 'maps/your-map-name/room-bedroom.png'
           }
       }
   }

Tips:
- Use transparent PNG files
- All images must be the same size
- Keep images reasonable size (1000-2000px max for performance)
- Use an image editor like GIMP, Photoshop, or Aseprite
- For collision layer, just paint over areas where you want walls
- For room layers, paint the entire room area in any color
*/
