"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const BLOB_RADII = [
  "58% 42% 38% 62% / 55% 35% 65% 45%",
  "40% 60% 68% 32% / 48% 62% 38% 52%",
  "62% 38% 45% 55% / 40% 58% 42% 60%",
  "45% 55% 55% 45% / 62% 40% 60% 38%",
  "58% 42% 38% 62% / 55% 35% 65% 45%",
];

export type BlobScene = {
  icon: LucideIcon;
  label: string;
};

export type BlobVideo = {
  src: string;
};

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);
  return fine;
}

export function MorphBlob({
  scenes,
  activeIndex,
  videos,
  activeVideoIndex = 0,
  size = "min(52vw, 420px)",
  className,
}: {
  scenes: BlobScene[];
  activeIndex: number;
  videos?: BlobVideo[];
  activeVideoIndex?: number;
  size?: string;
  className?: string;
}) {
  const [hovering, setHovering] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const chipX = useSpring(mouseX, { stiffness: reducedMotion ? 1000 : 220, damping: reducedMotion ? 100 : 22 });
  const chipY = useSpring(mouseY, { stiffness: reducedMotion ? 1000 : 220, damping: reducedMotion ? 100 : 22 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left + 14);
    mouseY.set(e.clientY - rect.top + 14);
  }

  const morphDuration = reducedMotion ? 0 : hovering ? 5 : 9;
  const showCursorChip = hovering && finePointer && !reducedMotion;

  return (
    <div
      ref={wrapperRef}
      className={className}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={handleMouseMove}
      style={{
        position: "relative",
        width: size,
        height: size,
        cursor: showCursorChip ? "none" : "default",
      }}
    >
      {/* rotating iridescent rim */}
      <motion.div
        aria-hidden
        animate={reducedMotion ? {} : { borderRadius: BLOB_RADII, scale: hovering ? 1.04 : 1 }}
        transition={{
          borderRadius: { duration: morphDuration, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.3, ease: "easeOut" },
        }}
        style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: BLOB_RADII[0] }}
      >
        <motion.div
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: "-30%" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(circle at 80% 80%, rgba(90,130,255,0.65) 0%, transparent 34%),
                radial-gradient(circle at 15% 85%, rgba(255,170,80,0.6) 0%, transparent 32%),
                radial-gradient(circle at 85% 15%, rgba(200,100,255,0.6) 0%, transparent 30%),
                radial-gradient(circle at 20% 20%, rgba(100,255,220,0.5) 0%, transparent 28%)
              `,
              filter: "blur(18px)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* masked content — same radius keyframes, kept in sync, inset to reveal the rim */}
      <motion.div
        animate={reducedMotion ? {} : { borderRadius: BLOB_RADII, scale: hovering ? 1.04 : 1 }}
        transition={{
          borderRadius: { duration: morphDuration, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.3, ease: "easeOut" },
        }}
        style={{
          position: "absolute",
          inset: "6px",
          overflow: "hidden",
          borderRadius: BLOB_RADII[0],
          background: "#0a0a0a",
          boxShadow: "inset 0 0 40px rgba(255,255,255,0.06), inset 0 -30px 60px rgba(0,0,0,0.6)",
        }}
      >
        {videos && videos.length > 0 && (
          <BlobVideoLayer videos={videos} activeIndex={activeVideoIndex} reducedMotion={reducedMotion} />
        )}

        <AnimatePresence mode="wait">
          {scenes[activeIndex] && (
            <SceneContent key={activeIndex} scene={scenes[activeIndex]} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* cursor-follow "Ask" chip */}
      {showCursorChip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            left: chipX,
            top: chipY,
            zIndex: 30,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            color: "#000000",
            borderRadius: "9999px",
            padding: "6px 14px 6px 10px",
            fontFamily: "var(--font-sui)",
            fontSize: "13px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          Ask
        </motion.div>
      )}
    </div>
  );
}

function BlobVideoLayer({
  videos,
  activeIndex,
  reducedMotion,
}: {
  videos: BlobVideo[];
  activeIndex: number;
  reducedMotion: boolean;
}) {
  const [loaded, setLoaded] = useState<boolean[]>(() => videos.map(() => false));

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0 }}>
      {videos.map((video, i) => (
        <motion.div
          key={`${video.src}-${i}`}
          animate={{ opacity: activeIndex === i ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease: "easeInOut" }}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* placeholder shown until this clip has decoded its first frame */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: loaded[i] ? 0 : 1,
              transition: "opacity 400ms ease",
              background: `
                radial-gradient(circle at 80% 80%, rgba(90,130,255,0.5) 0%, transparent 34%),
                radial-gradient(circle at 15% 85%, rgba(255,170,80,0.45) 0%, transparent 32%),
                radial-gradient(circle at 85% 15%, rgba(200,100,255,0.45) 0%, transparent 30%),
                #0a0a0a
              `,
            }}
          />
          <video
            src={video.src}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            onLoadedData={() =>
              setLoaded((prev) => (prev[i] ? prev : prev.map((v, idx) => (idx === i ? true : v))))
            }
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: loaded[i] ? 1 : 0,
              transition: "opacity 400ms ease",
            }}
          />
        </motion.div>
      ))}
      {/* scrim so the icon/label scene content stays legible over footage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}

function SceneContent({ scene }: { scene: BlobScene }) {
  const Icon = scene.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex h-full w-full flex-col items-center justify-center gap-4"
    >
      <Icon className="h-10 w-10" strokeWidth={1.5} style={{ color: "#ffffff" }} />
      <span
        className="uppercase"
        style={{ color: "#cccccc", fontSize: "14px", fontFamily: "var(--font-sui)", letterSpacing: "-0.01em" }}
      >
        {scene.label}
      </span>
    </motion.div>
  );
}

export function BlobEcho({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div ref={ref} className="relative flex items-center justify-center py-16">
      <motion.div
        aria-hidden
        initial={{ opacity: 0.5, scale: 1.3 }}
        whileInView={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.35 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          width: "260px",
          height: "260px",
          borderRadius: BLOB_RADII[2],
          background: "radial-gradient(circle at 40% 30%, rgba(120,90,255,0.45), transparent 70%)",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}
