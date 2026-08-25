/**
 * Asset export: raster ImageFill and vector nodes → PNG/SVG via UXP storage
 * and application.createRenditions.
 */

var application = require("application");
var naming = require("./utils/naming");

/**
 * Create AssetManager bound to export folders.
 * @param {{imagesFolder:*, iconsFolder:*, usedNames:Object.<string,number>}} options
 */
function createAssetManager(options) {
    var imagesFolder = options.imagesFolder;
    var iconsFolder = options.iconsFolder;
    var usedNames = options.usedNames || {};
    var pendingRenditions = [];

    /**
     * Queue a PNG rendition of a scenegraph node into assets/images.
     * @param {*} node
     * @param {string} preferredName
     * @returns {Promise<string>} Relative web path from artboards/ page
     */
    function exportRaster(node, preferredName) {
        var slug = naming.uniqueSlug(preferredName || node.name || "image", usedNames);
        var fileName = slug + ".png";
        return imagesFolder.createFile(fileName, { overwrite: true }).then(function (file) {
            pendingRenditions.push({
                node: node,
                outputFile: file,
                type: application.RenditionType.PNG,
                scale: 2
            });
            return "../assets/images/" + fileName;
        });
    }

    /**
     * Queue an SVG (fallback PNG) rendition into assets/icons.
     * @param {*} node
     * @param {string} preferredName
     * @returns {Promise<string>} Relative web path from artboards/ page
     */
    function exportVector(node, preferredName) {
        var slug = naming.uniqueSlug(preferredName || node.name || "icon", usedNames);
        var preferSvg =
            application.RenditionType && application.RenditionType.SVG;
        var type = preferSvg
            ? application.RenditionType.SVG
            : application.RenditionType.PNG;
        var ext = preferSvg ? ".svg" : ".png";
        var fileName = slug + ext;
        return iconsFolder.createFile(fileName, { overwrite: true }).then(function (file) {
            var entry = {
                node: node,
                outputFile: file,
                type: type,
                scale: 2
            };
            if (preferSvg) {
                entry.minify = true;
            }
            pendingRenditions.push(entry);
            return "../assets/icons/" + fileName;
        });
    }

    /**
     * Flush all queued renditions (must run while edit context is still valid).
     * @returns {Promise<void>}
     */
    function flush() {
        if (!pendingRenditions.length) {
            return Promise.resolve();
        }
        var batch = pendingRenditions.slice();
        pendingRenditions = [];
        return application.createRenditions(batch).then(function () {
            return undefined;
        });
    }

    return {
        exportRaster: exportRaster,
        exportVector: exportVector,
        flush: flush
    };
}

module.exports = {
    createAssetManager: createAssetManager
};
