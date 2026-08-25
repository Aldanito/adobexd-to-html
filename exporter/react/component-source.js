"use strict";

var markupToJsx = require("./markup-to-jsx").markupToJsx;
var toComponentName = require("./component-name").toComponentName;

/**
 * One default-export function component wrapping the artboard SVG + hotspots.
 * @param {{name:string, slug:string, width:number, height:number, background:string, bodyHtml:string, hotspotsHtml:string}} board
 * @returns {{fileName:string, componentName:string, source:string}}
 */
function artboardJsxFile(board) {
    var componentName = toComponentName(board.slug);
    var body = markupToJsx(board.bodyHtml || "");
    var spots = hotspotJsx(board.hotspotsHtml || "");
    var source =
        "/** Auto-generated from Adobe XD. Import into any React app. */\n" +
        "export default function " +
        componentName +
        "(props) {\n" +
        "  var hrefs = props.hrefs || {};\n" +
        "  var className = [\"xd-artboard\", props.className].filter(Boolean).join(\" \");\n" +
        "  var style = Object.assign(\n" +
        "    {\n" +
        "      position: \"relative\",\n" +
        "      width: " +
        Number(board.width) +
        ",\n" +
        "      height: " +
        Number(board.height) +
        ",\n" +
        "      overflow: \"hidden\",\n" +
        "      background: " +
        JSON.stringify(board.background || "#FFFFFF") +
        "\n" +
        "    },\n" +
        "    props.style\n" +
        "  );\n" +
        "  return (\n" +
        "    <div className={className} data-artboard={" +
        JSON.stringify(board.name) +
        "} style={style}>\n" +
        "      " +
        body +
        "\n" +
        spots +
        "    </div>\n" +
        "  );\n" +
        "}\n";
    return {
        fileName: componentName + ".jsx",
        componentName: componentName,
        source: source
    };
}

/**
 * Hotspot anchors with hrefs[slug] overrides for React Router.
 * @param {string} html
 * @returns {string}
 */
function hotspotJsx(html) {
    var jsx = markupToJsx(html);
    if (!jsx) {
        return "";
    }
    jsx = jsx.replace(/href="([^"]+)"/g, function (_, href) {
        var slug = String(href).replace(/\.html$/i, "");
        return (
            "href={(hrefs[" +
            JSON.stringify(slug) +
            "] || " +
            JSON.stringify(href) +
            ")}"
        );
    });
    return "      " + jsx + "\n";
}

module.exports = {
    artboardJsxFile: artboardJsxFile,
    hotspotJsx: hotspotJsx
};
