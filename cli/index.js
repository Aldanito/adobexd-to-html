"use strict";

/**
 * Public CLI API — argument parsing + export runner.
 */

var args = require("./args");
var runExport = require("./run-export");

module.exports = {
    parseArgs: args.parseArgs,
    printHelp: args.printHelp,
    run: runExport.runExport
};
