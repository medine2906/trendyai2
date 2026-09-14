import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreatePostForm } from "@/components/post/create-post-form";

export default async function CreatePostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <CreatePostForm />;
}
