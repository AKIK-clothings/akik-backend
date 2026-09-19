import crypto from "crypto";
import { supabase } from "../config/supabase";

/**
 * Generate a unique order number in format AKIK-YYYY-NNNN
 * e.g. AKIK-2026-0001
 */
export function generateOrderNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(4, "0");
  return `AKIK-${year}-${padded}`;
}

/**
 * Get the next order sequence number atomically from Supabase (SEC-02).
 * Uses database sequence to prevent race conditions during concurrent checkouts.
 */
export async function getNextOrderNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("generate_next_order_number");
    if (!error && data) {
      return data as string;
    }
    if (error) {
      console.warn("RPC generate_next_order_number error, using fallback:", error.message);
    }
  } catch (err) {
    console.warn("RPC generate_next_order_number failed, using fallback:", err);
  }

  // High-entropy fallback ensuring uniqueness even if DB function is not yet created
  const year = new Date().getFullYear();
  const timeSlice = Date.now().toString().slice(-5);
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `AKIK-${year}-${timeSlice}${rand}`;
}
