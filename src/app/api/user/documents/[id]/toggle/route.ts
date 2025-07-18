import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import {
  getRagDocumentById,
  toggleRagDocumentStatus,
} from "@/lib/db-helpers";

// PATCH - Toggle document status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const decoded = verifyTokenFromRequest(request);

  if (!decoded) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = decoded.userId;
  const documentId = parseInt(params.id);

  try {
    // Check if document exists and belongs to user
    const existingDocument = await getRagDocumentById(documentId);
    
    if (!existingDocument || existingDocument.uploaded_by !== userId) {
      return NextResponse.json(
        { success: false, error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Toggle document status
    const result = await toggleRagDocumentStatus(documentId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Document status updated successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update document status" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error toggling document status:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
