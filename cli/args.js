"use strict";

/**
 * CLI argument parsing and help text.
 */

/**
 * @param {string[]} args
 * @returns {{input:string|null, output:string, help:boolean, legacyHtml:boolean, hideOverlays:boolean, pagesOnly:boolean}}
 */
function parseArgs(args) {
    var input = null;
    var output = "./export-out";
    var help = false;
    var legacyHtml = false;
    var hideOverlays = false;
    var pagesOnly = false;

    for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (a === "-h" || a === "--help") {
            help = true;
        } else if (a === "-o" || a === "--out") {
            output = args[++i] || output;
        } else if (a === "--legacy-html") {
            legacyHtml = true;
        } else if (a === "--hide-overlays") {
            hideOverlays = true;
        } else if (a === "--pages-only") {
            pagesOnly = true;
        } else if (a.charAt(0) !== "-") {
            input = a;
        }
    }

    return {
        input: input,
        output: output,
        help: help,
        legacyHtml: legacyHtml,
        hideOverlays: hideOverlays,
        pagesOnly: pagesOnly
    };
}

/**
 * Print CLI usage to stdout.
 */
function printHelp() {
    console.log(
        [
            "xd-to-html — open an Adobe XD .xd file as HTML (no Adobe XD app)",
            "",
            "Usage:",
            "  npx xd-to-html <file.xd> [-o <output-dir>]",
            "  xd-to-html <file.xd> [-o <output-dir>]",
            "",
            "Options:",
            "  -o, --out <dir>     Output directory (default: ./export-out)",
            "  --pages-only        Skip Base / Component / XF kit artboards",
            "  --hide-overlays     Strip alternate-state overlays (off by default)",
            "  --legacy-html       Flattened CSS boxes (debug; not 1:1)",
            "  -h, --help          Show help",
            "",
            "Example:",
            "  npx xd-to-html ./examples/dashboard.xd -o ./out",
            "  open ./out/index.html"
        ].join("\n")
    );
}

module.exports = {
    parseArgs: parseArgs,
    printHelp: printHelp
};
