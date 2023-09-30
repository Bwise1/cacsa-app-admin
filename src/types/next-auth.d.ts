import { DefaultSession, DefaultUser } from "next-auth";
import NextAuth from "next-auth/next";
declare module "next-auth" {
  interface User {
    id?: number;
    username: string;
    email: string;
    role?: string;
    accessToken?: string;
  }
  interface Session extends DefaultSession {
    user: User;
    expires: string;
    error: string;
  }
}
