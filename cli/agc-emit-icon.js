"use strict";

/**
 * Detect compact stroke/path icon groups and emit one combined SVG.
 */

var htmlUtils = require("../exporter/html-utils");
var geometry = require("./agc-geometry");
var pathBounds = require("./path-bounds").pathBounds;
var svgPathAttrs = require("./agc-emit-path").svgPathAttrs;
var agcColor = require("./agc-color");

/**
 * @param {*} node
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {{x:number,y:number}} parentAbs
 * @returns {boolean}
 */
function isIconGroup(node, artboard, parentAbs) {
    if (!node || node.type !== "group") return false;
    if (groupHasText(node)) return false;
    var shapes = [];
    if (!collectIconShapes(node, artboard, parentAbs, shapes)) {
        return false;
    }
    if (shapes.length < 2) return false;
    var box = unionBox(shapes);
    return box.width <= 80 && box.height <= 80;
}

/**
 * Buttons/labels with text must not be collapsed into icon SVGs.
 * @param {*} node
 * @returns {boolean}
 */
function groupHasText(node) {
    if (!node) return false;
    if (node.type === "text" && node.text && node.text.rawText) {
        return true;
    }
    var kids = (node.group && node.group.children) || [];
    for (var i = 0; i < kids.length; i++) {
        if (groupHasText(kids[i])) return true;
    }
    return false;
}

/**
 * @param {*} node
 * @param {string} className
 * @param {*} ctx
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {{x:number,y:number}} parentAbs
 * @param {{x:number,y:number}} originOffset
 * @returns {string}
 */
function emitIconGroup(node, className, ctx, artboard, parentAbs, originOffset) {
    var shapes = [];
    collectIconShapes(node, artboard, parentAbs, shapes);
    var artboardBox = unionBox(shapes);
    var localBox = unionLocal(shapes);
    var off = originOffset || { x: 0, y: 0 };
    var pathOnly = shapes.every(function (p) {
        return p.kind === "path";
    });
    var collapsed =
        pathOnly &&
        localBox.minX > 20 &&
        localBox.minY > 20 &&
        (artboardBox.width * 2 < localBox.width ||
            artboardBox.height * 2 < localBox.height);
    var left;
    var top;
    var viewMinX;
    var viewMinY;
    var viewW;
    var viewH;
    var parts;
    if (collapsed) {
        var anchorX = Infinity;
        var anchorY = Infinity;
        shapes.forEach(function (p) {
            if (p.x < anchorX) anchorX = p.x;
            if (p.y < anchorY) anchorY = p.y;
        });
        left = anchorX + localBox.minX - off.x;
        top = anchorY + localBox.minY - off.y;
        viewMinX = localBox.minX;
        viewMinY = localBox.minY;
        viewW = localBox.width;
        viewH = localBox.height;
        parts = shapes.map(function (p) {
            return iconMarkup(p, false);
        });
    } else {
        left = artboardBox.minX - off.x;
        top = artboardBox.minY - off.y;
        viewMinX = artboardBox.minX;
        viewMinY = artboardBox.minY;
        viewW = artboardBox.width;
        viewH = artboardBox.height;
        parts = shapes.map(function (p) {
            return iconMarkup(p, true);
        });
    }
    var decls = {
        position: "absolute",
        left: round(left) + "px",
        top: round(top) + "px",
        width: round(viewW) + "px",
        height: round(viewH) + "px",
        overflow: "visible"
    };
    var rot = rotationDeg(node);
    if (rot) {
        decls.transform = "rotate(" + rot + "deg)";
        decls["transform-origin"] = "0 0";
    }
    ctx.sheet.add("." + className, decls);
    return (
        '<svg class="' +
        className +
        '" width="' +
        viewW +
        '" height="' +
        viewH +
        '" viewBox="' +
        round(viewMinX) +
        " " +
        round(viewMinY) +
        " " +
        round(viewW) +
        " " +
        round(viewH) +
        '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        parts.join("") +
        "</svg>"
    );
}

/**
 * @param {*} node
 * @param {*} artboard
 * @param {{x:number,y:number}} parentAbs
 * @param {Array} out
 * @returns {boolean} false if the group contains non-icon geometry
 */
