"use strict";

/**
 * Emit dropdown / select triggers with consistent field chrome classes.
 */

var htmlUtils = require("../exporter/html-utils");
var semantic = require("../exporter/semantic");
var agcStyle = require("./agc-style");
var agcTextLayout = require("./agc-text-layout");

/** Closed field / trigger labels common across UI kits (not product-specific). */
var DROPDOWN_LABEL_RE =
    /^(select\b|search\b|filter\b|choose\b|pick\b|section\s*edits|adjust\b)/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
function isDropdownLabel(text) {
    var t = text ? String(text).trim() : "";
    if (!t || t.indexOf("\n") !== -1) {
        return false;
    }
    return DROPDOWN_LABEL_RE.test(t);
}

/**
 * Prefer closed-field labels when claiming text slots (shorter / non-option).
 * @param {string} text
 * @returns {string}
 */
function dropdownSlotKind(text) {
    if (isDropdownLabel(text)) {
        return "dropdown-label";
    }
    return "text";
}

/**
 * @param {*} node
 * @param {string} className
 * @param {{x:number,y:number}} pos
 * @param {*} size
 * @param {*} ctx
 * @returns {string}
 */
function emitDropdownText(node, className, pos, size, ctx) {
    var box = agcTextLayout.textBox(node, pos, size);
    var decls = htmlUtils.mergeStyles(
        agcStyle.layoutDecls(box.pos, box.size),
        agcStyle.textDecls(node)
    );
    decls["white-space"] = "nowrap";
    decls.overflow = "hidden";
    decls["text-overflow"] = "ellipsis";
    ctx.sheet.add("." + className, decls);
    var text = htmlUtils.escapeHtml(agcTextLayout.formattedRawText(node));
    return (
        '<span class="' +
        className +
        ' xd-dropdown-label" data-dropdown="true">' +
        text +
        "</span>"
    );
}

module.exports = {
    isDropdownLabel: isDropdownLabel,
    dropdownSlotKind: dropdownSlotKind,
    emitDropdownText: emitDropdownText
};
