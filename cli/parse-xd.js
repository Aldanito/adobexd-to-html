"use strict";

/**
 * Open an Adobe XD .xd archive (ZIP) and list artboards + AGC trees.
 */

var fs = require("fs");
var path = require("path");
var os = require("os");
var { execFileSync } = require("child_process");

/**
 * Extract .xd to a temp dir and return a document handle with cleanup().
 * @param {string} xdPath
 * @returns {{
 *   name:string,
 *   artboards:Array<{id:string,name:string,width:number,height:number,x:number,y:number,agc:Object}>,
 *   resourcesDir:string,
 *   cleanup:Function
 * }}
 */
function openXd(xdPath) {
    var abs = path.resolve(xdPath);
    if (!fs.existsSync(abs)) {
        throw new Error("File not found: " + abs);
    }

    var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xd-to-html-"));
    execFileSync("unzip", ["-qq", "-o", abs, "-d", tmp], { stdio: "pipe" });

    var doc = loadFromExtracted(tmp, abs);
    doc.cleanup = function () {
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch (e) {
            /* ignore */
        }
    };
    return doc;
}

/**
 * @param {string} rootDir
 * @param {string} sourcePath
 */
function loadFromExtracted(rootDir, sourcePath) {
    var resourcesAgc = JSON.parse(
        fs.readFileSync(
            path.join(rootDir, "resources", "graphics", "graphicContent.agc"),
            "utf8"
        )
    );
    var artboardMeta = resourcesAgc.artboards || {};
    var manifestName = path.basename(sourcePath, ".xd");

    try {
        var manifest = JSON.parse(
            fs.readFileSync(path.join(rootDir, "manifest"), "utf8")
        );
        if (manifest.name) {
            manifestName = String(manifest.name).replace(/\u0001/g, "").trim();
        }
    } catch (e) {
        /* keep basename */
    }

    var artboards = [];
    Object.keys(artboardMeta).forEach(function (id) {
        var meta = artboardMeta[id];
        var agcFull = path.join(
            rootDir,
            "artwork",
            "artboard-" + id,
            "graphics",
            "graphicContent.agc"
        );
        if (!fs.existsSync(agcFull)) {
            return;
        }
        artboards.push({
            id: id,
            name: meta.name || id,
            width: meta.width || 0,
            height: meta.height || 0,
            x: meta.x || 0,
            y: meta.y || 0,
            agc: JSON.parse(fs.readFileSync(agcFull, "utf8"))
        });
    });

    artboards.sort(function (a, b) {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });

    return {
        name: manifestName,
        artboards: artboards,
        resourcesDir: path.join(rootDir, "resources")
    };
}

module.exports = {
    openXd: openXd
};
