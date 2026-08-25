"use strict";

var htmlUtils = require("../../exporter/html-utils");
var paint = require("./paint");

/**
 * clipPathResources → SVG clipPath on a group.
 * @param {*} node
 * @param {*} ctx
 * @returns {string|null} url(#id) or null
 */
function clipUrl(node, ctx) {
    var res =
        node.meta &&
        node.meta.ux &&
        node.meta.ux.clipPathResources &&
        node.meta.ux.clipPathResources.children;
    if (!res || !res.length) {
        return null;
    }
    var parts = res.map(function (clip) {
        return clipChild(clip);
    }).filter(Boolean);
    if (!parts.length) {
        return null;
    }
    var id = paint.nextId(ctx, "clip");
    ctx.defs.push('<clipPath id="' + id + '">' + parts.join("") + "</clipPath>");
    return "url(#" + id + ")";
}

function clipChild(clip) {
    var sh = clip.shape || {};
    var tr = clip.transform || { tx: 0, ty: 0 };
    var tf =
        tr.a != null
            ? ' transform="matrix(' +
              (tr.a || 1) +
              " " +
              (tr.b || 0) +
              " " +
              (tr.c || 0) +
              " " +
              (tr.d || 1) +
              " " +
              (tr.tx || 0) +
              " " +
              (tr.ty || 0) +
              ')"'
            : tr.tx || tr.ty
              ? ' transform="translate(' + (tr.tx || 0) + " " + (tr.ty || 0) + ')"'
              : "";
    if (sh.type === "rect") {
        return (
            '<rect x="' +
            (sh.x || 0) +
            '" y="' +
            (sh.y || 0) +
            '" width="' +
            (sh.width || 0) +
            '" height="' +
            (sh.height || 0) +
            '"' +
            tf +
            " />"
        );
    }
    if (sh.type === "circle") {
        return (
            '<circle cx="' +
            (sh.cx || 0) +
            '" cy="' +
            (sh.cy || 0) +
            '" r="' +
            (sh.r || 0) +
            '"' +
            tf +
            " />"
        );
    }
    if (sh.type === "path" && sh.path) {
        var rule = sh.winding === "evenodd" ? "evenodd" : "nonzero";
        return (
            '<path d="' +
            htmlUtils.escapeHtml(sh.path) +
            '" fill-rule="' +
            rule +
            '"' +
            tf +
            " />"
        );
    }
    return "";
}

module.exports = {
    clipUrl: clipUrl
};
