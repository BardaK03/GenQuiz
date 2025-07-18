import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromRequest } from "@/lib/auth";
import {
  saveRagDocument,
  deleteDocumentChunks,
  saveDocumentChunks,
} from "@/lib/db-helpers";
import { DocumentProcessor } from "@/lib/document-processor";

// POST - Upload file and create document
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
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;

    if (!file || !title) {
      return NextResponse.json(
        { success: false, error: "File and title are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/markdown"
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not supported. Please upload PDF, TXT, DOC, DOCX, or MD files." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    let content = "";

    try {
      // Extract text content based on file type
      if (file.type === "text/plain" || file.type === "text/markdown") {
        content = await file.text();
      } else if (file.type === "application/pdf") {
        // For PDF files, we would need a PDF parser library
        // For now, return an error asking for text files
        return NextResponse.json(
          { success: false, error: "PDF processing not yet implemented. Please convert to text format or use the manual text input." },
          { status: 400 }
        );
      } else if (file.type.includes("word") || file.type.includes("document")) {
        // For Word files, we would need a DOC/DOCX parser library
        // For now, return an error asking for text files
        return NextResponse.json(
          { success: false, error: "Word document processing not yet implemented. Please convert to text format or use the manual text input." },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: "Unsupported file type" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error reading file content:", error);
      return NextResponse.json(
        { success: false, error: "Failed to read file content" },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: "File appears to be empty or content could not be extracted" },
        { status: 400 }
      );
    }

    // Save document
    const result = await saveRagDocument(
      title,
      content,
      category || null,
      file.name,
      file.type,
      file.size,
      userId
    );

    if (!result.success || !result.documentId) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to save document" },
        { status: 500 }
      );
    }

    const documentId = result.documentId;
    console.log(`📄 Document uploaded and saved with ID: ${documentId}`);

    // Process document into chunks and generate embeddings
    try {
      console.log(`🔄 Processing uploaded document "${title}" into chunks...`);
      
      // Delete existing chunks if any
      await deleteDocumentChunks(documentId);

      // Generate chunks
      const chunks = DocumentProcessor.chunkDocument(content, {
        title,
        category,
        document_id: documentId,
        fileName: file.name,
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

        // Small delay between batches to prevent overwhelming the API
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ File upload and processing completed: ${processedChunks} chunks saved`);

      return NextResponse.json({
        success: true,
        message: "File uploaded and processed successfully",
        document: { 
          id: documentId, 
          title, 
          fileName: file.name, 
          fileSize: file.size,
          category 
        },
        chunksProcessed: processedChunks,
      });

    } catch (processingError) {
      console.error("❌ Error processing uploaded file:", processingError);
      
      return NextResponse.json({
        success: true,
        message: "File uploaded but processing failed. Embeddings will be generated later.",
        document: { 
          id: documentId, 
          title, 
          fileName: file.name, 
          fileSize: file.size,
          category 
        },
        warning: "Document processing failed",
        error: processingError instanceof Error ? processingError.message : "Unknown processing error",
      });
    }

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}
