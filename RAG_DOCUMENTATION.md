# 🚀 Sistem RAG cu Embeddings Locale

Acest ghid te ajută să configurezi sistemul RAG complet local, fără API key-uri externe.

## 📋 Prerequizite

- Ollama instalat și rulând
- PostgreSQL cu extensia pgvector
- Node.js și npm

## 🔧 Pași de configurare

### 1. Instalează modelul de embeddings

**Windows (PowerShell):**

```powershell
.\scripts\install-embeddings.ps1
```

**Linux/Mac:**

```bash
chmod +x scripts/install-embeddings.sh
./scripts/install-embeddings.sh
```

**Manual:**

```bash
ollama pull nomic-embed-text
```

### 2. Configurează baza de date

```sql
-- În pgAdmin, rulează în ordine:
-- 1. database/create_rag_documents.sql
-- 2. database/create_embeddings.sql
-- 3. database/set_admin_user.sql
```

### 3. Configurează variabilele de mediu

```env
# .env.local
RAG_EMBEDDING_PROVIDER=ollama
RAG_EMBEDDING_MODEL=nomic-embed-text
RAG_EMBEDDING_DIMENSIONS=768
```

## 🎯 Modele de embeddings disponibile

### nomic-embed-text (Recomandat)

- **Dimensiuni:** 768
- **Avantaje:** Optimizat pentru text, rapid, calitate bună
- **Instalare:** `ollama pull nomic-embed-text`

### mxbai-embed-large

- **Dimensiuni:** 1024
- **Avantaje:** Calitate foarte bună, model mai mare
- **Instalare:** `ollama pull mxbai-embed-large`

### snowflake-arctic-embed

- **Dimensiuni:** 1024
- **Avantaje:** Performanță excelentă, optimizat pentru căutare
- **Instalare:** `ollama pull snowflake-arctic-embed`

## ⚙️ Configurare pentru model diferit

Dacă vrei să folosești un model diferit, actualizează:

1. **În `src/lib/document-processor.ts`:**

```typescript
const EMBEDDING_CONFIG = {
  provider: "ollama",
  model: "mxbai-embed-large", // schimbă aici
  dimensions: 1024, // ajustează dimensiunile
};
```

2. **În `database/create_embeddings.sql`:**

```sql
embedding VECTOR(1024), -- ajustează dimensiunile
```

3. **În funcția PostgreSQL:**

```sql
query_embedding VECTOR(1024), -- ajustează dimensiunile
```

## 🔀 Fallback la OpenAI

Dacă vrei să folosești OpenAI ca fallback:

```env
RAG_EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
```

## 🧪 Testare

1. Mergi la `/admin`
2. Încarcă un document Markdown
3. Observă în terminal procesarea chunks-urilor
4. Generează o lecție și vezi contextul îmbunătățit

## 📊 Performanță

- **Viteza:** Ollama local ~2-3s per chunk
- **Calitate:** Foarte bună pentru majoritatea cazurilor
- **Scalabilitate:** Fără limite de API
- **Cost:** Complet gratuit

## 🛠️ Troubleshooting

### Eroare "Model not found"

```bash
ollama pull nomic-embed-text
```

### Eroare "Ollama not running"

```bash
ollama serve
```

### Eroare dimensiuni vector

- Verifică că dimensiunile din database match cu modelul
- Recreează tabelul cu dimensiunile corecte

## 🎉 Beneficii

- ✅ **Complet local** - Fără dependențe externe
- ✅ **Gratuit** - Fără costuri de API
- ✅ **Privat** - Datele rămân locale
- ✅ **Rapid** - Procesare în paralel
- ✅ **Scalabil** - Fără limite de rate

Acum ai un sistem RAG complet funcțional fără API key-uri externe! 🚀

- **Vectorizare**: Fiecare chunk este convertit în embeddings folosind OpenAI API
- **Stocare**: Chunk-urile și embeddings-urile sunt salvate în PostgreSQL cu extensia pgvector

### 2. Componente principale

#### DocumentProcessor (`src/lib/document-processor.ts`)

- `chunkDocument()`: Împarte documentul în chunk-uri
- `generateEmbedding()`: Generează embeddings cu OpenAI
- `processDocument()`: Procesează complet un document
- `searchSimilarChunks()`: Caută chunk-uri similare

#### Database Schema

```sql
-- Tabelul principal pentru documente
CREATE TABLE rag_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  ...
);

-- Tabelul pentru chunks și embeddings
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES rag_documents(id),
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embeddings
  ...
);
```

