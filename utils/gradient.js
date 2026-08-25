/**
 * XD linear / radial gradient → CSS gradient strings.
 */

var colorToCss = require("./color").colorToCss;

/**
 * @param {*} gradient XD LinearGradient
 * @param {number} opacity
 * @returns {string}
 */
function linearGradientToCss(gradient, opacity) {
    var dx = (gradient.endX || 0) - (gradient.startX || 0);
    var dy = (gradient.endY || 0) - (gradient.startY || 0);
    var angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
    var stops = (gradient.colorStops || [])
        .map(function (stop) {
            var pct = Math.round((stop.stop || 0) * 100);
            return colorToCss(stop.color, opacity) + " " + pct + "%";
        })
        .join(", ");
    return "linear-gradient(" + angleDeg + "deg, " + stops + ")";
}

/**
 * @param {*} gradient XD RadialGradient
 * @param {number} opacity
 * @returns {string}
 */
function radialGradientToCss(gradient, opacity) {
    var cx = Math.round((gradient.startX || 0.5) * 100);
    var cy = Math.round((gradient.startY || 0.5) * 100);
    var stops = (gradient.colorStops || [])
        .map(function (stop) {
            var pct = Math.round((stop.stop || 0) * 100);
            return colorToCss(stop.color, opacity) + " " + pct + "%";
        })
        .join(", ");
    return "radial-gradient(circle at " + cx + "% " + cy + "%, " + stops + ")";
}

module.exports = {
    linearGradientToCss: linearGradientToCss,
    radialGradientToCss: radialGradientToCss
};
