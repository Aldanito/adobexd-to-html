"use strict";

/**
 * Nested AGC → SVG matching Scenegraph transforms.
 */

var nodeSvg = require("./node-svg");
var fonts = require("./fonts");
var htmlUtils = require("../../exporter/html-utils");

/**
 * @param {*} artboardNode
 * @param {*} ctx artboard, assets, skipNodes, assetPathKey
 * @returns {{svg:string, fontCss:string, ctx:*}}
 */
function artboardToSvg(artboardNode, ctx) {
    ctx.defs = ctx.defs || [];
    ctx.idSeq = ctx.idSeq || 0;
    ctx.fonts = ctx.fonts || {};
    var bg =
        ctx.background ||
        "#FFFFFF";
    var w = ctx.artboard.width;
    var h = ctx.artboard.height;
    var children =
        (artboardNode.artboard && artboardNode.artboard.children) || [];
    var body = children
        .map(function (child) {
            return nodeSvg.nodeToSvg(child, ctx, true);
        })
        .join("");
    var style = fonts.fontFaceCss(ctx, ctx.fontFiles || {});
    if (style) {
        ctx.defs.unshift("<style>" + style + "</style>");
    }
    var defs =
        ctx.defs.length > 0 ? "<defs>" + ctx.defs.join("") + "</defs>" : "";
    var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' +
        w +
        '" height="' +
        h +
        '" viewBox="0 0 ' +
        w +
        " " +
        h +
        '" overflow="hidden">' +
        '<rect width="100%" height="100%" fill="' +
        htmlUtils.escapeHtml(bg) +
        '"/>' +
        defs +
        body +
        "</svg>";
    return { svg: svg, fontCss: style, ctx: ctx };
}

module.exports = {
    artboardToSvg: artboardToSvg,
    fonts: fonts
};
