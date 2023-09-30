import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUser } from "@/lib/actions"; // Import your loginUser function
import NextAuth from "next-auth/next";
import { use } from "react";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }
          // Call your loginUser function to authenticate the user
          const result = await loginUser(credentials);
          const user = result.data.user;
          // Return the user object or null if authentication fails

          if (result.data) {
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              accessToken: result.data.token,
            };
          } else {
            return null;
          }
        } catch (error) {
          // Handle any errors during the authentication process
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
  },
  callbacks: {
    async jwt({ token, user, session }) {
      // console.log("testing token", user);
      // console.log("jwt callback ", { token, user, session });
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, user, token }) {
      // console.log("session callback ", { token, user, session });
      return {
        ...session,
        user: {
          ...session.user,
          username: token.username,
          accessToken: token.accessToken as string,
          role: token.role,
          id: token.id,
        },
        error: token.error,
      };
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
