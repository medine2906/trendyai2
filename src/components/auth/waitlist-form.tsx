"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div
        className="flex items-center gap-2 uppercase"
        style={{ color: "#ffffff", fontFamily: "var(--font-sui)", fontSize: "15px" }}
      >
        <Check className="h-4 w-4" strokeWidth={2} />
        Teşekkürler, seni bilgilendireceğiz.
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3" style={{ fontFamily: "var(--font-sui)" }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <input
          type="email"
          required
          placeholder="e-posta@ornek.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          style={{
            color: "#ffffff",
            borderBottom: "1px solid #ffffff",
            padding: "7.2px 21.6px",
            fontSize: "17px",
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="flex shrink-0 items-center justify-center gap-2 uppercase transition-colors disabled:opacity-50"
          style={{
            border: "1px solid #ffffff",
            borderRadius: "9999px",
            padding: "0 30px",
            lineHeight: 2.14,
            fontSize: "15px",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: hovering ? "#000000" : "#ffffff",
            background: hovering ? "#ffffff" : "transparent",
          }}
        >
          {status === "loading" ? "Gönderiliyor..." : "Katıl"}
          {status !== "loading" && <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />}
        </button>
      </form>
      {status === "error" && error && (
        <p style={{ color: "#cccccc", fontSize: "14px" }}>{error}</p>
      )}
    </div>
  );
}
