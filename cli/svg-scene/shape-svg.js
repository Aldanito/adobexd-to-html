"use strict";

var htmlUtils = require("../../exporter/html-utils");
var matrix = require("./matrix");
var paint = require("./paint");

/**
 * @param {*} node
 * @param {*} ctx
 * @param {boolean} isTop
 * @returns {string}
 */
function shapeToSvg(node, ctx, isTop) {
    var sh = node.shape || {};
    var m = matrix.nodeAffine(node, ctx.artboard, isTop);
    var tf = matrix.matrixAttr(m);
    var geom = { width: sh.width || 0, height: sh.height || 0 };
    var wrap = paint.paintWrap(node, ctx, geom);
    var inner = shapeInner(sh);
    if (!inner) {
        return "";
    }
    if (sh.type === "path" && sh.winding === "evenodd") {
        inner = inner.replace(" />", ' fill-rule="evenodd" />');
    }
    inner = inner.replace(" />", wrap.attrs + " />");
    var out = wrap.prefix + inner + wrap.suffix;
    if (tf) {
        out = '<g transform="' + tf + '">' + out + "</g>";
    }
    return out;
}

function shapeInner(sh) {
    if (sh.type === "rect") {
        var rr = cornerRx(sh);
        return (
            '<rect x="' +
            (sh.x || 0) +
            '" y="' +
            (sh.y || 0) +
            '" width="' +
            (sh.width || 0) +
            '" height="' +
            (sh.height || 0) +
            '"' +
            rr +
            " />"
        );
    }
    if (sh.type === "circle") {
        return (
            '<circle cx="' +
            (sh.cx || 0) +
            '" cy="' +
            (sh.cy || 0) +
            '" r="' +
            (sh.r || 0) +
            '" />'
        );
    }
    if (sh.type === "line") {
        return (
            '<line x1="' +
            (sh.x1 || 0) +
            '" y1="' +
            (sh.y1 || 0) +
            '" x2="' +
            (sh.x2 || 0) +
            '" y2="' +
            (sh.y2 || 0) +
            '" />'
        );
    }
    if (sh.type === "path") {
        return '<path d="' + htmlUtils.escapeHtml(sh.path || "") + '" />';
    }
    if (sh.type === "ellipse") {
        return (
            '<ellipse cx="' +
            (sh.cx || 0) +
            '" cy="' +
            (sh.cy || 0) +
            '" rx="' +
            (sh.rx || sh.r || 0) +
            '" ry="' +
            (sh.ry || sh.r || 0) +
            '" />'
        );
    }
    return null;
}

function cornerRx(sh) {
    var r = sh.r;
    if (!Array.isArray(r) || !r.length) {
        return "";
    }
    return ' rx="' + r[0] + '" ry="' + r[1] + '"';
}

module.exports = {
    shapeToSvg: shapeToSvg
};
