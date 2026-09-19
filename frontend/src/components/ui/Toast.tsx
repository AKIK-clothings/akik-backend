"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { CheckCircle2, RotateCcw, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCart();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-[#1F1E1D] text-[#FAF9F6] rounded-lg shadow-xl border border-white/10 text-sm font-sans"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[#C47D5A] shrink-0" />
              <p className="truncate text-xs sm:text-sm">{toast.message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.undoAction && (
                <button
                  onClick={() => {
                    toast.undoAction?.();
                    dismissToast(toast.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#C47D5A] hover:text-[#e49b77] bg-white/10 hover:bg-white/15 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {toast.undoLabel || "Undo"}
                </button>
              )}
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-white/50 hover:text-white rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
