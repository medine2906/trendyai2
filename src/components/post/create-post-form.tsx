"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { createPost } from "@/lib/actions";

export function CreatePostForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createPost(formData);
      } catch (err) {
        const digest = (err as { digest?: string })?.digest;
        if (digest?.startsWith("NEXT_REDIRECT")) throw err;
        setError(err instanceof Error ? err.message : "Gönderi paylaşılamadı");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Yeni gönderi oluştur</h1>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Önizleme" className="h-full w-full object-cover" />
        ) : (
          <>
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm">Fotoğraf seçmek için tıkla</span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        required
        className="hidden"
      />

      <div>
        <label className="text-sm font-medium">Açıklama</label>
        <Textarea
          name="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={4}
          placeholder="Bir açıklama yaz..."
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Paylaşılıyor..." : "Paylaş"}
      </Button>
    </form>
  );
}
