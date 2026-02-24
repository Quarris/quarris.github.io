# Creating Image-Based Maps

The game now supports two types of maps:
1. **Coordinate-based** (current system) - Define walls and rooms with coordinates
2. **Image-based** (new system) - Draw maps using images

## Image-Based Maps (Recommended)

### Overview
Instead of defining walls and rooms with coordinates, you can draw them as images! This makes map creation much more intuitive.

### Required Files

For each map, you need 3 types of images (all must be the same dimensions):

1. **Display Layer** - What players see
2. **Collision Layer** - Where players can walk
3. **Room Layers** - Define room boundaries (one image per room)

### Step-by-Step Guide

#### 1. Create Display Layer (`display.png`)
- Draw what the map looks like
- This is the visual representation players see
- Use any art style you want
- Include floors, walls, furniture, decorations, etc.

#### 2. Create Collision Layer (`collision.png`)
- **Transparent pixels (alpha = 0)** = walkable areas
- **Any other color/opacity** = walls/obstacles
- Paint over walls, furniture, and any obstacle
- The color doesn't matter, only transparency

**Example:**
```
- Floor areas: Fully transparent
- Walls: Any color (red, black, etc.)
- Furniture: Any color
```

#### 3. Create Room Layers (`room-[name].png`)
- One image file per room
- **Transparent** = not in this room
- **Any color/opacity** = inside this room
- Paint the entire room area

**Example files:**
- `room-truck.png` - Paint where the truck is
- `room-hallway.png` - Paint the hallway area
- `room-bedroom.png` - Paint the bedroom area
- `room-kitchen.png` - Paint the kitchen area

### Folder Structure
```
/maps/
  /your-map-name/
    display.png        # Visual layer
    collision.png      # Collision layer
    room-truck.png     # Truck room
    room-hallway.png   # Hallway room
    room-bedroom.png   # Bedroom room
    room-kitchen.png   # Kitchen room
```

### Configuration

Add your map to `mapConfig.js`:

```javascript
yourMap: {
    type: 'image',
    spawn: { x: 100, y: 100 },  // Starting position
    layers: {
        display: 'maps/your-map-name/display.png',
        collision: 'maps/your-map-name/collision.png',
        rooms: {
            truck: 'maps/your-map-name/room-truck.png',
            hallway: 'maps/your-map-name/room-hallway.png',
            bedroom: 'maps/your-map-name/room-bedroom.png',
            kitchen: 'maps/your-map-name/room-kitchen.png'
        }
    }
}
```

### Tools You Can Use

- **GIMP** (Free) - Full-featured image editor
- **Aseprite** (Paid) - Great for pixel art
- **Paint.NET** (Free, Windows) - Simple and effective
- **Photoshop** (Paid) - Professional tool
- **Krita** (Free) - Digital painting focused

### Tips

1. **Same dimensions**: All images MUST be the same size
2. **PNG format**: Use PNG for transparency support
3. **Reasonable size**: Keep images 1000-2000px max for performance
4. **Grid size**: The pathfinding grid is 16px, so consider this when drawing
5. **Layers workflow**: 
   - Draw display layer first
   - Copy it to create collision layer
   - Paint over walls in collision layer
   - Copy display layer again for each room
   - Paint room areas in room layers

### Testing Your Map

1. Add your map to `mapConfig.js`
2. In `main.js`, load your map:
   ```javascript
   import { maps } from './mapConfig.js';
   const map = await createMap(maps.yourMapName);
   ```
3. Test collision by walking around
4. Toggle debug mode (press P) to see pathfinding grid

### Example Workflow in GIMP

1. Create new image (e.g., 1200x800px)
2. Draw your map layout
3. Export as `display.png`
4. Duplicate the layer
5. Use selection tools to select walkable areas
6. Invert selection and delete (makes walls solid, floor transparent)
7. Export as `collision.png`
8. For each room:
   - Create new transparent layer
   - Paint the room area
   - Export as `room-[name].png`

## Benefits of Image-Based Maps

✅ Visual map creation - see what you're making
✅ No coordinate calculations
✅ Easy to modify and iterate
✅ Support for complex shapes
✅ Faster map creation
✅ Artist-friendly workflow

## Current System Still Works

The coordinate-based system (mapData.js) still works for backwards compatibility. You can use whichever system you prefer!
