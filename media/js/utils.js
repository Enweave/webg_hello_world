"use strict";

var MIN_VELOCITY = 0.1;

var clampVelocity = function (new_velocity) {
    return - MIN_VELOCITY < new_velocity && new_velocity < MIN_VELOCITY ? 0 : new_velocity;
    // return new_velocity;
};

var CollisionResponce = function (e, a, b) {

    var d = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

    var nx = (b.x - a.x) / d;
    var ny = (b.y - a.y) / d;
    
    var p = (1+e) * (a.velocity.x * nx + a.velocity.y * ny - b.velocity.x * nx - b.velocity.y * ny) /
        (a.volume + b.volume);
    return {
        velocityA: {
            x: a.velocity.x - p * a.volume * nx,
            y: a.velocity.y - p * a.volume * ny
        },
        velocityB: {
            x: b.velocity.x + p * b.volume * nx,
            y: b.velocity.y + p * b.volume * ny
        }

    };
};

// http://stackoverflow.com/questions/12219802/a-javascript-function-that-returns-the-x-y-points-of-intersection-between-two-ci
var getIntersectionPoint = function (x0, y0, r0, x1, y1, r1) {
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy * dy) + (dx * dx));

    /* Check for solvability. */
    if (d > (r0 + r1)) {
        /* no solution. circles do not intersect. */
        return -1;
    }
    if (d < Math.abs(r0 - r1)) {
        /* no solution. one circle is contained in the other */
        return 0;
    }

    if (d <= 0) {
        return -1;
    }
    
    return 1;
    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.  
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

    /* Determine the coordinates of point 2. */
    x2 = x0 + (dx * a / d);
    y2 = y0 + (dy * a / d);

    return { x: x2, y: y2 };
}