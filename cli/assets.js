"use strict";

/**
 * Copy pattern/bitmap resources into categorized asset folders.
 */

var fs = require("fs");
var path = require("path");
var naming = require("../utils/naming");

/**
 * @param {string} resourcesDir
 * @param {string} assetsRoot  e.g. export-out/assets
 * @param {Object.<string,number>} usedNames
 */
function createAssetCopier(resourcesDir, assetsRoot, usedNames) {
    var cache = {};

    /**
     * @param {*} fill AGC pattern fill
     * @param {string} preferredName
     * @param {string} [category="images"] subfolder under assets/
     * @returns {string|null} copied asset record (caller picks a relative path)
     */
    function copyPatternFill(fill, preferredName, category) {
        if (!fill || fill.type !== "pattern" || !fill.pattern) {
            return null;
        }
        var uid =
            (fill.pattern.meta &&
                fill.pattern.meta.ux &&
                fill.pattern.meta.ux.uid) ||
            null;
        if (!uid) {
            return null;
        }
        var cat = category || "images";
        var cacheKey = cat + ":" + uid;
        if (cache[cacheKey]) {
            return cache[cacheKey];
        }

        var src = path.join(resourcesDir, uid);
        if (!fs.existsSync(src)) {
            return null;
        }

        var dir = path.join(assetsRoot, cat);
        fs.mkdirSync(dir, { recursive: true });

        var slug = naming.uniqueSlug(preferredName || "image", usedNames);
        var ext = detectExt(src);
        var fileName = slug + ext;
        fs.copyFileSync(src, path.join(dir, fileName));

        // Paths are resolved by caller depth; return category-relative token
        cache[cacheKey] = {
            category: cat,
            fileName: fileName,
            relFromArtboards: "../assets/" + cat + "/" + fileName,
            relFromRoot: "assets/" + cat + "/" + fileName
        };
        return cache[cacheKey];
    }

    return { copyPatternFill: copyPatternFill, cache: cache };
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function detectExt(filePath) {
    var buf = Buffer.alloc(8);
    var fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    if (buf[0] === 0x89 && buf[1] === 0x50) return ".png";
    if (buf[0] === 0xff && buf[1] === 0xd8) return ".jpg";
    if (buf[0] === 0x47 && buf[1] === 0x49) return ".gif";
    if (buf[0] === 0x52 && buf[1] === 0x49) return ".webp";
    return ".bin";
}

module.exports = {
    createAssetCopier: createAssetCopier
};
