/**
 * Detect ImageFill and vector-like nodes for asset export.
 */

var ImageFill;
try {
    ImageFill = require("scenegraph").ImageFill;
} catch (e) {
    ImageFill = null;
}

/**
 * @param {*} node
 * @returns {boolean}
 */
function hasImageFill(node) {
    if (!node || node.fill == null || node.fillEnabled === false) {
        return false;
    }
    if (ImageFill && node.fill instanceof ImageFill) {
        return true;
    }
    var f = node.fill;
    // Solid Color
    if (typeof f.r === "number" && typeof f.g === "number") {
        return false;
    }
    // Gradients expose colorStops
    if (f.colorStops) {
        return false;
    }
    // Remaining fill objects are typically ImageFill
    return typeof f === "object";
}

/**
 * True for path/boolean/polygon shapes that should become SVG/PNG icons.
 * @param {*} node
 * @returns {boolean}
 */
function isVectorShape(node) {
    var type = node.constructor && node.constructor.name;
    return (
        type === "Path" ||
        type === "BooleanGroup" ||
        type === "Polygon" ||
        type === "Line"
    );
}

module.exports = {
    hasImageFill: hasImageFill,
    isVectorShape: isVectorShape
};
