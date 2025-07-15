import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CONFIG } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const { subject } = await request.json();

    const prompt = `Generează o schiță detaliată de lecție pentru biologia clasa a 11-a în România, pentru subiectul "${subject}".

IMPORTANT: Returnează doar conținutul schiței de lecție, fără formatare JSON sau alte elemente.

Schița trebuie să includă:

1. **TITLUL LECȚIEI**: ${subject}

2. **OBIECTIVELE LECȚIEI**:
   - Obiective cognitive (ce vor știi elevii)
   - Obiective procedurale (ce vor ști să facă elevii)
   - Obiective atitudinale (ce atitudini vor dezvolta elevii)

3. **RESURSE NECESARE**:
   - Materiale didactice
   - Echipamente de laborator (dacă este cazul)
   - Resurse digitale

4. **STRUCTURA LECȚIEI**:

   **A. MOMENT ORGANIZATORIC** (2-3 minute)
   - Verificarea prezenței
   - Pregătirea materialelor

   **B. MOMENT DE VERIFICARE** (8-10 minute)
   - Verificarea cunoștințelor anterioare
   - Întrebări de legătură cu lecția precedentă

   **C. MOMENT DE ANUNȚARE** (2-3 minute)
   - Anunțarea temei și obiectivelor lecției
   - Motivarea elevilor

   **D. MOMENT DE REALIZARE** (25-30 minute)
   - Prezentarea conținutului nou
   - Concepte cheie și definiții
   - Exemple și aplicații practice
   - Activități interactive

   **E. MOMENT DE FIXARE** (5-7 minute)
   - Recapitularea punctelor esențiale
   - Întrebări de verificare
   - Exerciții rapide

   **F. MOMENT DE EVALUARE** (3-5 minute)
   - Evaluarea cunoștințelor dobândite
   - Feedback pentru elevi

5. **CONȚINUTUL ȘTIINȚIFIC DETALIAT**:
   - Toate conceptele importante
   - Definiții precise
   - Procese biologice explicat pas cu pas
   - Exemple concrete din natură

6. **ACTIVITĂȚI PROPUSE**:
   - Activități pentru different niveluri de dificultate
   - Experimente sau demonstrații practice
   - Exerciții de grup

Cerințe:
- Schița trebuie să fie detaliată și practică
- Să respecte programa școlară română pentru clasa a 11-a
- Să includă termeni științifici corecți în română
- Să fie adaptată pentru o lecție de 50 de minute
- Să includă activități interactive și moderne
- Să fie structurată clar și ușor de urmărit pentru profesor

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

    return NextResponse.json({
      success: true,
      lesson: responseText,
      subject: subject,
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    // Return fallback lesson if API fails
    const fallbackLesson = `# SCHIȚĂ DE LECȚIE - ${request
      .json()
      .then((data) => data.subject)}

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
- Activități de grup

## EVALUARE
- Întrebări orale
- Exerciții scrise
- Evaluare formativă

## TEMĂ PENTRU ACASĂ
- Exerciții de consolidare
- Activități de cercetare

Notă: Această schiță a fost generată automat. Pentru o schiță detaliată, vă rugăm să reîncercați.`;

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      lesson: fallbackLesson,
      subject: "Subiect necunoscut",
    });
  }
}
