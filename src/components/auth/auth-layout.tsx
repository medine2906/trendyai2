"use client";

import { motion } from "framer-motion";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useMediaQuery } from "@/lib/use-media-query";
import { ProductShowcaseDemo } from "./product-showcase-demo";

const features = [
  { icon: Search, text: "AI ile bağlamı anlayan ürün araması" },
  { icon: ShoppingBag, text: "Gerçek mağazalardan gerçek ürünler" },
  { icon: Sparkles, text: "Sana özel akış ve öneriler" },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <div
      className="flex"
      style={{
        minHeight: "100vh",
        // one continuous background across both columns — soft purple blends gradually
        // into cream, staying in a narrow tonal range instead of a hard color edge
        background: `
          radial-gradient(70% 90% at 15% 12%, rgba(255,255,255,0.12) 0%, transparent 60%),
          linear-gradient(90deg, #7d6aae 0%, #8a76b8 16%, #9683c0 30%, #b09fd4 42%, #b8aad0 50%, #cfc3e6 60%, #e6dcf1 70%, var(--background) 82%, var(--background) 100%)
        `,
      }}
    >
      {isDesktop && (
        <div
          className="relative flex flex-col"
          style={{
            width: "50%",
            overflow: "hidden",
            color: "#fcfaf1",
          }}
        >
          {/* announcement bar */}
          <div
            className="flex items-center justify-center text-center"
            style={{
              background: "linear-gradient(90deg, #9683c0 0%, #b8aad0 55%, #d9cfea 100%)",
              color: "#3a2c5c",
              padding: "8px 16px",
              fontSize: "12px",
            }}
          >
            AI destekli moda keşif ve alışveriş deneyimi
          </div>

          {/* nav */}
          <div className="flex items-center justify-between" style={{ padding: "20px 40px" }}>
            <span className="font-bold text-sm tracking-wide">TRENDAI</span>
            <div className="flex items-center gap-6 text-xs uppercase tracking-wide" style={{ opacity: 0.85 }}>
              <Link href="/login" className="hover:opacity-100">
                Giriş
              </Link>
              <Link href="/signup" className="hover:opacity-100">
                Kayıt
              </Link>
            </div>
          </div>

          {/* wordmark + live product demo */}
          <div className="relative flex flex-1 flex-col items-center justify-center" style={{ padding: "24px", gap: "40px" }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-center font-bold"
              style={{
                fontFamily: "var(--font-redaction)",
                fontSize: "clamp(40px, 5vw, 68px)",
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
                backgroundImage:
                  "linear-gradient(115deg, #ffffff 0%, #e4dbf5 18%, #fcfaf1 36%, #cabbe8 52%, #fcfaf1 68%, #e4dbf5 84%, #ffffff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 28px rgba(184,170,208,0.4))",
              }}
            >
              ShopMind
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductShowcaseDemo />
            </motion.div>
          </div>

          {/* feature list */}
          <div style={{ padding: "0 40px 32px" }}>
            <ul className="flex flex-col" style={{ gap: "12px" }}>
              {features.map(({ icon: Icon, text }, i) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.15, ease: "easeOut" }}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "rgba(252,250,241,0.8)" }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {text}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* footer band */}
          <div
            className="text-center"
            style={{
              background: "linear-gradient(90deg, #9683c0 0%, #b8aad0 55%, #d9cfea 100%)",
              color: "#3a2c5c",
              padding: "10px 16px",
              fontSize: "12px",
            }}
          >
            © {new Date().getFullYear()} ShopMind
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-center px-4"
        style={{
          width: isDesktop ? "50%" : "100%",
          paddingTop: "48px",
          paddingBottom: "48px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
