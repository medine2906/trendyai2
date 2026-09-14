import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainShell } from "@/components/layout/main-shell";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <MainShell user={null}>{children}</MainShell>;
  }

  const userId = session.user.id;

  const [user, participants] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { notificationsCheckedAt: true } }),
    db.conversationParticipant.findMany({
      where: { userId },
      select: {
        lastReadAt: true,
        conversation: {
          select: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, createdAt: true } } },
        },
      },
    }),
  ]);

  const unreadMessagesCount = participants.filter((p) => {
    const lastMessage = p.conversation.messages[0];
    return lastMessage && lastMessage.senderId !== userId && lastMessage.createdAt > p.lastReadAt;
  }).length;

  const notificationsCheckedAt = user?.notificationsCheckedAt ?? new Date(0);
  const [newLikes, newComments, newFollows] = await Promise.all([
    db.like.count({
      where: { post: { authorId: userId }, userId: { not: userId }, createdAt: { gt: notificationsCheckedAt } },
    }),
    db.comment.count({
      where: { post: { authorId: userId }, authorId: { not: userId }, createdAt: { gt: notificationsCheckedAt } },
    }),
    db.follow.count({ where: { followingId: userId, createdAt: { gt: notificationsCheckedAt } } }),
  ]);
  const unreadNotificationsCount = newLikes + newComments + newFollows;

  return (
    <MainShell
      user={{
        name: session.user.name ?? session.user.username,
        username: session.user.username,
        avatarUrl: session.user.image ?? null,
      }}
      unreadMessagesCount={unreadMessagesCount}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </MainShell>
  );
}
