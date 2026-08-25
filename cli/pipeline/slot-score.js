"use strict";

/**
 * Rank stacked alternate-state labels in one field slot.
 * Higher wins. Open-menu copy always loses to a closed field or a value.
 */

var overlayFilter = require("../overlay-filter");

/**
 * @param {string} text
 * @returns {boolean}
 */
function isConcreteValue(text) {
    var t = String(text || "").trim();
    if (!t || t.indexOf("\n") !== -1) {
        return false;
    }
    if (overlayFilter.isClosedTriggerText(t)) {
        return false;
    }
    if (overlayFilter.isOpenMenuText(t)) {
        return false;
    }
    return /\d/.test(t);
}

/**
 * @param {string} text
 * @returns {number}
 */
function textScore(text) {
    var t = String(text || "").trim();
    if (!t) {
        return 0;
    }
    if (overlayFilter.isOpenMenuText(t)) {
        return 0;
    }
    if (/^select\s+all\b/i.test(t)) {
        return 1;
    }
    if (isConcreteValue(t)) {
        return 3;
    }
    if (overlayFilter.isClosedTriggerText(t)) {
        return 2;
    }
    return 2;
}

module.exports = {
    textScore: textScore,
    isConcreteValue: isConcreteValue
};
