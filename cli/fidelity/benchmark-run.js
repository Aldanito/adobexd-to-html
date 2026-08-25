"use strict";

var path = require("path");
var fs = require("fs");
var cli = require("../index");
var compare = require("./compare");
var benchmark = require("./benchmark");
var score = require("./score");
var writeReport = require("./write-report");

var xd =
    process.argv[2] ||
    path.join(__dirname, "../../examples/sample.xd");
var out = process.argv[3] || path.join(__dirname, "../../examples/demo");
var designDir = path.dirname(path.resolve(xd));

if (!fs.existsSync(xd)) {
    console.error("No .xd file at " + xd);
    process.exit(1);
}

var t0 = Date.now();
cli
    .run({
        input: xd,
        output: out,
        legacyHtml: false,
        hideOverlays: false
    })
    .then(function () {
        var exportMs = Date.now() - t0;
        var wrap = compare.compareExport(out);
        var meta = JSON.parse(
            fs.readFileSync(path.join(out, "fidelity.json"), "utf8")
        );
        var scene = benchmark.sceneVsXd({
            artboards: meta.artboards,
            outRoot: out,
            designDir: designDir
        });
        var report = {
            generatedAt: new Date().toISOString(),
            exportMs: exportMs,
            wrap: wrap.reports,
            wrapAverage: score.averageScores(wrap.reports),
            scene: scene,
            sceneAverage: score.averageScores(scene)
        };
        writeReport.writeFiles(out, report);
        console.log(writeReport.toMarkdown(report));
        console.log("Wrote " + path.join(out, "benchmark.md"));
        if (!wrap.ok) {
            process.exit(1);
        }
    })
    .catch(function (err) {
        console.error(err && err.stack ? err.stack : err);
        process.exit(1);
    });
