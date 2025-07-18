import pool from "./database";

export interface Quiz {
  id: number;
  subject: string;
  type: "multiple-choice" | "short-answer";
  questions: any[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Lesson {
  id: number;
  subject: string;
  content: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_admin?: boolean;
  created_at: Date;
  updated_at: Date;
}

// User functions
export async function createUser(
  firstName: string,
  lastName: string,
  email: string,
  hashedPassword: string
): Promise<User> {
  const query = `
    INSERT INTO users (first_name, last_name, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [
    firstName,
    lastName,
    email,
    hashedPassword,
  ]);
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const query = "SELECT * FROM users WHERE email = $1";
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const query = "SELECT * FROM users WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// Quiz functions
export async function saveQuiz(
  subject: string,
  type: string,
  questions: any[],
  userId: number
): Promise<Quiz> {
  const query = `
    INSERT INTO quizzes (subject, type, questions, user_id, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const result = await pool.query(query, [
    subject,
    type,
    JSON.stringify(questions),
    userId,
  ]);
  return result.rows[0];
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  const query = "SELECT * FROM quizzes ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function getQuizzesByUserId(userId: number): Promise<Quiz[]> {
  const query =
    "SELECT * FROM quizzes WHERE user_id = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getQuizById(id: number): Promise<Quiz | null> {
  const query = "SELECT * FROM quizzes WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getQuizByIdAndUserId(
  id: number,
  userId: number
): Promise<Quiz | null> {
  const query = "SELECT * FROM quizzes WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function getQuizzesBySubject(subject: string): Promise<Quiz[]> {
  const query =
    "SELECT * FROM quizzes WHERE subject = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject]);
  return result.rows;
}

export async function getQuizzesBySubjectAndUserId(
  subject: string,
  userId: number
): Promise<Quiz[]> {
  const query =
    "SELECT * FROM quizzes WHERE subject = $1 AND user_id = $2 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject, userId]);
  return result.rows;
}

// Lesson functions
export async function saveLesson(
  subject: string,
  content: string,
  userId: number
): Promise<Lesson> {
  const query = `
    INSERT INTO lessons (subject, content, user_id, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const result = await pool.query(query, [subject, content, userId]);
  return result.rows[0];
}

export async function getAllLessons(): Promise<Lesson[]> {
  const query = "SELECT * FROM lessons ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function getLessonsByUserId(userId: number): Promise<Lesson[]> {
  const query =
    "SELECT * FROM lessons WHERE user_id = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getLessonById(id: number): Promise<Lesson | null> {
  const query = "SELECT * FROM lessons WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getLessonByIdAndUserId(
  id: number,
  userId: number
): Promise<Lesson | null> {
  const query = "SELECT * FROM lessons WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function getLessonsBySubject(subject: string): Promise<Lesson[]> {
  const query =
    "SELECT * FROM lessons WHERE subject = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject]);
  return result.rows;
}

export async function getLessonsBySubjectAndUserId(
  subject: string,
  userId: number
): Promise<Lesson[]> {
  const query =
    "SELECT * FROM lessons WHERE subject = $1 AND user_id = $2 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject, userId]);
  return result.rows;
}

// New functions for lesson management
export async function updateLesson(
  id: number,
  subject: string,
  content: string,
  userId: number
): Promise<Lesson | null> {
  const query = `
    UPDATE lessons 
    SET subject = $1, content = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND user_id = $4
    RETURNING *
  `;

  const result = await pool.query(query, [subject, content, id, userId]);
  return result.rows[0] || null;
}

export async function deleteLesson(
  id: number,
  userId: number
): Promise<boolean> {
  const query = "DELETE FROM lessons WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return (result.rowCount || 0) > 0;
}

// Quiz management functions
export async function updateQuiz(
  id: number,
  subject: string,
  type: string,
  questions: any[],
  userId: number
): Promise<Quiz | null> {
  const query = `
    UPDATE quizzes 
    SET subject = $1, type = $2, questions = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND user_id = $5
    RETURNING *
  `;

  const result = await pool.query(query, [
    subject,
    type,
    JSON.stringify(questions),
    id,
    userId,
  ]);
  return result.rows[0] || null;
}

export async function deleteQuiz(id: number, userId: number): Promise<boolean> {
  const query = "DELETE FROM quizzes WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return (result.rowCount || 0) > 0;
}

// RAG Documents interface
export interface RagDocument {
  id: number;
  title: string;
  content: string;
  category: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Save RAG document
export async function saveRagDocument(
  title: string,
  content: string,
  category: string | null,
  fileName: string | null,
  fileType: string | null,
  fileSize: number | null,
  uploadedBy: number
): Promise<{ success: boolean; documentId?: number; error?: string }> {
  try {
    const query = `
      INSERT INTO rag_documents (title, content, category, file_name, file_type, file_size, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await pool.query(query, [
      title,
      content,
      category,
      fileName,
      fileType,
      fileSize,
      uploadedBy,
    ]);

    return {
      success: true,
      documentId: result.rows[0].id,
    };
  } catch (error) {
    console.error("Error saving RAG document:", error);
    return {
      success: false,
      error: "Failed to save document",
    };
  }
}

// Get all RAG documents
export async function getRagDocuments(): Promise<RagDocument[]> {
  try {
    const query = `
      SELECT rd.*, u.first_name, u.last_name 
      FROM rag_documents rd
      JOIN users u ON rd.uploaded_by = u.id
      ORDER BY rd.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error getting RAG documents:", error);
    return [];
  }
}

// Get RAG documents by user
export async function getRagDocumentsByUser(userId: number): Promise<RagDocument[]> {
  try {
    const query = `
      SELECT rd.*, u.first_name, u.last_name,
      (SELECT COUNT(*) FROM document_chunks dc WHERE dc.document_id = rd.id) as chunks_count
      FROM rag_documents rd
      JOIN users u ON rd.uploaded_by = u.id
      WHERE rd.uploaded_by = $1
      ORDER BY rd.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error getting RAG documents by user:", error);
    return [];
  }
}

// Get RAG document by ID
export async function getRagDocumentById(
  id: number
): Promise<RagDocument | null> {
  try {
    const query = `
      SELECT rd.*, u.first_name, u.last_name 
      FROM rag_documents rd
      JOIN users u ON rd.uploaded_by = u.id
      WHERE rd.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting RAG document by ID:", error);
    return null;
  }
}

// Update RAG document
export async function updateRagDocument(
  id: number,
  title: string,
  content: string,
  category: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = `
      UPDATE rag_documents 
      SET title = $1, content = $2, category = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `;

    await pool.query(query, [title, content, category, id]);

    return { success: true };
  } catch (error) {
    console.error("Error updating RAG document:", error);
    return {
      success: false,
      error: "Failed to update document",
    };
  }
}

// Delete RAG document
export async function deleteRagDocument(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = "DELETE FROM rag_documents WHERE id = $1";
    await pool.query(query, [id]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting RAG document:", error);
    return {
      success: false,
      error: "Failed to delete document",
    };
  }
}

// Get RAG documents by category
export async function getRagDocumentsByCategory(
  category: string
): Promise<RagDocument[]> {
  try {
    const query = `
      SELECT * FROM rag_documents 
      WHERE category = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [category]);
    return result.rows;
  } catch (error) {
    console.error("Error getting RAG documents by category:", error);
    return [];
  }
}

// Toggle RAG document status
export async function toggleRagDocumentStatus(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = `
      UPDATE rag_documents 
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await pool.query(query, [id]);

    return { success: true };
  } catch (error) {
    console.error("Error toggling RAG document status:", error);
    return {
      success: false,
      error: "Failed to toggle document status",
    };
  }
}

// Document Chunks interface
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

// Save document chunks with embeddings
export async function saveDocumentChunks(
  chunks: DocumentChunk[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = `
      INSERT INTO document_chunks (document_id, chunk_index, chunk_text, chunk_size, embedding, metadata)
      VALUES ($1, $2, $3, $4, $5::real[], $6)
    `;

    for (const chunk of chunks) {
      await pool.query(query, [
        chunk.document_id,
        chunk.chunk_index,
        chunk.chunk_text,
        chunk.chunk_size,
        chunk.embedding || null,
        chunk.metadata ? JSON.stringify(chunk.metadata) : null,
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving document chunks:", error);
    return {
      success: false,
      error: "Failed to save document chunks",
    };
  }
}

// Get chunks for a document
export async function getDocumentChunks(
  documentId: number
): Promise<DocumentChunk[]> {
  try {
    const query = `
      SELECT * FROM document_chunks 
      WHERE document_id = $1 
      ORDER BY chunk_index
    `;

    const result = await pool.query(query, [documentId]);
    return result.rows;
  } catch (error) {
    console.error("Error getting document chunks:", error);
    return [];
  }
}

// Delete chunks for a document
export async function deleteDocumentChunks(
  documentId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const query = "DELETE FROM document_chunks WHERE document_id = $1";
    await pool.query(query, [documentId]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting document chunks:", error);
    return {
      success: false,
      error: "Failed to delete document chunks",
    };
  }
}

// Search similar chunks
export async function searchSimilarChunks(
  queryEmbedding: number[],
  maxResults: number = 10,
  similarityThreshold: number = 0.7
): Promise<any[]> {
  try {
    const query = `
      SELECT * FROM search_similar_chunks($1::vector, $2, $3)
    `;

    const result = await pool.query(query, [
      JSON.stringify(queryEmbedding),
      similarityThreshold,
      maxResults,
    ]);

    return result.rows;
  } catch (error) {
    console.error("Error searching similar chunks:", error);
    return [];
  }
}
