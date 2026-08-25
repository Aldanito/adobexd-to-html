"use strict";

var fs = require("fs");
var path = require("path");
var PNG = require("pngjs").PNG;
var pixelmatch = require("pixelmatch");
var { Resvg } = require("@resvg/resvg-js");

var MAX_MISMATCH_RATIO = 0.005;

/**
 * Raster SVG string to PNG buffer at 1× width.
 * @param {string} svg
 * @param {string} resolveDir
 * @param {number} width
 * @returns {Buffer}
 */
function rasterSvg(svg, resolveDir, width) {
    var resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: Math.max(1, Math.round(width)) },
        path: path.join(resolveDir, "scene.svg")
    });
    return resvg.render().asPng();
}

/**
 * @param {Buffer} pngA
 * @param {Buffer} pngB
 * @param {string} diffPath
 * @returns {{mismatch:number, total:number, ratio:number}}
 */
function diffPng(pngA, pngB, diffPath) {
    var a = PNG.sync.read(pngA);
    var b = PNG.sync.read(pngB);
    var w = Math.min(a.width, b.width);
    var h = Math.min(a.height, b.height);
    var diff = new PNG({ width: w, height: h });
    var mismatch = pixelmatch(a.data, b.data, diff.data, w, h, {
        threshold: 0.1
    });
    if (diffPath) {
        fs.mkdirSync(path.dirname(diffPath), { recursive: true });
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }
    var total = w * h;
    return { mismatch: mismatch, total: total, ratio: mismatch / total };
}

function stripText(svg) {
    return String(svg).replace(/<text[\s\S]*?<\/text>/g, "");
}

module.exports = {
    rasterSvg: rasterSvg,
    diffPng: diffPng,
    stripText: stripText,
    MAX_MISMATCH_RATIO: MAX_MISMATCH_RATIO
};
