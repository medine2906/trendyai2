import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { formatTL } from "@/lib/utils";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const saved = await db.savedPost.findMany({
    where: { userId: session.user.id },
    include: { post: { include: { product: true, author: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Kaydedilenler</h1>
      <p className="mt-1 text-muted-foreground">Daha sonra tekrar göz atmak için kaydettiğin gönderiler.</p>

      {saved.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">Henüz bir şey kaydetmedin.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {saved.map(({ post }) => (
            <Link key={post.id} href={post.product ? `/product/${post.product.id}` : `/profile/${post.author.username}`}>
              <Card className="overflow-hidden h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageUrl} alt={post.product?.name ?? post.author.username} className="w-full aspect-[3/4] object-cover" />
                <div className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.product?.name ?? post.caption ?? post.author.username}</p>
                    {post.product && <p className="text-sm text-primary">{formatTL(post.product.price)}</p>}
                  </div>
                  <Heart className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
