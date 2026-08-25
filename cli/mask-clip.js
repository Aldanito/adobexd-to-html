"use strict";

/**
 * XD mask groups → CSS overflow clip sized to the mask rectangle.
 */

/**
 * @param {*} node
 * @param {{x:number,y:number}} groupAbs
 * @returns {{x:number,y:number,width:number,height:number,radius:string|null}|null}
 */
function maskRect(node, groupAbs) {
    var clip =
        node.meta &&
        node.meta.ux &&
        node.meta.ux.clipPathResources &&
        node.meta.ux.clipPathResources.children &&
        node.meta.ux.clipPathResources.children[0];
    if (!clip || !clip.shape) {
        return null;
    }
    var tr = clip.transform || { tx: 0, ty: 0 };
    var sh = clip.shape;
    var x = groupAbs.x + (tr.tx || 0) + (sh.x || 0);
    var y = groupAbs.y + (tr.ty || 0) + (sh.y || 0);
    var w = sh.width || 0;
    var h = sh.height || 0;
    var radius = null;
    if (sh.type === "circle") {
        w = h = (sh.r || 0) * 2;
        x = groupAbs.x + (tr.tx || 0) + (sh.cx || 0) - (sh.r || 0);
        y = groupAbs.y + (tr.ty || 0) + (sh.cy || 0) - (sh.r || 0);
        radius = "50%";
    } else if (Array.isArray(sh.r)) {
        radius =
            sh.r[0] === sh.r[1] && sh.r[1] === sh.r[2] && sh.r[2] === sh.r[3]
                ? sh.r[0] + "px"
                : sh.r.join("px ") + "px";
    }
    if (w < 1 || h < 1) {
        return null;
    }
    return { x: x, y: y, width: w, height: h, radius: radius };
}

/**
 * Legacy artboard-absolute inset (fallback).
 * @param {*} node
 * @param {{x:number,y:number}} groupAbs
 * @param {{width:number,height:number}} artboard
 * @returns {string|null}
 */
function maskClipPath(node, groupAbs, artboard) {
    var rect = maskRect(node, groupAbs);
    if (!rect || !artboard) {
        return null;
    }
    var top = Math.max(0, rect.y);
    var left = Math.max(0, rect.x);
    var right = Math.max(0, artboard.width - (rect.x + rect.width));
    var bottom = Math.max(0, artboard.height - (rect.y + rect.height));
    return (
        "inset(" +
        round(top) +
        "px " +
        round(right) +
        "px " +
        round(bottom) +
        "px " +
        round(left) +
        "px)"
    );
}

function round(n) {
    return Math.round(n * 100) / 100;
}

module.exports = {
    maskRect: maskRect,
    maskClipPath: maskClipPath
};
