import { NextRequest, NextResponse } from "next/server";
import { getAllQuizzes, getQuizzesBySubject } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");

    const quizzes = subject
      ? await getQuizzesBySubject(subject)
      : await getAllQuizzes();

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
