"use strict";

var agcColor = require("../agc-color");

/**
 * CSS color from AGC RGB object or packed ARGB uint.
 * @param {*} color
 * @returns {string}
 */
function colorToCss(color) {
    if (color == null) {
        return "transparent";
    }
    if (typeof color === "number") {
        return agcColor.packedArgbToCss(color);
    }
    if (color.value != null && typeof color.value === "number") {
        return agcColor.packedArgbToCss(color.value);
    }
    return agcColor.agcColorToCss(color);
}

module.exports = {
    colorToCss: colorToCss
};
