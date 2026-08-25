"use strict";

/**
 * Orchestrate CLI export: parse .xd → artboards, assets, CSS.
 */

var fs = require("fs");
var path = require("path");
var parseXd = require("./parse-xd");
var assets = require("./assets");
var agcConvert = require("./agc-convert");
var agcColor = require("./agc-color");
var cssSheet = require("../exporter/css-sheet");
var documents = require("../exporter/documents");
var naming = require("../utils/naming");

/**
 * @param {{input:string, output:string}} options
 * @returns {Promise<{artboardCount:number}>}
 */
function runExport(options) {
    var doc = parseXd.openXd(options.input);
    try {
        var outRoot = path.resolve(options.output);
        var dirs = ensureOutputDirs(outRoot);
        var usedAssetNames = {};
        var usedSlugs = {};
        var sharedSheet = cssSheet.createCssSheet();
        var copier = assets.createAssetCopier(
            doc.resourcesDir,
            dirs.assets,
            usedAssetNames
        );
        var exported = [];

        doc.artboards.forEach(function (ab) {
            var rootNode = (ab.agc.children && ab.agc.children[0]) || ab.agc;
            var slug = naming.uniqueSlug(ab.name || ab.id, usedSlugs);
            var bg =
                agcColor.agcFillToCss(
                    rootNode.style && rootNode.style.fill
                ) || "#FFFFFF";

            var sheet = cssSheet.createCssSheet();
            var artboardClasses = {};

            var bodyHtml = agcConvert.convertArtboard(rootNode, {
                artboard: {
                    x: ab.x,
                    y: ab.y,
                    width: ab.width,
                    height: ab.height
                },
                sheet: sheet,
                assets: copier,
                usedClasses: artboardClasses,
                assetCategory: "images",
                assetPathKey: "relFromArtboards",
                hideOverlays: false
            });

            fs.writeFileSync(
                path.join(dirs.styles, slug + ".css"),
                sheet.toString(),
                "utf8"
            );

            var html = documents.artboardDocument({
                title: ab.name,
                className: slug,
                width: ab.width,
                height: ab.height,
                background: bg,
                bodyHtml: bodyHtml,
                stylesheet: slug + ".css"
            });

            fs.writeFileSync(
                path.join(dirs.artboards, slug + ".html"),
                html,
                "utf8"
            );
            exported.push({
                name: ab.name,
                slug: slug,
                width: ab.width,
                height: ab.height
            });
        });

        fs.writeFileSync(
            path.join(dirs.styles, "export.css"),
            sharedSheet.toString(),
            "utf8"
        );

        var assetList = Object.keys(copier.cache).map(function (key) {
            var a = copier.cache[key];
            return {
                category: a.category,
                fileName: a.fileName,
                href: a.relFromRoot
            };
        });

        fs.writeFileSync(
            path.join(outRoot, "index.html"),
            documents.indexDocument({
                artboards: exported,
                assets: assetList
            }),
            "utf8"
        );

        return Promise.resolve({
            artboardCount: exported.length
        });
    } finally {
        doc.cleanup();
    }
}

/**
 * @param {string} outRoot
 */
function ensureOutputDirs(outRoot) {
    var artboards = path.join(outRoot, "artboards");
    var styles = path.join(outRoot, "styles");
    var assets = path.join(outRoot, "assets");
    var images = path.join(assets, "images");
    var icons = path.join(assets, "icons");
    [outRoot, artboards, styles, assets, images, icons].forEach(function (d) {
        fs.mkdirSync(d, { recursive: true });
    });
    [
        path.join(outRoot, "components"),
        path.join(assets, "components")
    ].forEach(function (leftover) {
        if (fs.existsSync(leftover)) {
            fs.rmSync(leftover, { recursive: true, force: true });
        }
    });
    return {
        artboards: artboards,
        styles: styles,
        assets: assets,
        images: images,
        icons: icons
    };
}

module.exports = {
    runExport: runExport
};
