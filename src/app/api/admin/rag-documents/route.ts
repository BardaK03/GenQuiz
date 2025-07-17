import { NextRequest, NextResponse } from "next/server";
import { verifyAdminFromRequest } from "@/lib/auth";
import {
  saveRagDocument,
  getRagDocuments,
  getRagDocumentById,
  updateRagDocument,
  deleteRagDocument,
  toggleRagDocumentStatus,
  saveDocumentChunks,
  deleteDocumentChunks,
} from "@/lib/db-helpers";
import { DocumentProcessor } from "@/lib/document-processor";

// GET - Get all RAG documents (admin only)
export async function GET(request: NextRequest) {
  const admin = verifyAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (documentId) {
      // Get specific document
      const document = await getRagDocumentById(parseInt(documentId));

      if (!document) {
        return NextResponse.json(
          { success: false, error: "Document not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document,
      });
    } else {
      // Get all documents
      const documents = await getRagDocuments();

      return NextResponse.json({
        success: true,
        documents,
      });
    }
  } catch (error) {
    console.error("Error fetching RAG documents:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new RAG document (admin only)
export async function POST(request: NextRequest) {
  const admin = verifyAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const requestBody = await request.json();
    const { title, content, category, fileName, fileType, fileSize } =
      requestBody;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    const result = await saveRagDocument(
      title,
      content,
      category || null,
      fileName || null,
      fileType || null,
      fileSize || null,
      admin.userId
    );

    if (result.success) {
      // Procesează documentul pentru chunking și embeddings
      try {
        if (result.documentId) {
          console.log(
            `Processing document ${result.documentId} for embeddings...`
          );

          // Procesează documentul în chunks cu embeddings
          const chunks = await DocumentProcessor.processDocument(
            result.documentId,
            content,
            {
              title,
              category,
              fileType,
              fileName,
            }
          );

          // Salvează chunks-urile în baza de date
          await saveDocumentChunks(chunks);

          console.log(
            `Successfully processed ${chunks.length} chunks for document ${result.documentId}`
          );
        }
      } catch (embeddingError) {
        console.error(
          "Error processing document for embeddings:",
          embeddingError
        );
        // Documentul este salvat, dar embedding-ul a eșuat
        // Nu returnăm eroare pentru că documentul principal există
      }

      return NextResponse.json({
        success: true,
        message: "Document saved successfully",
        documentId: result.documentId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving RAG document:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update RAG document (admin only)
export async function PUT(request: NextRequest) {
  const admin = verifyAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const requestBody = await request.json();
    const { id, title, content, category } = requestBody;

    if (!id || !title || !content) {
      return NextResponse.json(
        { success: false, error: "ID, title and content are required" },
        { status: 400 }
      );
    }

    const result = await updateRagDocument(
      parseInt(id),
      title,
      content,
      category || null
    );

    if (result.success) {
      // Regenerează embeddings-urile pentru conținutul actualizat
      try {
        console.log(`Regenerating embeddings for document ${id}...`);

        // Șterge chunks-urile vechi
        await deleteDocumentChunks(parseInt(id));

        // Regenerează chunks-urile și embeddings-urile
        const chunks = await DocumentProcessor.processDocument(
          parseInt(id),
          content,
          {
            title,
            category,
          }
        );

        // Salvează chunks-urile noi
        await saveDocumentChunks(chunks);

        console.log(
          `Successfully regenerated ${chunks.length} chunks for document ${id}`
        );
      } catch (embeddingError) {
        console.error("Error regenerating embeddings:", embeddingError);
        // Continuă chiar dacă regenerarea embeddings-urilor a eșuat
      }

      return NextResponse.json({
        success: true,
        message: "Document updated successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating RAG document:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete RAG document (admin only)
export async function DELETE(request: NextRequest) {
  const admin = verifyAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteRagDocument(parseInt(documentId));

    if (result.success) {
      // Șterge și chunks-urile asociate
      try {
        await deleteDocumentChunks(parseInt(documentId));
        console.log(`Deleted chunks for document ${documentId}`);
      } catch (chunkError) {
        console.error("Error deleting document chunks:", chunkError);
        // Continuă chiar dacă ștergerea chunks-urilor a eșuat
      }

      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting RAG document:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle document status (admin only)
export async function PATCH(request: NextRequest) {
  const admin = verifyAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const requestBody = await request.json();
    const { id, action } = requestBody;

    if (!id || action !== "toggle") {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const result = await toggleRagDocumentStatus(parseInt(id));

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Document status toggled successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error toggling RAG document status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
