"use client";

import { motion } from "framer-motion";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { ProductShowcaseDemoApple } from "./product-showcase-demo-apple";

const features = [
  { icon: Search, text: "AI ile bağlamı anlayan ürün araması" },
  { icon: ShoppingBag, text: "Gerçek mağazalardan gerçek ürünler" },
  { icon: Sparkles, text: "Sana özel akış ve öneriler" },
];

/**
 * TEMPORARY comparison-only view — full Apple palette (#ffffff / #f5f5f7 / #0071e3)
 * applied to the auth left panel, for the user to preview against the real
 * brand-colored /login page before deciding which direction to keep.
 */
export function AppleStyleShowcasePreview() {
  return (
    <div
      className="relative flex flex-col"
      style={{ minHeight: "100vh", background: "#ffffff", color: "#1d1d1f" }}
    >
      {/* promo ribbon */}
      <div
        className="text-center"
        style={{ background: "#f5f5f7", color: "#1d1d1f", padding: "10px 16px", fontSize: "12px" }}
      >
        AI destekli moda keşif ve alışveriş deneyimi
      </div>

      {/* nav */}
      <div className="flex items-center justify-between" style={{ padding: "20px 40px" }}>
        <span className="font-semibold text-sm tracking-wide">TRENDAI</span>
        <div className="flex items-center gap-6 text-xs" style={{ color: "#474747" }}>
          <span>Giriş</span>
          <span>Kayıt</span>
        </div>
      </div>

      {/* headline + demo */}
      <div className="flex flex-1 flex-col items-center justify-center" style={{ padding: "40px 24px", gap: "48px" }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(48px, 6vw, 80px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: "#1d1d1f",
          }}
        >
          TrendAI
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductShowcaseDemoApple />
        </motion.div>
      </div>

      {/* features band */}
      <div style={{ background: "#f5f5f7", padding: "40px" }}>
        <ul className="mx-auto flex flex-col" style={{ gap: "16px", maxWidth: "420px" }}>
          {features.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.15, ease: "easeOut" }}
              className="flex items-center gap-3 text-sm"
              style={{ color: "#474747" }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: "#0071e3" }} />
              {text}
            </motion.li>
          ))}
        </ul>
      </div>

      <div
        className="text-center"
        style={{ background: "#ffffff", color: "#707070", padding: "16px", fontSize: "12px" }}
      >
        © {new Date().getFullYear()} TrendAI
      </div>
    </div>
  );
}
