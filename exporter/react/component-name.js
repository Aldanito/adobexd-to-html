"use strict";

/**
 * Artboard slug → PascalCase React component name.
 * @param {string} slug
 * @returns {string}
 */
function toComponentName(slug) {
    var parts = String(slug || "artboard")
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map(function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        });
    var name = parts.join("") || "Artboard";
    if (!/^[A-Z]/.test(name)) {
        name = "Artboard" + name;
    }
    return name;
}

module.exports = {
    toComponentName: toComponentName
};
