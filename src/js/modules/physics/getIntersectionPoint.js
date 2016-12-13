var getIntersectionPoint = function (x0, y0, r0, x1, y1, r1) {
    var dx, dy, d, dapp, a;
    var ip = {
        approach: false,
        collide: false
    };

    dx = x1 - x0;
    dy = y1 - y0;

    d = Math.sqrt((dy * dy) + (dx * dx));
    dapp = d - (r0 + r1);
    ip.approach = dapp < APPROACH_DISTANCE ? true : false;
    if (d > (r0 + r1)) {
        return ip;
    }
    if (d < Math.abs(r0 - r1)) {
        return ip;
    }

    if (d <= 0) {
        return ip;
    }

    a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

    ip.collide = true;
    ip.x = x0 + (dx * a / d);
    ip.y = y0 + (dy * a / d);
    return ip;
};