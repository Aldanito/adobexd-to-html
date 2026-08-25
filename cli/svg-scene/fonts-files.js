"use strict";

var fs = require("fs");
var path = require("path");

/**
 * Copy font binaries from the .xd resources dir when present.
 * @param {string} resourcesDir
 * @param {string} fontsOut
 * @returns {Object.<string,string>} id → relative url from artboards
 */
function copyEmbeddedFonts(resourcesDir, fontsOut) {
    var map = {};
    if (!resourcesDir || !fs.existsSync(resourcesDir)) {
        return map;
    }
    fs.mkdirSync(fontsOut, { recursive: true });
    fs.readdirSync(resourcesDir).forEach(function (name) {
        var src = path.join(resourcesDir, name);
        if (!fs.statSync(src).isFile()) {
            return;
        }
        var ext = fontExt(src);
        if (!ext) {
            return;
        }
        var destName = name + ext;
        fs.copyFileSync(src, path.join(fontsOut, destName));
        map[name] = "../assets/fonts/" + destName;
    });
    return map;
}

function fontExt(filePath) {
    var buf = Buffer.alloc(4);
    var fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    if (buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00) {
        return ".ttf";
    }
    if (buf.toString("ascii") === "OTTO") {
        return ".otf";
    }
    if (buf.toString("ascii") === "wOFF") {
        return ".woff";
    }
    return null;
}

module.exports = {
    copyEmbeddedFonts: copyEmbeddedFonts
};
