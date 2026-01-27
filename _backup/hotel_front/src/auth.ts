import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { post } from "@/lib/axiosController";
import { decodeJwt } from "jose";

export const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password } = credentials;
        const res: any = await post(`/auth/login`, {
          email,
          password,
        });

        if (res && !!res.accessToken) {
          const userDecodedData = decodeJwt(res.accessToken);
          const allData: any = {
            ...userDecodedData,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
          };
          return allData;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token?.id as string;
        session.user.firstName = token?.firstName as string;
        session.user.lastName = token?.lastName as string;
        session.user.hotelId = token?.hotelId as string;
        session.user.accessToken = token?.accessToken as string;
        session.user.refreshToken = token?.refreshToken as string;
      }
      return session;
    },
    authorized: async ({ auth }) => {
      //aquí ira el comprobador session
      return !!!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.hotelId = user.hotelId;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
  },
} as NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
