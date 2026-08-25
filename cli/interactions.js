"use strict";

var fs = require("fs");
var path = require("path");

/**
 * @param {string} rootDir unzipped .xd
 * @returns {Object}
 */
function loadInteractions(rootDir) {
    var p = path.join(rootDir, "interactions", "interactions.json");
    if (!fs.existsSync(p)) {
        return { version: null, interactions: {} };
    }
    try {
        var data = JSON.parse(fs.readFileSync(p, "utf8"));
        return {
            version: data.version || null,
            interactions: data.interactions || {}
        };
    } catch (e) {
        return { version: null, interactions: {} };
    }
}

/**
 * Tap/click targets whose destination is another artboard.
 * @param {Object} interactions
 * @param {Object.<string,string>} idToSlug artboard uuid → html slug
 * @returns {Object.<string,{href:string,action:string}>}
 */
function nodeHrefs(interactions, idToSlug) {
    var map = {};
    var table = (interactions && interactions.interactions) || {};
    Object.keys(table).forEach(function (nodeId) {
        var list = table[nodeId] || [];
        list.forEach(function (item) {
            if (item.triggerEvent && item.triggerEvent !== "tap") {
                return;
            }
            var action = item.action;
            var dest =
                item.properties &&
                (item.properties.destination || item.properties.artboard);
            if (action === "previous-artboard") {
                map[nodeId] = { href: "javascript:history.back()", action: action };
                return;
            }
            if (dest && idToSlug[dest]) {
                map[nodeId] = {
                    href: idToSlug[dest] + ".html",
                    action: action || "go"
                };
            }
        });
    });
    return map;
}

module.exports = {
    loadInteractions: loadInteractions,
    nodeHrefs: nodeHrefs
};
