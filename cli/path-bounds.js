"use strict";

/**
 * Parse SVG path `d` and compute axis-aligned bounds from endpoint/control points.
 */

var CMD_ARGS = {
    M: 2,
    L: 2,
    H: 1,
    V: 1,
    C: 6,
    S: 4,
    Q: 4,
    T: 2,
    A: 7,
    Z: 0
};

/**
 * @param {string} d
 * @returns {{width:number,height:number,radius:null,pathMinX:number,pathMinY:number,pathMaxX:number,pathMaxY:number}}
 */
function pathBounds(d) {
    var xs = [];
    var ys = [];
    var tokens = String(d || "").match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
    var i = 0;
    var cmd = "M";
    var cx = 0;
    var cy = 0;
    var startX = 0;
    var startY = 0;

    while (i < tokens.length) {
        var t = tokens[i];
        if (/^[a-zA-Z]$/.test(t)) {
            cmd = t;
            i += 1;
        }
        var upper = cmd.toUpperCase();
        var argc = CMD_ARGS[upper];
        if (argc === undefined) {
            i += 1;
            continue;
        }
        if (upper === "Z") {
            cx = startX;
            cy = startY;
            continue;
        }
        if (i + argc > tokens.length) {
            break;
        }
        var args = [];
        for (var a = 0; a < argc; a++) {
            args.push(parseFloat(tokens[i + a]));
        }
        i += argc;
        var rel = cmd === cmd.toLowerCase();

        if (upper === "H") {
            cx = rel ? cx + args[0] : args[0];
            xs.push(cx);
            ys.push(cy);
        } else if (upper === "V") {
            cy = rel ? cy + args[0] : args[0];
            xs.push(cx);
            ys.push(cy);
        } else if (upper === "A") {
            var rx = Math.abs(args[0] || 0);
            var ry = Math.abs(args[1] || 0);
            var ex = rel ? cx + args[5] : args[5];
            var ey = rel ? cy + args[6] : args[6];
            xs.push(cx, ex, cx - rx, cx + rx, ex - rx, ex + rx);
            ys.push(cy, ey, cy - ry, cy + ry, ey - ry, ey + ry);
            cx = ex;
            cy = ey;
        } else {
            // pairs of x,y including control points (conservative bbox)
            for (var p = 0; p + 1 < args.length; p += 2) {
                var px = rel ? cx + args[p] : args[p];
                var py = rel ? cy + args[p + 1] : args[p + 1];
                xs.push(px);
                ys.push(py);
            }
            cx = rel ? cx + args[args.length - 2] : args[args.length - 2];
            cy = rel ? cy + args[args.length - 1] : args[args.length - 1];
            if (upper === "M") {
                startX = cx;
                startY = cy;
            }
        }
    }

    if (!xs.length) {
        return {
            width: 24,
            height: 24,
            radius: null,
            pathMinX: 0,
            pathMinY: 0,
            pathMaxX: 24,
            pathMaxY: 24
        };
    }
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxY = Math.max.apply(null, ys);
    return {
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
        radius: null,
        pathMinX: minX,
        pathMinY: minY,
        pathMaxX: maxX,
        pathMaxY: maxY
    };
}

module.exports = {
    pathBounds: pathBounds
};
