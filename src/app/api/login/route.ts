import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "@/lib/db-helpers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validare input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email și parola sunt obligatorii",
        },
        { status: 400 }
      );
    }

    // Găsirea utilizatorului în baza de date
    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Email sau parolă incorectă",
        },
        { status: 401 }
      );
    }

    // Verificarea parolei
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Email sau parolă incorectă",
        },
        { status: 401 }
      );
    }

    // Generarea token-ului JWT
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-here";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    // Crearea cookie-ului pentru token
    const response = NextResponse.json({
      success: true,
      message: "Autentificare reușită",
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
    });

    // Setarea cookie-ului
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 ore
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Eroare internă de server",
      },
      { status: 500 }
    );
  }
}
