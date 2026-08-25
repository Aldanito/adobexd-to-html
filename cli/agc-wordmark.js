"use strict";

/**
 * Overlay letter + stem fragments (C + "ounsel lock") compose one wordmark.
 */

var geometry = require("./agc-geometry");

/**
 * @param {*} group
 * @param {{x:number,y:number,width:number,height:number}} artboard
 * @param {{x:number,y:number}} parentAbs
 * @returns {{stem:*, text:string, pos:{x:number,y:number}, size:{width:number,height:number,radius:null}, fontSize:number}|null}
 */
function tryCompose(group, artboard, parentAbs) {
    if (!group || group.type !== "group") {
        return null;
    }
    var groupPos = geometry.artboardPosition(group, artboard, parentAbs);
    var kids = (group.group && group.group.children) || [];
    var texts = [];
    kids.forEach(function (k) {
        if (k && k.type === "text" && k.text && k.text.rawText) {
            texts.push(k);
        }
    });
    if (texts.length < 3) {
        return null;
    }

    var caps = [];
    var stems = [];
    texts.forEach(function (n) {
        var raw = String(n.text.rawText).replace(/\s+/g, " ").trim();
        var pos = geometry.artboardPosition(n, artboard, groupPos);
        var fs = (n.style && n.style.font && n.style.font.size) || 14;
        if (/^[A-Z]$/.test(raw)) {
            caps.push({ node: n, raw: raw, pos: pos, fontSize: fs });
        } else if (/^[a-z]/.test(raw) && /\s/.test(raw)) {
            stems.push({ node: n, raw: raw, pos: pos, fontSize: fs });
        }
    });
    if (stems.length !== 1 || caps.length < 2) {
        return null;
    }

    var stem = stems[0];
    var words = stem.raw.split(" ").filter(Boolean);
    if (caps.length !== words.length) {
        return null;
    }

    caps.sort(function (a, b) {
        return a.pos.x - b.pos.x;
    });
    var row = stem.pos.y;
    for (var i = 0; i < caps.length; i++) {
        if (Math.abs(caps[i].pos.y - row) > 24) {
            return null;
        }
        if (caps[i].fontSize <= stem.fontSize) {
            return null;
        }
    }

    var label = composeLabel(caps, words);
    if (!label) {
        return null;
    }

    var left = capGlyphLeft(caps[0]);
    var fontSize = caps[0].fontSize;
    var width = Math.round(fontSize * 0.62 * label.length);
    return {
        stem: stem.node,
        text: label,
        pos: { x: left, y: caps[0].pos.y },
        size: {
            width: width,
            height: fontSize * 1.25,
            radius: null
        },
        fontSize: fontSize
    };
}

/**
 * @param {Array} caps
 * @param {string[]} words
 * @returns {string|null}
 */
function composeLabel(caps, words) {
    if (!caps || caps.length !== words.length) {
        return null;
    }
    return caps
        .map(function (c, i) {
            return c.raw + words[i];
        })
        .join(" ");
}

function capGlyphLeft(cap) {
    var minX = 0;
    var paras = cap.node.text && cap.node.text.paragraphs;
    if (paras) {
        paras.forEach(function (p) {
            (p.lines || []).forEach(function (line) {
                (line || []).forEach(function (run) {
                    if (typeof run.x === "number" && run.x < minX) {
                        minX = run.x;
                    }
                });
            });
        });
    }
    return cap.pos.x + minX;
}

module.exports = {
    tryCompose: tryCompose
};
