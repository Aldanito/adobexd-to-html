/**
 * Sanitize XD layer names into valid CSS class names / file slugs.
 * Example: "Header / Main Logo" → "header-main-logo"
 */

/**
 * @param {string} name
 * @returns {string}
 */
function toSlug(name) {
    if (!name || typeof name !== "string") {
        return "layer";
    }
    var slug = name
        .toLowerCase()
        .replace(/[\/\\|]+/g, "-")
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    if (!slug) {
        return "layer";
    }
    if (/^[0-9]/.test(slug)) {
        slug = "n-" + slug;
    }
    return slug;
}

/**
 * Allocate a unique class/file name using an in-memory collision map.
 * @param {string} name
 * @param {Object.<string, number>} usedMap
 * @returns {string}
 */
function uniqueSlug(name, usedMap) {
    var base = toSlug(name);
    if (!usedMap[base]) {
        usedMap[base] = 1;
        return base;
    }
    usedMap[base] += 1;
    return base + "-" + usedMap[base];
}

module.exports = {
    toSlug: toSlug,
    uniqueSlug: uniqueSlug
};
