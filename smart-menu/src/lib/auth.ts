import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { restaurant: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          restaurantSlug: user.restaurant.slug,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { role: string; restaurantId: string; restaurantSlug: string };
        token.role = u.role;
        token.restaurantId = u.restaurantId;
        token.restaurantSlug = u.restaurantSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { restaurantId?: string }).restaurantId = token.restaurantId as string;
        (session.user as { restaurantSlug?: string }).restaurantSlug = token.restaurantSlug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
