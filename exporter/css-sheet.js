/**
 * Collect CSS class rules for the export stylesheet.
 */

var cssFormat = require("./css-format");
var cssTokens = require("./css-tokens");

var CSS_RESET =
    "/* XD HTML Export — reset */\n" +
    "*, *::before, *::after { box-sizing: border-box; }\n" +
    "html, body { margin: 0; padding: 0; }\n" +
    "img { display: block; }\n" +
    "svg { display: block; overflow: visible; max-width: none; }\n" +
    "button { font: inherit; margin: 0; padding: 0; border: none; background: none; color: inherit; }\n";

/**
 * @returns {{add: Function, toString: Function}}
 */
function createCssSheet() {
    var rules = [];
    var colorCounts = {};
    var fontCounts = {};

    function add(selector, declarations) {
        rules.push({ selector: selector, declarations: declarations });
        Object.keys(declarations).forEach(function (prop) {
            var val = declarations[prop];
            if (
                (prop === "color" ||
                    prop === "background-color" ||
                    prop === "background") &&
                cssTokens.isColorish(val)
            ) {
                colorCounts[val] = (colorCounts[val] || 0) + 1;
            }
            if (prop === "font-family") {
                fontCounts[val] = (fontCounts[val] || 0) + 1;
            }
        });
    }

    function toString() {
        var tokens = cssFormat.buildTokens(colorCounts, fontCounts);
        var parts = [CSS_RESET, tokens.rootBlock];
        rules.forEach(function (rule) {
            var decls = cssTokens.applyTokens(
                rule.declarations,
                tokens.replacements
            );
            parts.push(cssFormat.formatRule(rule.selector, decls));
        });
        return parts.join("\n");
    }

    return { add: add, toString: toString };
}

module.exports = {
    createCssSheet: createCssSheet
};
