/**
 * Adobe XD plugin entry: menu command "Export to HTML".
 *
 * Flow:
 * 1. Prompt for export folder (UXP localFileSystem)
 * 2. Create output directories
 * 3. Walk root.children for Artboard nodes
 * 4. Export each artboard via exporter.js
 * 5. Flush asset renditions, write CSS + index.html
 */

var scenegraph = require("scenegraph");
var application = require("application");
var fs = require("uxp").storage.localFileSystem;

var exporter = require("./exporter");
var assetManager = require("./asset-manager");
var fsHelpers = require("./utils/fs-helpers");

/**
 * Collect Artboard nodes from the document root (top-level only).
 * @param {*} root
 * @returns {Array<*>}
 */
function collectArtboards(root) {
    var list = [];
    if (!root || !root.children) {
        return list;
    }
    root.children.forEach(function (node) {
        if (node instanceof scenegraph.Artboard) {
            list.push(node);
        }
    });
    return list;
}

/**
 * Main menu command handler (registered in manifest as exportToHtml).
 * @returns {Promise<void>}
 */
async function exportToHtml() {
    try {
        var rootFolder = await fs.getFolder();
        if (!rootFolder) {
            return;
        }

        var artboardsFolder = await fsHelpers.ensureFolder(rootFolder, "artboards");
        var stylesFolder = await fsHelpers.ensureFolder(rootFolder, "styles");
        var assetsFolder = await fsHelpers.ensureFolder(rootFolder, "assets");
        var imagesFolder = await fsHelpers.ensureFolder(assetsFolder, "images");
        var iconsFolder = await fsHelpers.ensureFolder(assetsFolder, "icons");

        var artboards = collectArtboards(scenegraph.root);
        if (!artboards.length) {
            await application.alert("No artboards found in this document.");
            return;
        }

        var assets = assetManager.createAssetManager({
            imagesFolder: imagesFolder,
            iconsFolder: iconsFolder,
            usedNames: {}
        });
        var sheet = exporter.createSharedSheet();
        var usedClasses = {};
        var exported = [];

        for (var i = 0; i < artboards.length; i++) {
            var result = await exporter.exportArtboard(artboards[i], {
                assets: assets,
                sheet: sheet,
                usedClasses: usedClasses
            });
            await fsHelpers.writeText(
                artboardsFolder,
                result.slug + ".html",
                result.html
            );
            exported.push({
                name: result.name,
                slug: result.slug,
                width: result.width,
                height: result.height
            });
        }

        await assets.flush();
        await fsHelpers.writeText(stylesFolder, "export.css", sheet.toString());
        await fsHelpers.writeText(
            rootFolder,
            "index.html",
            exporter.buildIndexHtml(exported)
        );

        await application.alert(
            "Exported " +
                exported.length +
                " artboard(s) to:\n" +
                rootFolder.name +
                "\n\nOpen index.html in a browser."
        );
    } catch (err) {
        console.error("Export to HTML failed", err);
        await application.alert(
            "Export failed: " + (err && err.message ? err.message : String(err))
        );
    }
}

module.exports = {
    commands: {
        exportToHtml: exportToHtml
    }
};
