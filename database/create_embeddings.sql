-- Tabel pentru chunks și embeddings
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_size INTEGER NOT NULL,
  embedding VECTOR(768), -- Pentru Ollama nomic-embed-text (768 dimensions)
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexuri pentru performanță
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Funcție pentru căutare similară
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding VECTOR(768),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id INTEGER,
  document_id INTEGER,
  chunk_text TEXT,
  similarity FLOAT,
  document_title TEXT,
  document_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.document_id,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    rd.title AS document_title,
    rd.category AS document_category
  FROM document_chunks dc
  JOIN rag_documents rd ON dc.document_id = rd.id
  WHERE rd.is_active = true
    AND (1 - (dc.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
