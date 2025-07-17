import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import { getUserById } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({ 
      user: userWithoutPassword,
      message: "Authenticated successfully" 
    });

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ message: "Authentication failed" }, { status: 500 });
  }
}
