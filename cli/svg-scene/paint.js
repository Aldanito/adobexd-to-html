"use strict";

var htmlUtils = require("../../exporter/html-utils");
var colorSvg = require("./color");
var agcColor = require("../agc-color");

/**
 * Fill, stroke, opacity, and paint defs for an AGC node.
 * @param {*} node
 * @param {*} ctx
 * @param {{width?:number,height?:number}} geom
 * @returns {{attrs:string, prefix:string, suffix:string}}
 */
function paintWrap(node, ctx, geom) {
    var style = node.style || {};
    var attrs = "";
    var prefix = "";
    var suffix = "";

    if (typeof style.opacity === "number" && style.opacity < 0.999) {
        attrs += ' opacity="' + style.opacity + '"';
    }

    var fill = style.fill;
    var fillAttr = fillAttrs(fill, ctx, node);
    attrs += fillAttr.attrs;
    prefix += fillAttr.prefix;
    suffix = fillAttr.suffix + suffix;

    var stroke = strokeAttrs(style.stroke, ctx, geom, node);
    attrs += stroke.attrs;
    prefix = stroke.prefix + prefix;
    suffix += stroke.suffix;

    var filterUrl = dropShadowUrl(style, ctx);
    if (filterUrl) {
        attrs += ' filter="' + filterUrl + '"';
    }

    return { attrs: attrs, prefix: prefix, suffix: suffix };
}

function fillAttrs(fill, ctx, node) {
    if (!fill || fill.type === "none") {
        return { attrs: ' fill="none"', prefix: "", suffix: "" };
    }
    if (fill.type === "solid" && fill.color) {
        return {
            attrs: ' fill="' + htmlUtils.escapeHtml(colorSvg.colorToCss(fill.color)) + '"',
            prefix: "",
            suffix: ""
        };
    }
    if (fill.type === "gradient" && fill.gradient) {
        var id = nextId(ctx, "grad");
        ctx.defs.push(gradientDef(id, fill.gradient));
        return { attrs: ' fill="url(#' + id + ')"', prefix: "", suffix: "" };
    }
    if (fill.type === "pattern" && ctx.assets) {
        var asset = ctx.assets.copyPatternFill(
            fill,
            node.name || "image",
            ctx.assetCategory || "images"
        );
        var href = asset && (asset[ctx.assetPathKey || "relFromArtboards"] || asset.relFromGold);
        if (href) {
            var pid = nextId(ctx, "pat");
            var w = (node.shape && node.shape.width) || 1;
            var h = (node.shape && node.shape.height) || 1;
            ctx.defs.push(
                '<pattern id="' +
                    pid +
                    '" patternUnits="userSpaceOnUse" width="' +
                    w +
                    '" height="' +
                    h +
                    '"><image href="' +
                    htmlUtils.escapeHtml(href) +
                    '" width="' +
                    w +
                    '" height="' +
                    h +
                    '" preserveAspectRatio="none" /></pattern>'
            );
            return { attrs: ' fill="url(#' + pid + ')"', prefix: "", suffix: "" };
        }
    }
    return { attrs: ' fill="none"', prefix: "", suffix: "" };
}

function strokeAttrs(stroke, ctx, geom, node) {
    if (!stroke || stroke.type === "none" || !(stroke.width > 0)) {
        return { attrs: "", prefix: "", suffix: "" };
    }
    var sw = stroke.width;
    var color = colorSvg.colorToCss(stroke.color);
    var attrs =
        ' stroke="' +
        htmlUtils.escapeHtml(color) +
        '" stroke-width="' +
        sw +
        '"';
    var cap = stroke.cap || "round";
    attrs += ' stroke-linecap="' + cap + '"';
    if (stroke.join) {
        attrs += ' stroke-linejoin="' + htmlUtils.escapeHtml(stroke.join) + '"';
    }
    var dash = stroke.dash || stroke.dashes;
    if (Array.isArray(dash) && dash.length) {
        attrs += ' stroke-dasharray="' + dash.join(" ") + '"';
    }

    var align = stroke.align;
    if (align === "inside" || align === "outside") {
        var cid = nextId(ctx, "sclip");
        var clipInner = clipGeom(node, geom);
        if (clipInner) {
            ctx.defs.push(
                '<clipPath id="' + cid + '">' + clipInner + "</clipPath>"
            );
            var scale = align === "inside" ? 2 : 2;
            attrs = attrs.replace(
                'stroke-width="' + sw + '"',
                'stroke-width="' + sw * scale + '"'
            );
            if (align === "outside") {
                attrs += ' paint-order="stroke fill"';
            }
            return {
                attrs: attrs,
                prefix: '<g clip-path="url(#' + cid + ')">',
                suffix: "</g>"
            };
        }
    }
    return { attrs: attrs, prefix: "", suffix: "" };
}

