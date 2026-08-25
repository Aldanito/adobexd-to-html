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
    var fontCss = opts.fontCss || "";
    return (
        "<!DOCTYPE html>\n" +
        '<html lang="en">\n' +
        "<head>\n" +
        '  <meta charset="utf-8" />\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
        "  <title>" +
        htmlUtils.escapeHtml(opts.title) +
        "</title>\n" +
        '  <link rel="stylesheet" href="../styles/' +
        htmlUtils.escapeHtml(cssFile) +
        '" />\n' +
        "  <style>\n" +
        fontCss +
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
        "    .artboard > svg { display: block; width: 100%; height: 100%; }\n" +
    "    .artboard { position: relative; }\n" +
    "    .hotspot { position: absolute; z-index: 2; display: block; }\n" +
        "  </style>\n" +
        "</head>\n" +
        '<body class="artboard-page">\n' +
        '  <section class="artboard ' +
        opts.className +
        '" data-artboard="' +
        htmlUtils.escapeHtml(opts.title) +
        '">\n' +
        opts.bodyHtml +
        (opts.hotspotsHtml || "") +
        "\n  </section>\n" +
        "</body>\n" +
        "</html>\n"
    );
}

module.exports = {
    artboardDocument: artboardDocument,
    indexDocument: indexDocument.indexDocument
};
