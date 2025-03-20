import jwt from "jsonwebtoken";

// Get JWT secret from environment variable
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

// Add function to check JWT status
export function getJwtStatus() {
  return {
    secretSet: !!process.env.JWT_SECRET,
    secretLength: process.env.JWT_SECRET?.length || 0,
    isDefault: process.env.JWT_SECRET === undefined,
    timestamp: new Date().toISOString(),
  };
}

// Generate a token for email verification
export function generateVerificationToken(email: string): string {
  if (!jwtSecret) {
    console.error("[token.ts] JWT_SECRET not set in environment variables");
    throw new Error("JWT_SECRET not set in environment variables");
  }

  try {
    console.log(`[token.ts] Generating verification token for email: ${email}`);

    const token = jwt.sign(
      {
        email,
        purpose: "email-verification",
      },
      jwtSecret,
      {
        expiresIn: "24h",
      }
    );

    console.log(
      `[token.ts] Token generated successfully for ${email} (length: ${token.length})`
    );
    return token;
  } catch (error) {
    console.error(`[token.ts] Error generating token for ${email}:`, error);
    throw error;
  }
}

// Generate a token for password reset
export function generatePasswordResetToken(email: string): string {
  if (!jwtSecret) {
    console.error("[token.ts] JWT_SECRET not set in environment variables");
    throw new Error("JWT_SECRET not set in environment variables");
  }

  try {
    console.log(
      `[token.ts] Generating password reset token for email: ${email}`
    );

    const token = jwt.sign(
      {
        email,
        purpose: "password-reset",
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    console.log(
      `[token.ts] Password reset token generated successfully for ${email}`
    );
    return token;
  } catch (error) {
    console.error(
      `[token.ts] Error generating password reset token for ${email}:`,
      error
    );
    throw error;
  }
}

// Verify a token
export function verifyToken(token: string): any {
  if (!jwtSecret) {
    console.error("[token.ts] JWT_SECRET not set in environment variables");
    throw new Error("JWT_SECRET not set in environment variables");
  }

  try {
    console.log(`[token.ts] Verifying token (length: ${token.length})`);

    const decoded = jwt.verify(token, jwtSecret);

    console.log(
      `[token.ts] Token verified successfully:`,
      typeof decoded === "object"
        ? {
            email: decoded.email,
            purpose: decoded.purpose,
            exp: decoded.exp
              ? new Date(decoded.exp * 1000).toISOString()
              : "unknown",
          }
        : "Invalid token format"
    );

    return decoded;
  } catch (error) {
    console.error(`[token.ts] Token verification failed:`, error);

    // Provide more specific error message
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("[token.ts] JWT Error type:", error.name);

      if (error.name === "TokenExpiredError") {
        const decodedExpired = jwt.decode(token);
        console.error(
          "[token.ts] Token expired. Original payload:",
          decodedExpired
        );
      }
    }

    throw error;
  }
}
