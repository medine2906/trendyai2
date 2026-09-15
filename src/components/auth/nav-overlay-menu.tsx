"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePrefersReducedMotion } from "./morph-blob";

const CRIMSON = "#fc1c46";
const ASH = "#cccccc";

const LINKS = [
  { href: "#hero", label: "Başlangıç" },
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#topluluk", label: "Topluluk" },
];

export function NavOverlayMenu({ dark = true }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleLinkClick(href: string, e: React.MouseEvent) {
    e.preventDefault();
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 flex h-9 w-9 shrink-0 items-center justify-center"
        style={{ color: open ? "#ffffff" : dark ? "#ffffff" : "#000000" }}
      >
        {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: "#000000" }}
          >
            <nav className="flex flex-col items-center gap-6">
              {LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(link.href, e)}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reducedMotion ? 0 : -16 }}
                  transition={{ duration: 0.35, delay: reducedMotion ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="uppercase"
                  style={{ color: "#ffffff", fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 700, letterSpacing: "-0.01em" }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="/signin"
                initial={{ opacity: 0, y: reducedMotion ? 0 : -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -16 }}
                transition={{ duration: 0.35, delay: reducedMotion ? 0 : LINKS.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 uppercase"
                style={{ color: CRIMSON, fontSize: "18px", fontWeight: 500, letterSpacing: "-0.01em" }}
              >
                Giriş
              </motion.a>
            </nav>
            <span
              className="absolute bottom-8 uppercase"
              style={{ color: ASH, fontSize: "12px", letterSpacing: "0.05em" }}
            >
              ShopMind
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
