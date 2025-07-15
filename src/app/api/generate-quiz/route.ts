import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CONFIG } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const { numberOfQuestions, subject, type } = await request.json();

    // Construct different prompts based on question type
    let prompt;
    
    if (type === "short-answer") {
      prompt = `Generează un test complet (lucrare de control) cu întrebări cu răspuns scurt, cu acest număr de întrebări ${numberOfQuestions}, despre subiectul ${subject} predat în clasa a 11-a la liceele din România.

IMPORTANT: Return ONLY a valid JSON array. Do not include any explanations, thinking, or additional text.

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "answer": "Short answer here"
  }
]

Cerințe:
- Întrebările trebuie să fie de tip definiții, concepte, sau răspunsuri scurte
- Răspunsurile trebuie să fie clare și concise (maximum 2-3 propoziții)
- Întrebările trebuie să fie educative și potrivite pentru elevi de liceu
- Să includă o varietate de niveluri de dificultate
- Toate întrebările trebuie să fie despre ${subject}
- Return exactly ${numberOfQuestions} questions
- Răspunsurile trebuie să fie în limba română, folosind un limbaj simplu și clar
- Întrebările și răspunsurile trebuie să fie relevante materiei de liceu predată în România pentru subiectul ${subject}
- Exemple de întrebări: "Definiți...", "Ce este...", "Explicați pe scurt...", "Enumerați...", "Descrieți..."

Return only the JSON array, no other text or formatting.`;
    } else {
      prompt = `Generează un test complet (lucrare de control), cu acest număr de întrebări ${numberOfQuestions}, cu variante de răspuns, despre subiectul ${subject} predat în clasa a 11-a la liceele din România.

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
- Răspunsul corect trebuie să fie indicele numeric (0, 1, 2, sau 3) al opțiunii corecte
- 0 = prima opțiune, 1 = a doua opțiune, 2 = a treia opțiune, 3 = a patra opțiune
- Întrebările trebuie să fie educative și potrivite pentru elevi
- Să includă o varietate de niveluri de dificultate
- Toate întrebările trebuie să fie despre ${subject}
- Return exactly ${numberOfQuestions} questions
- Răspunsurile trebuie să fie în limba română, folosind un limbaj simplu și clar, potrivit pentru elevii de liceu
- Întrebările și răspunsurile trebuie să fie relevante materiei de liceu predată în România pentru subiectul ${subject}
- IMPORTANT: correctAnswer must be a number (0, 1, 2, or 3), not a letter
- Distribuie răspunsurile corecte în mod egal între toate opțiunile (nu toate să fie A)

Return only the JSON array, no other text or formatting.`;
    }

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

      // Ensure each question has the required fields based on type
      questions = questions.map((q, index) => {
        if (type === "short-answer") {
          if (!q.question || !q.answer) {
            return {
              question: `Definiți conceptul ${index + 1} din ${subject}`,
              answer: `Răspuns exemplu pentru conceptul ${index + 1} despre ${subject}`,
            };
          }
          return {
            question: q.question,
            answer: q.answer,
          };
        } else {
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
              correctAnswer: Math.floor(Math.random() * 4),
            };
          }

          // Handle different correctAnswer formats
          let correctAnswer = 0;
          if (typeof q.correctAnswer === "number") {
            correctAnswer = q.correctAnswer;
          } else if (typeof q.correctAnswer === "string") {
            const letter = q.correctAnswer.toUpperCase();
            switch (letter) {
              case "A":
                correctAnswer = 0;
                break;
              case "B":
                correctAnswer = 1;
                break;
              case "C":
                correctAnswer = 2;
                break;
              case "D":
                correctAnswer = 3;
                break;
              default:
                const parsed = parseInt(q.correctAnswer);
                correctAnswer = !isNaN(parsed) && parsed >= 0 && parsed <= 3 ? parsed : Math.floor(Math.random() * 4);
            }
          }

          if (correctAnswer < 0 || correctAnswer > 3) {
            correctAnswer = Math.floor(Math.random() * 4);
          }

          return {
            question: q.question,
            options: q.options,
            correctAnswer: correctAnswer,
          };
        }
      });
    } catch (parseError) {
      // If parsing fails, return fallback questions
      console.error("Failed to parse LLM response:", parseError);
      console.error("Raw response:", responseText);
      
      if (type === "short-answer") {
        questions = Array.from({ length: numberOfQuestions }, (_, i) => ({
          question: `Definiți conceptul ${i + 1} din ${subject}`,
          answer: `Răspuns exemplu pentru conceptul ${i + 1} despre ${subject}`,
        }));
      } else {
        questions = Array.from({ length: numberOfQuestions }, (_, i) => ({
          question: `Generated question ${i + 1} about ${subject}`,
          options: [
            `Option A for question ${i + 1}`,
            `Option B for question ${i + 1}`,
            `Option C for question ${i + 1}`,
            `Option D for question ${i + 1}`,
          ],
          correctAnswer: Math.floor(Math.random() * 4),
        }));
      }
    }

    return NextResponse.json({
      success: true,
      questions: questions.slice(0, numberOfQuestions),
      type: type,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);

    // Return fallback questions if API fails
    try {
      const { numberOfQuestions, subject, type } = await request.json();
      
      let fallbackQuestions;
      if (type === "short-answer") {
        fallbackQuestions = Array.from({ length: numberOfQuestions }, (_, i) => ({
          question: `Sample definition question ${i + 1} about ${subject}`,
          answer: `Sample answer ${i + 1} for ${subject}`,
        }));
      } else {
        fallbackQuestions = Array.from({ length: numberOfQuestions }, (_, i) => ({
          question: `Sample question ${i + 1} about ${subject}`,
          options: [
            `Option A for question ${i + 1}`,
            `Option B for question ${i + 1}`,
            `Option C for question ${i + 1}`,
            `Option D for question ${i + 1}`,
          ],
          correctAnswer: Math.floor(Math.random() * 4),
        }));
      }

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        questions: fallbackQuestions,
        type: type,
      });
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: "Failed to generate fallback questions",
        questions: [],
        type: "multiple-choice",
      });
    }
  }
}
