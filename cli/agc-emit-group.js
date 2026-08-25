"use strict";

/**
 * Emit a group wrapper (mask clip or full-artboard hoist host).
 */

var semantic = require("../exporter/semantic");
var maskClip = require("./mask-clip");
var walkChildren = require("./walk-children");
var geometry = require("./agc-geometry");

/**
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} pos
 * @param {Array} children
 * @param {boolean} hasClip
 * @param {{x:number,y:number}} offset
 * @param {*} ctx
 * @param {*} artboard
 * @param {Function} convertNode
 * @returns {string}
 */
function emitGroup(
    node,
    className,
    pos,
    children,
    hasClip,
    offset,
    ctx,
    artboard,
    convertNode
) {
    var prevOffset = ctx.originOffset;
    var mask = hasClip ? maskClip.maskRect(node, pos) : null;
    var rotated = geometry.isRotated(node);
    var groupStyle;
    var restoreOffset = false;
    if (mask) {
        groupStyle = {
            position: "absolute",
            left: roundPx(mask.x - (offset.x || 0)) + "px",
            top: roundPx(mask.y - (offset.y || 0)) + "px",
            width: roundPx(mask.width) + "px",
            height: roundPx(mask.height) + "px",
            overflow: "hidden",
            "pointer-events": "none",
            "box-sizing": "border-box"
        };
        if (mask.radius) {
            groupStyle["border-radius"] = mask.radius;
        }
        ctx.originOffset = { x: mask.x, y: mask.y };
        restoreOffset = true;
    } else if (rotated) {
        groupStyle = {
            position: "absolute",
            left: roundPx(pos.x - (offset.x || 0)) + "px",
            top: roundPx(pos.y - (offset.y || 0)) + "px",
            width: "1px",
            height: "1px",
            overflow: "visible",
            "pointer-events": "none",
            transform: geometry.cssMatrix(node),
            "transform-origin": "0 0"
        };
        ctx.originOffset = { x: pos.x, y: pos.y };
        restoreOffset = true;
    } else {
        groupStyle = {
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
            "pointer-events": "none"
        };
        if (hasClip) {
            var clipVal = maskClip.maskClipPath(node, pos, artboard);
            if (clipVal) {
                groupStyle["clip-path"] = clipVal;
                groupStyle["-webkit-clip-path"] = clipVal;
            } else {
                groupStyle.overflow = "hidden";
            }
        }
    }
    ctx.sheet.add("." + className, groupStyle);
    var tag = semantic.pickTag(node.name, "Group");
    var inner = walkChildren.mapChildren(children, ctx, pos, convertNode);
    if (restoreOffset) {
        ctx.originOffset = prevOffset;
    }
    return "<" + tag + ' class="' + className + '">' + inner + "</" + tag + ">";
}

function roundPx(n) {
    return Math.round(n * 100) / 100;
}

module.exports = {
    emitGroup: emitGroup
};
