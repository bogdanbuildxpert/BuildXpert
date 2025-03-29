/**
 * Utility function for making authenticated API requests
 */

interface FetchOptions extends RequestInit {
  body?: any;
}

/**
 * Makes an authenticated API request with proper credentials and error handling
 * @param url The URL to fetch
 * @param options The fetch options (method, body, headers)
 * @returns Promise with fetch response JSON data
 */
export async function fetchAuthAPI<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  // Prepare headers with proper type
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add Authorization header using session token if available in browser
  if (typeof window !== "undefined") {
    // Try to get auth token from cookie
    const sessionToken = getCookie("next-auth.session-token");
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }

    // Also add CSRF token if available
    const csrfToken = getCookie("next-auth.csrf-token");
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken.split("|")[0];
    }
  }

  // Handle JSON body
  let requestBody = options.body;
  if (requestBody && typeof requestBody === "object") {
    requestBody = JSON.stringify(requestBody);
  }

  try {
    // Make the request with credentials included
    const response = await fetch(url, {
      ...options,
      headers,
      body: requestBody,
      credentials: "include", // Important for sending cookies with request
    });

    // Check for successful response
    if (!response.ok) {
      // Handle 401/403 by redirecting to login
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== "undefined") {
          // Log the error details for debugging
          console.error(`Authentication error for ${url}:`, {
            status: response.status,
            statusText: response.statusText,
          });
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API request failed with status ${response.status}`
      );
    }

    // Parse JSON response
    return (await response.json()) as T;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * Gets a cookie value by name
 */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return undefined;
}
