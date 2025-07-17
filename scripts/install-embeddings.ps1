# Script PowerShell pentru instalarea modelului de embeddings în Ollama
# Rulează acest script pentru a instala modelul local de embeddings

Write-Host "🔧 Instalarea modelului de embeddings pentru RAG..." -ForegroundColor Green

# Instalează modelul nomic-embed-text (recomandat pentru embeddings)
Write-Host "📥 Descărcarea modelului nomic-embed-text..." -ForegroundColor Blue
& ollama pull nomic-embed-text

# Alternativ, poți instala alte modele:
# Write-Host "📥 Descărcarea modelului mxbai-embed-large..." -ForegroundColor Blue
# & ollama pull mxbai-embed-large

# Write-Host "📥 Descărcarea modelului snowflake-arctic-embed..." -ForegroundColor Blue
# & ollama pull snowflake-arctic-embed

Write-Host "✅ Modelul de embeddings a fost instalat cu succes!" -ForegroundColor Green
Write-Host "🎯 Acum poți folosi RAG-ul fără API key-uri externe!" -ForegroundColor Yellow

# Testează dacă modelul funcționează
Write-Host "🧪 Testarea modelului..." -ForegroundColor Blue
& ollama run nomic-embed-text "Test embedding"

Write-Host "🚀 Gata! Poți acum să folosești sistemul RAG complet local!" -ForegroundColor Green
