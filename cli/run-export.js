"use strict";

/**
 * Orchestrate CLI export: parse .xd → artboards, assets, gold SVG, HTML.
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
var svgScene = require("./svg-scene");
var planVisible = require("./pipeline/plan-visible").planVisible;
var boardGroup = require("./board-group");
var interactions = require("./interactions");
var hotspots = require("./hotspots");
var thumbs = require("./thumbs");
var writeReact = require("../exporter/react/write-react");

/**
 * @param {{input:string, output:string, legacyHtml?:boolean, hideOverlays?:boolean, pagesOnly?:boolean}} options
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
        var fontFiles = svgScene.fonts.copyEmbeddedFonts(
            doc.resourcesDir,
            path.join(dirs.assets, "fonts")
        );

        var list = doc.artboards || [];
        if (options.pagesOnly) {
            list = list.filter(function (ab) {
                return !boardGroup.isKitBoard(ab.name);
            });
        }
        list.forEach(function (ab) {
            ab.slug = naming.uniqueSlug(ab.name || ab.id, usedSlugs);
        });
        var idToSlug = {};
        list.forEach(function (ab) {
            idToSlug[ab.id] = ab.slug;
        });
        var hrefById = interactions.nodeHrefs(doc.interactions, idToSlug);
        var exported = [];
        var reactBoards = [];

        list.forEach(function (ab) {
            var rootNode = (ab.agc.children && ab.agc.children[0]) || ab.agc;
            var slug = ab.slug;
            var bg =
                agcColor.agcFillToCss(
                    rootNode.style && rootNode.style.fill
                ) || "#FFFFFF";
            var artboard = {
                x: ab.x,
                y: ab.y,
                width: ab.width,
                height: ab.height
            };

            var bodyHtml;
            var fontCss = "";
            var sceneSvg = null;
            if (options.legacyHtml) {
                var sheet = cssSheet.createCssSheet();
                var artboardClasses = {};
                bodyHtml = agcConvert.convertArtboard(rootNode, {
                    artboard: artboard,
                    sheet: sheet,
                    assets: copier,
                    usedClasses: artboardClasses,
                    assetCategory: "images",
                    assetPathKey: "relFromArtboards",
                    hideOverlays: !!options.hideOverlays,
                    skipDatePickerGhosts: true
                });
                fs.writeFileSync(
                    path.join(dirs.styles, slug + ".css"),
                    sheet.toString(),
                    "utf8"
                );
            } else {
                var skip = new WeakSet();
                if (options.hideOverlays) {
                    skip = planVisible(rootNode, {
                        artboard: artboard,
                        hideOverlays: true,
                        skipDatePickerGhosts: false
                    });
                }
                var scene = svgScene.artboardToSvg(rootNode, {
                    artboard: artboard,
                    assets: copier,
                    skipNodes: skip,
                    assetCategory: "images",
                    assetPathKey: "relFromArtboards",
                    background: bg,
                    fontFiles: fontFiles
                });
                bodyHtml = scene.svg;
                sceneSvg = scene.svg;
                fontCss = scene.fontCss;
                fs.writeFileSync(
                    path.join(dirs.gold, slug + ".svg"),
                    scene.svg,
                    "utf8"
                );
                fs.writeFileSync(
                    path.join(dirs.styles, slug + ".css"),
                    sharedSheet.toString(),
                    "utf8"
                );
                try {
                    thumbs.writeThumb(
                        scene.svg,
                        path.join(dirs.thumbs, slug + ".png"),
                        dirs.gold,
                        320
                    );
                } catch (e) {
                    /* skip thumbnail */
                }
            }

            var hotspotsHtml = hotspots.hotspotHtml(
                rootNode,
                artboard,
                hrefById
            );
            var html = documents.artboardDocument({
                title: ab.name,
                className: slug,
                width: ab.width,
                height: ab.height,
                background: bg,
                bodyHtml: bodyHtml,
                stylesheet: slug + ".css",
                fontCss: fontCss,
                hotspotsHtml: hotspotsHtml
            });

            fs.writeFileSync(
                path.join(dirs.artboards, slug + ".html"),
                html,
                "utf8"
            );
            reactBoards.push({
                name: ab.name,
                slug: slug,
                width: ab.width,
                height: ab.height,
                background: bg,
                bodyHtml: bodyHtml,
                hotspotsHtml: hotspotsHtml
            });
            exported.push({
                name: ab.name,
                slug: slug,
                width: ab.width,
                height: ab.height,
                thumb: "assets/thumbs/" + slug + ".png"
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

        writeReact.writeReactExport(dirs.react, reactBoards);

        fs.writeFileSync(
            path.join(outRoot, "index.html"),
            documents.indexDocument({
                title: doc.name || "XD Export",
                artboards: exported,
                assets: assetList
            }),
            "utf8"
        );

        fs.writeFileSync(
            path.join(outRoot, "fidelity.json"),
            JSON.stringify(
                {
                    artboards: exported,
                    mode: options.legacyHtml ? "legacy-html" : "scenegraph-svg"
                },
                null,
                2
            ),
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
    var thumbsDir = path.join(assets, "thumbs");
    var gold = path.join(outRoot, "gold");
    var react = path.join(outRoot, "react");
    [outRoot, artboards, styles, assets, images, icons, thumbsDir, gold, react].forEach(
        function (d) {
            fs.mkdirSync(d, { recursive: true });
        }
    );
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
        icons: icons,
        thumbs: thumbsDir,
        gold: gold,
        react: react
    };
}

module.exports = {
    runExport: runExport
};
