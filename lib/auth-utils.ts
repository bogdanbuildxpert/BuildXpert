import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

/**
 * Extract the user from the request cookies or NextAuth JWT
 * @param request The Next.js request object
 * @returns The user object or null if not authenticated
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    // First try to get the user from the cookie
    const userCookie = request.cookies.get("user");

    if (userCookie && userCookie.value) {
      try {
        // Parse the user from the cookie
        const user = JSON.parse(decodeURIComponent(userCookie.value)) as User;

        if (user && user.id) {
          return user;
        }
      } catch (cookieError) {
        console.error("Error parsing user cookie:", cookieError);
        // Continue to try NextAuth as fallback
      }
    }

    // If cookie auth failed, try NextAuth token
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token && token.sub) {
        // Convert NextAuth token to our User type
        return {
          id: token.sub,
          name: (token.name as string) || null,
          email: token.email as string,
          role: (token.role as string) || "CLIENT",
        };
      }
    } catch (tokenError) {
      console.error("Error extracting NextAuth token:", tokenError);
    }

    return null;
  } catch (error) {
    console.error("Error in authentication process:", error);
    return null;
  }
}
