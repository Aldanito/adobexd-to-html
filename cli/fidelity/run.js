"use strict";

var path = require("path");
var fs = require("fs");
var cli = require("../index");
var compare = require("./compare");

var xd =
    process.argv[2] ||
    path.join(__dirname, "../../examples/sample.xd");
var out = process.argv[3] || path.join(__dirname, "../../examples/demo");

if (!fs.existsSync(xd)) {
    console.error("No .xd file at " + xd);
    process.exit(1);
}

cli
    .run({
        input: xd,
        output: out,
        legacyHtml: false,
        hideOverlays: false
    })
    .then(function () {
        var result = compare.compareExport(out);
        result.reports.forEach(function (r) {
            if (r.error) {
                console.log(r.slug + ": " + r.error);
                return;
            }
            console.log(
                r.slug +
                    " markup=" +
                    r.markupMatch +
                    " full=" +
                    (r.full.ratio * 100).toFixed(4) +
                    "%" +
                    " vector=" +
                    (r.vector.ratio * 100).toFixed(4) +
                    "%" +
                    " " +
                    (r.pass ? "PASS" : "FAIL")
            );
        });
        if (!result.ok) {
            process.exit(1);
        }
    })
    .catch(function (err) {
        console.error(err && err.stack ? err.stack : err);
        process.exit(1);
    });
