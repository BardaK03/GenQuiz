import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface AuthUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-here";
    const decoded = jwt.verify(token, jwtSecret) as AuthUser;

    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export function verifyTokenFromRequest(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}
