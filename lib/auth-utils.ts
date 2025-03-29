import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

/**
 * Extract the user from the request using NextAuth authentication
 * @param request The Next.js request object
 * @returns The user object or null if not authenticated
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    // Use only NextAuth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token && token.sub) {
      // Convert NextAuth token to our User type
      const userId = token.sub;
      const userName = (token.name as string) || null;
      const userEmail = token.email as string;
      const userRole = (token.role as string) || "CLIENT";

      console.log("User authenticated via NextAuth token:", {
        userId,
        userEmail,
      });

      return {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole,
      };
    }

    // In development only, provide a fallback user
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "WARNING: Using development fallback user. This should not happen in production!"
      );
      return {
        id: "dev_fallback_user",
        name: "Development User",
        email: "dev@example.com",
        role: "CLIENT",
      };
    }

    return null;
  } catch (error) {
    console.error("Error in authentication process:", error);
    return null;
  }
}
