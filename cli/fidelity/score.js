"use strict";

/**
 * Turn a pixel-mismatch ratio into a 1:1 score (percent) and band.
 * @param {number} ratio
 * @returns {{percent:number, band:string}}
 */
function matchScore(ratio) {
    var percent = Math.max(0, Math.min(100, (1 - (ratio || 0)) * 100));
    var band = "poor";
    if (percent >= 99.5) {
        band = "excellent";
    } else if (percent >= 95) {
        band = "good";
    } else if (percent >= 80) {
        band = "fair";
    }
    return { percent: percent, band: band };
}

/**
 * @param {Array<{full?:{ratio:number}, vector?:{ratio:number}}>} rows
 * @returns {{full:number, vector:number}|null}
 */
function averageScores(rows) {
    var full = 0;
    var vector = 0;
    var n = 0;
    rows.forEach(function (row) {
        if (!row || !row.full) {
            return;
        }
        n += 1;
        full += matchScore(row.full.ratio).percent;
        vector += matchScore((row.vector && row.vector.ratio) || row.full.ratio)
            .percent;
    });
    if (!n) {
        return null;
    }
    return { full: full / n, vector: vector / n };
}

module.exports = {
    matchScore: matchScore,
    averageScores: averageScores
};
