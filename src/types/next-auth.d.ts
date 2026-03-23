import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: number;
    username: string;
    email: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    permissions?: string[];
  }
  interface Session extends DefaultSession {
    user: User;
    expires: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    username?: string;
    email?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    permissions?: string[];
    error?: string;
  }
}
