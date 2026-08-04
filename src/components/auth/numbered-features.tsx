"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { BLOB_RADII, useFinePointer, usePrefersReducedMotion } from "./morph-blob";

const STEPS = [
  { n: "01", title: "Anlat", desc: "Ne aradığını sohbet ederek anlat, TrendAI durumunu dinlesin." },
  { n: "02", title: "Bul", desc: "Amazon ve Trendyol'daki gerçek ürünler arasından sana uygun olanları önersin." },
  { n: "03", title: "Satın Al", desc: "Önerilen ürüne tıkla, doğrudan satıldığı sayfaya git, güvenle satın al." },
  { n: "04", title: "Paylaş", desc: "Aldığını akışında paylaş, takipçilerin görsün ve senden ilham alsın." },
];

const GHOST = "rgba(255,255,255,0.08)";

function NumberRow({ variant }: { variant: "ghost" | "bright" }) {
  return (
    <div className="flex w-full">
      {STEPS.map((s, i) => (
        <div
          key={s.n}
          className="flex-1 px-4"
          style={{ borderLeft: i > 0 ? `1px solid ${variant === "ghost" ? "rgba(255,255,255,0.1)" : "transparent"}` : "none" }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sui)",
              fontWeight: 700,
              fontSize: "clamp(40px, 8vw, 96px)",
              lineHeight: 1,
              color: variant === "ghost" ? GHOST : "#ffffff",
            }}
          >
            {s.n}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NumberedFeatures() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 0.75", "end 0.25"] });
  const scrollBlobX = useTransform(scrollYProgress, [0, 1], ["-10%", "110%"]);

  const pointerFraction = useMotionValue(0.5);
  const pointerFractionSpring = useSpring(pointerFraction, { stiffness: 250, damping: 28 });
  const pointerBlobX = useTransform(pointerFractionSpring, [0, 1], ["-10%", "110%"]);

  const blobX = finePointer ? pointerBlobX : scrollBlobX;
  const maskImage = useMotionTemplate`radial-gradient(circle 16% at ${blobX} 50%, white 0%, white 45%, transparent 78%)`;

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    pointerFraction.set(Math.min(1, Math.max(0, fraction)));
  }

  return (
    <section
      ref={sectionRef}
      id="ozellikler"
      className="px-6 py-24"
      style={{ paddingLeft: "clamp(24px, 8vw, 126px)", paddingRight: "clamp(24px, 8vw, 126px)" }}
    >
      <div
        ref={rowRef}
        onMouseMove={finePointer ? handlePointerMove : undefined}
        className="relative mx-auto max-w-5xl"
        style={{ isolation: "isolate" }}
      >
        {/* dim base row — defines layout */}
        <NumberRow variant="ghost" />

        {/* bright row, only visible where the blob currently sits */}
        {!reducedMotion && (
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              WebkitMaskImage: maskImage,
              maskImage,
            }}
          >
            <NumberRow variant="bright" />
          </motion.div>
        )}

        {/* decorative blob drifting across the row */}
        {!reducedMotion && (
          <motion.div
            aria-hidden
            animate={{ borderRadius: BLOB_RADII }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              zIndex: 2,
              top: "50%",
              left: blobX,
              width: "90px",
              height: "90px",
              x: "-50%",
              y: "-50%",
              pointerEvents: "none",
              background: "radial-gradient(circle at 35% 30%, rgba(200,150,255,0.5), rgba(90,130,255,0.25) 60%, transparent 80%)",
              filter: "blur(10px)",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* titles + descriptions */}
        <div className="mt-10 flex w-full flex-col gap-10 md:flex-row">
          {STEPS.map((s, i) => (
            <StepCopy key={s.n} title={s.title} desc={s.desc} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCopy({ title, desc, delay }: { title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      className="flex-1 px-4"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <h3 className="uppercase" style={{ color: "#ffffff", fontFamily: "var(--font-sui)", fontSize: "16px", fontWeight: 700 }}>
        {title}
      </h3>
      <p className="mt-2" style={{ color: "#cccccc", fontSize: "14px", lineHeight: 1.4 }}>
        {desc}
      </p>
    </motion.div>
  );
}