function collectIconShapes(node, artboard, parentAbs, out) {
    if (!node || node.visible === false) return true;
    var pos = geometry.artboardPosition(node, artboard, parentAbs);
    if (node.type === "text") {
        return false;
    }
    if (node.type === "shape" && node.shape) {
        var t = node.shape.type;
        if (t === "path") {
            var b = pathBounds(node.shape.path || "");
            out.push({
                kind: "path",
                x: pos.x,
                y: pos.y,
                d: node.shape.path || "",
                node: node,
                minX: pos.x + b.pathMinX,
                minY: pos.y + b.pathMinY,
                maxX: pos.x + b.pathMaxX,
                maxY: pos.y + b.pathMaxY,
                localMinX: b.pathMinX,
                localMinY: b.pathMinY,
                localMaxX: b.pathMaxX,
                localMaxY: b.pathMaxY
            });
            return true;
        }
        if (t === "line") {
            var x1 = node.shape.x1 || 0;
            var y1 = node.shape.y1 || 0;
            var x2 = node.shape.x2 || 0;
            var y2 = node.shape.y2 || 0;
            var sw =
                (node.style && node.style.stroke && node.style.stroke.width) ||
                1;
            var pad = sw / 2;
            out.push({
                kind: "line",
                x: pos.x,
                y: pos.y,
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                node: node,
                minX: pos.x + Math.min(x1, x2) - pad,
                minY: pos.y + Math.min(y1, y2) - pad,
                maxX: pos.x + Math.max(x1, x2) + pad,
                maxY: pos.y + Math.max(y1, y2) + pad,
                localMinX: Math.min(x1, x2),
                localMinY: Math.min(y1, y2),
                localMaxX: Math.max(x1, x2),
                localMaxY: Math.max(y1, y2)
            });
            return true;
        }
        if (t === "circle") {
            var cx = node.shape.cx || 0;
            var cy = node.shape.cy || 0;
            var r = node.shape.r || 0;
            out.push({
                kind: "circle",
                x: pos.x,
                y: pos.y,
                cx: cx,
                cy: cy,
                r: r,
                node: node,
                minX: pos.x + cx - r,
                minY: pos.y + cy - r,
                maxX: pos.x + cx + r,
                maxY: pos.y + cy + r,
                localMinX: cx - r,
                localMinY: cy - r,
                localMaxX: cx + r,
                localMaxY: cy + r
            });
            return true;
        }
        return false;
    }
    var kids = (node.group && node.group.children) || [];
    for (var i = 0; i < kids.length; i++) {
        if (!collectIconShapes(kids[i], artboard, pos, out)) {
            return false;
        }
    }
    return true;
}

function iconMarkup(p, artboardSpace) {
    if (p.kind === "path") {
        var extra = artboardSpace
            ? ' transform="translate(' + round(p.x) + " " + round(p.y) + ')"'
            : "";
        return (
            '<path d="' +
            htmlUtils.escapeHtml(p.d) +
            '"' +
            svgPathAttrs(p.node) +
            extra +
            " />"
        );
    }
    if (p.kind === "line") {
        var lx1 = artboardSpace ? p.x + p.x1 : p.x1;
        var ly1 = artboardSpace ? p.y + p.y1 : p.y1;
        var lx2 = artboardSpace ? p.x + p.x2 : p.x2;
        var ly2 = artboardSpace ? p.y + p.y2 : p.y2;
        return (
            '<line x1="' +
            round(lx1) +
            '" y1="' +
            round(ly1) +
            '" x2="' +
            round(lx2) +
            '" y2="' +
            round(ly2) +
            '" fill="none"' +
            strokeAttrs(p.node) +
            " />"
        );
    }
    var cx = artboardSpace ? p.x + p.cx : p.cx;
    var cy = artboardSpace ? p.y + p.cy : p.cy;
    var fill = agcColor.agcFillToCss(p.node.style && p.node.style.fill);
    return (
        '<circle cx="' +
        round(cx) +
        '" cy="' +
        round(cy) +
        '" r="' +
        round(p.r) +
        '" fill="' +
        (fill || "none") +
        '"' +
        strokeAttrs(p.node) +
        " />"
    );
}

function strokeAttrs(node) {
    var stroke = node.style && node.style.stroke;
    if (!stroke || stroke.type !== "solid" || !(stroke.width > 0)) {
        return ' stroke-linecap="round"';
    }
    return (
        ' stroke="' +
        agcColor.agcColorToCss(stroke.color) +
        '" stroke-width="' +
        stroke.width +
        '" stroke-linecap="round"'
    );
}

function rotationDeg(node) {
    var t =
        (node.meta && node.meta.ux && node.meta.ux.localTransform) ||
        node.transform;
    if (!t || typeof t.a !== "number" || typeof t.b !== "number") {
        return 0;
    }
    var deg = (Math.atan2(t.b, t.a) * 180) / Math.PI;
    if (Math.abs(deg) < 5) {
        return 0;
    }
    return Math.round(deg);
}

function unionBox(paths) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    paths.forEach(function (p) {
        minX = Math.min(minX, p.minX);
        minY = Math.min(minY, p.minY);
        maxX = Math.max(maxX, p.maxX);
        maxY = Math.max(maxY, p.maxY);
    });
    return {
        minX: minX,
        minY: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY)
    };
}

function unionLocal(paths) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    paths.forEach(function (p) {
        minX = Math.min(minX, p.localMinX);
        minY = Math.min(minY, p.localMinY);
        maxX = Math.max(maxX, p.localMaxX);
        maxY = Math.max(maxY, p.localMaxY);
    });
    return {
        minX: minX,
        minY: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY)
    };
}

function round(n) {
    return Math.round(n * 100) / 100;
}

module.exports = {
    isIconGroup: isIconGroup,
    emitIconGroup: emitIconGroup,
    measureIconBox: measureIconBox
};

/**
 * @param {*} node
 * @param {*} artboard
 * @param {{x:number,y:number}} parentAbs
 * @returns {{minX:number,minY:number,width:number,height:number}}
 */
function measureIconBox(node, artboard, parentAbs) {
    var shapes = [];
    collectIconShapes(node, artboard, parentAbs, shapes);
    return unionBox(shapes);
}
