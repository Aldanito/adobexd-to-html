"use strict";

/**
 * Map AGC layout + fill/stroke into CSS declarations.
 * Typography lives in agc-text-style.js.
 */

var agcColor = require("./agc-color");
var agcTextStyle = require("./agc-text-style");

/**
 * Absolute layout declarations.
 * @param {{x:number,y:number}} pos
 * @param {{width:number,height:number,radius:string|null}} size
 * @returns {Object.<string,string>}
 */
function layoutDecls(pos, size) {
    var map = {
        position: "absolute",
        left: Math.round(pos.x * 100) / 100 + "px",
        top: Math.round(pos.y * 100) / 100 + "px",
        width: Math.round(size.width * 100) / 100 + "px",
        height: Math.round(size.height * 100) / 100 + "px",
        "box-sizing": "border-box"
    };
    if (size.radius) {
        map["border-radius"] = size.radius;
    }
    return map;
}

/**
 * Visual style from AGC style object (fill, stroke, opacity, shadows).
 * @param {*} style
 * @returns {Object.<string,string>}
 */
function visualDecls(style) {
    var map = {};
    if (!style) {
        return map;
    }

    if (typeof style.opacity === "number" && style.opacity < 0.999) {
        map.opacity = String(Math.round(style.opacity * 1000) / 1000);
    }

    var fillCss = agcColor.agcFillToCss(style.fill);
    if (fillCss) {
        map["background-color"] = fillCss;
    }

    var stroke = style.stroke;
    if (stroke && stroke.type === "solid" && stroke.width > 0) {
        var sw = stroke.width;
        map.outline =
            sw + "px solid " + agcColor.agcColorToCss(stroke.color);
        map["outline-offset"] = -sw / 2 + "px";
    }

    if (style.filters && style.filters.length) {
        var parts = [];
        style.filters.forEach(function (f) {
            if (f.type !== "dropShadow" || !f.params || !f.params.dropShadows) {
                return;
            }
            f.params.dropShadows.forEach(function (s) {
                parts.push(
                    (s.dx || 0) +
                        "px " +
                        (s.dy || 0) +
                        "px " +
                        (s.r || 0) +
                        "px " +
                        agcColor.agcColorToCss(s.color)
                );
            });
        });
        if (parts.length) {
            map["box-shadow"] = parts.join(", ");
        }
    }

    return map;
}

module.exports = {
    layoutDecls: layoutDecls,
    visualDecls: visualDecls,
    textDecls: agcTextStyle.textDecls
};
