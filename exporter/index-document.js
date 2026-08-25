/**
 * Root index.html — artboards + assets.
 */

var htmlUtils = require("./html-utils");
var lists = require("./index-lists");
var boardGroup = require("../cli/board-group");

var INDEX_CSS =
    "body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 40px 24px 80px; background: #111; color: #eee; }\n" +
    "h1 { font-size: 1.75rem; font-weight: 600; margin: 0 0 8px; }\n" +
    "h2 { margin: 40px 0 16px; font-size: 1.1rem; font-weight: 600; }\n" +
    "h3 { margin: 20px 0 8px; font-size: 0.85rem; opacity: 0.6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }\n" +
    "p.lead { margin: 0 0 32px; opacity: 0.65; max-width: 40rem; }\n" +
    "a { color: #8cb4ff; text-decoration: none; }\n" +
    "a:hover { text-decoration: underline; }\n" +
    ".board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }\n" +
    ".card { display: block; background: #1c1c1c; border: 1px solid #333; border-radius: 10px; overflow: hidden; color: inherit; }\n" +
    ".card:hover { border-color: #666; text-decoration: none; }\n" +
    ".card img { display: block; width: 100%; height: 140px; object-fit: cover; object-position: top; background: #222; }\n" +
    ".card .meta { padding: 10px 12px 14px; }\n" +
    ".card strong { display: block; font-size: 0.9rem; font-weight: 600; }\n" +
    ".card span { opacity: 0.5; font-size: 0.75rem; }\n" +
    ".asset-grid { display: flex; flex-wrap: wrap; gap: 12px; max-width: 960px; }\n" +
    ".asset-grid a { display: block; width: 96px; text-align: center; font-size: 12px; color: inherit; }\n" +
    ".asset-grid img { width: 96px; height: 96px; object-fit: contain; background: #fff; border: 1px solid #333; }\n";

/**
 * @param {{artboards:Array, assets:Array, title?:string}} data
 * @returns {string}
 */
function indexDocument(data) {
    var artboards = Array.isArray(data) ? data : data.artboards || [];
    var assets = Array.isArray(data) ? [] : data.assets || [];
    var title = (data && data.title) || "XD Export";

    return (
        "<!DOCTYPE html>\n" +
        '<html lang="en">\n' +
        "<head>\n" +
        '  <meta charset="utf-8" />\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
        "  <title>" +
        htmlUtils.escapeHtml(title) +
        "</title>\n" +
        '  <link rel="stylesheet" href="styles/export.css" />\n' +
        "  <style>\n" +
        INDEX_CSS +
        "  </style>\n" +
        "</head>\n" +
        "<body>\n" +
        "  <h1>" +
        htmlUtils.escapeHtml(title) +
        "</h1>\n" +
        '  <p class="lead">One HTML page per Adobe XD artboard. Click a thumbnail. Kit files list Components separately from Pages.</p>\n' +
        lists.groupArtboards(artboards, boardGroup.boardGroup) +
        "  <h2>Assets</h2>\n" +
        lists.groupAssets(assets) +
        "</body>\n" +
        "</html>\n"
    );
}

module.exports = {
    indexDocument: indexDocument
};
