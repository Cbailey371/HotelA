import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: User;
  }
}

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    hotelId: string;
    accessToken: string;
    refreshToken: string;
  }
}
