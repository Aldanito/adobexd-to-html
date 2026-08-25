/**
 * Root index.html — artboards + assets.
 */

var lists = require("./index-lists");

var INDEX_CSS =
    "body { font-family: Georgia, 'Times New Roman', serif; padding: 48px 24px; background: #f3f1ec; color: #1a1a1a; }\n" +
    "h1 { font-size: 2rem; font-weight: 400; margin: 0 0 8px; }\n" +
    "h2 { margin: 40px 0 12px; font-size: 1.25rem; font-weight: 400; }\n" +
    "h3 { margin: 20px 0 8px; font-size: 1rem; opacity: 0.75; font-weight: 400; text-transform: capitalize; }\n" +
    "p.lead { margin: 0 0 32px; opacity: 0.7; }\n" +
    "ul { list-style: none; padding: 0; margin: 0; max-width: 720px; }\n" +
    "li { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #ccc; }\n" +
    "a { color: #0b57d0; text-decoration: none; }\n" +
    "a:hover { text-decoration: underline; }\n" +
    "span { opacity: 0.55; font-variant-numeric: tabular-nums; }\n" +
    ".asset-grid { display: flex; flex-wrap: wrap; gap: 12px; max-width: 960px; }\n" +
    ".asset-grid a { display: block; width: 96px; text-align: center; font-size: 12px; }\n" +
    ".asset-grid img { width: 96px; height: 96px; object-fit: contain; background: #fff; border: 1px solid #ddd; }\n";

/**
 * @param {{
 *   artboards:Array,
 *   assets:Array
 * }|Array} data
 * @returns {string}
 */
function indexDocument(data) {
    var artboards = Array.isArray(data) ? data : data.artboards || [];
    var assets = Array.isArray(data) ? [] : data.assets || [];

    return (
        "<!DOCTYPE html>\n" +
        '<html lang="en">\n' +
        "<head>\n" +
        '  <meta charset="utf-8" />\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
        "  <title>XD Export</title>\n" +
        '  <link rel="stylesheet" href="styles/export.css" />\n' +
        "  <style>\n" +
        INDEX_CSS +
        "  </style>\n" +
        "</head>\n" +
        "<body>\n" +
        "  <h1>XD Export</h1>\n" +
        '  <p class="lead">Artboards and assets from Adobe XD.</p>\n' +
        "  <h2>Artboards</h2>\n" +
        "  <ul>\n" +
        lists.listArtboards(artboards) +
        "\n  </ul>\n" +
        "  <h2>Assets</h2>\n" +
        lists.groupAssets(assets) +
        "</body>\n" +
        "</html>\n"
    );
}

module.exports = {
    indexDocument: indexDocument
};
