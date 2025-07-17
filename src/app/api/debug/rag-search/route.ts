import { NextRequest, NextResponse } from "next/server";
import { DocumentProcessor } from "@/lib/document-processor";
import { verifyAdminFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Verifică dacă utilizatorul este admin
  const decoded = verifyAdminFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query, threshold = 0.6, maxResults = 10 } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log(`🔍 Debug RAG search for: "${query}"`);

    const similarChunks = await DocumentProcessor.searchSimilarChunks(
      query,
      maxResults,
      threshold
    );

    console.log(`📚 Found ${similarChunks.length} chunks`);

    return NextResponse.json({
      success: true,
      query,
      threshold,
      maxResults,
      chunks: similarChunks.map((chunk) => ({
        id: chunk.id,
        document_id: chunk.document_id,
        document_title: chunk.document_title,
        document_category: chunk.document_category,
        similarity: chunk.similarity,
        chunk_text: chunk.chunk_text.substring(0, 200) + "...", // Preview
        full_text: chunk.chunk_text,
      })),
    });
  } catch (error) {
    console.error("RAG debug error:", error);
    return NextResponse.json(
      { error: "Failed to search chunks" },
      { status: 500 }
    );
  }
}
