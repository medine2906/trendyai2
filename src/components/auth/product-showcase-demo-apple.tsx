"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
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

export function ProductShowcaseDemoApple() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  const scene = scenes[sceneIndex];

  useEffect(() => {
    setTyped("");
    setPhase("typing");
  }, [sceneIndex]);

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
    }, RESET_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      style={{
        width: "min(420px, 100%)",
        borderRadius: "28px",
        background: "#f5f5f7",
        padding: "24px",
      }}
    >
      {/* search bar */}
      <div
        className="flex items-center gap-2"
        style={{
          borderRadius: "999px",
          background: "#ffffff",
          padding: "12px 16px",
        }}
      >
        <Search className="h-4 w-4" strokeWidth={1.75} style={{ color: "#707070", flexShrink: 0 }} />
        <span className="text-sm" style={{ color: "#1d1d1f" }}>
          {typed}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            style={{ display: "inline-block", width: "1px", height: "14px", background: "#1d1d1f", marginLeft: "2px", verticalAlign: "middle" }}
          />
        </span>
      </div>

      {/* AI response area */}
      <div style={{ marginTop: "20px", minHeight: "168px" }}>
        <AnimatePresence mode="wait">
          {phase === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs"
              style={{ color: "#707070" }}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} style={{ color: "#0071e3" }} />
              <span>AI düşünüyor</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: "3px", height: "3px", background: "#0071e3", borderRadius: "999px" }}
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
                className="flex items-center gap-2 text-xs"
                style={{ color: "#0071e3", marginBottom: "12px" }}
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                {scene.aiNote}
              </div>
              <div className="grid grid-cols-3" style={{ gap: "10px" }}>
                {scene.products.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                    style={{ background: "#ffffff", borderRadius: "16px", overflow: "hidden" }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{ aspectRatio: "1", background: "#f5f5f7" }}
                    >
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "#707070" }}>
                        {p.tag}
                      </span>
                    </div>
                    <div style={{ padding: "10px" }}>
                      <p className="text-xs" style={{ color: "#1d1d1f" }}>{p.name}</p>
                      <p className="text-xs font-semibold" style={{ color: "#0071e3" }}>{p.price}</p>
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
