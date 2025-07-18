import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CONFIG } from "@/lib/ollama";
import { saveLesson } from "@/lib/db-helpers";
import { verifyTokenFromRequest } from "@/lib/auth";
import { DocumentProcessor } from "@/lib/document-processor";
import { getSubjectName, getClassName, availableClasses } from "@/lib/subjects";

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

  const { subject, technologies, classLevel, subjectName, topic } = requestBody;

  try {
    // Obține context RAG relevant pentru subiect
    let ragContext = "";
    let ragDocuments: any[] = [];

    try {
      // Construim query pentru RAG care include atât topic-ul cât și subiectul specific
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

        ragContext += `\n\nIMPORTANT: Folosește informațiile din documentația ta personală de mai sus pentru a crea activități practice specifice și detaliate.`;

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

    // Construim partea despre tehnologii dacă există
    const techSection =
      technologies && technologies.length > 0
        ? `\n\nIMPORTANT: Pentru activitatea practică, utilizează următoarele tehnologii disponibile în SmartLab: ${technologies.join(
            ", "
          )}. 
      Creează o activitate practică specifică și detaliată folosind aceste tehnologii, cu pași clari pe care profesorul poate să-i urmeze cu elevii, doar daca tehnologiile selectate sunt compatibile cu subiectul ales. In cazul in care nu sunt compatibile, creaza materiale fara a folosi tehnologiile alese.`
        : "";

    // Obține numele materiei și clasei
    const subjectDisplayName = getSubjectName(subjectName) || "această materie";
    const classDisplayName = getClassName(classLevel) || "această clasă";
    const classNumber =
      availableClasses.find((c) => c.id === classLevel)?.level || 11;

    const prompt = `Comporta te ca si un profesor cu experienta de zeci de ani in predarea ${subjectDisplayName.toLowerCase()}, generă-mi in limba romana, cu un limbaj corect gramatical, o schiță detaliată de lecție (50 de minute durata) pentru subiectul/capitolul "${topic}" din ${subjectDisplayName.toLowerCase()}${techSection}${ragContext}

IMPORTANT: Returnează doar conținutul schiței de lecție, fără formatare JSON sau alte elemente.

Schița trebuie să includă:


●	Context și audiență: Lecția este destinată elevilor de ${classDisplayName} cu cunoștințe anterioare în ${subjectDisplayName.toLowerCase()}
●	Obiective de învățare: Specifică 3–5 obiective clare și măsurabile la începutul lecției pentru subiectul "${topic}".
●	Structură pe secțiuni:
●	Introducere 
●	Prezentare teoretică (puncte cheie, explicații)
●	Activitate practică (exercițiu, problemă de rezolvat)${
      technologies && technologies.length > 0
        ? " - foloseste tehnologiile mentionate mai sus"
        : ""
    }
●	Evaluare formativă (întrebări, discuție)
●	Concluzii + temă/următorii pași (nu folosi analogii)
●	Durată estimată: Include timp recomandat pentru fiecare secțiune.
●	Resurse și materiale:foloseste ce se gaseste de obicei in cadrul unei scoli ,sau acasa(fara linkuri)${
      technologies && technologies.length > 0
        ? " si tehnologiile SmartLab mentionate"
        : ""
    }${ragContext ? " și documentația ta personală încărcată" : ""}
●	Ton și stil: Clar, concis, orientat spre pedagogie activă. foloseste schitele din memoria ta pentru a vedea cum trebuie sa arate o astfel de schita,schita generata de tine nu trebuie sa fie lunga,si trebuie sa contina doar ce ti am cerut


Cerințe:
- Să respecte programa școlară română pentru ${classDisplayName}
- Să includă termeni științifici corecți în română pentru ${subjectDisplayName.toLowerCase()}
- Să fie adaptată pentru o lecție de 50 de minute
- Să includă activități interactive și moderne
- Să fie structurată clar și ușor de urmărit pentru profesor${
      ragContext
        ? "\n- Să integreze informațiile din documentația ta personală acolo unde este relevant"
        : ""
    }
-respecta urmatorul format:
# Titlu lecției: ${topic}
Obiectivele lecției:
1. Obiectiv 1
2. Obiectiv 2
3. Obiectiv 3
Introducere:
Prezentare teoretică:
Activitate practică:
Evaluare formativă:
Concluzii + temă/următorii pași:
Resurse și materiale folosite:

De asemenea, raspunsul dat NU trebuie sa fie formatat sub niciun fel, trebuie sa fie doar text simplu, fara formatare Bold, Italic, Underline, dimensiune, culoare sau orice alt tip de formatare a textului.

Returnează doar conținutul schiței, formatat frumos cu titluri clare și structură logică.`;

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
            temperature: 0.7,
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

    // Clean the response
    responseText = responseText
      .replace(/<think>[\s\S]*?<\/think>/g, "") // Remove thinking blocks
      .replace(/<think>[\s\S]*$/g, "") // Remove incomplete thinking blocks
      .trim();

    // Save to database
    const savedLesson = await saveLesson(
      topic || subject,
      responseText,
      userId
    );

    return NextResponse.json({
      success: true,
      lesson: responseText,
      subject: topic || subject,
      lessonId: savedLesson.id,
      // Adaug informații RAG
      rag_info: {
        documents_used: ragDocuments.length,
        documents: ragDocuments,
        context_length: ragContext.length,
      },
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    // Use variables from request body for fallback
    const techSection =
      technologies && technologies.length > 0
        ? `\n\n## TEHNOLOGII SMARTLAB DISPONIBILE\n${technologies.join(
            ", "
          )}\n\n## ACTIVITATE PRACTICĂ CU TEHNOLOGII\n- Utilizează tehnologiile disponibile pentru activități interactive\n- Creează exerciții practice adaptate tehnologiilor selectate`
        : "";

    // Return fallback lesson
    const fallbackLesson = `# SCHIȚĂ DE LECȚIE - ${topic || subject}

## OBIECTIVELE LECȚIEI
- Să înțeleagă conceptele de bază
- Să dezvolte gândirea critică
- Să aplice cunoștințele în contexte practice

## STRUCTURA LECȚIEI
1. Moment organizatoric (3 min)
2. Verificarea cunoștințelor (10 min)
3. Prezentarea conținutului nou (30 min)
4. Consolidarea (7 min)

## CONȚINUTUL ȘTIINȚIFIC
[Conținutul va fi generat în funcție de subiectul selectat]

## ACTIVITĂȚI PROPUSE
- Discuții interactive
- Exerciții practice
- Activități de grup${techSection}

## EVALUARE
- Întrebări orale
- Exerciții scrise
- Evaluare formativă

## TEMĂ PENTRU ACASĂ
- Exerciții de consolidare
- Activități de cercetare

Notă: Această schiță a fost generată automat. Pentru o schiță detaliată, vă rugăm să reîncercați.`;

    // Try to save fallback lesson to database
    try {
      const savedLesson = await saveLesson(
        topic || subject,
        fallbackLesson,
        userId
      );

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lesson: fallbackLesson,
        subject: topic || subject,
        lessonId: savedLesson.id,
      });
    } catch (dbError) {
      console.error("Error saving fallback lesson:", dbError);

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lesson: fallbackLesson,
        subject: topic || subject,
      });
    }
  }
}
