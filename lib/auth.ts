import { NextAuthOptions } from "next-auth";
import prisma from "@/lib/db";
import { compare } from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Extend the built-in types
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // For users created with Google, they might not have a password
          if (!user.password) {
            throw new Error("Please login with Google for this account");
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          // Check if the user's email is verified
          if (!user.emailVerified) {
            console.log(`Login attempt for unverified email: ${user.email}`);
            throw new Error("Please verify your email before logging in");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // When signing in, include user data in token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }

      // Handle session updates
      if (trigger === "update") {
        // If we're updating the session, make sure to refresh the token
        console.log("JWT callback called due to update trigger");
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Ensure user data from token is included in the session
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email || session.user.email;
        session.user.name = token.name || session.user.name;
      }

      // Add a timestamp to help with session revalidation
      session.expires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      return session;
    },
    async signIn({ user, account }) {
      console.log(
        `Sign in attempt for ${user.email || "unknown"} with provider: ${
          account?.provider || "credentials"
        }`
      );

      // If it's a Google login
      if (account?.provider === "google" && user.email) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // If user doesn't exist, create a new one
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              password: "", // Empty password for Google users
              role: "CLIENT", // Default role for Google sign-ins
              emailVerified: new Date(), // Auto-verify Google accounts since they're already verified
            },
          });
        } else if (!existingUser.emailVerified) {
          // For Google logins, we can consider the email automatically verified
          // but we need to update existing unverified accounts
          await prisma.user.update({
            where: { email: user.email },
            data: { emailVerified: new Date() },
          });
        }
      } else if (!account?.provider && user.email) {
        // For credentials login, check if email is verified
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && !existingUser.emailVerified) {
          console.log(`Sign in blocked: Email not verified for ${user.email}`);
          return false; // Prevent login if email is not verified
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 30 * 60, // 30 minutes (more frequent updates for better security)
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Only use secure cookies in production or if site URL uses https
        secure:
          process.env.NODE_ENV === "production" ||
          process.env.NEXTAUTH_URL?.startsWith("https"),
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        // Only use secure cookies in production or if site URL uses https
        secure:
          process.env.NODE_ENV === "production" ||
          process.env.NEXTAUTH_URL?.startsWith("https"),
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Only use secure cookies in production or if site URL uses https
        secure:
          process.env.NODE_ENV === "production" ||
          process.env.NEXTAUTH_URL?.startsWith("https"),
      },
    },
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  // Add this event listener to help debug token issues
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`[NextAuth Event] User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`[NextAuth Event] User signed out`);
    },
    async createUser({ user }) {
      console.log(`[NextAuth Event] New user created: ${user.email}`);
    },
    async updateUser({ user }) {
      console.log(`[NextAuth Event] User updated: ${user.email}`);
    },
    async linkAccount({ user, account, profile }) {
      console.log(
        `[NextAuth Event] Account linked: ${user.email} with ${account.provider}`
      );
    },
  },
};
