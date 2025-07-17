-- Recrează funcția cu cast explicit pentru toate tipurile
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding REAL[],
  similarity_threshold REAL DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id INTEGER,
  document_id INTEGER,
  chunk_text TEXT,
  similarity REAL,
  document_title TEXT,
  document_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id::INTEGER,
    dc.document_id::INTEGER,
    dc.chunk_text::TEXT,
    cosine_similarity(dc.embedding, query_embedding)::REAL AS similarity,
    COALESCE(rd.title, '')::TEXT AS document_title,
    COALESCE(rd.category, '')::TEXT AS document_category
  FROM document_chunks dc
  JOIN rag_documents rd ON dc.document_id = rd.id
  WHERE rd.is_active = true
    AND dc.embedding IS NOT NULL
    AND cosine_similarity(dc.embedding, query_embedding) > similarity_threshold
  ORDER BY cosine_similarity(dc.embedding, query_embedding) DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
