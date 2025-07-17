import { NextRequest, NextResponse } from "next/server";
import { OLLAMA_CONFIG } from "@/lib/ollama";
import { saveLesson } from "@/lib/db-helpers";

export async function POST(request: NextRequest) {
  try {
    const { subject, technologies } = await request.json();

    // Construim partea despre tehnologii dacă există
    const techSection = technologies && technologies.length > 0 
      ? `\n\nIMPORTANT: Pentru activitatea practică, utilizează următoarele tehnologii disponibile în SmartLab: ${technologies.join(", ")}. 
      Creează o activitate practică specifică și detaliată folosind aceste tehnologii, cu pași clari pe care profesorul poate să-i urmeze cu elevii.`
      : "";

    const prompt = `Comporta te ca si un profesor cu experienta de zeci de ani in predarea biologiei,generă-mi in limba romana,cu un limbaj corect gramatical, o schiță detaliată de lecție(50 de minute durata ) pentru subiectul ${subject}${techSection}

IMPORTANT: Returnează doar conținutul schiței de lecție, fără formatare JSON sau alte elemente.

Schița trebuie să includă:


●	Context și audiență: Lecția este destinată elevilor/studenților de nivel liceal cu cunoștințe anterioare minime în domeniu
●	Obiective de învățare: Specifică 3–5 obiective clare și măsurabile la începutul lecției.
●	Structură pe secțiuni:
●	Introducere 
●	Prezentare teoretică (puncte cheie, explicații)
●	Activitate practică (exercițiu, problemă de rezolvat)${technologies && technologies.length > 0 ? " - foloseste tehnologiile mentionate mai sus" : ""}
●	Evaluare formativă (întrebări, discuție)
●	Concluzii + temă/următorii pași (nu folosi analogii)
●	Durată estimată: Include timp recomandat pentru fiecare secțiune.
●	Resurse și materiale:foloseste ce se gaseste de obicei in cadrul unei scoli ,sau acasa(fara linkuri)${technologies && technologies.length > 0 ? " si tehnologiile SmartLab mentionate" : ""}
●	Ton și stil: Clar, concis, orientat spre pedagogie activă. foloseste schitele din memoria ta pentru a vedea cum trebuie sa arate o astfel de schita,schita generata de tine nu trebuie sa fie lunga,si trebuie sa contina doar ce ti am cerut


Cerințe:
- Să respecte programa școlară română pentru clasa a 11-a
- Să includă termeni științifici corecți în română
- Să fie adaptată pentru o lecție de 50 de minute
- Să includă activități interactive și moderne
- Să fie structurată clar și ușor de urmărit pentru profesor
-respecta urmatorul format:
# Titlu lecției: ${subject}
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
    const savedLesson = await saveLesson(subject, responseText);

    return NextResponse.json({
      success: true,
      lesson: responseText,
      subject: subject,
      lessonId: savedLesson.id,
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    // Try to get subject and technologies from request for fallback
    let subject = "Subiect necunoscut";
    let technologies = [];
    try {
      const { subject: requestSubject, technologies: requestTechnologies } = await request.json();
      subject = requestSubject || "Subiect necunoscut";
      technologies = requestTechnologies || [];
    } catch (parseError) {
      console.error("Error parsing request for fallback:", parseError);
    }

    const techSection = technologies && technologies.length > 0 
      ? `\n\n## TEHNOLOGII SMARTLAB DISPONIBILE\n${technologies.join(", ")}\n\n## ACTIVITATE PRACTICĂ CU TEHNOLOGII\n- Utilizează tehnologiile disponibile pentru activități interactive\n- Creează exerciții practice adaptate tehnologiilor selectate`
      : "";

    // Return fallback lesson
    const fallbackLesson = `# SCHIȚĂ DE LECȚIE - ${subject}

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
      const savedLesson = await saveLesson(subject, fallbackLesson);
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lesson: fallbackLesson,
        subject: subject,
        lessonId: savedLesson.id,
      });
    } catch (dbError) {
      console.error("Error saving fallback lesson:", dbError);
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lesson: fallbackLesson,
        subject: subject,
      });
    }
  }
}
