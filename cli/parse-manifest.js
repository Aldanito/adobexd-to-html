"use strict";

var fs = require("fs");
var path = require("path");

/**
 * Artboard id → name/bounds from the .xd manifest (folder id may differ
 * from resources.artboards keys).
 * @param {string} rootDir unzipped .xd root
 * @returns {Object.<string,{name:string,width:number,height:number,x:number,y:number}>}
 */
function manifestArtboards(rootDir) {
    var map = {};
    try {
        var manifest = JSON.parse(
            fs.readFileSync(path.join(rootDir, "manifest"), "utf8")
        );
        walk(manifest);
    } catch (e) {
        return map;
    }
    return map;

    function walk(node) {
        if (!node) {
            return;
        }
        var p = node.path || "";
        if (p.indexOf("artboard-") === 0) {
            var id = p.slice("artboard-".length);
            var b = node["uxdesign#bounds"] || {};
            map[id] = {
                name: node.name || id,
                width: b.width || 0,
                height: b.height || 0,
                x: b.x || 0,
                y: b.y || 0
            };
        }
        (node.children || []).forEach(walk);
    }
}

module.exports = {
    manifestArtboards: manifestArtboards
};
