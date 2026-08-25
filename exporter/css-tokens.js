/**
 * Apply CSS variable tokens only to color/font properties (never left/top/etc).
 */

var COLOR_PROPS = {
    color: true,
    "background-color": true,
    background: true,
    border: true,
    "border-color": true,
    "border-top-color": true,
    "border-right-color": true,
    "border-bottom-color": true,
    "border-left-color": true,
    "box-shadow": true,
    fill: true,
    stroke: true
};

/**
 * @param {Object.<string,string>} declarations
 * @param {Object.<string,string>} replacements
 * @returns {Object.<string,string>}
 */
function applyTokens(declarations, replacements) {
    var out = {};
    Object.keys(declarations).forEach(function (prop) {
        var val = declarations[prop];
        if (
            (COLOR_PROPS[prop] || prop === "font-family") &&
            replacements[val]
        ) {
            out[prop] = replacements[val];
        } else {
            out[prop] = val;
        }
    });
    return out;
}

/**
 * Only promote values that look like colors (not "4px", "1px solid …" alone).
 * @param {string} val
 */
function isColorish(val) {
    if (!val || val === "transparent") return false;
    if (val.charAt(0) === "#") return true;
    if (val.indexOf("rgb") === 0) return true;
    if (val.indexOf("linear-gradient") === 0) return true;
    if (val.indexOf("radial-gradient") === 0) return true;
    return false;
}

module.exports = {
    applyTokens: applyTokens,
    isColorish: isColorish
};
