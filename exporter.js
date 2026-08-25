/**
 * Export engine: convert XD Artboard Scenegraph nodes into HTML + CSS rules.
 *
 * Layout strategy: absolute positioning relative to the artboard origin for
 * 1:1 pixel fidelity. Shared styles accumulate on a CssSheet; assets are
 * queued through asset-manager and flushed by main.js after all artboards.
 */

var naming = require("./utils/naming");
var color = require("./utils/color");
var cssSheet = require("./exporter/css-sheet");
var convertNode = require("./exporter/convert-node");
var documents = require("./exporter/documents");

/**
 * Export one artboard into HTML string + metadata (does not write files).
 * @param {*} artboard XD Artboard node
 * @param {{assets:*, sheet:*, usedClasses:Object.<string,number>}} ctx
 * @returns {Promise<{slug:string,name:string,width:number,height:number,html:string}>}
 */
function exportArtboard(artboard, ctx) {
    var gb = artboard.globalBounds;
    var origin = { x: gb.x, y: gb.y };
    var width = Math.round(gb.width);
    var height = Math.round(gb.height);
    var slug = naming.uniqueSlug(artboard.name || "artboard", ctx.usedClasses);
    var bg = color.fillToCss(artboard.fill, 1) || "#FFFFFF";

    var walkCtx = {
        artboardOrigin: origin,
        sheet: ctx.sheet,
        assets: ctx.assets,
        usedClasses: ctx.usedClasses,
        depth: 0
    };

    // Scenegraph traversal: depth-first over artboard.children
    return convertNode.convertChildren(artboard, walkCtx).then(function (bodyHtml) {
        var html = documents.artboardDocument({
            title: artboard.name || slug,
            className: slug,
            width: width,
            height: height,
            background: bg,
            bodyHtml: bodyHtml
        });
        return {
            slug: slug,
            name: artboard.name || slug,
            width: width,
            height: height,
            html: html
        };
    });
}

/**
 * Create a shared CSS sheet used across all artboards in one export run.
 * @returns {{add:Function,toString:Function}}
 */
function createSharedSheet() {
    return cssSheet.createCssSheet();
}

/**
 * Build index.html listing exported artboards.
 * @param {Array<{name:string,slug:string,width:number,height:number}>} list
 * @returns {string}
 */
function buildIndexHtml(list) {
    return documents.indexDocument(list);
}

module.exports = {
    exportArtboard: exportArtboard,
    createSharedSheet: createSharedSheet,
    buildIndexHtml: buildIndexHtml
};
