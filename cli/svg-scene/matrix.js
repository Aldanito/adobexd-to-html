"use strict";

/**
 * Full 2D affine from AGC localTransform / transform.
 */

function identity() {
    return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}

/**
 * @param {*} node
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {boolean} isTop
 * @returns {{a:number,b:number,c:number,d:number,tx:number,ty:number}}
 */
function nodeAffine(node, artboard, isTop) {
    var lt = node.meta && node.meta.ux && node.meta.ux.localTransform;
    var src = lt || node.transform || identity();
    var m = {
        a: typeof src.a === "number" ? src.a : 1,
        b: typeof src.b === "number" ? src.b : 0,
        c: typeof src.c === "number" ? src.c : 0,
        d: typeof src.d === "number" ? src.d : 1,
        tx: src.tx || 0,
        ty: src.ty || 0
    };
    if (isTop && !lt && node.transform) {
        var local = pasteboardLocal(m.tx, m.ty, artboard);
        m.tx = local.tx;
        m.ty = local.ty;
    }
    return m;
}

/**
 * @param {number} tx
 * @param {number} ty
 * @param {{x:number,y:number,width:number,height:number}} artboard
 */
function pasteboardLocal(tx, ty, artboard) {
    var gx = tx - (artboard.x || 0);
    var gy = ty - (artboard.y || 0);
    if (isInside(gx, gy, artboard, 80)) {
        return { tx: gx, ty: gy };
    }
    if (isInside(tx, ty, artboard, 80)) {
        return { tx: tx, ty: ty };
    }
    return { tx: gx, ty: gy };
}

function isInside(x, y, artboard, pad) {
    return (
        x >= -pad &&
        y >= -pad &&
        x <= artboard.width + pad &&
        y <= artboard.height + pad
    );
}

/**
 * @param {{a:number,b:number,c:number,d:number,tx:number,ty:number}} m
 * @returns {string|null}
 */
function matrixAttr(m) {
    if (!m) {
        return null;
    }
    var id =
        Math.abs(m.a - 1) < 1e-9 &&
        Math.abs(m.b) < 1e-9 &&
        Math.abs(m.c) < 1e-9 &&
        Math.abs(m.d - 1) < 1e-9 &&
        Math.abs(m.tx) < 1e-9 &&
        Math.abs(m.ty) < 1e-9;
    if (id) {
        return null;
    }
    return (
        "matrix(" +
        m.a +
        " " +
        m.b +
        " " +
        m.c +
        " " +
        m.d +
        " " +
        m.tx +
        " " +
        m.ty +
        ")"
    );
}

module.exports = {
    nodeAffine: nodeAffine,
    matrixAttr: matrixAttr
};
