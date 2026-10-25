"use strict";
/**
 * Configuration and eligibility rules for Cash on Delivery (COD).
 * Backend remains the authoritative source of truth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodConfig = void 0;
exports.validateCodEligibility = validateCodEligibility;
const getCodConfig = () => ({
    enabled: process.env.COD_ENABLED !== "false",
    minOrderValue: process.env.COD_MIN_ORDER_VALUE ? Number(process.env.COD_MIN_ORDER_VALUE) : undefined,
    maxOrderValue: process.env.COD_MAX_ORDER_VALUE ? Number(process.env.COD_MAX_ORDER_VALUE) : undefined,
});
exports.getCodConfig = getCodConfig;
function validateCodEligibility(finalTotal) {
    const config = (0, exports.getCodConfig)();
    if (!config.enabled) {
        return {
            eligible: false,
            reason: "Cash on Delivery is currently unavailable. Please select Online Payment.",
        };
    }
    if (config.minOrderValue !== undefined && finalTotal < config.minOrderValue) {
        return {
            eligible: false,
            reason: `Cash on Delivery is available for orders above ₹${config.minOrderValue.toLocaleString("en-IN")}.`,
        };
    }
    if (config.maxOrderValue !== undefined && finalTotal > config.maxOrderValue) {
        return {
            eligible: false,
            reason: `Cash on Delivery is available for orders up to ₹${config.maxOrderValue.toLocaleString("en-IN")}.`,
        };
    }
    return { eligible: true };
}
