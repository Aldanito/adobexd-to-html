"use strict";

/**
 * Classify artboards for index grouping and --pages-only.
 */

function boardGroup(name) {
    var n = String(name || "").toLowerCase();
    if (/^m-|\bmobile\b/.test(n)) {
        return "Mobile";
    }
    if (/^(base|component)\b/.test(n)) {
        return "Components";
    }
    if (/^xf\b/.test(n)) {
        return "Fragments";
    }
    if (/^(template|page)\b/.test(n)) {
        return "Pages";
    }
    return "Screens";
}

function isKitBoard(name) {
    var n = String(name || "").toLowerCase();
    return /^(base|component|xf)\b/.test(n);
}

module.exports = {
    boardGroup: boardGroup,
    isKitBoard: isKitBoard
};
