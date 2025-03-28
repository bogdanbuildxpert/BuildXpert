import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

/**
 * Extract the user from the request using multiple authentication methods
 * @param request The Next.js request object
 * @returns The user object or null if not authenticated
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    let userId: string | null = null;
    let userName: string | null = null;
    let userEmail: string | null = null;
    let userRole: string = "CLIENT";
    let authMethod: string | null = null;

    // Check for user_id in query parameters (most reliable backup)
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get("user_id");
    if (queryUserId) {
      userId = queryUserId;
      authMethod = "query_param";
      console.log("User authenticated via query parameter:", { userId });
    }

    // Check X-User-ID header if no userId yet
    if (!userId) {
      const userIdHeader = request.headers.get("x-user-id");
      if (userIdHeader) {
        userId = userIdHeader;
        authMethod = "header";
        console.log("User authenticated via X-User-ID header:", { userId });
      }
    }

    // Try to get the user from cookies if no userId yet
    if (!userId) {
      // Check auth_token cookie first (our custom JWT)
      const authTokenCookie = request.cookies.get("auth_token");
      if (authTokenCookie?.value) {
        try {
          const decodedToken = JSON.parse(
            Buffer.from(authTokenCookie.value, "base64").toString()
          );

          // Check if token is expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedToken.exp && decodedToken.exp > currentTime) {
            userId = decodedToken.id;
            userEmail = decodedToken.email;
            authMethod = "auth_token";
            console.log("User authenticated via auth_token cookie:", {
              userId,
              userEmail,
            });
          } else {
            console.log("auth_token cookie expired");
          }
        } catch (err) {
          console.error("Failed to parse auth_token cookie:", err);
        }
      }

      // Then try user_id cookie
      if (!userId) {
        const userIdCookie = request.cookies.get("user_id");
        if (userIdCookie?.value) {
          userId = userIdCookie.value;
          authMethod = "user_id_cookie";
          console.log("User authenticated via user_id cookie:", { userId });
        }
      }

      // If still no userId, try the main user cookie
      if (!userId) {
        const userCookie = request.cookies.get("user");
        if (userCookie?.value) {
          try {
            // Parse the user from the cookie
            const user = JSON.parse(
              decodeURIComponent(userCookie.value)
            ) as User;

            if (user && user.id) {
              userId = user.id;
              userName = user.name;
              userEmail = user.email;
              userRole = user.role;
              authMethod = "user_cookie";
              console.log("User authenticated via user cookie:", {
                userId,
                userEmail,
              });
              return user; // Return full user object if found in cookie
            }
          } catch (cookieError) {
            console.error("Error parsing user cookie:", cookieError);
          }
        }
      }
    }

    // If cookie auth failed, try NextAuth token
    if (!userId) {
      try {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });

        if (token && token.sub) {
          // Convert NextAuth token to our User type
          userId = token.sub;
          userName = (token.name as string) || null;
          userEmail = token.email as string;
          userRole = (token.role as string) || "CLIENT";
          authMethod = "nextauth";
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
      } catch (tokenError) {
        console.error("Error extracting NextAuth token:", tokenError);
      }
    }

    // Check authorization header as a last resort
    if (!userId && request.headers.get("authorization")) {
      try {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          try {
            // Basic validation of the token
            if (token && token.length > 20) {
              // Try to decode as base64
              const decoded = Buffer.from(token, "base64").toString();
              const tokenData = JSON.parse(decoded);

              if (tokenData.id) {
                userId = tokenData.id;
                userEmail = tokenData.email;
                authMethod = "authorization_header";
                console.log("User authenticated via Authorization header:", {
                  userId,
                });
              }
            }
          } catch (e) {
            console.error("Invalid Authorization token format:", e);
          }
        }
      } catch (authError) {
        console.error("Error processing Authorization header:", authError);
      }
    }

    // If we have a userId but not a full user object, create a minimal one
    if (userId) {
      return {
        id: userId,
        name: userName,
        email: userEmail || `${userId}@unknown.com`,
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
