import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CONFIG } from "@/lib/ollama";
import { saveQuiz } from "@/lib/db-helpers";
import { verifyTokenFromRequest } from "@/lib/auth";
import { getSubjectName, getClassName } from "@/lib/subjects";
import { DocumentProcessor } from "@/lib/document-processor";

export async function POST(request: NextRequest) {
  // Verify authentication first
  const decoded = verifyTokenFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = decoded.userId;

  // Parse request body once at the beginning
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { numberOfQuestions, subject, topic, type, classLevel, subjectName } =
    requestBody;

  // Declarăm variabilele RAG în afara try-catch pentru a fi accesibile peste tot
  let ragContext = "";
  let ragDocuments: any[] = [];

  try {
    try {
      // Construim query pentru RAG
      const ragQuery = topic || subject;
      console.log(
        `🔍 Searching for RAG context for user ${userId} with query: ${ragQuery}`
      );

      // Caută chunks-uri similare doar pentru documentele utilizatorului curent
      const similarChunks = await DocumentProcessor.searchSimilarChunksForUser(
        ragQuery,
        userId, // folosește userId-ul utilizatorului autentificat
        5, // max 5 chunks
        0.6 // similarity threshold
      );

      console.log(
        `📚 Found ${similarChunks.length} similar chunks for user ${userId}`
      );

      if (similarChunks.length > 0) {
        ragContext = `\n\nCONTEXT DOCUMENTAȚIE PERSONALĂ:\n`;
        ragContext += similarChunks
          .map((chunk, index) => {
            console.log(
              `📖 Chunk ${index + 1} from "${
                chunk.document_title
              }" (similarity: ${chunk.similarity.toFixed(3)})`
            );
            return `--- Document: ${chunk.document_title} (${chunk.document_category}) ---\n${chunk.chunk_text}`;
          })
          .join("\n\n");

        ragContext += `\n\nIMPORTANT: Folosește informațiile din documentația ta personală de mai sus pentru a crea întrebări specifice și detaliate.`;

        ragDocuments = similarChunks.map((chunk) => ({
          title: chunk.document_title,
          category: chunk.document_category,
          similarity: chunk.similarity,
        }));

        console.log(
          `✅ RAG context prepared for user ${userId}: ${ragContext.length} characters`
        );
      } else {
        console.log(
          `⚠️ No similar chunks found for user ${userId} with query: ${ragQuery}`
        );
      }
    } catch (ragError) {
      console.error("❌ RAG search error:", ragError);
      ragContext = "";
    }

    // Get human-readable names for class and subject
    const className = classLevel ? getClassName(classLevel) : "clasa a 11-a";
    const fullSubjectName = subjectName
      ? getSubjectName(subjectName)
      : "biologie";
    const topicText = topic || subject || "concepte generale";

    // Construct different prompts based on question type
    let prompt;

    if (type === "short-answer") {
      prompt = `Generează un test complet (lucrare de control) cu întrebări cu răspuns scurt, cu acest număr de întrebări ${numberOfQuestions}, despre subiectul "${topicText}" din ${fullSubjectName} predat în ${className} la liceele din România.${ragContext}

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
- Întrebările trebuie să fie educative și potrivite pentru elevii de ${className}
- Să includă o varietate de niveluri de dificultate
- Toate întrebările trebuie să fie despre ${topicText} din ${fullSubjectName}
- Return exactly ${numberOfQuestions} questions
- Răspunsurile trebuie să fie în limba română, folosind un limbaj simplu și clar
- Întrebările și răspunsurile trebuie să fie relevante materiei de liceu predată în România pentru ${className}${
        ragContext
          ? "\n- Să integreze informațiile din documentația ta personală acolo unde este relevant"
          : ""
      }
- Exemple de întrebări: "Definiți...", "Ce este...", "Explicați pe scurt...", "Enumerați...", "Descrieți..."

Return only the JSON array, no other text or formatting.`;
    } else {
      prompt = `Generează un test complet (lucrare de control), cu acest număr de întrebări ${numberOfQuestions}, cu variante de răspuns, despre subiectul "${topicText}" din ${fullSubjectName} predat în ${className} la liceele din România.${ragContext}

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
- Întrebările trebuie să fie educative și potrivite pentru elevii de ${className}
- Să includă o varietate de niveluri de dificultate
- Toate întrebările trebuie să fie despre ${topicText} din ${fullSubjectName}
- Return exactly ${numberOfQuestions} questions
- Răspunsurile trebuie să fie în limba română, folosind un limbaj simplu și clar, potrivit pentru elevii de ${className}
- Întrebările și răspunsurile trebuie să fie relevante materiei de liceu predată în România pentru ${className}${
        ragContext
          ? "\n- Să integreze informațiile din documentația ta personală acolo unde este relevant"
          : ""
      }
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
              answer: `Răspuns exemplu pentru conceptul ${
                index + 1
              } despre ${subject}`,
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
              question: `Întrebare generată ${index + 1} despre ${topicText}`,
              options: [
                `Opțiunea A pentru întrebarea ${index + 1}`,
                `Opțiunea B pentru întrebarea ${index + 1}`,
                `Opțiunea C pentru întrebarea ${index + 1}`,
                `Opțiunea D pentru întrebarea ${index + 1}`,
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
                correctAnswer =
                  !isNaN(parsed) && parsed >= 0 && parsed <= 3
                    ? parsed
                    : Math.floor(Math.random() * 4);
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

    // Save to database with improved title
    const quizTitle = `${fullSubjectName} - ${topicText} (${className})`;
    const savedQuiz = await saveQuiz(
      quizTitle,
      type,
      questions.slice(0, numberOfQuestions),
      userId
    );

    return NextResponse.json({
      success: true,
      questions: questions.slice(0, numberOfQuestions),
      type: type,
      quizId: savedQuiz.id,
      // Adaug informații RAG
      rag_info: {
        documents_used: ragDocuments.length,
        documents: ragDocuments,
        context_length: ragContext.length,
      },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);

    // Get human-readable names for fallback
    const className = classLevel ? getClassName(classLevel) : "clasa a 11-a";
    const fullSubjectName = subjectName
      ? getSubjectName(subjectName)
      : "biologie";
    const topicText = topic || subject || "concepte generale";

    // Return fallback questions if API fails (without saving to database)
    let fallbackQuestions;
    if (type === "short-answer") {
      fallbackQuestions = Array.from({ length: numberOfQuestions }, (_, i) => ({
        question: `Întrebare de definiție ${i + 1} despre ${topicText}`,
        answer: `Răspuns eșantion ${i + 1} pentru ${topicText}`,
      }));
    } else {
      fallbackQuestions = Array.from({ length: numberOfQuestions }, (_, i) => ({
        question: `Întrebare eșantion ${i + 1} despre ${topicText}`,
        options: [
          `Opțiunea A pentru întrebarea ${i + 1}`,
          `Opțiunea B pentru întrebarea ${i + 1}`,
          `Opțiunea C pentru întrebarea ${i + 1}`,
          `Opțiunea D pentru întrebarea ${i + 1}`,
        ],
        correctAnswer: Math.floor(Math.random() * 4),
      }));
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      questions: fallbackQuestions,
      type: type,
      // Adaug informații RAG chiar și pentru fallback
      rag_info: {
        documents_used: ragDocuments ? ragDocuments.length : 0,
        documents: ragDocuments || [],
        context_length: ragContext ? ragContext.length : 0,
      },
    });
  }
}
