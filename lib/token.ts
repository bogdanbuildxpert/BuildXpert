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

export const verifyToken = (
  token: string
): { email: string; purpose: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      email: string;
      purpose: string;
    };
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
