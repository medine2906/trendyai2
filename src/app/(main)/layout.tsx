import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainShell } from "@/components/layout/main-shell";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;

  let unreadMessagesCount = 0;
  let unreadNotificationsCount = 0;

  // Misafirler (girişsiz ziyaretçiler) için kullanıcıya özel sorguları
  // (okunmamış mesaj/bildirim sayıları) hiç çalıştırmıyoruz — bunlar sadece
  // giriş yapmış kullanıcılar için anlamlı.
  if (userId) {
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

    unreadMessagesCount = participants.filter((p) => {
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
    unreadNotificationsCount = newLikes + newComments + newFollows;
  }

  return (
    <MainShell
      user={
        session?.user
          ? {
              name: session.user.name ?? session.user.username,
              username: session.user.username,
              avatarUrl: session.user.image ?? null,
            }
          : null
      }
      unreadMessagesCount={unreadMessagesCount}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </MainShell>
  );
}
