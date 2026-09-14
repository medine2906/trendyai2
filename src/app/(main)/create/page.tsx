import { PlusSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { CreatePostForm } from "@/components/post/create-post-form";
import { GuestGate } from "@/components/layout/guest-gate";

export default async function CreatePostPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <GuestGate
        icon={PlusSquare}
        title="Paylaşım yapmak için giriş yap"
        description="Gönderi oluşturmak için hesabına giriş yapmalısın."
      />
    );
  }
  return <CreatePostForm />;
}
