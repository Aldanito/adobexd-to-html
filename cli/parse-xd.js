"use strict";

/**
 * Open an Adobe XD .xd archive (ZIP) and list artboards + AGC trees.
 */

var fs = require("fs");
var path = require("path");
var os = require("os");
var { execFileSync } = require("child_process");
var parseManifest = require("./parse-manifest");
var interactions = require("./interactions");

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
    var fromManifest = parseManifest.manifestArtboards(rootDir);
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

    var folders = listArtboardFolders(rootDir);
    var artboards = [];
    folders.forEach(function (folder) {
        var meta = artboardMeta[folder.id] || {};
        var man = fromManifest[folder.id] || {};
        artboards.push({
            id: folder.id,
            name: meta.name || man.name || folder.id,
            width: meta.width || man.width || 0,
            height: meta.height || man.height || 0,
            x: meta.x != null ? meta.x : man.x || 0,
            y: meta.y != null ? meta.y : man.y || 0,
            agc: JSON.parse(fs.readFileSync(folder.agcFull, "utf8"))
        });
    });

    artboards.sort(function (a, b) {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });

    return {
        name: manifestName,
        artboards: artboards,
        resourcesDir: path.join(rootDir, "resources"),
        interactions: interactions.loadInteractions(rootDir)
    };
}

/**
 * Prefer artwork/artboard-* folders (ids can diverge from resources.artboards).
 * @param {string} rootDir
 */
function listArtboardFolders(rootDir) {
    var artworkDir = path.join(rootDir, "artwork");
    var folders = [];
    if (fs.existsSync(artworkDir)) {
        fs.readdirSync(artworkDir).forEach(function (name) {
            if (name.indexOf("artboard-") !== 0) {
                return;
            }
            var agcFull = path.join(
                artworkDir,
                name,
                "graphics",
                "graphicContent.agc"
            );
            if (fs.existsSync(agcFull)) {
                folders.push({
                    id: name.slice("artboard-".length),
                    agcFull: agcFull
                });
            }
        });
    }
    return folders;
}

module.exports = {
    openXd: openXd
};
