import { OLLAMA_CONFIG } from "./ollama";

// Configurarea pentru embeddings locale
const EMBEDDING_CONFIG = {
  provider: "ollama", // sau 'openai' dacă vrei să folosești OpenAI
  model: "nomic-embed-text", // model Ollama pentru embeddings
  dimensions: 768, // dimensiuni pentru nomic-embed-text
  // Pentru alte modele Ollama de embeddings:
  // 'mxbai-embed-large' - 1024 dimensions
  // 'snowflake-arctic-embed' - 1024 dimensions
};

export interface DocumentChunk {
  id?: number;
  document_id: number;
  chunk_index: number;
  chunk_text: string;
  chunk_size: number;
  embedding?: number[];
  metadata?: any;
  created_at?: Date;
}

export interface SimilarChunk {
  id: number;
  document_id: number;
  chunk_text: string;
  similarity: number;
  document_title: string;
  document_category: string;
}

export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 1000; // caractere per chunk
  private static readonly CHUNK_OVERLAP = 200; // overlap între chunks
  private static readonly MAX_EMBEDDING_REQUESTS = 10; // limite pentru API

  /**
   * Împarte un document în chunks
   */
  static chunkDocument(text: string, metadata: any = {}): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sentences = this.splitIntoSentences(text);

    let currentChunk = "";
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const potentialChunk =
        currentChunk + (currentChunk ? " " : "") + sentence;

      if (potentialChunk.length > this.CHUNK_SIZE && currentChunk) {
        // Salvează chunk-ul curent
        chunks.push({
          document_id: 0, // va fi setat mai târziu
          chunk_index: chunkIndex++,
          chunk_text: currentChunk.trim(),
          chunk_size: currentChunk.length,
          metadata: {
            ...metadata,
            sentence_count: this.countSentences(currentChunk),
          },
        });

        // Începe un nou chunk cu overlap
        const overlapText = this.getOverlapText(
          currentChunk,
          this.CHUNK_OVERLAP
        );
        currentChunk = overlapText + sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Adaugă ultimul chunk dacă nu e gol
    if (currentChunk.trim()) {
      chunks.push({
        document_id: 0,
        chunk_index: chunkIndex,
        chunk_text: currentChunk.trim(),
        chunk_size: currentChunk.length,
        metadata: {
          ...metadata,
          sentence_count: this.countSentences(currentChunk),
        },
      });
    }

    return chunks;
  }

  /**
   * Generează embeddings pentru un chunk folosind Ollama local
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (EMBEDDING_CONFIG.provider === "ollama") {
        return await this.generateOllamaEmbedding(text);
      } else {
        // Fallback la OpenAI dacă este configurat
        return await this.generateOpenAIEmbedding(text);
      }
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  /**
   * Generează embeddings folosind Ollama local
   */
  private static async generateOllamaEmbedding(
    text: string
  ): Promise<number[]> {
    try {
      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_CONFIG.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error("Error generating Ollama embedding:", error);
      throw new Error("Failed to generate Ollama embedding");
    }
  }

  /**
   * Generează embeddings folosind OpenAI (fallback)
   */
  private static async generateOpenAIEmbedding(
    text: string
  ): Promise<number[]> {
    try {
      // Verifică dacă OpenAI este configurat
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }

      const { OpenAI } = await import("openai");
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating OpenAI embedding:", error);
      throw new Error("Failed to generate OpenAI embedding");
    }
  }

  /**
   * Procesează un document complet: chunking + embeddings
   */
  static async processDocument(
    documentId: number,
    text: string,
    metadata: any = {}
  ): Promise<DocumentChunk[]> {
    try {
      // 1. Chunk-uire document
      const chunks = this.chunkDocument(text, metadata);

      // 2. Setează document_id pentru toate chunk-urile
      chunks.forEach((chunk) => {
        chunk.document_id = documentId;
      });

      // 3. Generează embeddings pentru fiecare chunk (cu batch processing)
      const processedChunks: DocumentChunk[] = [];

      for (let i = 0; i < chunks.length; i += this.MAX_EMBEDDING_REQUESTS) {
        const batch = chunks.slice(i, i + this.MAX_EMBEDDING_REQUESTS);

        const embeddingPromises = batch.map(async (chunk) => {
          try {
            const embedding = await this.generateEmbedding(chunk.chunk_text);
            return {
              ...chunk,
              embedding,
            };
          } catch (error) {
            console.error(
              `Error processing chunk ${chunk.chunk_index}:`,
              error
            );
            // Returnează chunk-ul fără embedding în caz de eroare
            return chunk;
          }
        });

        const batchResults = await Promise.all(embeddingPromises);
        processedChunks.push(...batchResults);

        // Pauză între batches pentru a respecta rate limits
        if (i + this.MAX_EMBEDDING_REQUESTS < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return processedChunks;
    } catch (error) {
      console.error("Error processing document:", error);
      throw new Error("Failed to process document");
    }
  }

  /**
   * Caută chunks similare cu un query
   */
  static async searchSimilarChunks(
    queryText: string,
    maxResults: number = 10,
    similarityThreshold: number = 0.7
  ): Promise<SimilarChunk[]> {
    try {
      // Generează embedding pentru query
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Importă pool pentru database
      const pool = (await import("./database")).default;

      // Caută chunks similare
      const query = `
        SELECT * FROM search_similar_chunks($1::real[], $2, $3)
      `;

      const result = await pool.query(query, [
        queryEmbedding,
        similarityThreshold,
        maxResults,
      ]);

      return result.rows;
    } catch (error) {
      console.error("Error searching similar chunks:", error);
      throw new Error("Failed to search similar chunks");
    }
  }

  // Metode utilitare private
  private static splitIntoSentences(text: string): string[] {
    // Împarte textul în propoziții folosind regex
    return text
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.trim().length > 0);
  }

  private static countSentences(text: string): number {
    return this.splitIntoSentences(text).length;
  }

  private static getOverlapText(text: string, overlapLength: number): string {
    if (text.length <= overlapLength) return text;

    const lastPart = text.slice(-overlapLength);
    // Încearcă să păstreze propoziții întregi în overlap
    const sentenceMatch = lastPart.match(/[.!?]\s+(.+)$/);

    return sentenceMatch ? sentenceMatch[1] : lastPart;
  }
}

// Funcție pentru cleanup embeddings vechi
export async function cleanupDocumentEmbeddings(
  documentId: number
): Promise<void> {
  try {
    const pool = (await import("./database")).default;
    await pool.query("DELETE FROM document_chunks WHERE document_id = $1", [
      documentId,
    ]);
  } catch (error) {
    console.error("Error cleaning up embeddings:", error);
    throw new Error("Failed to cleanup embeddings");
  }
}
