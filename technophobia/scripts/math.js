// Math utility functions

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(start, end, t) {
    return start + (end - start) * t;
}
