"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useEffect, useState } from "react";

const PRODUCT = { name: "Şal Yaka Ceket", price: "₺429", tag: "Ağır kumaş" };
const CAPTION = "Bugünkü kombin — AI önerisiyle buldum";

const PURCHASED_HOLD_MS = 1800;
const SHARING_MS = 600;
const SHARED_HOLD_MS = 3400;
const RESET_HOLD_MS = 700;

type Phase = "purchased" | "sharing" | "shared" | "resetting";

export function PurchaseShareDemoMono() {
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
        border: "1px solid rgba(255,255,255,0.16)",
        padding: "22px",
        minHeight: "280px",
        fontFamily: "var(--font-sui)",
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
                border: "1px solid rgba(255,255,255,0.12)",
                marginBottom: "14px",
              }}
            >
              <span className="text-[10px] uppercase" style={{ color: "#4c4c4c" }}>
                {PRODUCT.tag}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: "#cccccc", fontSize: "14px" }}>{PRODUCT.name}</p>
                <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 500 }}>{PRODUCT.price}</p>
              </div>
              <div
                className="uppercase"
                style={{ color: "#4c4c4c", fontSize: "14px" }}
              >
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
              className="uppercase"
              style={{ color: "#4c4c4c", marginBottom: "12px", fontSize: "14px" }}
            >
              paylaştı
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                aspectRatio: "1.2",
                border: "1px solid rgba(255,255,255,0.12)",
                marginBottom: "12px",
              }}
            >
              <span className="text-[10px] uppercase" style={{ color: "#4c4c4c" }}>
                {PRODUCT.tag}
              </span>
            </div>
            <p style={{ color: "#cccccc", marginBottom: "10px", fontSize: "14px" }}>
              {CAPTION}
            </p>
            <motion.div
              key={likes}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="uppercase"
              style={{ color: "#4c4c4c", fontSize: "14px" }}
            >
              {likes} beğeni
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
