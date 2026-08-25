"use strict";

/**
 * Optional table cell helpers. Prefer default occupancy for 1:1 fidelity;
 * only band clear stacked duplicates when text+position strongly match.
 */

/**
 * @param {string} text
 * @returns {boolean}
 */
function isShortLabel(text) {
    if (!text) return false;
    var t = String(text).trim();
    return t.length > 0 && t.length <= 28 && t.indexOf("\n") === -1;
}

/**
 * Do not force table banding on all text — that destroys legitimate rows.
 * Return null so occupancy uses tight position slots only.
 * @param {{x:number,y:number}} pos
 * @param {string} text
 * @returns {string|null}
 */
function tableCellSlot(pos, text) {
    return null;
}

module.exports = {
    isShortLabel: isShortLabel,
    tableCellSlot: tableCellSlot
};
