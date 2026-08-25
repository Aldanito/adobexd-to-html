"use strict";

/**
 * Bounding size for AGC shapes and text frames.
 */

var pathBounds = require("./path-bounds").pathBounds;

/**
 * @param {*} node
 * @returns {{width:number,height:number,radius:string|null,pathMinX?:number,pathMinY?:number}}
 */
function nodeSize(node) {
    var shape = node.shape || {};
    if (shape.type === "rect") {
        return rectSize(shape);
    }
    if (shape.type === "circle") {
        var d = (shape.r || 0) * 2;
        return { width: d, height: d, radius: "50%" };
    }
    if (shape.type === "line") {
        var w = Math.abs((shape.x2 || 0) - (shape.x1 || 0));
        var h = Math.abs((shape.y2 || 0) - (shape.y1 || 0));
        return { width: Math.max(w, 1), height: Math.max(h, 1), radius: null };
    }
    if (shape.type === "path") {
        return pathBounds(shape.path || "");
    }
    if (node.type === "text" && node.text && node.text.frame) {
        return textFrameSize(node);
    }
    return { width: 0, height: 0, radius: null };
}

function rectSize(shape) {
    var r = shape.r;
    var radius = null;
    if (Array.isArray(r)) {
        radius =
            r[0] === r[1] && r[1] === r[2] && r[2] === r[3]
                ? r[0] + "px"
                : r[0] + "px " + r[1] + "px " + r[2] + "px " + r[3] + "px";
    }
    return {
        width: shape.width || 0,
        height: shape.height || 0,
        radius: radius
    };
}

function textFrameSize(node) {
    var frame = node.text.frame;
    var fontSize =
        (node.style && node.style.font && node.style.font.size) || 14;
    var height = frame.height;
    if (!height && node.text.paragraphs && node.text.paragraphs.length) {
        var maxY = 0;
        node.text.paragraphs.forEach(function (p) {
            (p.lines || []).forEach(function (line) {
                (line || []).forEach(function (run) {
                    if (run.y > maxY) maxY = run.y;
                });
            });
        });
        height = maxY + fontSize * 0.35;
    }
    return {
        width: frame.width || 100,
        height: height || fontSize * 1.4,
        radius: null
    };
}

module.exports = {
    nodeSize: nodeSize
};
