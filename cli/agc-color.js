"use strict";

/**
 * Convert AGC color / fill objects to CSS values.
 */

/**
 * @param {*} color AGC color { mode, value:{r,g,b}, alpha? }
 * @returns {string}
 */
function agcColorToCss(color) {
    if (!color) {
        return "transparent";
    }
    if (typeof color === "number") {
        return packedArgbToCss(color);
    }
    if (color.value != null && typeof color.value === "number") {
        return packedArgbToCss(color.value);
    }
    if (!color.value) {
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
        var cx = Math.round((gradient.cx != null ? gradient.cx : 0.5) * 100);
        var cy = Math.round((gradient.cy != null ? gradient.cy : 0.5) * 100);
        return "radial-gradient(circle at " + cx + "% " + cy + "%, " + stops + ")";
    }
    var angle = Math.round((gradient.rotation || 0) + 90);
    return "linear-gradient(" + angle + "deg, " + stops + ")";
}

/**
 * Packed 0xAARRGGBB (AGC rangedStyle.fill.value).
 * @param {number} n
 * @returns {string}
 */
function packedArgbToCss(n) {
    var v = n >>> 0;
    var a = ((v >>> 24) & 255) / 255;
    var r = (v >>> 16) & 255;
    var g = (v >>> 8) & 255;
    var b = v & 255;
    a = Math.round(a * 1000) / 1000;
    if (a >= 0.999) {
        return (
            "#" +
            ((1 << 24) + (r << 16) + (g << 8) + b)
                .toString(16)
                .slice(1)
                .toUpperCase()
        );
    }
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
}

module.exports = {
    agcColorToCss: agcColorToCss,
    agcFillToCss: agcFillToCss,
    packedArgbToCss: packedArgbToCss
};
