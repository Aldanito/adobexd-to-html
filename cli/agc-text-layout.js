"use strict";

/**
 * Map AGC text frames to CSS boxes the way SVG tspans do:
 * origin + line.x, not translateX of the (often much wider) frame.
 */

var agcColor = require("./agc-color");

/**
 * @param {*} node
 * @returns {number[]}
 */
function lineXs(node) {
    var xs = [];
    var paras = node.text && node.text.paragraphs;
    if (!paras) {
        return xs;
    }
    paras.forEach(function (p) {
        (p.lines || []).forEach(function (line) {
            (line || []).forEach(function (run) {
                if (typeof run.x === "number") {
                    xs.push(run.x);
                }
            });
        });
    });
    return xs;
}

/**
 * @param {*} node
 * @param {{x:number,y:number}} pos
 * @param {{width:number,height:number,radius?:string|null}} size
 * @returns {{pos:{x:number,y:number}, size:{width:number,height:number,radius?:string|null}}}
 */
function textBox(node, pos, size) {
    var xs = lineXs(node);
    var minX = xs.length ? Math.min.apply(null, xs) : 0;
    var ta = node.style && node.style.textAttributes;
    var align = ta && ta.paragraphAlign;
    var x = pos.x;
    var w = size.width || 0;
    var fontSize =
        (node.style && node.style.font && node.style.font.size) || 14;
    var lh = ta && ta.lineHeight;
    var decorative =
        typeof lh === "number" && lh > fontSize * 1.5;

    // Area-text origin is the frame left. Using line.x (glyph center) pulls
    // sidebar labels, date fields, and letterhead out of their boxes.
    if (align === "center" && w > 0 && !decorative) {
        return {
            pos: { x: pos.x, y: pos.y },
            size: {
                width: w,
                height: size.height,
                radius: size.radius
            }
        };
    }

    if (minX < -0.5) {
        x = pos.x + minX;
        w = align === "right" ? -minX : Math.max(-2 * minX, 1);
    } else if (minX > 0.5 && align !== "center") {
        x = pos.x + minX;
        w = Math.max(w - minX, 1);
    }

    return {
        pos: { x: x, y: pos.y },
        size: {
            width: w,
            height: size.height,
            radius: size.radius
        }
    };
}

/**
 * Rebuild raw text with AGC line breaks (rawText is often a single line).
 * @param {*} node
 * @returns {string}
 */
function formattedRawText(node) {
    var raw = (node.text && node.text.rawText) || "";
    var paras = node.text && node.text.paragraphs;
    if (!paras || !paras.length) {
        return raw;
    }
    var parts = [];
    paras.forEach(function (p, pi) {
        if (pi) {
            parts.push("\n");
        }
        (p.lines || []).forEach(function (line, li) {
            if (li) {
                parts.push("\n");
            }
            (line || []).forEach(function (run) {
                if (typeof run.from === "number" && typeof run.to === "number") {
                    parts.push(raw.slice(run.from, run.to));
                }
            });
        });
    });
    return parts.join("") || raw;
}

/**
 * Same as formattedRawText, with per-run fill as inline color spans.
 * @param {*} node
 * @param {function(string):string} escapeHtml
 * @returns {string}
 */
function formattedHtml(node, escapeHtml) {
    var raw = (node.text && node.text.rawText) || "";
    var paras = node.text && node.text.paragraphs;
    if (!paras || !paras.length) {
        return escapeHtml(raw);
    }
    var parts = [];
    paras.forEach(function (p, pi) {
        if (pi) {
            parts.push("\n");
        }
        (p.lines || []).forEach(function (line, li) {
            if (li) {
                parts.push("\n");
            }
            (line || []).forEach(function (run) {
                if (typeof run.from !== "number" || typeof run.to !== "number") {
                    return;
                }
                var slice = escapeHtml(raw.slice(run.from, run.to));
                var fill =
                    run.style && run.style.fill
                        ? agcColor.agcFillToCss(run.style.fill)
                        : null;
                if (fill) {
                    parts.push('<span style="color:' + fill + '">' + slice + "</span>");
                } else {
                    parts.push(slice);
                }
            });
        });
    });
    return parts.join("") || escapeHtml(raw);
}

module.exports = {
    textBox: textBox,
    formattedRawText: formattedRawText,
    formattedHtml: formattedHtml
};
