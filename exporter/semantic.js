/**
 * Heuristic: map XD layer names to semantic HTML tags.
 */

/**
 * @param {string} name
 * @param {string} constructorName
 * @returns {string}
 */
function pickTag(name, constructorName) {
    var n = (name || "").toLowerCase();
    if (constructorName === "Text") {
        if (/\bh1\b|^title$|hero.?title/.test(n)) return "h1";
        if (/\bh2\b|subtitle|heading/.test(n)) return "h2";
        if (/\bh3\b/.test(n)) return "h3";
        if (/\bh4\b/.test(n)) return "h4";
        if (/\bh5\b/.test(n)) return "h5";
        if (/\bh6\b/.test(n)) return "h6";
        return "p";
    }
    if (/\bheader\b/.test(n)) return "header";
    if (/\bnav\b|navbar|menu/.test(n)) return "nav";
    if (/\bfooter\b/.test(n)) return "footer";
    if (/\bmain\b/.test(n)) return "main";
    if (/\barticle\b/.test(n)) return "article";
    if (/\bsection\b/.test(n)) return "section";
    if (/\bbutton\b|btn\b/.test(n)) return "button";
    if (/\binput\b|field\b|textbox/.test(n)) return "div";
    return "div";
}

/**
 * True when a Group is only a transparent layout wrapper (hoist children).
 * @param {*} node
 * @returns {boolean}
 */
function isTransparentGroup(node) {
    var name = (node.name || "").trim();
    var unnamed =
        !name ||
        /^group(\s+\d+)?$/i.test(name) ||
        /^layer(\s+\d+)?$/i.test(name);
    if (!unnamed) {
        return false;
    }
    if (node.opacity < 0.999) {
        return false;
    }
    if (node.shadow || node.blur) {
        return false;
    }
    if (node.mask) {
        return false;
    }
    return true;
}

module.exports = {
    pickTag: pickTag,
    isTransparentGroup: isTransparentGroup
};
