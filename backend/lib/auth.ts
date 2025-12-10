import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  const expire = process.env.JWT_EXPIRE || "7d";

  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }

  return jwt.sign({ userId }, secret, { expiresIn: expire });
}

export function verifyToken(token: string): { userId: string } | null {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }

  try {
    return jwt.verify(token, secret) as { userId: string };
  } catch (error) {
    return null;
  }
}
