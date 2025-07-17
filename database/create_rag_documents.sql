-- Tabel pentru documentele RAG (Retrieval Augmented Generation)
CREATE TABLE rag_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pentru performanță
CREATE INDEX idx_rag_documents_category ON rag_documents(category);
CREATE INDEX idx_rag_documents_active ON rag_documents(is_active);
CREATE INDEX idx_rag_documents_uploaded_by ON rag_documents(uploaded_by);

-- Adaugă o coloană în tabelul users pentru a marca admin-ul
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Trigger pentru updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rag_documents_updated_at 
    BEFORE UPDATE ON rag_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
