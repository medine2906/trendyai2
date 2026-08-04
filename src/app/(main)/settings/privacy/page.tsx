import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PrivacyToggle } from "@/components/settings/privacy-toggle";

export default async function SettingsPrivacyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Hesap gizliliği</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Hesabını gizli yaparsan, sadece onayladığın takipçiler gönderilerini görebilir.
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-medium">Gizli hesap</span>
        <PrivacyToggle isPrivate={user.isPrivate} />
      </div>
    </div>
  );
}
