/**
 * Extract CSS declarations for typography from an XD Text node.
 */

var color = require("../utils/color");

/**
 * @param {*} textNode
 * @returns {Object.<string,string>}
 */
function textStyleMap(textNode) {
    var map = {};
    var style =
        typeof textNode.styleRanges === "object" &&
        textNode.styleRanges &&
        textNode.styleRanges[0]
            ? textNode.styleRanges[0]
            : null;

    var fontFamily =
        (style && style.fontFamily) || textNode.fontFamily || "sans-serif";
    var fontSize = (style && style.fontSize) || textNode.fontSize || 14;
    var fontStyle = (style && style.fontStyle) || textNode.fontStyle || "Regular";
    var fill = (style && style.fill && style.fill[0]) || textNode.fill;

    map["font-family"] = quoteFont(fontFamily);
    map["font-size"] = fontSize + "px";
    map["font-weight"] = weightFromStyle(fontStyle);
    if (/italic/i.test(fontStyle)) {
        map["font-style"] = "italic";
    }

    var textColor = color.fillToCss(fill, 1);
    if (textColor) {
        map.color = textColor;
    }

    if (typeof textNode.lineSpacing === "number" && textNode.lineSpacing > 0) {
        map["line-height"] = textNode.lineSpacing + "px";
    }

    // XD charSpacing is 1/1000 em
    if (typeof textNode.charSpacing === "number" && textNode.charSpacing !== 0) {
        map["letter-spacing"] = textNode.charSpacing / 1000 + "em";
    }

    var align = textNode.textAlign;
    if (align && align !== "left") {
        map["text-align"] = align;
    }

    if (textNode.textTransform && textNode.textTransform !== "none") {
        map["text-transform"] = textNode.textTransform;
    }

    map.margin = "0";
    map["white-space"] = "pre-wrap";
    return map;
}

/**
 * @param {string} family
 * @returns {string}
 */
function quoteFont(family) {
    if (/\s/.test(family)) {
        return '"' + family + '", sans-serif';
    }
    return family + ", sans-serif";
}

/**
 * @param {string} fontStyle
 * @returns {string}
 */
function weightFromStyle(fontStyle) {
    var s = (fontStyle || "").toLowerCase();
    if (s.indexOf("thin") !== -1 || s.indexOf("hairline") !== -1) return "100";
    if (s.indexOf("extralight") !== -1 || s.indexOf("ultralight") !== -1) return "200";
    if (s.indexOf("light") !== -1) return "300";
    if (s.indexOf("medium") !== -1) return "500";
    if (s.indexOf("semibold") !== -1 || s.indexOf("demibold") !== -1) return "600";
    if (s.indexOf("extrabold") !== -1 || s.indexOf("ultrabold") !== -1) return "800";
    if (s.indexOf("black") !== -1 || s.indexOf("heavy") !== -1) return "900";
    if (s.indexOf("bold") !== -1) return "700";
    return "400";
}

module.exports = {
    textStyleMap: textStyleMap
};
