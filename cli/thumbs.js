"use strict";

var fs = require("fs");
var path = require("path");
var { Resvg } = require("@resvg/resvg-js");

/**
 * Write a PNG thumbnail of an artboard SVG.
 * @param {string} svg
 * @param {string} destPng
 * @param {string} resolveDir
 * @param {number} width
 */
function writeThumb(svg, destPng, resolveDir, width) {
    var resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: Math.max(80, Math.round(width || 320)) },
        path: path.join(resolveDir, "thumb.svg")
    });
    fs.mkdirSync(path.dirname(destPng), { recursive: true });
    fs.writeFileSync(destPng, resvg.render().asPng());
}

module.exports = {
    writeThumb: writeThumb
};
