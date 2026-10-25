/**
 * Configuration and eligibility rules for Cash on Delivery (COD).
 * Backend remains the authoritative source of truth.
 */

export interface CodConfig {
  enabled: boolean;
  minOrderValue?: number;
  maxOrderValue?: number;
}

export const getCodConfig = (): CodConfig => ({
  enabled: process.env.COD_ENABLED !== "false",
  minOrderValue: process.env.COD_MIN_ORDER_VALUE ? Number(process.env.COD_MIN_ORDER_VALUE) : undefined,
  maxOrderValue: process.env.COD_MAX_ORDER_VALUE ? Number(process.env.COD_MAX_ORDER_VALUE) : undefined,
});

export function validateCodEligibility(finalTotal: number): { eligible: boolean; reason?: string } {
  const config = getCodConfig();

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
