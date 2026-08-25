"use strict";

/**
 * Build examples/sample.xd — tiny public fixture (Home + About + tap link).
 */

var fs = require("fs");
var path = require("path");
var os = require("os");
var { execFileSync } = require("child_process");

var HOME = "11111111-1111-4111-8111-111111111111";
var ABOUT = "22222222-2222-4222-8222-222222222222";
var BTN_TO_ABOUT = "33333333-3333-4333-8333-333333333333";
var BTN_TO_HOME = "44444444-4444-4444-8444-444444444444";

function writeSampleXd(dest) {
    var root = fs.mkdtempSync(path.join(os.tmpdir(), "xd-sample-"));
    fs.writeFileSync(
        path.join(root, "mimetype"),
        "application/vnd.adobe.sparkler.project+dcxucf"
    );
    fs.writeFileSync(
        path.join(root, "manifest"),
        JSON.stringify(manifest())
    );
    mkdir(root, "resources/graphics");
    mkdir(root, "artwork/pasteboard/graphics");
    mkdir(root, "artwork/artboard-" + HOME + "/graphics");
    mkdir(root, "artwork/artboard-" + ABOUT + "/graphics");
    mkdir(root, "interactions");
    fs.writeFileSync(
        path.join(root, "resources/graphics/graphicContent.agc"),
        JSON.stringify(resourcesAgc())
    );
    fs.writeFileSync(
        path.join(root, "artwork/pasteboard/graphics/graphicContent.agc"),
        JSON.stringify({ version: "1.5.0", children: [], resources: {}, artboards: {} })
    );
    fs.writeFileSync(
        path.join(root, "artwork/artboard-" + HOME + "/graphics/graphicContent.agc"),
        JSON.stringify(
            boardAgc(HOME, "#1B2A4A", [
                textNode("Title", 40, 48, "Home", "#F4EFE4", 32),
                textNode("Lead", 40, 100, "Sample .xd for xd-to-html", "#C8C2B4", 16),
                shapeNode(BTN_TO_ABOUT, "About button", 40, 160, 160, 44, "#C45C26"),
                textNode("About label", 72, 172, "About →", "#FFFFFF", 16)
            ])
        )
    );
    fs.writeFileSync(
        path.join(root, "artwork/artboard-" + ABOUT + "/graphics/graphicContent.agc"),
        JSON.stringify(
            boardAgc(ABOUT, "#F4EFE4", [
                textNode("Title", 40, 48, "About", "#1B2A4A", 32),
                textNode("Lead", 40, 100, "Tap Home to go back.", "#333333", 16),
                shapeNode(BTN_TO_HOME, "Home button", 40, 160, 160, 44, "#1B2A4A"),
                textNode("Home label", 72, 172, "← Home", "#FFFFFF", 16)
            ])
        )
    );
    fs.writeFileSync(
        path.join(root, "interactions/interactions.json"),
        JSON.stringify({
            version: "0.24",
            interactions: {
                [BTN_TO_ABOUT]: [
                    {
                        triggerEvent: "tap",
                        action: "overlay-transition",
                        properties: { destination: ABOUT }
                    }
                ],
                [BTN_TO_HOME]: [
                    {
                        triggerEvent: "tap",
                        action: "overlay-transition",
                        properties: { destination: HOME }
                    }
                ]
            }
        })
    );

    var out = path.resolve(dest);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (fs.existsSync(out)) {
        fs.unlinkSync(out);
    }
    execFileSync(
        "zip",
        ["-q", "-r", "-X", out, "mimetype", "manifest", "artwork", "resources", "interactions"],
        { cwd: root }
    );
    fs.rmSync(root, { recursive: true, force: true });
    return out;
}

function mkdir(root, rel) {
    fs.mkdirSync(path.join(root, rel), { recursive: true });
}

function manifest() {
    return {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "xd-to-html sample",
        children: [
            {
                name: "artwork",
                path: "artwork",
                children: [
                    {
                        name: "Home",
                        path: "artboard-" + HOME,
                        "uxdesign#bounds": { x: 0, y: 0, width: 640, height: 400 }
                    },
                    {
                        name: "About",
                        path: "artboard-" + ABOUT,
                        "uxdesign#bounds": { x: 720, y: 0, width: 640, height: 400 }
                    }
                ]
            }
        ]
    };
}

function resourcesAgc() {
    return {
        version: "1.5.0",
        children: [],
        resources: { meta: {}, gradients: {}, clipPaths: {} },
        artboards: {
            [HOME]: { width: 640, height: 400, name: "Home", x: 0, y: 0 },
            [ABOUT]: { width: 640, height: 400, name: "About", x: 720, y: 0 }
        }
    };
}

function boardAgc(id, fillHex, children) {
    var rgb = hexRgb(fillHex);
    return {
        version: "1.5.0",
        children: [
            {
                type: "artboard",
                id: id,
                style: {
                    fill: {
                        type: "solid",
                        color: { mode: "RGB", value: rgb }
                    }
                },
                artboard: { children: children }
            }
        ],
        resources: {},
        artboards: {}
    };
}

function textNode(name, x, y, raw, fillHex, size) {
    var rgb = hexRgb(fillHex);
    return {
        type: "text",
        name: name,
        transform: { a: 1, b: 0, c: 0, d: 1, tx: x, ty: y },
        style: {
            fill: { type: "solid", color: { mode: "RGB", value: rgb } },
            font: {
                family: "Georgia",
                postscriptName: "Georgia",
                style: "Regular",
                size: size
            }
        },
        text: {
            rawText: raw,
            frame: { type: "autoHeight", width: 400 },
            paragraphs: [
                { lines: [[{ x: 0, y: size, from: 0, to: raw.length }]] }
            ]
        }
    };
}

function shapeNode(id, name, x, y, w, h, fillHex) {
    var rgb = hexRgb(fillHex);
    return {
        type: "shape",
        id: id,
        name: name,
        transform: { a: 1, b: 0, c: 0, d: 1, tx: x, ty: y },
        style: {
            fill: { type: "solid", color: { mode: "RGB", value: rgb } }
        },
        shape: { type: "rect", x: 0, y: 0, width: w, height: h, r: [6, 6, 6, 6] }
    };
}

function hexRgb(hex) {
    var h = hex.replace("#", "");
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16)
    };
}

if (require.main === module) {
    var dest =
        process.argv[2] ||
        path.join(__dirname, "sample.xd");
    console.log("Wrote " + writeSampleXd(dest));
}

module.exports = { writeSampleXd: writeSampleXd };
