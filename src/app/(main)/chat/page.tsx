"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Paperclip, Mic, ExternalLink, Search, Wand2, ArrowUp, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatTL } from "@/lib/utils";
import type { SearchResult } from "@/lib/groq";

const STARTER_PROMPTS = [
  {
    icon: Search,
    title: "Ürün ara",
    description: "Ne aradığını tarif et, sana en uygun ürünleri bulayım.",
    prompt: "Yazlık, rahat kesim bir elbise arıyorum",
  },
  {
    icon: Wand2,
    title: "İlham al",
    description: "Bir kombin ya da stil önerisi iste.",
    prompt: "İş görüşmesi için şık bir kombin önerir misin?",
  },
];

interface ChatTurn {
  query: string;
  imagePreview?: string;
  result: SearchResult | null;
  loading: boolean;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface PendingImage {
  previewUrl: string;
  dataUrl: string;
}

function ChatComposer({
  variant,
  onSubmit,
}: {
  variant: "hero" | "bar";
  onSubmit: (query: string, imageDataUrl?: string) => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<PendingImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage({ previewUrl: URL.createObjectURL(file), dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = text.trim();
    if (!query && !image) return;
    onSubmit(query, image?.dataUrl);
    setText("");
    setImage(null);
  }

  const canSubmit = text.trim().length > 0 || image !== null;

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="border border-border bg-card">
        {image && (
          <div className="flex items-center gap-2 border-b border-border p-2">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt="Yüklenen fotoğraf" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-primary text-primary-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Bu fotoğraftaki ürüne benzer şeyler arayacağım</span>
          </div>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={variant === "hero" ? "Ne arıyorsun?" : "Mesajınızı yazın..."}
          className="w-full bg-transparent px-4 pt-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <div className="flex items-center justify-between px-3 py-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground">
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [history, setHistory] = useState<HistoryMessage[]>([]);

  async function runSearch(query: string, imageDataUrl?: string) {
    const label = query || (imageDataUrl ? "Yüklediğim fotoğraftaki gibi ürünler" : "");
    setTurns((prev) => [...prev, { query: label, imagePreview: imageDataUrl, result: null, loading: true }]);
    const historyForRequest = history;
    setHistory((prev) => [...prev, { role: "user", content: imageDataUrl ? `[Fotoğraf] ${label}` : label }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history: historyForRequest, image: imageDataUrl }),
      });
      const data: SearchResult = await res.json();
      setTurns((prev) =>
        prev.map((t, i) => (i === prev.length - 1 ? { ...t, result: data, loading: false } : t))
      );
      const assistantContent = data.clarify
        ? data.clarify.question
        : (data.explanation ?? "");
      setHistory((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch {
      setTurns((prev) =>
        prev.map((t, i) =>
          i === prev.length - 1
            ? { ...t, result: { products: [], explanation: "Bir şeyler ters gitti, tekrar dener misin?" }, loading: false }
            : t
        )
      );
    }
  }

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) queueMicrotask(() => runSearch(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (turns.length === 0) {
    return (
      <div className="flex h-[calc(100vh-0px)] flex-col items-center justify-center gap-8 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            ShopMind
          </span>
          <p className="text-sm text-muted-foreground">
            Ürünlerimiz hakkında her şeyi bana sor, ya da bir fotoğraf yükle
          </p>
        </div>

        <ChatComposer variant="hero" onSubmit={runSearch} />

        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {STARTER_PROMPTS.map(({ icon: Icon, title, description, prompt }) => (
            <button
              key={title}
              type="button"
              onClick={() => runSearch(prompt)}
              className="flex flex-col gap-2 border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <Icon className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
          {turns.map((turn, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="flex flex-col items-end gap-2 self-end">
                {turn.imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={turn.imagePreview}
                    alt="Yüklenen fotoğraf"
                    className="h-24 w-24 border border-border object-cover"
                  />
                )}
                <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {turn.query}
                </div>
              </div>
              {turn.loading ? (
                <p className="text-sm text-muted-foreground">Düşünüyor...</p>
              ) : (
                turn.result &&
                (turn.result.clarify ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-foreground">{turn.result.clarify.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {turn.result.clarify.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={i !== turns.length - 1}
                          onClick={() => runSearch(option)}
                          className="border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-50"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-foreground">{turn.result.explanation}</p>
                    {turn.result.products.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {turn.result.products.map((p) => (
                          <a key={p.id} href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <Card className="overflow-hidden h-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imageUrl} alt={p.name} className="w-full aspect-[3/4] object-cover" />
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">{p.name}</p>
                                <p className="text-xs text-primary">{formatTL(p.price)}</p>
                                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  {p.sourceSite} <ExternalLink className="h-3 w-3" />
                                </p>
                              </div>
                            </Card>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <ChatComposer variant="bar" onSubmit={runSearch} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
