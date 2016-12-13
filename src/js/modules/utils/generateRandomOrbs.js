var generateRandomOrbs = function (count, factor) {
    var _place;
    if (count === 1) {
        _place = function() { return true };
    } else {
        _place = function () {
            return Math.random() < 0.5 ? true : false;
        };
    }
    var orb_placement = [];

    var y0 = WALL_LENGTH / 2;
    var step = Math.round(WALL_LENGTH / factor);
    var x0, cy, cx;
    for (var y = 0; y < factor; y++) {
        cy = y0 - Math.round(step / 2);
        x0 = -WALL_LENGTH / 2;
        for (var x = 0; x < factor; x++) {
            if (_place() === true && count > 0) {
                count--;
                cx = x0 + Math.round(step / 2);
                orb_placement.push({
                    x: cx,
                    y: cy,
                    r: Math.round(step * (0.2 + Math.random() * 0.3))
                });
            }
            x0 += step;
        }
        y0 -= step;
    }
    return orb_placement;
};