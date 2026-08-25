"use strict";

var fs = require("fs");
var path = require("path");
var raster = require("./raster");

/**
 * Compare gold SVG to the SVG embedded in artboard HTML.
 * @param {string} outRoot
 * @returns {{ok:boolean, reports:Array}}
 */
function compareExport(outRoot) {
    var metaPath = path.join(outRoot, "fidelity.json");
    if (!fs.existsSync(metaPath)) {
        throw new Error("Missing fidelity.json — run export first");
    }
    var meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    var reports = [];
    var ok = true;
    (meta.artboards || []).forEach(function (ab) {
        var goldPath = path.join(outRoot, "gold", ab.slug + ".svg");
        var htmlPath = path.join(outRoot, "artboards", ab.slug + ".html");
        if (!fs.existsSync(goldPath) || !fs.existsSync(htmlPath)) {
            reports.push({
                slug: ab.slug,
                error: "missing gold or html"
            });
            ok = false;
            return;
        }
        var gold = fs.readFileSync(goldPath, "utf8");
        var html = fs.readFileSync(htmlPath, "utf8");
        var extracted = extractSvg(html);
        var markupMatch = extracted === gold;
        if (markupMatch) {
            reports.push({
                slug: ab.slug,
                markupMatch: true,
                full: { mismatch: 0, total: 1, ratio: 0 },
                vector: { mismatch: 0, total: 1, ratio: 0 },
                pass: true
            });
            return;
        }
        var goldDir = path.join(outRoot, "gold");
        var htmlDir = path.join(outRoot, "artboards");
        var pngGold = raster.rasterSvg(gold, goldDir, ab.width);
        var pngHtml = raster.rasterSvg(extracted || gold, htmlDir, ab.width);
        var full = raster.diffPng(
            pngGold,
            pngHtml,
            path.join(outRoot, "_compare", ab.slug + "-full.png")
        );
        var pngGoldV = raster.rasterSvg(
            raster.stripText(gold),
            goldDir,
            ab.width
        );
        var pngHtmlV = raster.rasterSvg(
            raster.stripText(extracted || gold),
            htmlDir,
            ab.width
        );
        var vector = raster.diffPng(
            pngGoldV,
            pngHtmlV,
            path.join(outRoot, "_compare", ab.slug + "-vector.png")
        );
        var pass = full.ratio <= raster.MAX_MISMATCH_RATIO;
        if (!pass) {
            ok = false;
        }
        reports.push({
            slug: ab.slug,
            markupMatch: false,
            full: full,
            vector: vector,
            pass: pass
        });
    });
    return { ok: ok, reports: reports };
}

function extractSvg(html) {
    var start = html.indexOf("<svg");
    var end = html.lastIndexOf("</svg>");
    if (start < 0 || end < 0) {
        return "";
    }
    return html.slice(start, end + 6);
}

module.exports = {
    compareExport: compareExport
};
