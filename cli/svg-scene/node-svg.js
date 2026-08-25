"use strict";

var matrix = require("./matrix");
var shapeSvg = require("./shape-svg");
var textSvg = require("./text-svg");
var clipSvg = require("./clip-svg");
var paint = require("./paint");

/**
 * @param {*} node
 * @param {*} ctx
 * @param {boolean} isTop
 * @returns {string}
 */
function nodeToSvg(node, ctx, isTop) {
    if (!node || node.visible === false) {
        return "";
    }
    if (ctx.skipNodes && ctx.skipNodes.has(node)) {
        return "";
    }
    var type = node.type;
    if (type === "shape") {
        return shapeSvg.shapeToSvg(node, ctx, isTop);
    }
    if (type === "text") {
        return textSvg.textToSvg(node, ctx, isTop);
    }
    return groupToSvg(node, ctx, isTop);
}

function groupToSvg(node, ctx, isTop) {
    var children =
        (node.group && node.group.children) ||
        (node.artboard && node.artboard.children) ||
        [];
    var inner = children
        .map(function (child) {
            return nodeToSvg(child, ctx, false);
        })
        .join("");
    var m = matrix.nodeAffine(node, ctx.artboard, isTop);
    var tf = matrix.matrixAttr(m);
    var clip = clipSvg.clipUrl(node, ctx);
    var style = node.style || {};
    var extra = "";
    if (typeof style.opacity === "number" && style.opacity < 0.999) {
        extra += ' opacity="' + style.opacity + '"';
    }
    var filter = paint.dropShadowUrl(style, ctx);
    if (filter) {
        extra += ' filter="' + filter + '"';
    }
    var attrs = "";
    if (tf) {
        attrs += ' transform="' + tf + '"';
    }
    if (clip) {
        attrs += ' clip-path="' + clip + '"';
    }
    attrs += extra;
    return "<g" + attrs + ">" + inner + "</g>";
}

module.exports = {
    nodeToSvg: nodeToSvg
};
