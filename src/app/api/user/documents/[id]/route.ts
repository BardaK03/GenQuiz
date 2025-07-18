import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import {
  getRagDocumentById,
  updateRagDocument,
  deleteRagDocument,
  toggleRagDocumentStatus,
  deleteDocumentChunks,
  saveDocumentChunks,
} from "@/lib/db-helpers";
import { DocumentProcessor } from "@/lib/document-processor";

// PUT - Update user's document
export async function PUT(
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

    const { title, content, category, fileType } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Update document
    const result = await updateRagDocument(
      documentId,
      title,
      content,
      category || null
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update document" },
        { status: 500 }
      );
    }

    // Re-process document into chunks if content changed
    if (content !== existingDocument.content) {
      try {
        console.log(`🔄 Re-processing document "${title}" into chunks...`);
        
        // Delete existing chunks
        await deleteDocumentChunks(documentId);

        // Generate new chunks
        const chunks = DocumentProcessor.chunkDocument(content, {
          title,
          category,
          document_id: documentId,
        });

        console.log(`📊 Generated ${chunks.length} chunks`);

        // Process chunks in batches
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
                  embedding: undefined,
                  document_id: documentId,
                };
              }
            })
          );

          // Save batch to database
          await saveDocumentChunks(chunksWithEmbeddings);
          processedChunks += batch.length;
          console.log(`💾 Saved batch to database. Total processed: ${processedChunks}/${chunks.length}`);

          // Small delay between batches
          if (i + batchSize < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`✅ Document re-processing completed: ${processedChunks} chunks saved`);

        return NextResponse.json({
          success: true,
          message: "Document updated and re-processed successfully",
          chunksProcessed: processedChunks,
        });

      } catch (processingError) {
        console.error("❌ Error re-processing document:", processingError);
        
        return NextResponse.json({
          success: true,
          message: "Document updated but re-processing failed",
          warning: "Document re-processing failed",
          error: processingError instanceof Error ? processingError.message : "Unknown processing error",
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: "Document updated successfully",
      });
    }

  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user's document
export async function DELETE(
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

    // Delete document chunks first
    await deleteDocumentChunks(documentId);

    // Delete document
    const result = await deleteRagDocument(documentId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete document" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
