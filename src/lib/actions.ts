"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Tarayıcının bildirdiği Content-Type'a güvenmek yeterli değil (kolayca
// sahtelenebilir) — dosyanın gerçekten o formatta olduğunu ilk birkaç
// byte'ındaki (magic number) imzadan doğruluyoruz.
function matchesImageSignature(mimeType: string, bytes: Buffer) {
  switch (mimeType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    case "image/gif":
      return bytes.toString("ascii", 0, 6) === "GIF87a" || bytes.toString("ascii", 0, 6) === "GIF89a";
    case "image/webp":
      return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    default:
      return false;
  }
}

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Oturum açmanız gerekiyor");
  return session.user.id;
}

export async function toggleFollow(targetUserId: string) {
  const userId = await requireUserId();
  if (userId === targetUserId) return;

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
  } else {
    await db.follow.create({ data: { followerId: userId, followingId: targetUserId } });
  }

  revalidatePath("/");
  revalidatePath("/explore");
}

export async function updateProfile(data: { name: string; bio: string }) {
  const userId = await requireUserId();
  await db.user.update({
    where: { id: userId },
    data: { name: data.name.slice(0, 60), bio: data.bio.slice(0, 150) },
  });
  revalidatePath("/settings/profile");
  revalidatePath("/");
}

export async function startConversation(targetUserId: string) {
  const userId = await requireUserId();
  if (userId === targetUserId) throw new Error("Kendinize mesaj gönderemezsiniz");

  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  });
  if (existing) {
    redirect(`/messages/${existing.id}`);
  }

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
  });

  revalidatePath("/messages");
  redirect(`/messages/${conversation.id}`);
}

export async function sendMessage(conversationId: string, content: string) {
  const userId = await requireUserId();
  if (!content.trim()) return;

  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new Error("Bu sohbete erişiminiz yok");

  await db.message.create({
    data: { conversationId, senderId: userId, content: content.trim() },
  });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

export async function toggleLike(postId: string) {
  const userId = await requireUserId();

  const existing = await db.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
  } else {
    await db.like.create({ data: { userId, postId } });
  }

  revalidatePath("/");
  revalidatePath("/activity");
}

export async function toggleProductLike(productId: string) {
  const userId = await requireUserId();

  const existing = await db.productLike.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await db.productLike.delete({ where: { id: existing.id } });
  } else {
    await db.productLike.create({ data: { userId, productId } });
  }

  revalidatePath("/");
  revalidatePath("/explore");
}

export async function addToCart(productId: string, quantity = 1) {
  const userId = await requireUserId();

  const existing = await db.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await db.cartItem.create({ data: { userId, productId, quantity } });
  }

  revalidatePath("/cart");
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const userId = await requireUserId();
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { id: cartItemId, userId } });
  } else {
    await db.cartItem.updateMany({ where: { id: cartItemId, userId }, data: { quantity } });
  }
  revalidatePath("/cart");
}

export async function removeFromCart(cartItemId: string) {
  const userId = await requireUserId();
  await db.cartItem.deleteMany({ where: { id: cartItemId, userId } });
  revalidatePath("/cart");
}

export async function togglePrivacy(isPrivate: boolean) {
  const userId = await requireUserId();
  await db.user.update({ where: { id: userId }, data: { isPrivate } });
  revalidatePath("/settings/privacy");
}

export async function addComment(postId: string, content: string) {
  const userId = await requireUserId();
  const trimmed = content.trim();
  if (!trimmed) return;

  await db.comment.create({
    data: { postId, authorId: userId, content: trimmed.slice(0, 500) },
  });

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/activity");
}

export async function addProductComment(productId: string, content: string) {
  const userId = await requireUserId();
  const trimmed = content.trim();
  if (!trimmed) return;

  await db.productComment.create({
    data: { productId, authorId: userId, content: trimmed.slice(0, 500) },
  });

  revalidatePath(`/product/${productId}`);
  revalidatePath("/explore");
  revalidatePath("/design-concepts");
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Oturum açmanız gerekiyor");
  const userId = session.user.id;

  const image = formData.get("image");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 2200);

  if (!(image instanceof File) || image.size === 0) {
    throw new Error("Bir görsel seçmelisin");
  }
  const ext = ALLOWED_IMAGE_TYPES[image.type];
  if (!ext) {
    throw new Error("Sadece JPG, PNG, WEBP veya GIF yükleyebilirsin");
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel en fazla 8MB olabilir");
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  if (!matchesImageSignature(image.type, buffer)) {
    throw new Error("Dosya içeriği beyan edilen görsel tipiyle uyuşmuyor");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  await db.post.create({
    data: {
      authorId: userId,
      imageUrl: `/uploads/posts/${filename}`,
      caption: caption || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/profile/${session.user.username}`);
  redirect(`/profile/${session.user.username}`);
}

export async function toggleSave(postId: string) {
  const userId = await requireUserId();

  const existing = await db.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.savedPost.delete({ where: { id: existing.id } });
  } else {
    await db.savedPost.create({ data: { userId, postId } });
  }

  revalidatePath("/");
  revalidatePath("/saved");
}