### 3. Fluxul de procesare

1. **Upload document** → Admin Panel
2. **Salvare în rag_documents** → Database
3. **Procesare automată**:
   - Chunking text
   - Generare embeddings (OpenAI API)
   - Salvare chunks în document_chunks
4. **Căutare semantică** → La generarea lecțiilor

### 4. Integrarea cu generarea lecțiilor

În `src/app/api/generate-lesson/route.ts`:

```typescript
// Caută context relevant
const similarChunks = await DocumentProcessor.searchSimilarChunks(
  `${subject} ${technologies.join(" ")}`,
  5, // max chunks
  0.6 // similarity threshold
);

// Adaugă context în prompt
const ragContext = similarChunks
  .map(
    (chunk) => `
Document: ${chunk.document_title}
Conținut: ${chunk.chunk_text}
`
  )
  .join("\n");
```

## Configurarea sistemului

### 1. Pregătirea bazei de date

```sql
-- 1. Instalează extensia pgvector în PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Rulează scripturile de migrare
\i database/create_rag_documents.sql
\i database/create_embeddings.sql
```

### 2. Configurarea OpenAI

```env
# .env.local
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Setarea utilizatorului admin

```sql
-- Setează un utilizator ca admin
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

## Utilizarea sistemului

### 1. Încărcarea documentelor

1. Accesează `/admin` (doar admin)
2. Navighează la "Încărcare Document"
3. Completează:
   - Titlu document
   - Categorie (SmartLab, Biologie, etc.)
   - Conținut (manual sau upload fișier)
4. Documentul va fi procesat automat pentru RAG

### 2. Gestionarea documentelor

- **Editare**: Regenerează automat embeddings-urile
- **Activare/Dezactivare**: Controlează dacă documentul este folosit în RAG
- **Ștergere**: Elimină documentul și toate chunk-urile asociate

### 3. Utilizarea în generarea lecțiilor

Sistemul RAG funcționează automat:

- Caută documente relevante pentru subiectul cerut
- Adaugă context în prompt-ul trimis către LLM
- Îmbunătățește calitatea și specificitatea lecțiilor

## Performanță și optimizări

### 1. Indexuri database

```sql
-- Index pentru căutare rapidă
CREATE INDEX idx_document_chunks_embedding
ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

### 2. Batch processing

- Procesarea embeddings-urilor în batch-uri de 10
- Pauze între request-uri pentru rate limiting
- Gestionarea erorilor pentru resilience

### 3. Căutarea semantică

- Folosește cosine similarity pentru găsirea chunk-urilor relevante
- Threshold configurat: 0.6 pentru relevance
- Limitare la 5 chunks pentru context optimal

## Monitorizarea și debugging

### 1. Loguri

```typescript
console.log(`Processing document ${documentId} for embeddings...`);
console.log(`Found ${similarChunks.length} relevant chunks`);
```

### 2. Verificarea stării

```sql
-- Verifică numărul de chunks per document
SELECT d.title, COUNT(c.id) as chunks_count
FROM rag_documents d
LEFT JOIN document_chunks c ON d.id = c.document_id
GROUP BY d.id, d.title;
```

### 3. Testarea căutării

```sql
-- Testează funcția de căutare
SELECT * FROM search_similar_chunks(
  '[0.1, 0.2, ...]'::vector,
  0.7,
  10
);
```

## Considerații de securitate

- Doar admin-ii pot încărca/edita documente
- Validarea tipurilor de fișiere (.md, .txt, .json)
- Sanitizarea conținutului înainte de procesare
- Rate limiting pentru API-ul OpenAI

## Extinderi viitoare

1. **Suport pentru mai multe formate**: PDF, DOCX
2. **Embeddings locale**: Folosirea modelelor locale în loc de OpenAI
3. **Chunk-uri inteligente**: Împărțirea pe baza structurii documentului
4. **Cache embeddings**: Evitarea regenerării pentru conținut similar
5. **Metrici avansate**: Tracking performanța RAG în lecții

## Troubleshooting

### Probleme comune

1. **Embeddings nu se generează**

   - Verifică OPENAI_API_KEY
   - Verifică conexiunea la internet
   - Verifică rate limits OpenAI

2. **Căutarea semantică nu funcționează**

   - Verifică extensia pgvector
   - Verifică indexurile database
   - Verifică threshold-ul de similarity

3. **Procesarea documentelor eșuează**
   - Verifică dimensiunea documentului
   - Verifică formatul fișierului
   - Verifică logurile pentru erori specifice
