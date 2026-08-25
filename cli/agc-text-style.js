"use strict";

/**
 * Typography declarations for AGC text nodes.
 */

var agcColor = require("./agc-color");

var FONT_WEIGHT = [
    ["thin", "100"],
    ["hairline", "100"],
    ["extralight", "200"],
    ["ultralight", "200"],
    ["light", "300"],
    ["medium", "500"],
    ["semibold", "600"],
    ["demibold", "600"],
    ["extrabold", "800"],
    ["ultrabold", "800"],
    ["black", "900"],
    ["heavy", "900"],
    ["bold", "700"]
];

/**
 * @param {*} node
 * @returns {Object.<string,string>}
 */
function textDecls(node) {
    var map = {
        margin: "0",
        "white-space": "pre-wrap",
        overflow: "visible"
    };
    var style = node.style || {};
    var font = style.font || {};
    var ranged =
        node.meta &&
        node.meta.ux &&
        node.meta.ux.rangedStyles &&
        node.meta.ux.rangedStyles[0];

    var family = (ranged && ranged.fontFamily) || font.family || "sans-serif";
    var postscript =
        (ranged && ranged.postscriptName) || font.postscriptName || "";
    var size = (ranged && ranged.fontSize) || font.size || 14;
    var fontStyle = (ranged && ranged.fontStyle) || font.style || "Regular";

    map["font-family"] = fontStack(postscript, family);
    map["font-size"] = size + "px";
    map["font-weight"] = weightFromStyle(fontStyle);
    map["line-height"] = lineHeightPx(node, size) + "px";
    if (/italic/i.test(fontStyle)) {
        map["font-style"] = "italic";
    }

    var fillCss = agcColor.agcFillToCss(style.fill);
    if (fillCss) {
        map.color = fillCss;
    }

    var spacing =
        (ranged && ranged.charSpacing) ||
        (style.textAttributes && style.textAttributes.letterSpacing);
    if (spacing && Number(spacing) !== 0) {
        map["letter-spacing"] = Number(spacing) / 1000 + "em";
    }

    var align =
        style.textAttributes && style.textAttributes.paragraphAlign;
    if (align === "center") {
        map["text-align"] = "center";
    } else if (align === "right") {
        map["text-align"] = "right";
    }

    return map;
}

function fontStack(postscript, family) {
    var parts = [];
    if (postscript) parts.push('"' + postscript + '"');
    if (family && family !== postscript) {
        parts.push(/\s/.test(family) ? '"' + family + '"' : family);
    }
    var blob = ((postscript || "") + " " + (family || "")).toLowerCase();
    if (
        /serif|georgia|garamond|times|baskerville|playfair/.test(blob) &&
        !/sans/.test(blob)
    ) {
        parts.push("Georgia", "serif");
    } else {
        parts.push("sans-serif");
    }
    return parts.join(", ");
}

function weightFromStyle(fontStyle) {
    var s = (fontStyle || "").toLowerCase();
    for (var i = 0; i < FONT_WEIGHT.length; i++) {
        if (s.indexOf(FONT_WEIGHT[i][0]) !== -1) {
            return FONT_WEIGHT[i][1];
        }
    }
    return "400";
}

function lineHeightPx(node, fontSize) {
    var ta = node.style && node.style.textAttributes;
    var ys = runYs(node);
    if (ys.length >= 2) {
        var gap = ys[1] - ys[0];
        if (gap > 0) {
            return gap;
        }
    }
    if (ta && typeof ta.lineHeight === "number" && ta.lineHeight > 0) {
        // Area boxes often store a huge lineHeight (e.g. 50 on 22px wordmark).
        if (ta.lineHeight <= fontSize * 1.5) {
            return ta.lineHeight;
        }
        if (ys.length && ys[0] >= fontSize * 0.8 && ys[0] <= fontSize * 1.4) {
            return ys[0];
        }
        return fontSize;
    }
    return fontSize;
}

function runYs(node) {
    var ys = [];
    var paras = node.text && node.text.paragraphs;
    if (paras) {
        paras.forEach(function (p) {
            (p.lines || []).forEach(function (line) {
                (line || []).forEach(function (run) {
                    if (typeof run.y === "number") ys.push(run.y);
                });
            });
        });
    }
    ys.sort(function (a, b) {
        return a - b;
    });
    return ys;
}

module.exports = {
    textDecls: textDecls
};
