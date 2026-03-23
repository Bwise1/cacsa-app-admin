import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUser } from "@/lib/loginUser";
import { decodeJwtExpMs } from "@/lib/jwtDecode";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials: Record<string, string> | undefined) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }
          const result = await loginUser({
            username: credentials.username,
            password: credentials.password,
          });
          const user = result.data.user;

          if (result.data) {
            const accessToken = result.data.token;
            const refreshToken = result.data.refreshToken;
            const accessTokenExpires =
              decodeJwtExpMs(accessToken) ?? Date.now() + 14 * 60 * 1000;
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              permissions: user.permissions ?? [],
              accessToken,
              refreshToken,
              accessTokenExpires,
            };
          }
          return null;
        } catch (error) {
          console.error("Authentication Error:", error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const u = user as JWT & {
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpires?: number;
        };
        return {
          ...token,
          id: typeof user.id === "number" ? user.id : Number(user.id),
          username: user.username,
          email: user.email,
          role: user.role,
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          accessTokenExpires: u.accessTokenExpires,
          permissions: user.permissions ?? [],
          error: undefined,
        };
      }

      if (token.error === "RefreshAccessTokenError") {
        return token;
      }

      const expires = token.accessTokenExpires as number | undefined;
      if (
        typeof expires === "number" &&
        Date.now() < expires - 60_000
      ) {
        return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      const { refreshAccessToken } = await import("@/lib/refreshAccessToken");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          email: token.email as string,
          username: token.username as string,
          accessToken: token.accessToken as string,
          role: token.role as string,
          id: token.id as number,
          permissions: (token.permissions as string[]) ?? [],
        },
        error: token.error as string | undefined,
      };
    },
  },
};
