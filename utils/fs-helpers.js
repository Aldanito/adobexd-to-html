/**
 * UXP storage helpers for creating folders and writing UTF-8 files.
 */

var formats = require("uxp").storage.formats;

/**
 * Ensure a child folder exists (create if missing).
 * @param {*} parentFolder
 * @param {string} name
 * @returns {Promise<*>}
 */
function ensureFolder(parentFolder, name) {
    return parentFolder.getEntry(name).then(
        function (entry) {
            return entry;
        },
        function () {
            return parentFolder.createFolder(name);
        }
    );
}

/**
 * Write a UTF-8 text file, overwriting if present.
 * @param {*} folder
 * @param {string} fileName
 * @param {string} contents
 * @returns {Promise<void>}
 */
function writeText(folder, fileName, contents) {
    return folder.createFile(fileName, { overwrite: true }).then(function (file) {
        return file.write(contents, { format: formats.utf8 });
    });
}

module.exports = {
    ensureFolder: ensureFolder,
    writeText: writeText
};
