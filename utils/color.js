/**
 * Convert Adobe XD Color objects into CSS rgba/hex values.
 */

/**
 * @param {*} color XD Color-like object with r,g,b,a (0–255)
 * @param {number} [opacity=1] Additional opacity multiplier (0–1)
 * @returns {string}
 */
function colorToCss(color, opacity) {
    if (!color) {
        return "transparent";
    }
    var alpha = typeof opacity === "number" ? opacity : 1;
    if (typeof color.a === "number") {
        alpha = alpha * (color.a / 255);
    }
    var r = Math.round(color.r || 0);
    var g = Math.round(color.g || 0);
    var b = Math.round(color.b || 0);
    alpha = Math.round(alpha * 1000) / 1000;
    if (alpha >= 0.999) {
        return (
            "#" +
            ((1 << 24) + (r << 16) + (g << 8) + b)
                .toString(16)
                .slice(1)
                .toUpperCase()
        );
    }
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

/**
 * Convert solid Color or gradient fill to a CSS background/color value.
 * @param {*} fill
 * @param {number} [opacity=1]
 * @returns {string|null}
 */
function fillToCss(fill, opacity) {
    if (!fill) {
        return null;
    }
    var op = typeof opacity === "number" ? opacity : 1;
    if (typeof fill.r === "number" && typeof fill.g === "number") {
        return colorToCss(fill, op);
    }
    if (fill.colorStops && fill.startX !== undefined && fill.endX !== undefined) {
        return require("./gradient").linearGradientToCss(fill, op);
    }
    if (fill.colorStops && fill.startR !== undefined) {
        return require("./gradient").radialGradientToCss(fill, op);
    }
    return null;
}

module.exports = {
    colorToCss: colorToCss,
    fillToCss: fillToCss
};
