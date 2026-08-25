"use strict";

var fs = require("fs");
var path = require("path");
var naming = require("../../utils/naming");

/**
 * Map an artboard name to a design-folder SVG exported from XD, if any.
 * @param {string} designDir
 * @param {string} artboardName
 * @returns {string|null}
 */
function referenceSvgPath(designDir, artboardName) {
    if (!designDir || !fs.existsSync(designDir)) {
        return null;
    }
    var exact = path.join(designDir, artboardName + ".svg");
    if (fs.existsSync(exact)) {
        return exact;
    }
    var want = naming.toSlug(artboardName);
    var match = null;
    fs.readdirSync(designDir).forEach(function (name) {
        if (!/\.svg$/i.test(name)) {
            return;
        }
        if (naming.toSlug(name.replace(/\.svg$/i, "")) === want) {
            match = path.join(designDir, name);
        }
    });
    return match;
}

module.exports = {
    referenceSvgPath: referenceSvgPath
};
