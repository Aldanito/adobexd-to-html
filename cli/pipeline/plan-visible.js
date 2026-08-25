"use strict";

/**
 * Pass 1 of artboard export: decide which nodes are visible.
 *
 * Emit (pass 2) must not skip, score, or claim slots. All visibility lives here
 * so occupancy cannot crush unrelated fields during HTML generation.
 */

var geometry = require("../agc-geometry");
var agcSize = require("../agc-size");
var overlayFilter = require("../overlay-filter");
var agcEmitIcon = require("../agc-emit-icon");
var slotClaim = require("./slot-claim");

/**
 * @param {*} artboardNode AGC artboard root
 * @param {{artboard:*, hideOverlays?:boolean}} ctx
 * @returns {WeakSet}
 */
function planVisible(artboardNode, ctx) {
    var skip = new WeakSet();
    var artboard = ctx.artboard;
    var children =
        (artboardNode.artboard && artboardNode.artboard.children) || [];

    overlayFilter.beginPass(artboardNode);
    try {
        var dateBounds = overlayFilter.collectDatePickerBounds(
            children,
            artboard,
            geometry.artboardPosition,
            agcSize.nodeSize
        );
        markDatePickerGhosts(
            children,
            { x: 0, y: 0 },
            skip,
            dateBounds,
            artboard
        );

        if (!ctx.hideOverlays) {
            return skip;
        }

        var slots = slotClaim.createSlotIndex();
        var flags = { triggersOnly: false, insideDatePicker: 0 };

        children.forEach(function (child) {
            visit(child, { x: 0, y: 0 }, flags);
        });
    } finally {
        overlayFilter.endPass();
    }

    return skip;

    function visit(node, parentAbs, state) {
        if (!node || node.visible === false) {
            return;
        }
        if (overlayFilter.shouldSkipOnArtboard(node)) {
            skip.add(node);
            return;
        }

        var enteredPicker = overlayFilter.isDateRangePicker(node);
        if (enteredPicker) {
            state = {
                triggersOnly: state.triggersOnly,
                insideDatePicker: state.insideDatePicker + 1
            };
        }

        if (
            state.triggersOnly &&
            overlayFilter.shouldSkipInTriggersOnly(node)
        ) {
            skip.add(node);
            if (node.type !== "group") {
                return;
            }
        }

        var enteredMixed = false;
        if (!state.triggersOnly && overlayFilter.isMixedOverlayGroup(node)) {
            state = {
                triggersOnly: true,
                insideDatePicker: state.insideDatePicker
            };
            enteredMixed = true;
        }

        var pos = geometry.artboardPosition(node, artboard, parentAbs);
        var size = agcSize.nodeSize(node);
        var type = node.type;
        var isLeaf = type === "text" || type === "shape";
        var isPath =
            type === "shape" && node.shape && node.shape.type === "path";
        var inPicker = state.insideDatePicker > 0;

        if (
            isLeaf &&
            !inPicker &&
            overlayFilter.overlapsProtectedOverlay(pos, size, dateBounds)
        ) {
            skip.add(node);
            return;
        }

        if (
            !inPicker &&
            overlayFilter.isDisposableOverlayChrome(node, size)
        ) {
            skip.add(node);
            return;
        }

        if (
            type === "group" &&
            agcEmitIcon.isIconGroup(node, artboard, parentAbs)
        ) {
            var box = agcEmitIcon.measureIconBox(node, artboard, parentAbs);
            if (
                !slots.claimBox(
                    { x: box.minX, y: box.minY },
                    { width: box.width, height: box.height },
                    "icon"
                )
            ) {
                skip.add(node);
            }
            return;
        }

        if (isLeaf && !isPath) {
            if (type === "text") {
                var raw = (node.text && node.text.rawText) || "";
                if (!slots.claimText(node, pos, raw, skip)) {
                    skip.add(node);
                }
            } else if (!slots.claimBox(pos, size, "shape")) {
                skip.add(node);
            }
        }

        var kids = (node.group && node.group.children) || [];
        kids.forEach(function (child) {
            visit(child, pos, state);
        });
    }

    function markDatePickerGhosts(nodes, parentAbs, skipSet, bounds, ab) {
        if (!bounds || !bounds.length) {
            return;
        }
        function walk(n, pa) {
            if (!n || n.visible === false) {
                return;
            }
            var p = geometry.artboardPosition(n, ab, pa);
            if (
                overlayFilter.isDatePickerScrollbarGhost(
                    n,
                    p,
                    agcSize.nodeSize(n),
                    bounds
                )
            ) {
                skipSet.add(n);
            }
            ((n.group && n.group.children) || []).forEach(function (c) {
                walk(c, p);
            });
        }
        (nodes || []).forEach(function (c) {
            walk(c, parentAbs);
        });
    }
}

module.exports = {
    planVisible: planVisible
};
