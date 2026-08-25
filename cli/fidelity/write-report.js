"use strict";

var fs = require("fs");
var path = require("path");
var score = require("./score");

/**
 * @param {*} report
 * @returns {string}
 */
function toMarkdown(report) {
    var lines = [
        "# 1:1 fidelity benchmark",
        "",
        "- **When:** " + report.generatedAt,
        "- **Export:** " + report.exportMs + " ms",
        "- **Wrap (HTML ≡ gold SVG):** " +
            fmtAvg(report.wrapAverage) +
            " — CI gate, same engine",
        "- **Scene vs XD SVG:** " +
            fmtAvg(report.sceneAverage) +
            " — 1:1 performance vs Adobe export of the same file",
        "",
        "## HTML wrap vs gold",
        "",
        "| Artboard | Markup | Full | Vector |",
        "|----------|--------|------|--------|"
    ];
    (report.wrap || []).forEach(function (r) {
        if (r.error) {
            lines.push("| " + r.slug + " | error | " + r.error + " | |");
            return;
        }
        lines.push(
            "| " +
                r.slug +
                " | " +
                r.markupMatch +
                " | " +
                pct(r.full && r.full.ratio) +
                " | " +
                pct(r.vector && r.vector.ratio) +
                " |"
        );
    });
    lines.push("", "## Scenegraph SVG vs Adobe XD SVG", "");
    lines.push(
        "| Artboard | Reference | Full 1:1 | Vector 1:1 | Band | Raster ms |"
    );
    lines.push("|----------|-----------|----------|------------|------|-----------|");
    (report.scene || []).forEach(function (r) {
        if (r.skipped) {
            lines.push(
                "| " + r.slug + " | — | no XD SVG in design/ | — | — | — |"
            );
            return;
        }
        if (r.error) {
            lines.push("| " + r.slug + " | " + r.reference + " | " + r.error + " | | | |");
            return;
        }
        lines.push(
            "| " +
                r.slug +
                " | " +
                r.reference +
                " | " +
                r.fullScore.percent.toFixed(2) +
                "% | " +
                r.vectorScore.percent.toFixed(2) +
                "% | " +
                r.fullScore.band +
                " | " +
                r.rasterMs +
                " |"
        );
    });
    lines.push(
        "",
        "Score is `(1 − mismatched pixels / total) × 100` at 1× artboard width, pixelmatch 0.1.",
        "Vector score strips `<text>` so type rasterization is excluded.",
        "Bands: excellent ≥ 99.5%, good ≥ 95%, fair ≥ 80%, else poor.",
        ""
    );
    return lines.join("\n");
}

function pct(ratio) {
    return score.matchScore(ratio).percent.toFixed(4) + "%";
}

function fmtAvg(avg) {
    if (!avg) {
        return "n/a";
    }
    return (
        avg.full.toFixed(2) +
        "% full / " +
        avg.vector.toFixed(2) +
        "% vector"
    );
}

/**
 * @param {string} outRoot
 * @param {*} report
 */
function writeFiles(outRoot, report) {
    fs.writeFileSync(
        path.join(outRoot, "benchmark.json"),
        JSON.stringify(report, null, 2),
        "utf8"
    );
    fs.writeFileSync(
        path.join(outRoot, "benchmark.md"),
        toMarkdown(report),
        "utf8"
    );
}

module.exports = {
    toMarkdown: toMarkdown,
    writeFiles: writeFiles
};
