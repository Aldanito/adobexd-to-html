"use strict";

/**
 * @param {string} name
 * @returns {string}
 */
function attrToJsxName(name) {
    if (name === "class") {
        return "className";
    }
    if (name === "for") {
        return "htmlFor";
    }
    if (name.indexOf("data-") === 0 || name.indexOf("aria-") === 0) {
        return name;
    }
    return name.replace(/[:|-]+([a-zA-Z0-9])/g, function (_, ch) {
        return ch.toUpperCase();
    });
}

/**
 * CSS declaration string → JSX style={{ ... }} token.
 * @param {string} css
 * @returns {string}
 */
function cssStyleToJsx(css) {
    var fields = String(css || "")
        .split(";")
        .map(function (part) {
            return part.trim();
        })
        .filter(Boolean)
        .map(function (part) {
            var i = part.indexOf(":");
            if (i < 0) {
                return null;
            }
            var key = attrToJsxName(part.slice(0, i).trim());
            var val = part.slice(i + 1).trim();
            return key + ":" + JSON.stringify(val);
        })
        .filter(Boolean);
    return "{{" + fields.join(",") + "}}";
}

/**
 * Convert HTML/SVG tags to JSX (className, camelCase attrs, style objects).
 * @param {string} markup
 * @returns {string}
 */
function markupToJsx(markup) {
    return String(markup || "").replace(
        /<([a-zA-Z][\w:-]*)([^>]*?)(\/?)\s*>/g,
        function (_, tag, rawAttrs, self) {
            var attrs = rawAttrs
                ? rawAttrs.replace(
                      /\s+([^\s=]+)(?:="([^"]*)"|='([^']*)')?/g,
                      function (_m, name, dq, sq) {
                          var jsxName = attrToJsxName(name);
                          if (dq == null && sq == null) {
                              return " " + jsxName;
                          }
                          var val = dq != null ? dq : sq;
                          if (name === "style") {
                              return " style=" + cssStyleToJsx(val);
                          }
                          return " " + jsxName + "=" + JSON.stringify(val);
                      }
                  )
                : "";
            return "<" + tag + attrs + (self ? " /" : "") + ">";
        }
    );
}

module.exports = {
    attrToJsxName: attrToJsxName,
    cssStyleToJsx: cssStyleToJsx,
    markupToJsx: markupToJsx
};
