"use strict";

var htmlUtils = require("../../exporter/html-utils");
var files = require("./fonts-files");

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
 * @param {string} fontStyle
 * @returns {string}
 */
function weightFromStyle(fontStyle) {
    var s = (fontStyle || "").toLowerCase();
    for (var i = 0; i < FONT_WEIGHT.length; i++) {
        if (s.indexOf(FONT_WEIGHT[i][0]) !== -1) {
            return FONT_WEIGHT[i][1];
        }
    }
    return "400";
}

/**
 * @param {*} ctx
 * @param {string} postscript
 * @param {string} family
 * @param {string} fontStyle
 */
function noteFont(ctx, postscript, family, fontStyle) {
    if (!ctx.fonts) {
        ctx.fonts = {};
    }
    var key = (postscript || family || "") + "|" + (fontStyle || "");
    if (!key || ctx.fonts[key]) {
        return;
    }
    ctx.fonts[key] = {
        postscript: postscript || "",
        family: family || "sans-serif",
        fontStyle: fontStyle || "Regular",
        weight: weightFromStyle(fontStyle || "")
    };
}

/**
 * @param {*} ctx
 * @param {Object.<string,string>} fileMap
 * @returns {string}
 */
function fontFaceCss(ctx, fileMap) {
    var fonts = ctx.fonts || {};
    return Object.keys(fonts)
        .map(function (key) {
            var f = fonts[key];
            var src = [
                'local("' + f.postscript + '")',
                'local("' + f.family + " " + f.fontStyle + '")'
            ];
            var file = fileMap[f.postscript] || fileMap[f.family];
            if (file) {
                src.unshift('url("' + htmlUtils.escapeHtml(file) + '")');
            }
            return (
                "@font-face {\n  font-family: \"" +
                htmlUtils.escapeHtml(f.postscript || f.family) +
                "\";\n  font-weight: " +
                f.weight +
                ";\n  src: " +
                src.join(", ") +
                ";\n}\n" +
                (f.family && f.family !== f.postscript
                    ? "@font-face {\n  font-family: " +
                      (/\s/.test(f.family)
                          ? '"' + htmlUtils.escapeHtml(f.family) + '"'
                          : f.family) +
                      ";\n  font-weight: " +
                      f.weight +
                      ";\n  src: " +
                      src.join(", ") +
                      ";\n}\n"
                    : "")
            );
        })
        .join("");
}

module.exports = {
    weightFromStyle: weightFromStyle,
    noteFont: noteFont,
    fontFaceCss: fontFaceCss,
    copyEmbeddedFonts: files.copyEmbeddedFonts
};
