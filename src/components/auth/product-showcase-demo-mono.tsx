"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Scene = {
  query: string;
  aiNote: string;
  products: { name: string; price: string; tag: string }[];
};

const scenes: Scene[] = [
  {
    query: "İş görüşmesi için şık ama rahat bir kombin",
    aiNote: "Klasik kesim, koyu tonlar öneriyorum",
    products: [
      { name: "Blazer Ceket", price: "₺649", tag: "Dar kesim" },
      { name: "Kumaş Pantolon", price: "₺389", tag: "Klasik" },
      { name: "Saten Gömlek", price: "₺299", tag: "Streç" },
    ],
  },
  {
    query: "Düğünde giyeceğim, rüzgarlı olacak, uçmasın",
    aiNote: "Dar kesim, ağır kumaş seçtim",
    products: [
      { name: "Midi Elbise", price: "₺549", tag: "Kalem kesim" },
      { name: "Şal Yaka Ceket", price: "₺429", tag: "Ağır kumaş" },
      { name: "Topuklu Ayakkabı", price: "₺699", tag: "Saten" },
    ],
  },
  {
    query: "Yazlık, hafif, plaj için elbise arıyorum",
    aiNote: "Şifon kumaş, salaş kesim seçtim",
    products: [
      { name: "Şifon Elbise", price: "₺349", tag: "Salaş" },
      { name: "Hasır Şapka", price: "₺179", tag: "Yazlık" },
      { name: "Deri Sandalet", price: "₺259", tag: "Düz taban" },
    ],
  },
];

const TYPE_SPEED_MS = 55;
const THINK_MS = 900;
const RESULTS_HOLD_MS = 3200;
const RESET_HOLD_MS = 700;

type Phase = "typing" | "thinking" | "results" | "resetting";

export function ProductShowcaseDemoMono() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  const scene = scenes[sceneIndex];

  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length >= scene.query.length) {
      const t = setTimeout(() => setPhase("thinking"), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped(scene.query.slice(0, typed.length + 1));
    }, TYPE_SPEED_MS);
    return () => clearTimeout(t);
  }, [phase, typed, scene.query]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = setTimeout(() => setPhase("results"), THINK_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "results") return;
    const t = setTimeout(() => setPhase("resetting"), RESULTS_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "resetting") return;
    const t = setTimeout(() => {
      setSceneIndex((i) => (i + 1) % scenes.length);
      setTyped("");
      setPhase("typing");
    }, RESET_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      style={{
        width: "min(420px, 100%)",
        border: "1px solid rgba(255,255,255,0.16)",
        padding: "22px",
      }}
    >
      {/* search bar */}
      <div
        className="flex items-center"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          padding: "7px 0",
        }}
      >
        <span className="text-sm" style={{ color: "#ffffff", fontFamily: "var(--font-sui)" }}>
          {typed}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            style={{ display: "inline-block", width: "1px", height: "14px", background: "#ffffff", marginLeft: "2px", verticalAlign: "middle" }}
          />
        </span>
      </div>

      {/* AI response area */}
      <div style={{ marginTop: "18px", minHeight: "168px" }}>
        <AnimatePresence mode="wait">
          {phase === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 uppercase"
              style={{ color: "#4c4c4c", fontFamily: "var(--font-sui)", fontSize: "14px" }}
            >
              <span>AI düşünüyor</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: "3px", height: "3px", background: "#ffffff", borderRadius: "9999px" }}
                  />
                ))}
              </span>
            </motion.div>
          )}

          {(phase === "results" || phase === "resetting") && (
            <motion.div
              key={`results-${sceneIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "resetting" ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="uppercase"
                style={{ color: "#cccccc", marginBottom: "12px", fontFamily: "var(--font-sui)", fontSize: "14px" }}
              >
                {scene.aiNote}
              </div>
              <div className="grid grid-cols-3" style={{ gap: "9px" }}>
                {scene.products.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                    style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{ aspectRatio: "1", borderBottom: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <span className="text-[10px] uppercase" style={{ color: "#4c4c4c" }}>
                        {p.tag}
                      </span>
                    </div>
                    <div style={{ padding: "8px" }}>
                      <p style={{ color: "#cccccc", fontSize: "14px" }}>{p.name}</p>
                      <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 500 }}>{p.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
