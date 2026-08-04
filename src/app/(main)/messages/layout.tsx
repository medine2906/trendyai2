import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/messages/conversation-list";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const memberships = await db.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const conversations = memberships
    .map((m) => {
      const otherParticipant = m.conversation.participants.find((p) => p.userId !== userId);
      const lastMessage = m.conversation.messages[0];
      return {
        id: m.conversation.id,
        otherUser: {
          username: otherParticipant?.user.username ?? "Bilinmeyen",
          avatarUrl: otherParticipant?.user.avatarUrl ?? null,
        },
        lastMessage: lastMessage?.content ?? "Henüz mesaj yok",
        lastMessageAt: lastMessage?.createdAt ?? m.conversation.createdAt,
        isUnread: Boolean(lastMessage && lastMessage.senderId !== userId && lastMessage.createdAt > m.lastReadAt),
      };
    })
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  return (
    <div className="flex h-full">
      <div className="hidden sm:flex w-72 shrink-0 flex-col border-r border-border">
        <h1 className="p-4 text-lg font-semibold border-b border-border">Mesajlar</h1>
        <div className="flex-1 overflow-auto">
          <ConversationList conversations={conversations} />
        </div>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
