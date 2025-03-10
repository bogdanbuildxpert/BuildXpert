import { NextRequest } from "next/server";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

/**
 * Extract the user from the request cookies
 * @param request The Next.js request object
 * @returns The user object or null if not authenticated
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    // Get the user cookie
    const userCookie = request.cookies.get("user");

    if (!userCookie || !userCookie.value) {
      return null;
    }

    // Parse the user from the cookie
    const user = JSON.parse(decodeURIComponent(userCookie.value)) as User;

    if (!user || !user.id) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error extracting user from request:", error);
    return null;
  }
}
