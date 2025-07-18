// Tipuri pentru selecția materiei și clasei
export interface SubjectOption {
  id: string;
  name: string;
  topics: string[];
}

export interface ClassLevel {
  id: string;
  name: string;
  level: number;
}

// Clasele disponibile (5-12)
export const availableClasses: ClassLevel[] = [
  { id: "clasa-5", name: "Clasa a 5-a", level: 5 },
  { id: "clasa-6", name: "Clasa a 6-a", level: 6 },
  { id: "clasa-7", name: "Clasa a 7-a", level: 7 },
  { id: "clasa-8", name: "Clasa a 8-a", level: 8 },
  { id: "clasa-9", name: "Clasa a 9-a", level: 9 },
  { id: "clasa-10", name: "Clasa a 10-a", level: 10 },
  { id: "clasa-11", name: "Clasa a 11-a", level: 11 },
  { id: "clasa-12", name: "Clasa a 12-a", level: 12 },
];

// Materiile disponibile
export const availableSubjects: SubjectOption[] = [
  {
    id: "matematica",
    name: "Matematică",
    topics: [
      "Numere naturale",
      "Numere întregi",
      "Numere raționale",
      "Numere reale",
      "Ecuații și inecuații",
      "Funcții matematice",
      "Derivata unei funcții",
      "Integrala unei funcții",
      "Geometrie plană",
      "Geometrie în spațiu",
      "Trigonometrie",
      "Progresii aritmetice și geometrice",
      "Combinatorică",
      "Probabilități",
      "Statistică",
    ],
  },
  {
    id: "biologie",
    name: "Biologie",
    topics: [
      "Celula",
      "Genetica",
      "Evoluția",
      "Excreția",
      "Respirația",
      "Circulația",
      "Digestia",
      "Sistemul nervos",
      "Sistemul endocrin",
      "Reproducerea",
      "Ecosistemele",
      "Biodiversitatea",
    ],
  },
];

// Funcție pentru a obține subiectele unei materii
export function getTopicsForSubject(subjectId: string): string[] {
  const subject = availableSubjects.find((s) => s.id === subjectId);
  return subject ? subject.topics : [];
}

// Funcție pentru a obține numele unei materii
export function getSubjectName(subjectId: string): string {
  const subject = availableSubjects.find((s) => s.id === subjectId);
  return subject ? subject.name : "";
}

// Funcție pentru a obține numele unei clase
export function getClassName(classId: string): string {
  const classLevel = availableClasses.find((c) => c.id === classId);
  return classLevel ? classLevel.name : "";
}
