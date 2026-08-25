"use strict";

var htmlUtils = require("../../exporter/html-utils");
var matrix = require("./matrix");
var colorSvg = require("./color");
var fonts = require("./fonts");

/**
 * SVG text with AGC run positions. Matches XD SVG: start-anchored
 * tspans (run.x is already the glyph origin, not a CSS text-align).
 * @param {*} node
 * @param {*} ctx
 * @param {boolean} isTop
 * @returns {string}
 */
function textToSvg(node, ctx, isTop) {
    var m = matrix.nodeAffine(node, ctx.artboard, isTop);
    var tf = matrix.matrixAttr(m);
    var raw = (node.text && node.text.rawText) || "";
    var base = baseStyle(node);
    fonts.noteFont(ctx, base.postscript, base.family, base.fontStyle);
    var inner = tspans(node, raw, base, ctx);
    var family = fontFamilyAttr(base);
    return (
        "<text" +
        (tf ? ' transform="' + tf + '"' : "") +
        ' font-family="' +
        htmlUtils.escapeHtml(family) +
        '" font-size="' +
        base.size +
        '" font-weight="' +
        base.weight +
        '" fill="' +
        htmlUtils.escapeHtml(base.fill) +
        '"' +
        (base.italic ? ' font-style="italic"' : "") +
        ' xml:space="preserve" style="white-space:pre"' +
        ">" +
        inner +
        "</text>"
    );
}

function fontFamilyAttr(base) {
    var parts = [];
    if (base.postscript) {
        parts.push(base.postscript);
    }
    if (base.family && base.family !== base.postscript) {
        parts.push(base.family);
    }
    return parts.join(", ") || "sans-serif";
}

function tspans(node, raw, base, ctx) {
    var paras = node.text && node.text.paragraphs;
    if (!paras || !paras.length) {
        return htmlUtils.escapeHtml(raw);
    }
    var ranges = buildRanges(node, raw, base);
    var parts = [];
    paras.forEach(function (p) {
        (p.lines || []).forEach(function (line) {
            var lineFirst = true;
            (line || []).forEach(function (run) {
                if (typeof run.from !== "number" || typeof run.to !== "number") {
                    return;
                }
                var sliceFirst = true;
                ranges.forEach(function (rg) {
                    var from = Math.max(run.from, rg.from);
                    var to = Math.min(run.to, rg.to);
                    if (from >= to) {
                        return;
                    }
                    var slice = htmlUtils.escapeHtml(raw.slice(from, to));
                    var st = mergeRunStyle(rg, run, base);
                    fonts.noteFont(ctx, st.postscript, st.family, st.fontStyle);
                    var pos = "";
                    if (lineFirst) {
                        var x = typeof run.x === "number" ? run.x : 0;
                        var y = typeof run.y === "number" ? run.y : base.size;
                        pos = ' x="' + x + '" y="' + y + '"';
                        lineFirst = false;
                    } else if (sliceFirst && typeof run.y === "number") {
                        pos = ' y="' + run.y + '"';
                    }
                    sliceFirst = false;
                    parts.push(
                        "<tspan" +
                            pos +
                            tspanStyle(st, base) +
                            ">" +
                            slice +
                            "</tspan>"
                    );
                });
            });
        });
    });
    return parts.join("") || htmlUtils.escapeHtml(raw);
}

function buildRanges(node, raw, base) {
    var listed =
        node.meta && node.meta.ux && node.meta.ux.rangedStyles;
    if (!listed || !listed.length) {
        return [{ from: 0, to: raw.length, style: null }];
    }
    var out = [];
    var i = 0;
    listed.forEach(function (rg) {
        var len = rg.length || 0;
        out.push({ from: i, to: i + len, style: rg });
        i += len;
    });
    if (i < raw.length) {
        out.push({ from: i, to: raw.length, style: null });
    }
    return out;
}

function baseStyle(node) {
    var font = (node.style && node.style.font) || {};
    var fill = node.style && node.style.fill;
    var fillCss = "#000000";
    if (fill && fill.type !== "none") {
        fillCss = colorSvg.colorToCss(fill.color || fill);
    }
    return {
        family: font.family || "sans-serif",
        postscript: font.postscriptName || "",
        fontStyle: font.style || "Regular",
        size: font.size || 14,
        weight: fonts.weightFromStyle(font.style || ""),
        italic: /italic/i.test(font.style || ""),
        fill: fillCss,
        underline: false,
        strikethrough: false
    };
}

function mergeRunStyle(rg, run, base) {
    var st = Object.assign({}, base);
    var rs = rg.style;
    if (rs) {
        st.family = rs.fontFamily || st.family;
        st.postscript = rs.postscriptName || st.postscript;
        st.fontStyle = rs.fontStyle || st.fontStyle;
        st.size = rs.fontSize || st.size;
        st.weight = fonts.weightFromStyle(st.fontStyle);
        st.italic = /italic/i.test(st.fontStyle);
        st.underline = !!rs.underline;
        st.strikethrough = !!rs.strikethrough;
        if (rs.fill) {
            st.fill = colorSvg.colorToCss(rs.fill);
        }
    }
    if (run.style && run.style.fill) {
        st.fill = colorSvg.colorToCss(run.style.fill.color || run.style.fill);
    }
    return st;
}

function tspanStyle(st, base) {
    var a = "";
    var fam = fontFamilyAttr(st);
    if (fam !== fontFamilyAttr(base)) {
        a += ' font-family="' + htmlUtils.escapeHtml(fam) + '"';
    }
    if (st.size !== base.size) {
        a += ' font-size="' + st.size + '"';
    }
    if (st.weight !== base.weight) {
        a += ' font-weight="' + st.weight + '"';
    }
    if (st.italic) {
        a += ' font-style="italic"';
    }
    if (st.fill !== base.fill) {
        a += ' fill="' + htmlUtils.escapeHtml(st.fill) + '"';
    }
    if (st.underline) {
        a += ' text-decoration="underline"';
    } else if (st.strikethrough) {
        a += ' text-decoration="line-through"';
    }
    return a;
}

module.exports = {
    textToSvg: textToSvg
};
