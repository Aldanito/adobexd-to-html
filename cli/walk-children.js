"use strict";

/**
 * Emit children in Scenegraph order (first child paints underneath).
 */

/**
 * @param {Array} children
 * @param {*} ctx
 * @param {{x:number,y:number}} pos
 * @param {Function} convertNode
 * @returns {string}
 */
function mapChildren(children, ctx, pos, convertNode) {
    var html = "";
    if (!children || !children.length) {
        return html;
    }
    for (var i = 0; i < children.length; i++) {
        html += convertNode(children[i], ctx, pos);
    }
    return html;
}

module.exports = {
    mapChildren: mapChildren
};
