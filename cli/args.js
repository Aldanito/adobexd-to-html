"use strict";

/**
 * CLI argument parsing and help text.
 */

/**
 * @param {string[]} args
 * @returns {{input:string|null, output:string, help:boolean}}
 */
function parseArgs(args) {
    var input = null;
    var output = "./export-out";
    var help = false;

    for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (a === "-h" || a === "--help") {
            help = true;
        } else if (a === "-o" || a === "--out") {
            output = args[++i] || output;
        } else if (a.charAt(0) !== "-") {
            input = a;
        }
    }

    return { input: input, output: output, help: help };
}

/**
 * Print CLI usage to stdout.
 */
function printHelp() {
    console.log(
        [
            "xd-to-html — CLI proxy for Adobe XD → HTML/CSS export",
            "",
            "Usage:",
            "  xd-to-html <file.xd> [-o <output-dir>]",
            "",
            "Options:",
            "  -o, --out <dir>   Output directory (default: ./export-out)",
            "  -h, --help        Show help",
            "",
            "Example:",
            '  xd-to-html "./design/My File.xd" -o ./export-out'
        ].join("\n")
    );
}

module.exports = {
    parseArgs: parseArgs,
    printHelp: printHelp
};
