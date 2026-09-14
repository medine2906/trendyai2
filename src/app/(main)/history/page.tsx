import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GuestGate } from "@/components/layout/guest-gate";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <GuestGate
        icon={MessageSquare}
        title="Geçmişi görmek için giriş yap"
        description="Giriş yapmadan da AI ile arama yapabilirsin, ama geçmiş aramaların ancak hesabına giriş yaptığında kaydedilir."
      />
    );
  }
  const searches = await db.searchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Geçmiş Aramalar</h1>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
        {searches.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">Henüz bir arama yapmadınız.</p>
        )}
        {searches.map((s) => (
          <Link
            key={s.id}
            href={`/chat?q=${encodeURIComponent(s.query)}`}
            className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 truncate text-sm">{s.query}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
