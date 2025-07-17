import { NextRequest, NextResponse } from "next/server";
import {
  getAllQuizzes,
  getQuizzesBySubject,
  updateQuiz,
  deleteQuiz,
  getQuizById,
  getQuizzesByUserId,
  getQuizzesBySubjectAndUserId,
  getQuizByIdAndUserId,
} from "@/lib/db-helpers";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = verifyTokenFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const id = searchParams.get("id");

    // Dacă avem un ID specific, returnăm doar acel quiz
    if (id) {
      const quiz = await getQuizByIdAndUserId(parseInt(id), decoded.userId);
      if (quiz) {
        return NextResponse.json({
          success: true,
          quiz,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Quiz not found",
          },
          { status: 404 }
        );
      }
    }

    // Altfel returnăm toate quiz-urile sau pe subiect
    const quizzes = subject
      ? await getQuizzesBySubjectAndUserId(subject, decoded.userId)
      : await getQuizzesByUserId(decoded.userId);

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

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = verifyTokenFromRequest(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, subject, type, questions } = await request.json();

    if (!id || !subject || !type || !questions) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, subject, type, questions",
        },
        { status: 400 }
      );
    }

    const updatedQuiz = await updateQuiz(
      id,
      subject,
      type,
      questions,
      decoded.userId
    );

    if (!updatedQuiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
    });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing quiz ID" },
        { status: 400 }
      );
    }

    const deleted = await deleteQuiz(parseInt(id), decoded.userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
