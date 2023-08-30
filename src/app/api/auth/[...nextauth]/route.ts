import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUser } from "@/lib/actions"; // Import your loginUser function
import NextAuth from "next-auth/next";

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any) {
        try {
          // Call your loginUser function to authenticate the user
          const user = await loginUser(credentials);

          // Return the user object or null if authentication fails
          if (user) {
            return user;
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
  secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
