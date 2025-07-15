"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const [selectedQuestions, setSelectedQuestions] = useState<number | null>(
    null
  );
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [questionType, setQuestionType] = useState<string>("");
  const router = useRouter();

  const subjects = [
    "Sistemul Nervos",
    "Analizatorul auditiv",
    "Analizatorul vestibular",
    "Analizatorul cutanat",
    "Excretia",
    "Analizatorul olfactiv",
    "Analizatorul kinestezic",
    "Glandele endocrine",
    "Sistemul osos",
    "Sistemul muscular",
    "Circulația sângelui",
    "Respiratia",
  ];

  const questionTypes = [
    {
      value: "multiple-choice",
      label: "Întrebări cu variante de răspuns (grile)",
    },
    {
      value: "short-answer",
      label: "Întrebări cu răspuns scurt (definiții, concepte)",
    },
  ];

  const handleStartTest = () => {
    if (!selectedQuestions || !selectedSubject || !questionType) {
      alert(
        "Te rugăm să selectezi numărul de întrebări, materia și tipul de întrebări."
      );
      return;
    }

    // Navigate to the quiz page with parameters
    router.push(
      `/quiz?questions=${selectedQuestions}&subject=${encodeURIComponent(
        selectedSubject
      )}&type=${questionType}`
    );
  };

  return (
    <div className="p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col gap-[32px] items-center text-center max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-800">Test de cunoștințe</h1>
        <p className="text-xl text-gray-700">
          Selectează numărul de întrebări și subiectul pentru testul generat de
          AI.
        </p>

        <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            Configurare test
          </h2>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Subiectul:
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="" className="text-gray-800">
                  Selectează subiectul
                </option>
                {subjects.map((subject) => (
                  <option
                    key={subject}
                    value={subject}
                    className="text-gray-800"
                  >
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="question-type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tipul de întrebări:
              </label>
              <select
                id="question-type"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="" className="text-gray-800">
                  Selectează tipul de întrebări
                </option>
                {questionTypes.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                    className="text-gray-800"
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="questions-count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Numărul de întrebări:
              </label>
              <select
                id="questions-count"
                value={selectedQuestions || ""}
                onChange={(e) => setSelectedQuestions(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="" className="text-gray-800">
                  Selectează numărul de întrebări
                </option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="text-gray-800">
                    {num} {num === 1 ? "întrebare" : "întrebări"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            disabled={!selectedQuestions || !selectedSubject}
            className={`w-full mt-6 py-3 px-6 rounded-lg font-medium transition-colors ${
              selectedQuestions && selectedSubject
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Generează testul cu AI
          </button>

          {(!selectedQuestions || !selectedSubject) && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Selectează atât subiectul cât și numărul de întrebări
            </p>
          )}
        </div>

        <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            ✨ Întrebări generate de AI
          </h3>
          <p className="text-sm text-blue-700">
            Acest test va fi generat automat de inteligența artificială folosind
            un model LLM. Întrebările vor fi create în timp real pe baza
            subiectului selectat.
          </p>
        </div>
      </div>
    </div>
  );
}
