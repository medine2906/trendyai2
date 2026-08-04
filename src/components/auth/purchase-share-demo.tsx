"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

const PRODUCT = { name: "Şal Yaka Ceket", price: "₺429", tag: "Ağır kumaş" };
const CAPTION = "Bugünkü kombin ✨ AI önerisiyle buldum";

const PURCHASED_HOLD_MS = 1800;
const SHARING_MS = 600;
const SHARED_HOLD_MS = 3400;
const RESET_HOLD_MS = 700;

type Phase = "purchased" | "sharing" | "shared" | "resetting";

export function PurchaseShareDemo() {
  const [phase, setPhase] = useState<Phase>("purchased");
  const [likes, setLikes] = useState(12);

  useEffect(() => {
    if (phase !== "purchased") return;
    const t = setTimeout(() => setPhase("sharing"), PURCHASED_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "sharing") return;
    const t = setTimeout(() => {
      setLikes(12);
      setPhase("shared");
    }, SHARING_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "shared") return;
    const bump = setTimeout(() => setLikes(27), 900);
    const t = setTimeout(() => setPhase("resetting"), SHARED_HOLD_MS);
    return () => {
      clearTimeout(bump);
      clearTimeout(t);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "resetting") return;
    const t = setTimeout(() => setPhase("purchased"), RESET_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      style={{
        width: "min(360px, 100%)",
        border: "1px solid rgba(252,250,241,0.16)",
        background: "rgba(252,250,241,0.04)",
        padding: "20px",
        minHeight: "280px",
      }}
    >
      <AnimatePresence mode="wait">
        {(phase === "purchased" || phase === "sharing") && (
          <motion.div
            key="purchased"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "sharing" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                aspectRatio: "1.2",
                border: "1px solid rgba(252,250,241,0.12)",
                marginBottom: "12px",
              }}
            >
              <span className="text-[10px] uppercase tracking-wide" style={{ opacity: 0.5 }}>
                {PRODUCT.tag}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "rgba(252,250,241,0.9)" }}>{PRODUCT.name}</p>
                <p className="text-sm font-semibold" style={{ color: "#fcfaf1" }}>{PRODUCT.price}</p>
              </div>
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "rgba(184,170,208,1)" }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                Sepete eklendi
              </div>
            </div>
          </motion.div>
        )}

        {(phase === "shared" || phase === "resetting") && (
          <motion.div
            key="shared"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: phase === "resetting" ? 0 : 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              className="flex items-center gap-2"
              style={{ marginBottom: "10px" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "9999px",
                  background: "rgba(252,250,241,0.1)",
                }}
              >
                <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} style={{ opacity: 0.8 }} />
              </div>
              <span className="text-xs" style={{ color: "rgba(252,250,241,0.7)" }}>
                paylaştı
              </span>
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                aspectRatio: "1.2",
                border: "1px solid rgba(252,250,241,0.12)",
                marginBottom: "10px",
              }}
            >
              <span className="text-[10px] uppercase tracking-wide" style={{ opacity: 0.5 }}>
                {PRODUCT.tag}
              </span>
            </div>
            <p className="text-sm" style={{ color: "rgba(252,250,241,0.9)", marginBottom: "8px" }}>
              {CAPTION}
            </p>
            <motion.div
              key={likes}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(252,250,241,0.6)" }}
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
              {likes} beğeni
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
