/**
 * Convert a single Scenegraph node into HTML fragments (async for assets).
 * Traversal preserves layer nesting; absolute layout is relative to artboard.
 */

var naming = require("../utils/naming");
var geometry = require("../utils/geometry");
var semantic = require("./semantic");
var textStyle = require("./text-style");
var visualStyle = require("./visual-style");
var htmlUtils = require("./html-utils");
var nodeKind = require("./node-kind");

/**
 * @param {*} node
 * @param {{
 *   artboardOrigin:{x:number,y:number},
 *   sheet:*,
 *   assets:*,
 *   usedClasses:Object.<string,number>,
 *   depth:number
 * }} ctx
 * @returns {Promise<string>}
 */
function convertNode(node, ctx) {
    if (!node || node.visible === false) {
        return Promise.resolve("");
    }

    var type = node.constructor && node.constructor.name;

    // Skip artboard chrome when walking children (handled by caller)
    if (type === "Artboard") {
        return convertChildren(node, ctx);
    }

    // Transparent layout groups: hoist children to avoid DOM bloat
    if (
        (type === "Group" || type === "ScrollableGroup" || type === "SymbolInstance") &&
        semantic.isTransparentGroup(node)
    ) {
        return convertChildren(node, ctx);
    }

    var bounds = geometry.relativeBounds(node, ctx.artboardOrigin);
    var className = naming.uniqueSlug(node.name || type || "layer", ctx.usedClasses);
    var tag = semantic.pickTag(node.name, type);
    var decls = htmlUtils.mergeStyles(
        visualStyle.layoutStyleMap(bounds),
        type === "Text" ? textStyle.textStyleMap(node) : visualStyle.visualStyleMap(node)
    );

    // Image fills → <img> via rendition
    if (nodeKind.hasImageFill(node)) {
        return ctx.assets.exportRaster(node, className).then(function (src) {
            ctx.sheet.add("." + className, decls);
            return (
                '<img class="' +
                className +
                '" src="' +
                htmlUtils.escapeHtml(src) +
                '" alt="' +
                htmlUtils.escapeHtml(node.name || "") +
                '" width="' +
                bounds.width +
                '" height="' +
                bounds.height +
                '" />'
            );
        });
    }

    // Vector paths / booleans → external SVG/PNG
    if (nodeKind.isVectorShape(node)) {
        return ctx.assets.exportVector(node, className).then(function (src) {
            ctx.sheet.add("." + className, decls);
            return (
                '<img class="' +
                className +
                '" src="' +
                htmlUtils.escapeHtml(src) +
                '" alt="' +
                htmlUtils.escapeHtml(node.name || "") +
                '" width="' +
                bounds.width +
                '" height="' +
                bounds.height +
                '" />'
            );
        });
    }

    // Ellipse without children → rounded box (CSS)
    if (type === "Ellipse") {
        decls["border-radius"] = "50%";
    }

    ctx.sheet.add("." + className, decls);

    if (type === "Text") {
        var text = htmlUtils.escapeHtml(node.text || "");
        return Promise.resolve(
            "<" + tag + ' class="' + className + '">' + text + "</" + tag + ">"
        );
    }

    // Groups / rectangles / containers with children
    if (node.children && node.children.length) {
        var childCtx = {
            artboardOrigin: ctx.artboardOrigin,
            sheet: ctx.sheet,
            assets: ctx.assets,
            usedClasses: ctx.usedClasses,
            depth: ctx.depth + 1
        };
        return convertChildren(node, childCtx).then(function (inner) {
            return (
                "<" +
                tag +
                ' class="' +
                className +
                '">' +
                inner +
                "</" +
                tag +
                ">"
            );
        });
    }

    return Promise.resolve("<" + tag + ' class="' + className + '"></' + tag + ">");
}

/**
 * Depth-first walk of node.children (XD scenegraph list).
 * @param {*} parent
 * @param {*} ctx
 * @returns {Promise<string>}
 */
function convertChildren(parent, ctx) {
    if (!parent.children || !parent.children.length) {
        return Promise.resolve("");
    }
    var chain = Promise.resolve("");
    parent.children.forEach(function (child) {
        chain = chain.then(function (htmlSoFar) {
            return convertNode(child, ctx).then(function (piece) {
                return htmlSoFar + piece;
            });
        });
    });
    return chain;
}

module.exports = {
    convertNode: convertNode,
    convertChildren: convertChildren
};
