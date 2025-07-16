import { NextRequest, NextResponse } from "next/server";
import { getAllLessons, getLessonsBySubject } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    
    const lessons = subject 
      ? await getLessonsBySubject(subject)
      : await getAllLessons();

    return NextResponse.json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
