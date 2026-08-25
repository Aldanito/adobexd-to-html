"use strict";

/**
 * Resolve a node's position in artboard-local coordinates.
 *
 * Nested AGC transforms are parent-relative (same as SVG group translates).
 * Treating a large nested tx as artboard-absolute stacked unrelated controls
 * (Version History onto Preview Draft, Invoice No. onto Invoice Date).
 *
 * Top-level only: transform may be pasteboard-global (subtract artboard origin)
 * or already artboard-local.
 */

/**
 * @param {*} node
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {{x:number,y:number}} parentAbs
 * @returns {{x:number,y:number}}
 */
function artboardPosition(node, artboard, parentAbs) {
    var lt = node.meta && node.meta.ux && node.meta.ux.localTransform;
    var src = lt || node.transform || { tx: 0, ty: 0 };
    var tx = src.tx || 0;
    var ty = src.ty || 0;
    var isTop = parentAbs.x === 0 && parentAbs.y === 0;

    if (!isTop) {
        return { x: parentAbs.x + tx, y: parentAbs.y + ty };
    }

    if (lt) {
        return { x: tx, y: ty };
    }

    var globalLocal = { x: tx - artboard.x, y: ty - artboard.y };
    if (isInside(globalLocal, artboard, 80)) {
        return globalLocal;
    }
    return isInside({ x: tx, y: ty }, artboard, 80)
        ? { x: tx, y: ty }
        : globalLocal;
}

/**
 * @param {{x:number,y:number}} pos
 * @param {{width:number,height:number}} artboard
 * @param {number} pad
 */
function isInside(pos, artboard, pad) {
    return (
        pos.x >= -pad &&
        pos.y >= -pad &&
        pos.x <= artboard.width + pad &&
        pos.y <= artboard.height + pad
    );
}

/**
 * @param {{x:number,y:number}} pos
 * @param {{width:number,height:number}} size
 * @param {{width:number,height:number}} artboard
 */
function intersectsArtboard(pos, size, artboard) {
    var w = Math.max(size.width || 0, 1);
    var h = Math.max(size.height || 0, 1);
    var pad = 4;
    var x1 = pos.x;
    var y1 = pos.y;
    var x2 = pos.x + w;
    var y2 = pos.y + h;
    if (
        x2 < -pad ||
        y2 < -pad ||
        x1 > artboard.width + pad ||
        y1 > artboard.height + pad
    ) {
        return false;
    }
    // Pasteboard notes (origin far off-canvas) can graze the artboard by a
    // sliver; require a real share of the box to sit on the page.
    var ix = Math.max(0, Math.min(x2, artboard.width) - Math.max(x1, 0));
    var iy = Math.max(0, Math.min(y2, artboard.height) - Math.max(y1, 0));
    var area = w * h;
    if (area > 400 && (ix * iy) / area < 0.12) {
        return false;
    }
    return true;
}

module.exports = {
    artboardPosition: artboardPosition,
    intersectsArtboard: intersectsArtboard,
    isRotated: isRotated,
    cssMatrix: cssMatrix
};

/**
 * True when a/b/c/d is not a pure translation (rotation or scale).
 * @param {*} node
 * @returns {boolean}
 */
function isRotated(node) {
    var t = nodeMatrix(node);
    if (!t) {
        return false;
    }
    return (
        Math.abs(t.a - 1) > 0.02 ||
        Math.abs(t.d - 1) > 0.02 ||
        Math.abs(t.b) > 0.02 ||
        Math.abs(t.c) > 0.02
    );
}

/**
 * CSS matrix() from AGC a/b/c/d (no translation — position is left/top).
 * @param {*} node
 * @returns {string|null}
 */
function cssMatrix(node) {
    var t = nodeMatrix(node);
    if (!t) {
        return null;
    }
    return (
        "matrix(" +
        t.a +
        ", " +
        t.b +
        ", " +
        t.c +
        ", " +
        t.d +
        ", 0, 0)"
    );
}

function nodeMatrix(node) {
    var t =
        (node.meta && node.meta.ux && node.meta.ux.localTransform) ||
        node.transform;
    if (!t || typeof t.a !== "number") {
        return null;
    }
    return {
        a: t.a,
        b: typeof t.b === "number" ? t.b : 0,
        c: typeof t.c === "number" ? t.c : 0,
        d: typeof t.d === "number" ? t.d : 1
    };
}
