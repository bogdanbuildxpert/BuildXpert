import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateVerificationToken = (email: string): string => {
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
  return jwt.sign(
    {
      email,
      purpose: "password-reset",
    },
    JWT_SECRET,
    { expiresIn: "1h" } // Password reset tokens expire in 1 hour for security
  );
};

export const verifyToken = (
  token: string
): { email: string; purpose: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      email: string;
      purpose: string;
    };
    return decoded;
  } catch {
    throw new Error("Invalid or expired token");
  }
};
