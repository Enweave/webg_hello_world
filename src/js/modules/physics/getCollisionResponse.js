var getCollisionResponse = function (e, a, b, ip) {
    var ma = a.volume;
    var mb = b.volume;
    var Ia = 1;
    var Ib = 1;

    var ra = {
        x: ip.x - a.x,
        y: ip.y - a.y
    };
    var rb = {
        x: ip.x - b.x,
        y: ip.y - b.y
    };

    var vai = a.velocity;
    var vbi = b.velocity;
    var k = 1 / (ma * ma) + 2 / (ma * mb) + 1 / (mb * mb) - ra.x * ra.x / (ma * Ia) - rb.x * rb.x / (ma * Ib) - ra.y * ra.y / (ma * Ia)
        - ra.y * ra.y / (mb * Ia) - ra.x * ra.x / (mb * Ia) - rb.x * rb.x / (mb * Ib) - rb.y * rb.y / (ma * Ib)
        - rb.y * rb.y / (mb * Ib) + ra.y * ra.y * rb.x * rb.x / (Ia * Ib) + ra.x * ra.x * rb.y * rb.y / (Ia * Ib) - 2 * ra.x * ra.y * rb.x * rb.y / (Ia * Ib);

    var Jx = ((e + 1) / k) * (
        (vai.x - vbi.x) * (1 / ma - ra.x * ra.x / Ia + 1 / mb - rb.x * rb.x / Ib)
    ) - ((e + 1) / k) * ((vai.y - vbi.y) * (ra.x * ra.y / Ia + rb.x * rb.y / Ib));
    var Jy = - ((e + 1) / k) * (
        (vai.x - vbi.x) * (ra.x * ra.y / Ia + rb.x * rb.y / Ib)
    ) + (e + 1) / k * (vai.y - vbi.y) * (1 / ma - ra.y * ra.y / Ia + 1 / mb - rb.y * rb.y / Ib);

    return {
        velocityA: {
            x: vai.x - Jx / ma,
            y: vai.y - Jy / ma
        },
        velocityB: {
            x: vbi.x + Jx / mb,
            y: vbi.y + Jy / mb
        }
    };
};