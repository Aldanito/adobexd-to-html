"use strict";

var geometry = require("./agc-geometry");
var agcSize = require("./agc-size");
var htmlUtils = require("../exporter/html-utils");

/**
 * Absolute hit targets for prototype taps that go to another artboard.
 * @param {*} rootNode
 * @param {{width:number,height:number,x:number,y:number}} artboard
 * @param {Object.<string,{href:string}>} hrefById
 * @returns {string}
 */
function hotspotHtml(rootNode, artboard, hrefById) {
    var parts = [];
    walk(
        (rootNode.artboard && rootNode.artboard.children) || [],
        { x: 0, y: 0 }
    );
    return parts.join("");

    function walk(nodes, parentAbs) {
        (nodes || []).forEach(function (node) {
            if (!node || node.visible === false) {
                return;
            }
            var pos = geometry.artboardPosition(node, artboard, parentAbs);
            var link = node.id && hrefById[node.id];
            if (link) {
                var size = agcSize.nodeSize(node);
                var w = Math.max(size.width || 0, 24);
                var h = Math.max(size.height || 0, 24);
                parts.push(
                    '<a class="hotspot" href="' +
                        htmlUtils.escapeHtml(link.href) +
                        '" style="left:' +
                        pos.x +
                        "px;top:" +
                        pos.y +
                        "px;width:" +
                        w +
                        "px;height:" +
                        h +
                        'px" aria-label="Go to artboard"></a>'
                );
            }
            var kids = (node.group && node.group.children) || [];
            walk(kids, pos);
        });
    }
}

module.exports = {
    hotspotHtml: hotspotHtml
};
