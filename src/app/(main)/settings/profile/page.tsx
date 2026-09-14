import { UserCog } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";
import { GuestGate } from "@/components/layout/guest-gate";

export default async function SettingsProfilePage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <GuestGate
        icon={UserCog}
        title="Ayarları görmek için giriş yap"
        description="Profilini düzenlemek için giriş yapmalısın."
      />
    );
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <ProfileEditForm
      user={{ name: user.name, username: user.username, bio: user.bio ?? "", avatarUrl: user.avatarUrl }}
    />
  );
}
