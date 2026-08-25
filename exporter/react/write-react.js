"use strict";

var fs = require("fs");
var path = require("path");
var artboardJsxFile = require("./component-source").artboardJsxFile;

/**
 * Write react/*.jsx plus a barrel index.js.
 * @param {string} reactDir
 * @param {Array} boards
 */
function writeReactExport(reactDir, boards) {
    fs.mkdirSync(reactDir, { recursive: true });
    var names = [];
    (boards || []).forEach(function (board) {
        var file = artboardJsxFile(board);
        names.push(file);
        fs.writeFileSync(path.join(reactDir, file.fileName), file.source, "utf8");
    });
    var barrel =
        "/** Auto-generated artboard components. */\n" +
        names
            .map(function (f) {
                return (
                    "export { default as " +
                    f.componentName +
                    ' } from "./' +
                    f.fileName +
                    '";'
                );
            })
            .join("\n") +
        (names.length ? "\n" : "");
    fs.writeFileSync(path.join(reactDir, "index.js"), barrel, "utf8");
}

module.exports = {
    writeReactExport: writeReactExport
};
