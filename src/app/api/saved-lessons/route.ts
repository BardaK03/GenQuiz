import { NextRequest, NextResponse } from "next/server";
import { getAllLessons, getLessonsBySubject, updateLesson, deleteLesson, getLessonsByUserId, getLessonsBySubjectAndUserId } from "@/lib/db-helpers";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = verifyTokenFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    
    const lessons = subject 
      ? await getLessonsBySubjectAndUserId(subject, decoded.userId)
      : await getLessonsByUserId(decoded.userId);

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

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = verifyTokenFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, subject, content } = await request.json();
    
    if (!id || !subject || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, subject, content" },
        { status: 400 }
      );
    }
    
    const updatedLesson = await updateLesson(id, subject, content, decoded.userId);
    
    if (!updatedLesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = verifyTokenFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing lesson ID" },
        { status: 400 }
      );
    }
    
    const deleted = await deleteLesson(parseInt(id), decoded.userId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
