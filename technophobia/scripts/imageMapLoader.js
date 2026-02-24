// Image-based map loader
// Loads display, collision, and room layers from images

export class ImageMapLoader {
    constructor() {
        this.displayLayer = null;
        this.collisionLayer = null;
        this.roomLayers = {};
        this.mapWidth = 0;
        this.mapHeight = 0;
    }

    // Load all map layers
    async loadMap(mapConfig) {
        const promises = [];

        // Load display layer
        if (mapConfig.displayLayer) {
            promises.push(
                this.loadImage(mapConfig.displayLayer).then(img => {
                    this.displayLayer = img;
                    this.mapWidth = img.width;
                    this.mapHeight = img.height;
                })
            );
        }

        // Load collision layer
        if (mapConfig.collisionLayer) {
            promises.push(
                this.loadImage(mapConfig.collisionLayer).then(img => {
                    this.collisionLayer = img;
                })
            );
        }

        // Load room layers
        if (mapConfig.roomLayers) {
            for (let roomName in mapConfig.roomLayers) {
                promises.push(
                    this.loadImage(mapConfig.roomLayers[roomName]).then(img => {
                        this.roomLayers[roomName] = img;
                    })
                );
            }
        }

        await Promise.all(promises);
        console.log(`Map loaded: ${this.mapWidth}x${this.mapHeight}`);

        return this;
    }

    // Load an image and return it
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // Check if a pixel in the collision layer is walkable
    // Transparent (alpha = 0) = walkable, anything else = blocked
    isWalkable(x, y) {
        if (!this.collisionLayer) return true;

        // Clamp to image bounds
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return false;
        }

        // Get pixel data from collision layer
        const canvas = document.createElement('canvas');
        canvas.width = this.collisionLayer.width;
        canvas.height = this.collisionLayer.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.collisionLayer, 0, 0);

        const imageData = ctx.getImageData(x, y, 1, 1);
        const alpha = imageData.data[3]; // Alpha channel

        return alpha === 0; // Transparent = walkable
    }

    // Check if a position is inside a specific room
    // Any non-transparent pixel = inside room
    isInRoom(x, y, roomName) {
        const roomLayer = this.roomLayers[roomName];
        if (!roomLayer) return false;

        // Clamp to image bounds
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || y < 0 || x >= roomLayer.width || y >= roomLayer.height) {
            return false;
        }

        // Get pixel data from room layer
        const canvas = document.createElement('canvas');
        canvas.width = roomLayer.width;
        canvas.height = roomLayer.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(roomLayer, 0, 0);

        const imageData = ctx.getImageData(x, y, 1, 1);
        const alpha = imageData.data[3]; // Alpha channel

        return alpha > 0; // Non-transparent = inside room
    }

    // Get all rooms a position is in
    getRoomsAt(x, y) {
        const rooms = [];
        for (let roomName in this.roomLayers) {
            if (this.isInRoom(x, y, roomName)) {
                rooms.push(roomName);
            }
        }
        return rooms.length > 0 ? rooms : ['outside'];
    }

    // Create PIXI sprite from display layer
    createDisplaySprite() {
        if (!this.displayLayer) return null;

        const texture = PIXI.Texture.from(this.displayLayer);
        const sprite = new PIXI.Sprite(texture);
        return sprite;
    }

    // Pre-cache collision data for better performance
    cacheCollisionData() {
        if (!this.collisionLayer) return;

        const canvas = document.createElement('canvas');
        canvas.width = this.collisionLayer.width;
        canvas.height = this.collisionLayer.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.collisionLayer, 0, 0);

        this.collisionData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log('Collision data cached');
    }

    // Optimized collision check using cached data
    isWalkableCached(x, y) {
        if (!this.collisionData) return true;

        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return false;
        }

        const index = (y * this.mapWidth + x) * 4 + 3; // Alpha channel index
        return this.collisionData.data[index] === 0; // Transparent = walkable
    }

    // Cache room data for better performance
    cacheRoomData() {
        this.roomDataCache = {};

        for (let roomName in this.roomLayers) {
            const roomLayer = this.roomLayers[roomName];
            const canvas = document.createElement('canvas');
            canvas.width = roomLayer.width;
            canvas.height = roomLayer.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(roomLayer, 0, 0);

            let room = {};
            room.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.roomDataCache[roomName] = room;
        }

        let room = this.roomDataCache['building']
        let minX = Number.MAX_VALUE
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        for (let idx = 0; idx < room.imageData.data.length; idx += 4) {
            let empty = true;
            for (let colorIdx = 0; colorIdx < 4; colorIdx++) {
                let val = room.imageData.data[idx + colorIdx];
                if (val > 0)  empty = false;
            }

            if (empty) continue;
            let pixelIdx = Math.floor(idx / 4);
            let x = pixelIdx % room.imageData.width;
            let y = Math.floor(pixelIdx / room.imageData.width);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        room.bounds = {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
        console.log('Room data cached for:', Object.keys(this.roomDataCache));
    }

    // Optimized room check using cached data
    isInRoomCached(x, y, roomName) {
        const roomData = this.roomDataCache[roomName];
        if (!roomData) return false;

        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
            return false;
        }

        const index = (y * this.mapWidth + x) * 4 + 3; // Alpha channel index
        return roomData.imageData.data[index] > 0; // Non-transparent = inside room
    }

    getRoomsAtCached(x, y) {
        const rooms = [];
        for (let roomName in this.roomDataCache) {
            if (this.isInRoomCached(x, y, roomName)) {
                rooms.push(roomName);
            }
        }
        return rooms.length > 0 ? rooms : ['outside'];
    }
}
