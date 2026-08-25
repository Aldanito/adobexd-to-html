"use strict";

/**
 * @deprecated Slot claiming lives in pipeline/slot-claim.js (plan pass).
 */

var slotClaim = require("./pipeline/slot-claim");

module.exports = {
    createOccupancyIndex: slotClaim.createSlotIndex
};
