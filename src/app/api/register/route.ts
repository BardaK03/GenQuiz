import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createUser, getUserByEmail } from "@/lib/db-helpers";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    // Validare input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Toate câmpurile sunt obligatorii" 
        },
        { status: 400 }
      );
    }

    // Validare email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Formatul email-ului nu este valid" 
        },
        { status: 400 }
      );
    }

    // Validare parolă
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Parola trebuie să aibă cel puțin 8 caractere" 
        },
        { status: 400 }
      );
    }

    // Verificare dacă email-ul există deja
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Acest email este deja înregistrat" 
        },
        { status: 400 }
      );
    }

    // Criptare parolă
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crearea utilizatorului
    const newUser = await createUser(
      firstName.trim(),
      lastName.trim(),
      email.toLowerCase().trim(),
      hashedPassword
    );

    // Returnare success (fără parola)
    return NextResponse.json({
      success: true,
      message: "Contul a fost creat cu succes",
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Eroare internă de server" 
      },
      { status: 500 }
    );
  }
}
