import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CONFIG } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const { numberOfQuestions, subject } = await request.json();

    // Construct the prompt for the LLM
    const prompt = `Generează un test complet (lucrare de control), cu acest numar de intrebari ${numberOfQuestions}, cu o varianta sau mai multe de raspuns,despre subiectul ${subject} predat in clasa a 11a la liceele din romania. 

IMPORTANT: Return ONLY a valid JSON array. Do not include any explanations, thinking, or additional text.

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Cerințe:
- Fiecare întrebare trebuie să aibă exact 4 opțiuni
- Răspunsul corect trebuie să fie indicele (0-3) al opțiunii corecte
- Întrebările trebuie să fie educative și potrivite pentru elevi
- Să includă o varietate de niveluri de dificultate
- Toate intrebarile trebuie sa fie despre ${subject}
- Return exactly ${numberOfQuestions} questions
-raspunsurile trebuie sa fie in limba romana,folosind un limbaj simplu si clar, potrivit pentru elevii de liceu,si corect din punct de vedere gramatical si ortografic
-intrebarile si raspunsurile trebuie sa fie relevante materiei de liceu predate in romania pentru subiectul ${subject} 

Return only the JSON array, no other text or formatting.`;

    // Call Ollama API
    const ollamaResponse = await fetch(
      `${OLLAMA_CONFIG.baseUrl}${OLLAMA_CONFIG.endpoints.generate}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: OLLAMA_CONFIG.settings.temperature,
          },
        }),
      }
    );

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    const ollamaResult = await ollamaResponse.json();

    // Extract the response text
    let responseText = ollamaResult.response;

    // Try to parse the JSON response
    let questions;
    try {
      // Clean the response - remove various formatting
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/<think>[\s\S]*?<\/think>/g, "") // Remove thinking blocks
        .replace(/<think>[\s\S]*$/g, "") // Remove incomplete thinking blocks
        .replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/g, "$1") // Extract JSON array
        .trim();

      // Try to find JSON array in the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      questions = JSON.parse(responseText);

      // Validate the structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid questions format");
      }

      // Ensure each question has the required fields
      questions = questions.map((q, index) => {
        if (
          !q.question ||
          !q.options ||
          !Array.isArray(q.options) ||
          q.options.length !== 4
        ) {
          return {
            question: `Generated question ${index + 1} about ${subject}`,
            options: [
              `Option A for question ${index + 1}`,
              `Option B for question ${index + 1}`,
              `Option C for question ${index + 1}`,
              `Option D for question ${index + 1}`,
            ],
            correctAnswer: 0,
          };
        }
        return {
          question: q.question,
          options: q.options,
          correctAnswer:
            typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
        };
      });
    } catch (parseError) {
      // If parsing fails, return a fallback response
      console.error("Failed to parse LLM response:", parseError);
      console.error("Raw response:", responseText);
      questions = Array.from({ length: numberOfQuestions }, (_, i) => ({
        question: `Generated question ${i + 1} about ${subject}`,
        options: [
          `Option A for question ${i + 1}`,
          `Option B for question ${i + 1}`,
          `Option C for question ${i + 1}`,
          `Option D for question ${i + 1}`,
        ],
        correctAnswer: 0,
      }));
    }

    return NextResponse.json({
      success: true,
      questions: questions.slice(0, numberOfQuestions), // Ensure we don't exceed requested number
    });
  } catch (error) {
    console.error("Error generating quiz:", error);

    // Return fallback questions if API fails
    const { numberOfQuestions, subject } = await request.json();
    const fallbackQuestions = Array.from(
      { length: numberOfQuestions },
      (_, i) => ({
        question: `Sample question ${i + 1} about ${subject}`,
        options: [
          `Option A for question ${i + 1}`,
          `Option B for question ${i + 1}`,
          `Option C for question ${i + 1}`,
          `Option D for question ${i + 1}`,
        ],
        correctAnswer: 0,
      })
    );

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      questions: fallbackQuestions,
    });
  }
}