function clipGeom(node, geom) {
    var sh = node.shape || {};
    if (sh.type === "rect") {
        var x = sh.x || 0;
        var y = sh.y || 0;
        return (
            '<rect x="' +
            x +
            '" y="' +
            y +
            '" width="' +
            (sh.width || geom.width || 0) +
            '" height="' +
            (sh.height || geom.height || 0) +
            '" />'
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
            '" />'
        );
    }
    if (sh.type === "path" && sh.path) {
        var rule = sh.winding === "evenodd" ? "evenodd" : "nonzero";
        return (
            '<path d="' +
            htmlUtils.escapeHtml(sh.path) +
            '" fill-rule="' +
            rule +
            '" />'
        );
    }
    return null;
}

function gradientDef(id, gradient) {
    var stops = (gradient.stops || [])
        .map(function (s) {
            var c = s.color
                ? colorSvg.colorToCss(s.color)
                : agcColor.agcColorToCss(s.color);
            return (
                '<stop offset="' +
                (s.offset || 0) +
                '" stop-color="' +
                htmlUtils.escapeHtml(c) +
                '" />'
            );
        })
        .join("");
    if (gradient.type === "radial") {
        var cx = gradient.cx != null ? gradient.cx : 0.5;
        var cy = gradient.cy != null ? gradient.cy : 0.5;
        var r = gradient.r != null ? gradient.r : 0.5;
        return (
            '<radialGradient id="' +
            id +
            '" cx="' +
            cx +
            '" cy="' +
            cy +
            '" r="' +
            r +
            '" gradientUnits="objectBoundingBox">' +
            stops +
            "</radialGradient>"
        );
    }
    var rot = gradient.rotation || 0;
    return (
        '<linearGradient id="' +
        id +
        '" gradientTransform="rotate(' +
        rot +
        ' 0.5 0.5)" gradientUnits="objectBoundingBox">' +
        stops +
        "</linearGradient>"
    );
}

function dropShadowUrl(style, ctx) {
    var filters = style.filters || [];
    var shadows = [];
    filters.forEach(function (f) {
        if (f.type !== "dropShadow" || !f.params || !f.params.dropShadows) {
            return;
        }
        f.params.dropShadows.forEach(function (s) {
            shadows.push(s);
        });
    });
    if (!shadows.length) {
        return null;
    }
    var id = nextId(ctx, "ds");
    var fe = shadows
        .map(function (s) {
            return (
                '<feDropShadow dx="' +
                (s.dx || 0) +
                '" dy="' +
                (s.dy || 0) +
                '" stdDeviation="' +
                (s.r || 0) / 2 +
                '" flood-color="' +
                htmlUtils.escapeHtml(colorSvg.colorToCss(s.color)) +
                '" />'
            );
        })
        .join("");
    ctx.defs.push('<filter id="' + id + '">' + fe + "</filter>");
    return "url(#" + id + ")";
}

function nextId(ctx, prefix) {
    ctx.idSeq = (ctx.idSeq || 0) + 1;
    return prefix + ctx.idSeq;
}

module.exports = {
    paintWrap: paintWrap,
    nextId: nextId,
    dropShadowUrl: dropShadowUrl
};
