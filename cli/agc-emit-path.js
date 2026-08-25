"use strict";

/**
 * Emit a single path as SVG using a correct viewBox (no bogus translate).
 */

var htmlUtils = require("../exporter/html-utils");
var agcStyle = require("./agc-style");
var agcColor = require("./agc-color");
var pathBounds = require("./path-bounds").pathBounds;

/**
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} pos artboard-local position of the node
 * @param {*} size unused — recomputed
 * @param {*} ctx
 * @returns {string}
 */
function emitPath(node, className, pos, size, ctx) {
    var bounds = pathBounds((node.shape && node.shape.path) || "");
    // Place SVG so path local (0,0) aligns with node transform origin
    var left = pos.x + bounds.pathMinX;
    var top = pos.y + bounds.pathMinY;
    var decls = agcStyle.layoutDecls(
        { x: left, y: top },
        { width: bounds.width, height: bounds.height, radius: null }
    );
    decls.overflow = "visible";
    ctx.sheet.add("." + className, decls);
    var d = htmlUtils.escapeHtml(node.shape.path || "");
    return (
        '<svg class="' +
        className +
        '" width="' +
        bounds.width +
        '" height="' +
        bounds.height +
        '" viewBox="' +
        bounds.pathMinX +
        " " +
        bounds.pathMinY +
        " " +
        bounds.width +
        " " +
        bounds.height +
        '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        "<path d=\"" +
        d +
        '"' +
        svgPathAttrs(node) +
        " />" +
        "</svg>"
    );
}

/**
 * @param {*} node
 * @returns {string}
 */
function svgPathAttrs(node) {
    var fill = agcColor.agcFillToCss(node.style && node.style.fill);
    var stroke = node.style && node.style.stroke;
    var attrs = fill ? ' fill="' + fill + '"' : ' fill="none"';
    if (stroke && stroke.type === "solid" && stroke.width > 0) {
        attrs +=
            ' stroke="' +
            agcColor.agcColorToCss(stroke.color) +
            '" stroke-width="' +
            stroke.width +
            '"';
    } else if (!fill) {
        attrs = ' fill="#000"';
    }
    return attrs;
}

module.exports = {
    emitPath: emitPath,
    svgPathAttrs: svgPathAttrs
};
