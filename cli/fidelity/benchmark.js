"use strict";

var fs = require("fs");
var path = require("path");
var raster = require("./raster");
var reference = require("./reference");
var score = require("./score");

/**
 * Raster gold SVG against Adobe XD SVG exports in design/.
 * @param {{artboards:Array, outRoot:string, designDir:string}} opts
 * @returns {Array}
 */
function sceneVsXd(opts) {
    var rows = [];
    (opts.artboards || []).forEach(function (ab) {
        var refPath = reference.referenceSvgPath(opts.designDir, ab.name);
        var goldPath = path.join(opts.outRoot, "gold", ab.slug + ".svg");
        if (!refPath) {
            rows.push({
                slug: ab.slug,
                name: ab.name,
                reference: null,
                skipped: true
            });
            return;
        }
        if (!fs.existsSync(goldPath)) {
            rows.push({
                slug: ab.slug,
                name: ab.name,
                reference: refPath,
                error: "missing gold svg"
            });
            return;
        }
        var t0 = Date.now();
        try {
            var gold = fs.readFileSync(goldPath, "utf8");
            var xdSvg = fs.readFileSync(refPath, "utf8");
            var pngGold = raster.rasterSvg(
                gold,
                path.join(opts.outRoot, "gold"),
                ab.width
            );
            var pngXd = raster.rasterSvg(xdSvg, path.dirname(refPath), ab.width);
            var full = raster.diffPng(
                pngXd,
                pngGold,
                path.join(opts.outRoot, "_compare", ab.slug + "-vs-xd-full.png")
            );
            var vector = raster.diffPng(
                raster.rasterSvg(
                    raster.stripText(xdSvg),
                    path.dirname(refPath),
                    ab.width
                ),
                raster.rasterSvg(
                    raster.stripText(gold),
                    path.join(opts.outRoot, "gold"),
                    ab.width
                ),
                path.join(opts.outRoot, "_compare", ab.slug + "-vs-xd-vector.png")
            );
            rows.push({
                slug: ab.slug,
                name: ab.name,
                reference: path.basename(refPath),
                rasterMs: Date.now() - t0,
                full: full,
                vector: vector,
                fullScore: score.matchScore(full.ratio),
                vectorScore: score.matchScore(vector.ratio)
            });
        } catch (err) {
            rows.push({
                slug: ab.slug,
                name: ab.name,
                reference: path.basename(refPath),
                error: err && err.message ? err.message : String(err)
            });
        }
    });
    return rows;
}

module.exports = {
    sceneVsXd: sceneVsXd
};
