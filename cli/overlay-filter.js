"use strict";

/**
 * Project-agnostic overlay / alternate-state filtering for artboard export.
 *
 * Artboard pages keep default closed UI. Open menus, dialogs, and edit-row
 * field stacks are omitted.
 *
 * Prefer structure (geometry, multiline option lists, dialog actions) over
 * product-specific copy so the same rules apply to any .xd file.
 */

/** Bottom-up text lists for the current artboard (avoids O(n²) collectTexts). */
var textCache = null;

var DIALOG_ACTION_RE = /^(cancel|apply|ok|okay|save|confirm|done|close|submit)$/i;
var DIALOG_TITLE_HINT_RE =
    /\b(edit|add|create|delete|remove|update|settings|options|details)\b/i;
var SUMMARY_CHROME_RE =
    /\b(grand\s*total|sub\s*total|subtotal|total\s*amount|amount\s*selected|sum\s*total|balance\s*due)\b/i;
var CLOSED_FIELD_HINT_RE =
    /^(select\b|search\b|filter\b|choose\b|pick\b|section\s*edits|adjust\b)/i;
var CLOSED_BUTTON_HINT_RE =
    /^(apply|add|edit|adjust|save|confirm|undo|cancel)\b/i;
var MENU_VERB_RE =
    /^(create|merge|duplicate|delete|remove|rename|export|import|share|move|copy)\b/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
function isStackedOptionList(text) {
    if (!text || String(text).indexOf("\n") === -1) {
        return false;
    }
    var lines = String(text)
        .split(/\n/)
        .map(function (l) {
            return l.trim();
        })
        .filter(Boolean);
    if (lines.length < 3) {
        return false;
    }
    var plusLines = lines.filter(function (l) {
        return /^[+\-]\s*\d+/.test(l);
    }).length;
    if (plusLines >= 3) {
        return true;
    }
    var short = lines.filter(function (l) {
        return l.length <= 32 && l.split(/\s+/).length <= 5;
    });
    if (short.length < 3) {
        return false;
    }
    var avg =
        short.reduce(function (a, b) {
            return a + b.length;
        }, 0) / short.length;
    var similar = short.filter(function (l) {
        return Math.abs(l.length - avg) <= 10;
    }).length;
    return similar >= 3 && avg <= 24;
}

/**
 * Single-line open menu item (not a closed field/button).
 * @param {string} t trimmed
 * @returns {boolean}
 */
