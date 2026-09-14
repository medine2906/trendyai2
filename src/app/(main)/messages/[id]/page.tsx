import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MessageComposer } from "@/components/messages/message-composer";
import { GuestGate } from "@/components/layout/guest-gate";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return (
      <GuestGate
        icon={MessageSquare}
        title="Mesajları görmek için giriş yap"
        description="Sohbetlerine erişmek için hesabına giriş yapmalısın."
      />
    );
  }
  const userId = session.user.id;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });

  if (!conversation || !conversation.participants.some((p) => p.userId === userId)) {
    notFound();
  }

  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId } },
    data: { lastReadAt: new Date() },
  });

  const otherUser = conversation.participants.find((p) => p.userId !== userId)?.user;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar src={otherUser?.avatarUrl} alt={otherUser?.username ?? ""} fallback={otherUser?.username ?? "?"} size={36} />
        <span className="font-medium">{otherUser?.username}</span>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-2">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
              message.senderId === userId
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted text-foreground"
            )}
          >
            {message.content}
          </div>
        ))}
      </div>

      <MessageComposer conversationId={conversation.id} />
    </div>
  );
}
