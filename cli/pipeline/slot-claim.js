"use strict";

/**
 * One occupant per field slot. Same origin (±6px) is the same control;
 * adjacent header actions (≈10px apart) stay independent.
 */

var ORIGIN_TOL = 6;
var slotScore = require("./slot-score");

/**
 * @returns {{claimText: Function, claimBox: Function}}
 */
function createSlotIndex() {
    var textSlots = [];
    var boxKeys = {};

    /**
     * Document order (bottom first). Higher score replaces; ties keep earlier.
     * @param {*} node
     * @param {{x:number,y:number}} pos
     * @param {string} text
     * @param {WeakSet} skip
     * @returns {boolean}
     */
    function claimText(node, pos, text, skip) {
        var x = pos.x || 0;
        var y = pos.y || 0;
        var score = slotScore.textScore(text);
        var i;
        for (i = 0; i < textSlots.length; i++) {
            var s = textSlots[i];
            if (Math.abs(s.x - x) > ORIGIN_TOL || Math.abs(s.y - y) > ORIGIN_TOL) {
                continue;
            }
            if (score > s.score) {
                skip.add(s.node);
                s.node = node;
                s.score = score;
                s.x = x;
                s.y = y;
                return true;
            }
            return false;
        }
        textSlots.push({ node: node, x: x, y: y, score: score });
        return true;
    }

    /**
     * Exact duplicate geometry (stacked identical chrome).
     * @param {{x:number,y:number}} pos
     * @param {{width:number,height:number}} size
     * @param {string} kind
     * @returns {boolean}
     */
    function claimBox(pos, size, kind) {
        var key =
            kind +
            ":" +
            Math.round(pos.x) +
            "," +
            Math.round(pos.y) +
            "," +
            Math.round((size && size.width) || 0) +
            "," +
            Math.round((size && size.height) || 0);
        if (boxKeys[key]) {
            return false;
        }
        boxKeys[key] = true;
        return true;
    }

    return { claimText: claimText, claimBox: claimBox };
}

module.exports = {
    createSlotIndex: createSlotIndex
};
