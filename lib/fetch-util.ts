/**
 * Utility function for making fetch requests with proper CORS and credentials handling
 */

/**
 * Enhanced fetch function that includes proper cross-domain handling
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise with fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Default headers with cache prevention
  const defaultHeaders = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  // Merge headers
  const mergedHeaders = {
    ...defaultHeaders,
    ...options.headers,
  };

  // Always include credentials for cross-domain requests
  const config: RequestInit = {
    ...options,
    credentials: "include", // Critical for cross-domain cookies
    headers: mergedHeaders,
  };

  try {
    const response = await fetch(url, config);

    // Check if the response requires a redirect for authentication
    if (
      response.redirected &&
      (response.url.includes("/login") || response.url.includes("/auth"))
    ) {
      console.warn(
        "Authentication redirect detected, user may not be authenticated"
      );

      // If we're in a browser, we can handle the redirect
      if (typeof window !== "undefined") {
        window.location.href = response.url;
        return Promise.reject(new Error("Authentication redirect"));
      }
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

/**
 * Enhanced JSON fetch function with auth handling
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise with parsed JSON data
 */
export async function fetchJsonWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      // Try to parse as JSON
      const errorJson = JSON.parse(errorText);
      throw new Error(
        errorJson.error || errorJson.message || `API error: ${response.status}`
      );
    } catch (e) {
      // If not JSON, use the text
      throw new Error(
        `API error: ${response.status} - ${errorText || response.statusText}`
      );
    }
  }

  return response.json();
}
