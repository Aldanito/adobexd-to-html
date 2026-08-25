/**
 * Geometry helpers for absolute 1:1 layout relative to an artboard origin.
 */

/**
 * Bounds of a node relative to the artboard's top-left (global space).
 * @param {*} node
 * @param {{x:number,y:number}} artboardOrigin artboard.globalBounds x/y
 * @returns {{left:number,top:number,width:number,height:number}}
 */
function relativeBounds(node, artboardOrigin) {
    var gb = node.globalBounds;
    return {
        left: Math.round((gb.x - artboardOrigin.x) * 100) / 100,
        top: Math.round((gb.y - artboardOrigin.y) * 100) / 100,
        width: Math.round(gb.width * 100) / 100,
        height: Math.round(gb.height * 100) / 100
    };
}

/**
 * CSS border-radius from XD effectiveCornerRadii or uniform cornerRadii.
 * @param {*} node
 * @returns {string|null}
 */
function cornerRadiiCss(node) {
    var r = node.effectiveCornerRadii || node.cornerRadii;
    if (!r) {
        if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
            return node.cornerRadius + "px";
        }
        return null;
    }
    var tl = r.topLeft || 0;
    var tr = r.topRight || 0;
    var br = r.bottomRight || 0;
    var bl = r.bottomLeft || 0;
    if (tl === 0 && tr === 0 && br === 0 && bl === 0) {
        return null;
    }
    if (tl === tr && tr === br && br === bl) {
        return tl + "px";
    }
    return tl + "px " + tr + "px " + br + "px " + bl + "px";
}

/**
 * Approximate gap between two sibling bounds along an axis (for flex hints).
 * @param {{left:number,top:number,width:number,height:number}} a
 * @param {{left:number,top:number,width:number,height:number}} b
 * @param {"x"|"y"} axis
 * @returns {number}
 */
function gapBetween(a, b, axis) {
    if (axis === "x") {
        return Math.max(0, b.left - (a.left + a.width));
    }
    return Math.max(0, b.top - (a.top + a.height));
}

module.exports = {
    relativeBounds: relativeBounds,
    cornerRadiiCss: cornerRadiiCss,
    gapBetween: gapBetween
};
