import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

async function uniqueUsernameFromEmail(email: string) {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "kullanici";
  let candidate = base;
  let suffix = 0;
  while (await db.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const { allowed } = checkRateLimit(`login:${email.toLowerCase()}`, 10, 15 * 60 * 1000);
        if (!allowed) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      let dbUser = await db.user.findUnique({ where: { email: user.email } });
      if (!dbUser) {
        const username = await uniqueUsernameFromEmail(user.email);
        // Google hesapları şifreyle giriş yapamaz; rastgele, kullanılmayan bir hash tutulur.
        const passwordHash = await bcrypt.hash(randomUUID(), 10);
        dbUser = await db.user.create({
          data: {
            email: user.email,
            name: user.name ?? username,
            username,
            passwordHash,
            avatarUrl: user.image ?? null,
          },
        });
      }

      user.id = dbUser.id;
      (user as { username?: string }).username = dbUser.username;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
