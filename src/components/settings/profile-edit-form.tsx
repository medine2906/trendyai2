"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { updateProfile } from "@/lib/actions";

export function ProfileEditForm({
  user,
}: {
  user: { name: string; username: string; bio: string; avatarUrl: string | null };
}) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateProfile({ name, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Profili düzenle</h2>

      <div className="mt-4 flex items-center gap-4">
        <Avatar src={user.avatarUrl} alt={user.username} fallback={user.username} size={56} />
        <div>
          <p className="font-medium">{user.username}</p>
          <button type="button" className="text-sm text-primary hover:underline">
            Fotoğrafı Değiştir
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium">Ad Soyad</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">İnternet sitesi</label>
          <Input placeholder="İnternet sitesi" className="mt-1" />
          <p className="mt-1 text-xs text-muted-foreground">
            Bağlantılar sadece mobil cihazlarda düzenlenebilir.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Biyografi</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150} rows={3} className="mt-1" />
          <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length} / 150</p>
        </div>

        <div>
          <label className="text-sm font-medium">Cinsiyet</label>
          <select className="mt-1 flex h-9 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>Söylememeyi tercih ederim</option>
            <option>Kadın</option>
            <option>Erkek</option>
            <option>Diğer</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Bu, herkese açık profilinin parçası olmayacak.</p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">Profillerde hesap önerilerini göster</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              İnsanların senin profiline benzer hesap önerileri görüp göremeyeceğini seç.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={suggestionsEnabled}
            onClick={() => setSuggestionsEnabled((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              suggestionsEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                suggestionsEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {saved && <span className="self-center text-sm text-primary">Kaydedildi</span>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
