import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import {
  saveRagDocument,
  getRagDocumentsByUser,
  getRagDocumentById,
  updateRagDocument,
  deleteRagDocument,
  toggleRagDocumentStatus,
  saveDocumentChunks,
  deleteDocumentChunks,
} from "@/lib/db-helpers";
import { DocumentProcessor } from "@/lib/document-processor";

// GET - Get user's RAG documents
export async function GET(request: NextRequest) {
  const decoded = verifyTokenFromRequest(request);

  if (!decoded) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = decoded.userId;

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (documentId) {
      // Get specific document (only if it belongs to the user)
      const document = await getRagDocumentById(parseInt(documentId));

      if (!document || document.uploaded_by !== userId) {
        return NextResponse.json(
          { success: false, error: "Document not found or access denied" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document,
      });
    } else {
      // Get all user's documents
      const documents = await getRagDocumentsByUser(userId);

      return NextResponse.json({
        success: true,
        documents,
      });
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new RAG document for user
export async function POST(request: NextRequest) {
  const decoded = verifyTokenFromRequest(request);

  if (!decoded) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = decoded.userId;

  try {
    const { title, content, category, fileType } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Save document
    const result = await saveRagDocument(
      title,
      content,
      category || null,
      null, // filename
      fileType || "text",
      content.length,
      userId
    );

    if (!result.success || !result.documentId) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to save document" },
        { status: 500 }
      );
    }

    const documentId = result.documentId;
    console.log(`📄 Document saved with ID: ${documentId}`);

    // Process document into chunks and generate embeddings
    try {
      console.log(`🔄 Processing document "${title}" into chunks...`);
      
      // Delete existing chunks if any
      await deleteDocumentChunks(documentId);

      // Generate chunks
      const chunks = DocumentProcessor.chunkDocument(content, {
        title,
        category,
        document_id: documentId,
      });

      console.log(`📊 Generated ${chunks.length} chunks`);

      // Process chunks in batches to avoid overwhelming the system
      const batchSize = 5;
      let processedChunks = 0;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

        // Generate embeddings for batch
        const chunksWithEmbeddings = await Promise.all(
          batch.map(async (chunk, index) => {
            try {
              const embedding = await DocumentProcessor.generateEmbedding(
                chunk.chunk_text
              );
              console.log(`✅ Generated embedding for chunk ${i + index + 1}`);
              return {
                ...chunk,
                embedding,
                document_id: documentId,
              };
            } catch (embeddingError) {
              console.error(`❌ Error generating embedding for chunk ${i + index + 1}:`, embeddingError);
              return {
                ...chunk,
                embedding: undefined, // Folosim undefined în loc de null pentru compatibilitate cu tipul
                document_id: documentId,
              };
            }
          })
        );

        // Save batch to database
        await saveDocumentChunks(chunksWithEmbeddings);
        processedChunks += batch.length;
        console.log(`💾 Saved batch to database. Total processed: ${processedChunks}/${chunks.length}`);

        // Small delay between batches to prevent overwhelming the API
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Document processing completed: ${processedChunks} chunks saved`);

      return NextResponse.json({
        success: true,
        message: "Document saved and processed successfully",
        document: { id: documentId, title, content, category },
        chunksProcessed: processedChunks,
      });

    } catch (processingError) {
      console.error("❌ Error processing document:", processingError);
      
      return NextResponse.json({
        success: true,
        message: "Document saved but processing failed. Embeddings will be generated later.",
        document: { id: documentId, title, content, category },
        warning: "Document processing failed",
        error: processingError instanceof Error ? processingError.message : "Unknown processing error",
      });
    }

  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
