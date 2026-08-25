/**
 * HTML list fragments for the export index page.
 */

var htmlUtils = require("./html-utils");

function groupArtboards(artboards, groupFn) {
    var groups = {};
    var order = [];
    artboards.forEach(function (ab) {
        var g = groupFn ? groupFn(ab.name) : "Screens";
        if (!groups[g]) {
            groups[g] = [];
            order.push(g);
        }
        groups[g].push(ab);
    });
    return order
        .map(function (g) {
            return (
                "  <h2>" +
                htmlUtils.escapeHtml(g) +
                '</h2>\n  <div class="board-grid">\n' +
                groups[g].map(cardArtboard).join("\n") +
                "\n  </div>\n"
            );
        })
        .join("");
}

function cardArtboard(ab) {
    var thumb =
        ab.thumb || "assets/thumbs/" + ab.slug + ".png";
    return (
        '    <a class="card" href="artboards/' +
        htmlUtils.escapeHtml(ab.slug) +
        '.html"><img src="' +
        htmlUtils.escapeHtml(thumb) +
        '" alt="" /><div class="meta"><strong>' +
        htmlUtils.escapeHtml(ab.name) +
        "</strong><span>" +
        ab.width +
        " × " +
        ab.height +
        "</span></div></a>"
    );
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
    listArtboards: groupArtboards,
    groupArtboards: groupArtboards,
    groupAssets: groupAssets
};
