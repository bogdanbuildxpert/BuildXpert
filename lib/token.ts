import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Add function to check JWT status
export function getJwtStatus() {
  return {
    secretSet: !!process.env.JWT_SECRET,
    secretLength: process.env.JWT_SECRET?.length || 0,
    isDefault: process.env.JWT_SECRET === undefined,
    timestamp: new Date().toISOString(),
  };
}

export const generateVerificationToken = (email: string): string => {
  if (!process.env.JWT_SECRET) {
    console.warn(
      "Warning: Using default JWT_SECRET. This is not secure for production!"
    );
  }

  return jwt.sign(
    {
      email,
      purpose: "email-verification",
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export const generatePasswordResetToken = (email: string): string => {
  if (!process.env.JWT_SECRET) {
    console.warn(
      "Warning: Using default JWT_SECRET. This is not secure for production!"
    );
  }

  return jwt.sign(
    {
      email,
      purpose: "password-reset",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const verifyToken = (
  token: string
): { email: string; purpose: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as jwt.JwtPayload & {
      email: string;
      purpose: "email-verification" | "password-reset";
    };
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};
