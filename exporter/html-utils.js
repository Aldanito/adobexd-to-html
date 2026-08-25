/**
 * Escape text for HTML text nodes and attributes.
 */

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Merge declaration objects (later keys win).
 * @param {...Object.<string,string>} maps
 * @returns {Object.<string,string>}
 */
function mergeStyles() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
        var src = arguments[i] || {};
        Object.keys(src).forEach(function (k) {
            out[k] = src[k];
        });
    }
    return out;
}

module.exports = {
    escapeHtml: escapeHtml,
    mergeStyles: mergeStyles
};
