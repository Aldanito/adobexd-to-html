/**
 * Build a declaration map for non-text visual styles on an XD node.
 */

var color = require("../utils/color");
var geometry = require("../utils/geometry");

/**
 * Absolute position + size relative to artboard.
 * @param {{left:number,top:number,width:number,height:number}} bounds
 * @returns {Object.<string,string>}
 */
function layoutStyleMap(bounds) {
    return {
        position: "absolute",
        left: bounds.left + "px",
        top: bounds.top + "px",
        width: bounds.width + "px",
        height: bounds.height + "px",
        "box-sizing": "border-box"
    };
}

/**
 * Fills, strokes, shadows, opacity, blend, radii for a shape-like node.
 * @param {*} node
 * @returns {Object.<string,string>}
 */
function visualStyleMap(node) {
    var map = {};
    var op = typeof node.opacity === "number" ? node.opacity : 1;

    if (op < 0.999) {
        map.opacity = String(Math.round(op * 1000) / 1000);
    }

    if (node.blendMode && node.blendMode !== "normal" && node.blendMode !== "pass-through") {
        map["mix-blend-mode"] = String(node.blendMode).replace(/_/g, "-");
    }

    var fillCss = color.fillToCss(node.fill, 1);
    if (fillCss) {
        if (fillCss.indexOf("gradient") !== -1) {
            map.background = fillCss;
        } else {
            map["background-color"] = fillCss;
        }
    }

    if (node.strokeEnabled !== false && node.stroke && node.strokeWidth > 0) {
        var strokeCss = color.fillToCss(node.stroke, 1) || color.colorToCss(node.stroke, 1);
        map.border =
            node.strokeWidth +
            "px solid " +
            (strokeCss || "transparent");
        if (node.strokeDashArray && node.strokeDashArray.length) {
            map["border-style"] =
                node.strokeDashArray[0] <= 2 ? "dotted" : "dashed";
        }
    }

    var radius = geometry.cornerRadiiCss(node);
    if (radius) {
        map["border-radius"] = radius;
    }

    if (node.shadow && node.shadow.visible !== false) {
        map["box-shadow"] = shadowToCss(node.shadow);
    }

    if (node.blur && node.blur.visible !== false) {
        var blurPx = (node.blur.blurAmount || node.blur.value || 0) + "px";
        if (node.blur.isBackgroundEffect) {
            map["backdrop-filter"] = "blur(" + blurPx + ")";
        } else {
            map.filter = "blur(" + blurPx + ")";
        }
    }

    if (node.mask) {
        map.overflow = "hidden";
    }

    return map;
}

/**
 * @param {*} shadow
 * @returns {string}
 */
function shadowToCss(shadow) {
    var inset = shadow.shadowType === "inner" || shadow.type === "InnerShadow" ? "inset " : "";
    var c = color.colorToCss(shadow.color, 1);
    return (
        inset +
        (shadow.x || 0) +
        "px " +
        (shadow.y || 0) +
        "px " +
        (shadow.blur || 0) +
        "px " +
        c
    );
}

module.exports = {
    layoutStyleMap: layoutStyleMap,
    visualStyleMap: visualStyleMap
};
