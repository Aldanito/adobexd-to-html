"use strict";

/**
 * Emit HTML for AGC text and shape nodes (paths → agc-emit-path).
 */

var htmlUtils = require("../exporter/html-utils");
var semantic = require("../exporter/semantic");
var agcStyle = require("./agc-style");
var agcColor = require("./agc-color");
var agcTextLayout = require("./agc-text-layout");

/**
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} pos
 * @param {*} size
 * @param {*} ctx
 * @returns {string}
 */
function emitText(node, className, pos, size, ctx, extraDecls, rawOverride) {
    var box = rawOverride
        ? { pos: pos, size: size }
        : agcTextLayout.textBox(node, pos, size);
    var decls = htmlUtils.mergeStyles(
        agcStyle.layoutDecls(box.pos, box.size),
        agcStyle.textDecls(node),
        extraDecls || {}
    );
    ctx.sheet.add("." + className, decls);
    var tag = semantic.pickTag(node.name, "Text");
    var text =
        rawOverride != null
            ? htmlUtils.escapeHtml(rawOverride)
            : agcTextLayout.formattedHtml(node, htmlUtils.escapeHtml);
    return "<" + tag + ' class="' + className + '">' + text + "</" + tag + ">";
}

/**
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} pos
 * @param {*} size
 * @param {*} ctx
 * @returns {string}
 */
function emitShape(node, className, pos, size, ctx) {
    if (node.shape && node.shape.type === "line") {
        return emitLine(node, className, pos, ctx);
    }
    var decls = htmlUtils.mergeStyles(
        agcStyle.layoutDecls(pos, size),
        agcStyle.visualDecls(node.style)
    );
    ctx.sheet.add("." + className, decls);
    var tag = semantic.pickTag(node.name, "Rectangle");
    return "<" + tag + ' class="' + className + '"></' + tag + ">";
}

/**
 * Stroke lines (X, chevron, rules) as SVG — a filled div is a solid box.
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} pos
 * @param {*} ctx
 * @returns {string}
 */
function emitLine(node, className, pos, ctx) {
    var s = node.shape || {};
    var x1 = s.x1 || 0;
    var y1 = s.y1 || 0;
    var x2 = s.x2 || 0;
    var y2 = s.y2 || 0;
    var stroke = node.style && node.style.stroke;
    var sw = (stroke && stroke.width) || 1;
    var pad = Math.max(sw, 0.5);
    var minX = Math.min(x1, x2) - pad;
    var minY = Math.min(y1, y2) - pad;
    var width = Math.max(Math.abs(x2 - x1) + pad * 2, pad * 2);
    var height = Math.max(Math.abs(y2 - y1) + pad * 2, pad * 2);
    var decls = agcStyle.layoutDecls(
        { x: pos.x + minX, y: pos.y + minY },
        { width: width, height: height, radius: null }
    );
    decls.overflow = "visible";
    ctx.sheet.add("." + className, decls);
    var color =
        stroke && stroke.type === "solid"
            ? agcColor.agcColorToCss(stroke.color)
            : "#000";
    return (
        '<svg class="' +
        className +
        '" width="' +
        width +
        '" height="' +
        height +
        '" viewBox="' +
        minX +
        " " +
        minY +
        " " +
        width +
        " " +
        height +
        '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<line x1="' +
        x1 +
        '" y1="' +
        y1 +
        '" x2="' +
        x2 +
        '" y2="' +
        y2 +
        '" fill="none" stroke="' +
        color +
        '" stroke-width="' +
        sw +
        '" stroke-linecap="round" />' +
        "</svg>"
    );
}

module.exports = {
    emitText: emitText,
    emitShape: emitShape
};
