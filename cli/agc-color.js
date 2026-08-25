"use strict";

/**
 * Convert AGC color / fill objects to CSS values.
 */

/**
 * @param {*} color AGC color { mode, value:{r,g,b}, alpha? }
 * @returns {string}
 */
function agcColorToCss(color) {
    if (!color || !color.value) {
        return "transparent";
    }
    var r = Math.round(color.value.r || 0);
    var g = Math.round(color.value.g || 0);
    var b = Math.round(color.value.b || 0);
    var alpha = typeof color.alpha === "number" ? color.alpha : 1;
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
 * @param {*} fill AGC style.fill
 * @returns {string|null}
 */
function agcFillToCss(fill) {
    if (!fill || fill.type === "none") {
        return null;
    }
    if (fill.type === "solid" && fill.color) {
        return agcColorToCss(fill.color);
    }
    if (fill.type === "gradient" && fill.gradient) {
        return gradientToCss(fill.gradient);
    }
    return null;
}

/**
 * @param {*} gradient
 * @returns {string}
 */
function gradientToCss(gradient) {
    var stops = (gradient.stops || [])
        .map(function (s) {
            var pct = Math.round((s.offset || 0) * 100);
            return agcColorToCss(s.color) + " " + pct + "%";
        })
        .join(", ");
    if (gradient.type === "radial") {
        return "radial-gradient(circle, " + stops + ")";
    }
    var angle = Math.round((gradient.rotation || 0) + 90);
    return "linear-gradient(" + angle + "deg, " + stops + ")";
}

module.exports = {
    agcColorToCss: agcColorToCss,
    agcFillToCss: agcFillToCss
};
