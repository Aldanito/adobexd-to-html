/**
 * Format CSS rules and promote repeated values to tokens.
 */

/**
 * @param {Object.<string,number>} colorCounts
 * @param {Object.<string,number>} fontCounts
 * @returns {{rootBlock:string, replacements:Object.<string,string>}}
 */
function buildTokens(colorCounts, fontCounts) {
    var replacements = {};
    var lines = [":root {"];
    var ci = 1;
    Object.keys(colorCounts).forEach(function (val) {
        if (colorCounts[val] < 2 || val === "transparent") return;
        var name = "--color-" + ci++;
        replacements[val] = "var(" + name + ")";
        lines.push("  " + name + ": " + val + ";");
    });
    var fi = 1;
    Object.keys(fontCounts).forEach(function (val) {
        if (fontCounts[val] < 2) return;
        var name = "--font-" + fi++;
        replacements[val] = "var(" + name + ")";
        lines.push("  " + name + ": " + val + ";");
    });
    lines.push("}");
    lines.push("");
    lines.push(CANVAS_CSS);
    return { rootBlock: lines.join("\n") + "\n", replacements: replacements };
}

var CANVAS_CSS =
    "/* Responsive artboard canvas: 1:1 at design width, scale down on small viewports */\n" +
    ".artboard-page { min-height: 100vh; display: flex; justify-content: center; background: #e8e8e8; }\n" +
    ".artboard {\n" +
    "  position: relative;\n" +
    "  overflow: hidden;\n" +
    "  flex-shrink: 0;\n" +
    "  transform-origin: top center;\n" +
    "  transform: scale(var(--scale, 1));\n" +
    "  margin-bottom: calc((var(--scale, 1) - 1) * var(--artboard-height, 0px));\n" +
    "}\n" +
    "body {\n" +
    "  --scale: min(1, 100vw / var(--artboard-width, 1440px));\n" +
    "}\n";

/**
 * @param {string} selector
 * @param {Object.<string,string>} declarations
 * @returns {string}
 */
function formatRule(selector, declarations) {
    var body = Object.keys(declarations)
        .map(function (prop) {
            return "  " + prop + ": " + declarations[prop] + ";";
        })
        .join("\n");
    return selector + " {\n" + body + "\n}\n";
}

module.exports = {
    buildTokens: buildTokens,
    formatRule: formatRule
};
