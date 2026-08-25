/**
 * HTML document builders for artboards and index.
 */

var htmlUtils = require("./html-utils");
var indexDocument = require("./index-document");

/**
 * @param {{
 *   title:string,
 *   className:string,
 *   width:number,
 *   height:number,
 *   background:string|null,
 *   bodyHtml:string
 * }} opts
 * @returns {string}
 */
function artboardDocument(opts) {
    var bg = opts.background || "#FFFFFF";
    var cssFile = opts.stylesheet || "export.css";
    return (
        "<!DOCTYPE html>\n" +
        '<html lang="en">\n' +
        "<head>\n" +
        '  <meta charset="utf-8" />\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
        "  <title>" +
        htmlUtils.escapeHtml(opts.title) +
        "</title>\n" +
        '  <link rel="preconnect" href="https://fonts.googleapis.com" />\n' +
        '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" />\n' +
        '  <link rel="stylesheet" href="../styles/' +
        htmlUtils.escapeHtml(cssFile) +
        '" />\n' +
        "  <style>\n" +
        "    body {\n" +
        "      --artboard-width: " +
        opts.width +
        "px;\n" +
        "      --artboard-height: " +
        opts.height +
        "px;\n" +
        "    }\n" +
        "    ." +
        opts.className +
        " {\n" +
        "      width: " +
        opts.width +
        "px;\n" +
        "      height: " +
        opts.height +
        "px;\n" +
        "      background: " +
        bg +
        ";\n" +
        "    }\n" +
        "  </style>\n" +
        "</head>\n" +
        '<body class="artboard-page">\n' +
        '  <section class="artboard ' +
        opts.className +
        '" data-artboard="' +
        htmlUtils.escapeHtml(opts.title) +
        '">\n' +
        opts.bodyHtml +
        "\n  </section>\n" +
        "</body>\n" +
        "</html>\n"
    );
}

module.exports = {
    artboardDocument: artboardDocument,
    indexDocument: indexDocument.indexDocument
};
