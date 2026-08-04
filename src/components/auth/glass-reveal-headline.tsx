"use client";

import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useEffect, type CSSProperties, type ReactNode } from "react";

const BLOB_RADII = [
  "58% 42% 38% 62% / 55% 35% 65% 45%",
  "40% 60% 68% 32% / 48% 62% 38% 52%",
  "62% 38% 45% 55% / 40% 58% 42% 60%",
  "45% 55% 55% 45% / 62% 40% 60% 38%",
  "58% 42% 38% 62% / 55% 35% 65% 45%",
];

/**
 * Duplicates the headline text as a dim "ghost" layer, floats a soft
 * frosted-glass blob over it, and reveals a bright copy of the text
 * only where the blob currently sits — the blob drifts and morphs
 * organically, so it looks like it's uncovering hidden type as it
 * moves. All CSS/SVG, no images or WebGL.
 */
export function GlassRevealHeadline({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const mvX = useMotionValue(28);
  const mvY = useMotionValue(42);

  useEffect(() => {
    const cx = animate(mvX, [28, 52, 22, 38, 28], {
      duration: 17,
      repeat: Infinity,
      ease: "easeInOut",
    });
    const cy = animate(mvY, [42, 22, 60, 34, 42], {
      duration: 21,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => {
      cx.stop();
      cy.stop();
    };
  }, [mvX, mvY]);

  const blobLeft = useMotionTemplate`${mvX}%`;
  const blobTop = useMotionTemplate`${mvY}%`;
  const maskGradient = useMotionTemplate`radial-gradient(circle 26% at ${mvX}% ${mvY}%, white 0%, white 55%, transparent 78%)`;

  return (
    <div style={{ position: "relative", isolation: "isolate" }}>
      {/* dim ghost layer — establishes the real text layout */}
      <h1 className={className} style={{ ...style, color: "rgba(255,255,255,0.09)" }}>
        {children}
      </h1>

      {/* frosted glass blob, drifting + morphing */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          left: blobLeft,
          top: blobTop,
          width: "min(50vw, 520px)",
          height: "min(50vw, 520px)",
          x: "-50%",
          y: "-50%",
          zIndex: 1,
          pointerEvents: "none",
          filter: "blur(0.5px)",
        }}
        animate={{ borderRadius: BLOB_RADII }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* base frosted fill */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(235,235,238,0.72) 45%, rgba(10,10,12,0.55) 100%)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />
        {/* rotating iridescent rim */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-25%",
              background: `
                radial-gradient(circle at 80% 80%, rgba(90,130,255,0.55) 0%, transparent 32%),
                radial-gradient(circle at 15% 85%, rgba(255,170,80,0.5) 0%, transparent 30%),
                radial-gradient(circle at 85% 15%, rgba(170,100,255,0.45) 0%, transparent 28%)
              `,
              filter: "blur(20px)",
              mixBlendMode: "screen",
            }}
          />
        </motion.div>
        {/* rim edge definition */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            boxShadow:
              "inset 0 0 40px rgba(255,255,255,0.4), inset 0 -30px 60px rgba(0,0,0,0.45)",
          }}
        />
      </motion.div>

      {/* bright text, only visible through the blob */}
      <motion.h1
        aria-hidden
        className={className}
        style={{
          ...style,
          position: "absolute",
          inset: 0,
          color: "#ffffff",
          zIndex: 2,
          pointerEvents: "none",
          WebkitMaskImage: maskGradient,
          maskImage: maskGradient,
        }}
      >
        {children}
      </motion.h1>
    </div>
  );
}
