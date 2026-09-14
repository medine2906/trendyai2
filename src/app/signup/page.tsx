"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/ui/google-icon";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Kayıt sırasında bir hata oluştu.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthLayout>
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <Flame className="h-8 w-8 text-primary" />
          <CardTitle className="text-xl">TrendAI&apos;a katıl</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              name="name"
              autoComplete="name"
              placeholder="Ad Soyad"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              name="username"
              autoComplete="off"
              placeholder="Kullanıcı adı"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              required
            />
            <Input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="E-posta"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="password"
              name="new-password"
              autoComplete="new-password"
              placeholder="Şifre"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            veya
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <GoogleIcon className="h-4 w-4" />
            Google ile devam et
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Giriş yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
