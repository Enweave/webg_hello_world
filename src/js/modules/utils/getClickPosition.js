var getClickPosition = function (event) {
    var rect = $screen[0].getBoundingClientRect();
    var w = $screen.width();
    var h = $screen.height();
    var x = (event.clientX - rect.left)/w * 2 - 1;
    var y = - ((event.clientY - rect.top)/h * 2) + 1;
    if (Math.abs(y)>1) {
        console.warn("mouse input not normalized!", event.clientY, rect.top, rect.bottom);
    }
    return {
        x: x,
        y: y
    };
};