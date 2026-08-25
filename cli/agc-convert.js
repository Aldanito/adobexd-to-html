"use strict";

/**
 * Pass 2: AGC tree → HTML. Visibility is already decided by planVisible.
 * This walk only positions, hoists groups, and emits.
 */

var naming = require("../utils/naming");
var semantic = require("../exporter/semantic");
var geometry = require("./agc-geometry");
var agcSize = require("./agc-size");
var agcEmit = require("./agc-emit");
var agcEmitPath = require("./agc-emit-path");
var agcEmitPattern = require("./agc-emit-pattern");
var walkChildren = require("./walk-children");
var agcEmitDropdown = require("./agc-emit-dropdown");
var agcEmitIcon = require("./agc-emit-icon");
var planVisible = require("./pipeline/plan-visible").planVisible;
var agcEmitGroup = require("./agc-emit-group");
var agcTextLayout = require("./agc-text-layout");
var agcWordmark = require("./agc-wordmark");

/**
 * Convert artboard AGC root into inner HTML (children only).
 * @param {*} artboardNode
 * @param {*} ctx must include artboard, sheet, assets, usedClasses
 * @returns {string}
 */
function convertArtboard(artboardNode, ctx) {
    if (ctx.skipDatePickerGhosts === undefined) {
        ctx.skipDatePickerGhosts = true;
    }
    ctx.skipNodes = planVisible(artboardNode, ctx);
    var children =
        (artboardNode.artboard && artboardNode.artboard.children) || [];
    return walkChildren.mapChildren(children, ctx, { x: 0, y: 0 }, convertNode);
}

/**
 * Convert a subtree with positions relative to originOffset.
 * @param {*} node
 * @param {*} ctx
 * @param {{x:number,y:number}} originOffset
 * @returns {string}
 */
function convertSubtree(node, ctx, originOffset) {
    ctx.originOffset = originOffset || { x: 0, y: 0 };
    ctx.skipNodes = ctx.skipNodes || new WeakSet();
    var html = convertNode(node, ctx, { x: 0, y: 0 });
    ctx.originOffset = { x: 0, y: 0 };
    return html;
}

/**
 * @param {*} node
 * @param {*} ctx
 * @param {{x:number,y:number}} parentAbs
 * @returns {string}
 */
function convertNode(node, ctx, parentAbs) {
    if (!node || node.visible === false) {
        return "";
    }
    if (ctx.skipNodes && ctx.skipNodes.has(node)) {
        return "";
    }

    var artboard = ctx.artboard;
    var type = node.type;
    var pos = geometry.artboardPosition(node, artboard, parentAbs);
    var size = agcSize.nodeSize(node);
    var offset = ctx.originOffset || { x: 0, y: 0 };
    var drawPos = { x: pos.x - offset.x, y: pos.y - offset.y };
    var children = (node.group && node.group.children) || [];

    var isLeaf = type === "text" || type === "shape";
    if (
        isLeaf &&
        !ctx.skipClip &&
        !geometry.intersectsArtboard(pos, size, artboard)
    ) {
        return "";
    }

    var className = naming.uniqueSlug(
        node.name || type || "layer",
        ctx.usedClasses
    );

    var opacity =
        node.style && typeof node.style.opacity === "number"
            ? node.style.opacity
            : 1;
    var hasClip =
        node.meta && node.meta.ux && node.meta.ux.clipPathResources;
    var hoist =
        type === "group" &&
        !hasClip &&
        !ctx.keepGroups &&
        !agcEmitIcon.isIconGroup(node, artboard, parentAbs) &&
        !geometry.isRotated(node) &&
        semantic.isTransparentGroup({
            name: node.name,
            opacity: opacity,
            shadow: null,
            blur: null,
            mask: null
        });

    if (type === "group") {
        var mark = agcWordmark.tryCompose(node, artboard, parentAbs);
        if (mark) {
            return agcEmit.emitText(
                mark.stem,
                className,
                {
                    x: mark.pos.x - offset.x,
                    y: mark.pos.y - offset.y
                },
                mark.size,
                ctx,
                {
                    "font-size": mark.fontSize + "px",
                    "text-align": "left",
                    "white-space": "nowrap",
                    "line-height": mark.fontSize + "px"
                },
                mark.text
            );
        }
    }

    if (hoist) {
        return walkChildren.mapChildren(children, ctx, pos, convertNode);
    }

    if (
        type === "group" &&
        agcEmitIcon.isIconGroup(node, artboard, parentAbs)
    ) {
        var iconBox = agcEmitIcon.measureIconBox(node, artboard, parentAbs);
        if (
            !ctx.skipClip &&
            !geometry.intersectsArtboard(
                { x: iconBox.minX, y: iconBox.minY },
                { width: iconBox.width, height: iconBox.height },
                artboard
            )
        ) {
            return "";
        }
        return agcEmitIcon.emitIconGroup(
            node,
            className,
            ctx,
            artboard,
            parentAbs,
            offset
        );
    }

    var fill = node.style && node.style.fill;
    if (fill && fill.type === "pattern") {
        return agcEmitPattern.emitPattern(node, className, drawPos, size, ctx);
    }

    if (type === "shape" && node.shape && node.shape.type === "path") {
        return agcEmitPath.emitPath(node, className, drawPos, size, ctx);
    }

    var rawText =
        type === "text" ? agcTextLayout.formattedRawText(node) : "";
    if (type === "text") {
        return agcEmitDropdown.isDropdownLabel(rawText)
            ? agcEmitDropdown.emitDropdownText(
                  node,
                  className,
                  drawPos,
                  size,
                  ctx
              )
            : agcEmit.emitText(
                  node,
                  className,
                  drawPos,
                  size,
                  ctx,
                  agcTextLayout.formattedRawText(node).indexOf("\n") === -1
                      ? { "white-space": "nowrap" }
                      : null
              );
    }

    if (type === "group") {
        return agcEmitGroup.emitGroup(
            node,
            className,
            pos,
            children,
            hasClip,
            offset,
            ctx,
            artboard,
            convertNode
        );
    }
    if (type === "shape") {
        return agcEmit.emitShape(node, className, drawPos, size, ctx);
    }
    return walkChildren.mapChildren(children, ctx, pos, convertNode);
}

module.exports = {
    convertArtboard: convertArtboard,
    convertSubtree: convertSubtree
};
