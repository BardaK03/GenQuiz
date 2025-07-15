// Configuration for Ollama integration
export const OLLAMA_CONFIG = {
  // Ollama API endpoint
  baseUrl: "http://localhost:11434",

  // Default model to use (change this to your preferred model)
  model: "qwen3:14b", // or 'llama2', 'codellama', 'mistral', etc.

  // API endpoints
  endpoints: {
    generate: "/api/generate",
    chat: "/api/chat",
    models: "/api/tags",
  },

  // Generation settings
  settings: {
    temperature: 0.7,
    max_tokens: 4096,
    stream: false,
  },
};

// Helper function to check if Ollama is available
export async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`);
    return response.ok;
  } catch (error) {
    console.error("Ollama health check failed:", error);
    return false;
  }
}
