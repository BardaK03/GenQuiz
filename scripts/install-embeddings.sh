#!/bin/bash

# Script pentru instalarea modelului de embeddings în Ollama
# Rulează acest script pentru a instala modelul local de embeddings

echo "🔧 Instalarea modelului de embeddings pentru RAG..."

# Instalează modelul nomic-embed-text (recomandat pentru embeddings)
echo "📥 Descărcarea modelului nomic-embed-text..."
ollama pull nomic-embed-text

# Alternativ, poți instala alte modele:
# echo "📥 Descărcarea modelului mxbai-embed-large..."
# ollama pull mxbai-embed-large

# echo "📥 Descărcarea modelului snowflake-arctic-embed..."
# ollama pull snowflake-arctic-embed

echo "✅ Modelul de embeddings a fost instalat cu succes!"
echo "🎯 Acum poți folosi RAG-ul fără API key-uri externe!"

# Testează dacă modelul funcționează
echo "🧪 Testarea modelului..."
ollama run nomic-embed-text "Test embedding"

echo "🚀 Gata! Poți acum să folosești sistemul RAG complet local!"
