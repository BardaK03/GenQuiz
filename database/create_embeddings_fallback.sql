-- Verifică și creează extensia pgvector (dacă este disponibilă)
-- Dacă nu este disponibilă, folosim array-uri pentru embeddings

-- Tabel pentru chunks și embeddings (cu fallback la array)
CREATE TABLE IF NOT EXISTS document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_size INTEGER NOT NULL,
  embedding REAL[], -- Fallback: array de numere reale pentru embeddings
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexuri pentru performanță
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(document_id, chunk_index);

-- Funcție pentru calcul similaritate cosinusoidală între array-uri
CREATE OR REPLACE FUNCTION cosine_similarity(a REAL[], b REAL[])
RETURNS REAL AS $$
DECLARE
  dot_product REAL := 0;
  norm_a REAL := 0;
  norm_b REAL := 0;
  i INTEGER;
BEGIN
  -- Verifică că array-urile au aceeași lungime
  IF array_length(a, 1) != array_length(b, 1) THEN
    RETURN NULL;
  END IF;
  
  -- Calculează produsul scalar și normele
  FOR i IN 1..array_length(a, 1) LOOP
    dot_product := dot_product + (a[i] * b[i]);
    norm_a := norm_a + (a[i] * a[i]);
    norm_b := norm_b + (b[i] * b[i]);
  END LOOP;
  
  -- Evită împărțirea la zero
  IF norm_a = 0 OR norm_b = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
END;
$$ LANGUAGE plpgsql;

-- Funcție pentru căutare similară (cu array-uri)
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
    dc.id,
    dc.document_id,
    dc.chunk_text,
    cosine_similarity(dc.embedding, query_embedding) AS similarity,
    rd.title::TEXT AS document_title,
    rd.category::TEXT AS document_category
  FROM document_chunks dc
  JOIN rag_documents rd ON dc.document_id = rd.id
  WHERE rd.is_active = true
    AND dc.embedding IS NOT NULL
    AND cosine_similarity(dc.embedding, query_embedding) > similarity_threshold
  ORDER BY cosine_similarity(dc.embedding, query_embedding) DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Funcție pentru ștergerea chunk-urilor unui document
CREATE OR REPLACE FUNCTION delete_document_chunks(doc_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM document_chunks WHERE document_id = doc_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
