/**
 * HTML list fragments for the export index page.
 */

var htmlUtils = require("./html-utils");

/**
 * @param {Array} artboards
 * @returns {string}
 */
function listArtboards(artboards) {
    return artboards
        .map(function (ab) {
            return (
                "    <li><a href=\"artboards/" +
                htmlUtils.escapeHtml(ab.slug) +
                '.html">' +
                htmlUtils.escapeHtml(ab.name) +
                "</a><span>" +
                ab.width +
                " × " +
                ab.height +
                "</span></li>"
            );
        })
        .join("\n");
}

/**
 * @param {Array} assets
 * @returns {string}
 */
function groupAssets(assets) {
    var byCat = {};
    assets.forEach(function (a) {
        if (!byCat[a.category]) byCat[a.category] = [];
        byCat[a.category].push(a);
    });
    var cats = Object.keys(byCat).sort();
    if (!cats.length) {
        return '  <p class="lead">No bitmap assets exported.</p>\n';
    }
    return cats
        .map(function (cat) {
            var items = byCat[cat]
                .map(function (a) {
                    return (
                        '<a href="' +
                        htmlUtils.escapeHtml(a.href) +
                        '"><img src="' +
                        htmlUtils.escapeHtml(a.href) +
                        '" alt="' +
                        htmlUtils.escapeHtml(a.fileName) +
                        '" /><span>' +
                        htmlUtils.escapeHtml(a.fileName) +
                        "</span></a>"
                    );
                })
                .join("\n");
            return (
                "  <h3>" +
                htmlUtils.escapeHtml(cat) +
                '</h3>\n  <div class="asset-grid">\n' +
                items +
                "\n  </div>\n"
            );
        })
        .join("");
}

module.exports = {
    listArtboards: listArtboards,
    groupAssets: groupAssets
};
