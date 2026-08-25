#!/usr/bin/env node
"use strict";

var path = require("path");
var cli = require("../cli/index");

var args = process.argv.slice(2);
var options = cli.parseArgs(args);

if (options.help || !options.input) {
    cli.printHelp();
    process.exit(options.help ? 0 : 1);
}

cli
    .run(options)
    .then(function (summary) {
        console.log(
            "Exported " +
                summary.artboardCount +
                " artboard(s) → " +
                path.resolve(options.output)
        );
        console.log("Open " + path.join(options.output, "index.html"));
    })
    .catch(function (err) {
        console.error("xd-to-html failed:", err && err.message ? err.message : err);
        process.exit(1);
    });
