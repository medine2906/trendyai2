import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";

export default async function SettingsProfilePage() {
  const session = await auth();
  const user = await db.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <ProfileEditForm
      user={{ name: user.name, username: user.username, bio: user.bio ?? "", avatarUrl: user.avatarUrl }}
    />
  );
}
