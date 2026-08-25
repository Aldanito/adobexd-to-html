"use strict";

/**
 * Emit <img> for AGC pattern/bitmap fills.
 */

var htmlUtils = require("../exporter/html-utils");
var agcStyle = require("./agc-style");

/**
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} drawPos
 * @param {*} size
 * @param {*} ctx
 * @returns {string}
 */
function emitPattern(node, className, drawPos, size, ctx) {
    var asset = ctx.assets.copyPatternFill(
        node.style.fill,
        className,
        ctx.assetCategory || "images"
    );
    var pathKey = ctx.assetPathKey || "relFromArtboards";
    var src = asset && asset[pathKey];
    var imgDecls = htmlUtils.mergeStyles(
        agcStyle.layoutDecls(drawPos, size),
        agcStyle.visualDecls(node.style)
    );
    delete imgDecls["background-color"];
    ctx.sheet.add("." + className, imgDecls);
    if (!src) {
        return "";
    }
    return (
        '<img class="' +
        className +
        '" src="' +
        htmlUtils.escapeHtml(src) +
        '" alt="' +
        htmlUtils.escapeHtml(node.name || "") +
        '" />'
    );
}

module.exports = {
    emitPattern: emitPattern
};