function isImperativeMenuItem(t) {
    if (!t || t.indexOf("\n") !== -1) {
        return false;
    }
    if (CLOSED_FIELD_HINT_RE.test(t) || DIALOG_ACTION_RE.test(t)) {
        return false;
    }
    if (CLOSED_BUTTON_HINT_RE.test(t) && t.split(/\s+/).length <= 3) {
        return false;
    }
    var words = t.split(/\s+/).length;
    return MENU_VERB_RE.test(t) && words >= 2 && words <= 8 && t.length <= 48;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isClosedTriggerText(text) {
    if (!text) {
        return false;
    }
    var t = String(text).trim();
    if (!t || t.indexOf("\n") !== -1 || t.length > 48) {
        return false;
    }
    return CLOSED_FIELD_HINT_RE.test(t) || CLOSED_BUTTON_HINT_RE.test(t);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isOpenMenuText(text) {
    if (!text) {
        return false;
    }
    var t = String(text).trim();
    if (!t) {
        return false;
    }
    // Calendar quick-ranges are real UI on calendar screens, not junk menus
    if (isDateRangePresetList(t)) {
        return false;
    }
    if (/^search\s+by\b/i.test(t)) {
        return true;
    }
    // Open list options like "All Lawyers & Paralegals" (not "All time")
    if (
        /^all\s+/i.test(t) &&
        !/^all\s+time\b/i.test(t) &&
        t.indexOf("\n") === -1 &&
        t.length <= 48
    ) {
        return true;
    }
    if (t.indexOf("\n") === -1 && CLOSED_FIELD_HINT_RE.test(t)) {
        return false;
    }
    if (isStackedOptionList(text)) {
        return true;
    }
    if (isImperativeMenuItem(t)) {
        return true;
    }
    if (t.indexOf("\n") === -1) {
        return false;
    }
    var lines = t
        .split(/\n/)
        .map(function (l) {
            return l.trim();
        })
        .filter(Boolean);
    if (lines.length < 2) {
        return false;
    }
    var actionish = lines.filter(function (l) {
        return DIALOG_ACTION_RE.test(l) || DIALOG_TITLE_HINT_RE.test(l);
    }).length;
    if (actionish >= 1 && lines.length >= 3) {
        return true;
    }
    return false;
}

/**
 * @param {string[]} texts
 * @returns {{openHits:number, actions:number, titleHints:number, closedTriggers:number}}
 */
function summarizeTexts(texts) {
    var openHits = 0;
    var actions = 0;
    var titleHints = 0;
    var closedTriggers = 0;
    texts.forEach(function (t) {
        if (isOpenMenuText(t)) {
            openHits += 1;
        }
        if (isClosedTriggerText(t)) {
            closedTriggers += 1;
        }
        var line = String(t).trim();
        if (line.indexOf("\n") === -1 && DIALOG_ACTION_RE.test(line)) {
            actions += 1;
        }
        if (
            line.indexOf("\n") === -1 &&
            DIALOG_TITLE_HINT_RE.test(line) &&
            line.length <= 40
        ) {
            titleHints += 1;
        }
    });
    return {
        openHits: openHits,
        actions: actions,
        titleHints: titleHints,
        closedTriggers: closedTriggers
    };
}

/**
 * Open searchable combo: "Search By …" plus at least one option row.
 * Common ungrouped / loosely grouped leftover under other UI.
 * @param {*} node
 * @returns {boolean}
 */
function isOpenSearchableDropdown(node) {
    if (!node || node.type !== "group") {
        return false;
    }
    if (isDateRangePicker(node)) {
        return false;
    }
    var texts = [];
    collectTexts(node, texts);
    if (texts.length < 2) {
        return false;
    }
    var hasSearchBy = texts.some(function (t) {
        return /^search\s+by\b/i.test(String(t).trim());
    });
    if (!hasSearchBy) {
        return false;
    }
    var options = texts.filter(function (t) {
        var line = String(t).trim();
        if (!line || line.indexOf("\n") !== -1) {
            return false;
        }
        if (/^search\s+by\b/i.test(line)) {
            return false;
        }
        if (DIALOG_ACTION_RE.test(line)) {
            return false;
        }
        return line.length <= 48;
    });
    return options.length >= 1;
}

/**
 * @param {*} node
 * @returns {boolean}
 */
function isOpenDropdownPanel(node) {
    if (!node) {
        return false;
    }
    var name = (node.name || "").trim();
    var text = (node.text && node.text.rawText) || "";

    if (node.type === "text") {
        return isOpenMenuText(text);
    }

    if (/\b(modal|dialog|popup|overlay|dropdown\s*menu|context\s*menu)\b/i.test(name)) {
        return true;
    }

    if (node.type !== "group") {
        return false;
    }

    if (isDateRangePicker(node)) {
        return false;
    }

    if (isOpenSearchableDropdown(node)) {
        // Keep closed value via mixed path when a Select/trigger is present
        var texts = [];
        collectTexts(node, texts);
        var s = summarizeTexts(texts);
        if (s.closedTriggers >= 1) {
            return false;
        }
        return true;
    }

    if (isDateRangePicker(node)) {
        return false;
    }

    var texts = [];
    collectTexts(node, texts);
    if (!texts.length) {
        return false;
    }

    var s = summarizeTexts(texts);

    // Mixed closed trigger + open options: handled via triggers-only walk
    if (isMixedOverlayGroup(node)) {
        return false;
    }

    // Dialog chrome: title-ish + Cancel/Apply — but not calendar footers
    if (s.actions >= 2 && (s.titleHints >= 1 || texts.length >= 3)) {
        return true;
    }
    if (s.actions >= 1 && s.titleHints >= 1 && texts.length >= 3) {
        return true;
    }
    if (s.openHits >= 2) {
        return true;
    }

    var shortSingles = texts.filter(function (t) {
        var line = String(t).trim();
        return line.indexOf("\n") === -1 && line.length > 0 && line.length <= 36;
    });
    if (shortSingles.length >= 4 && s.openHits >= 1) {
        return true;
    }

    return false;
}

/**
 * @param {*} node
 * @returns {boolean}
 */
function isTableEditRow(node) {
    if (!node || node.type !== "group") {
        return false;
    }
    var rects = [];
    collectFieldRects(node, rects, 0);
    if (rects.length < 5) {
        return false;
    }
    var heights = rects.map(function (r) {
        return r.h;
    });
    var avg =
        heights.reduce(function (a, b) {
            return a + b;
        }, 0) / heights.length;
    if (avg < 18 || avg > 48) {
        return false;
    }
    var similar = heights.filter(function (h) {
        return Math.abs(h - avg) < 10;
    }).length;
    return similar >= 5;
}

/**
 * Date-range / calendar popovers are intentional on calendar artboards —
 * never treat them as disposable overlays.
 * @param {string} text
 * @returns {boolean}
 */
function isDateRangePresetList(text) {
    if (!text) return false;
    var t = String(text);
    return (
        /\btoday\b/i.test(t) &&
        /\byesterday\b/i.test(t) &&
        /\b(this\s*week|this\s*month|last\s*month)\b/i.test(t)
    );
}

/**
 * @param {*} node
 * @returns {boolean}
 */
function isDateRangePicker(node) {
    if (!node || node.type !== "group") {
        return false;
    }
    var texts = [];
    collectTexts(node, texts);
    if (texts.length < 4) {
        return false;
    }
    var hasPresets = texts.some(isDateRangePresetList);
    var hasMonth = texts.some(function (t) {
        return /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b/i.test(
            t
        );
    });
    var hasDayHeader = texts.some(function (t) {
        return /\bMo\b.*\bTu\b.*\bWe\b/i.test(t);
    });
    return hasPresets && (hasMonth || hasDayHeader);
}

/**
 * Closed trigger + open menu options in the same group.
 * @param {*} node
 * @returns {boolean}
 */
function isMixedOverlayGroup(node) {
    if (!node || node.type !== "group") {
        return false;
    }
    if (isDateRangePicker(node)) {
        return false;
    }
    if (isOpenSearchableDropdown(node)) {
        var textsSearch = [];
        collectTexts(node, textsSearch);
        var sumSearch = summarizeTexts(textsSearch);
        if (sumSearch.closedTriggers >= 1) {
            return true;
        }
    }
    var texts = [];
    collectTexts(node, texts);
    if (!texts.length) {
        return false;
    }
    var s = summarizeTexts(texts);
    return s.closedTriggers >= 1 && s.openHits >= 1;
}

/**
 * Ungrouped popover / open-menu panels (rect or boolean path), not field rows or page cards.
 * @param {*} node
 * @param {{width:number,height:number}} size
 * @returns {boolean}
 */
function isDisposableOverlayChrome(node, size) {
    if (!node || node.type !== "shape") {
        return false;
    }
    var sh = node.shape || {};
    if (sh.type !== "rect" && sh.type !== "path") {
        return false;
    }
    var w = (size && size.width) || sh.width || 0;
    var h = (size && size.height) || sh.height || 0;
    return w >= 80 && w <= 480 && h >= 48 && h <= 320;
}

/**
 * Leftover scrollbar thumbs inside a date picker (thin tall rects).
 * @param {*} node
 * @param {{x:number,y:number}} pos
 * @param {{width:number,height:number}} size
 * @param {Array} dateBounds
 * @returns {boolean}
 */
function isDatePickerScrollbarGhost(node, pos, size, dateBounds) {
    if (!node || node.type !== "shape") {
        return false;
    }
    var sh = node.shape || {};
    if (sh.type !== "rect") {
        return false;
    }
    var w = (size && size.width) || sh.width || 0;
    var h = (size && size.height) || sh.height || 0;
    if (w < 3 || w > 12 || h < 24) {
        return false;
    }
    return overlapsProtectedOverlay(pos, size, dateBounds);
}

/**
 * Menu/dialog panel backgrounds left behind when only option text is stripped.
 * @param {*} node
 * @returns {boolean}
 */
function isPanelChromeShape(node) {
    if (!node || node.type !== "shape") {
        return false;
    }
    var sh = node.shape || {};
    if (sh.type !== "rect") {
        return false;
    }
    var w = sh.width || 0;
    var h = sh.height || 0;
    // Tall popover / menu panel
    if (w >= 80 && h >= 48) {
        return true;
    }
    // Menu row chips
    if (w >= 100 && h >= 22 && h <= 44) {
        return true;
    }
    return false;
}

/**
 * Inside a mixed overlay group: drop open-menu copy + panel chrome;
 * keep closed triggers and any other non-menu text (e.g. calendar grids).
 * @param {*} node
 * @returns {boolean}
 */
function shouldSkipInTriggersOnly(node) {
    if (!node) {
        return true;
    }
    if (node.type === "text") {
        var text = (node.text && node.text.rawText) || "";
        if (/^search\s+by\b/i.test(String(text).trim())) {
            return true;
        }
        return isOpenMenuText(text);
    }
    if (node.type === "shape") {
        if (isPanelChromeShape(node)) {
            return true;
        }
        var sh = node.shape || {};
        if (sh.type === "path") {
            return false;
        }
        // Keep small field chrome; drop mid-size menu rows already covered above
        var h = sh.height || 0;
        var w = sh.width || 0;
        if (sh.type === "rect" && w >= 100 && h >= 22 && h <= 44) {
            return true;
        }
        return false;
    }
    if (node.type === "group") {
        return false;
    }
    return false;
}

/**
 * @param {*} node
 * @returns {boolean}
 */
function shouldSkipOnArtboard(node) {
    return isOpenDropdownPanel(node) || isTableEditRow(node);
}

/**
 * Content bbox of a group from descendant leaves (ignores parked group origin).
 * @param {*} node
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {{x:number,y:number}} parentAbs
 * @param {Function} artboardPosition
 * @param {Function} nodeSize
 * @returns {{x:number,y:number,width:number,height:number}|null}
 */
function measureContentBounds(
    node,
    artboard,
    parentAbs,
    artboardPosition,
    nodeSize
) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;

    function visit(n, pa) {
        if (!n || n.visible === false) {
            return;
        }
        var pos = artboardPosition(n, artboard, pa);
        var kids = (n.group && n.group.children) || [];
        if (n.type === "text" || n.type === "shape") {
            var size = nodeSize(n);
            var w = Math.max(size.width || 0, 1);
            var h = Math.max(size.height || 0, 1);
            var x = pos.x;
            var y = pos.y;
            if (size.pathMinX != null) {
                x += size.pathMinX;
            }
            if (size.pathMinY != null) {
                y += size.pathMinY;
            }
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        }
        kids.forEach(function (c) {
            visit(c, pos);
        });
    }

    visit(node, parentAbs || { x: 0, y: 0 });
    if (!isFinite(minX) || maxX - minX < 8 || maxY - minY < 8) {
        return null;
    }
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Collect date-range picker content bounds on an artboard.
 * @param {Array} children
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {Function} artboardPosition
 * @param {Function} nodeSize
 * @returns {Array<{x:number,y:number,width:number,height:number}>}
 */
function collectDatePickerBounds(
    children,
    artboard,
    artboardPosition,
    nodeSize
) {
    var out = [];
    function visit(n, pa) {
        if (!n || n.visible === false) {
            return;
        }
        var pos = artboardPosition(n, artboard, pa);
        if (isDateRangePicker(n)) {
            var box = measureContentBounds(
                n,
                artboard,
                pa,
                artboardPosition,
                nodeSize
            );
            if (box) {
                out.push(box);
            }
            return;
        }
        ((n.group && n.group.children) || []).forEach(function (c) {
            visit(c, pos);
        });
    }
    (children || []).forEach(function (c) {
        visit(c, { x: 0, y: 0 });
    });
    return out;
}

/**
 * True when a leaf overlaps a protected date-picker panel (other UI under it).
 * @param {{x:number,y:number}} pos
 * @param {{width:number,height:number}} size
 * @param {Array<{x:number,y:number,width:number,height:number}>} boundsList
 * @returns {boolean}
 */
function overlapsProtectedOverlay(pos, size, boundsList) {
    if (!boundsList || !boundsList.length || !pos) {
        return false;
    }
    var w = Math.max((size && size.width) || 0, 4);
    var h = Math.max((size && size.height) || 0, 4);
    var ax1 = pos.x;
    var ay1 = pos.y;
    var ax2 = pos.x + w;
    var ay2 = pos.y + h;
    for (var i = 0; i < boundsList.length; i++) {
        var b = boundsList[i];
        var bx1 = b.x;
        var by1 = b.y;
        var bx2 = b.x + b.width;
        var by2 = b.y + b.height;
        var ix = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
        var iy = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
        var area = ix * iy;
        if (area <= 0) {
            continue;
        }
        var leafArea = w * h;
        // Skip if most of this leaf sits under the picker, or any solid hit on small chrome
        if (area / leafArea >= 0.35 || (leafArea < 400 && area > 20)) {
            return true;
        }
    }
    return false;
}

/**
 * @param {string} text
 * @param {{x:number,y:number}} [pos]
 * @returns {string|null}
 */
function chromeDedupeKey(text, pos) {
    if (!text) {
        return null;
    }
    var t = String(text).trim();
    if (!t || t.indexOf("\n") !== -1 || t.length > 64) {
        return null;
    }
    // Only collapse clearly repeated summary chrome, not arbitrary labels
    if (SUMMARY_CHROME_RE.test(t)) {
        return "chrome:" + t.toLowerCase();
    }
    return null;
}

/**
 * Index descendant text once per artboard convert.
 * @param {*} root
 */
function beginPass(root) {
    textCache = new WeakMap();
    indexTexts(root);
}

function endPass() {
    textCache = null;
}

/**
 * @param {*} node
 * @returns {string[]}
 */
function indexTexts(node) {
    var out = [];
    if (!node) {
        return out;
    }
    if (node.type === "text" && node.text && node.text.rawText) {
        out.push(node.text.rawText);
    }
    var groups = (node.group && node.group.children) || [];
    var i;
    for (i = 0; i < groups.length; i++) {
        var g = indexTexts(groups[i]);
        for (var j = 0; j < g.length; j++) out.push(g[j]);
    }
    var board = (node.artboard && node.artboard.children) || [];
    for (i = 0; i < board.length; i++) {
        var b = indexTexts(board[i]);
        for (var k = 0; k < b.length; k++) out.push(b[k]);
    }
    if (textCache) {
        textCache.set(node, out);
    }
    return out;
}

/**
 * @param {*} node
 * @param {string[]} out
 */
function collectTexts(node, out) {
    if (!node) return;
    if (textCache && textCache.has(node)) {
        var cached = textCache.get(node);
        for (var i = 0; i < cached.length; i++) {
            out.push(cached[i]);
        }
        return;
    }
    if (node.type === "text" && node.text && node.text.rawText) {
        out.push(node.text.rawText);
    }
    var kids = (node.group && node.group.children) || [];
    kids.forEach(function (c) {
        collectTexts(c, out);
    });
}

/**
 * @param {*} node
 * @param {Array} out
 * @param {number} depth
 */
function collectFieldRects(node, out, depth) {
    if (!node || depth > 4) return;
    var sh = node.shape || {};
    if (
        node.type === "shape" &&
        sh.type === "rect" &&
        sh.width > 40 &&
        sh.height > 16 &&
        sh.height < 50
    ) {
        out.push({ w: sh.width, h: sh.height });
    }
    var kids = (node.group && node.group.children) || [];
    kids.forEach(function (c) {
        collectFieldRects(c, out, depth + 1);
    });
}

module.exports = {
    beginPass: beginPass,
    endPass: endPass,
    shouldSkipOnArtboard: shouldSkipOnArtboard,
    shouldSkipInTriggersOnly: shouldSkipInTriggersOnly,
    isMixedOverlayGroup: isMixedOverlayGroup,
    isOpenDropdownPanel: isOpenDropdownPanel,
    isTableEditRow: isTableEditRow,
    isOpenMenuText: isOpenMenuText,
    isClosedTriggerText: isClosedTriggerText,
    isDateRangePicker: isDateRangePicker,
    chromeDedupeKey: chromeDedupeKey,
    measureContentBounds: measureContentBounds,
    collectDatePickerBounds: collectDatePickerBounds,
    overlapsProtectedOverlay: overlapsProtectedOverlay,
    isDisposableOverlayChrome: isDisposableOverlayChrome,
    isDatePickerScrollbarGhost: isDatePickerScrollbarGhost
};
