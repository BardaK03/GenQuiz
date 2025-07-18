"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  availableClasses,
  availableSubjects,
  getTopicsForSubject,
  getSubjectName,
  getClassName,
} from "@/lib/subjects";

export default function TestPage() {
  const [selectedQuestions, setSelectedQuestions] = useState<number | null>(
    null
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [questionType, setQuestionType] = useState<string>("");
  const router = useRouter();

  // Obține subiectele pentru materia selectată
  const availableTopics = selectedSubject
    ? getTopicsForSubject(selectedSubject)
    : [];

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
    if (
      !selectedQuestions ||
      !selectedClass ||
      !selectedSubject ||
      !selectedTopic ||
      !questionType
    ) {
      alert(
        "Te rugăm să completezi toate câmpurile: clasa, materia, subiectul, numărul de întrebări și tipul de întrebări."
      );
      return;
    }

    // Navigate to the quiz page with parameters
    router.push(
      `/quiz?questions=${selectedQuestions}&class=${encodeURIComponent(
        selectedClass
      )}&subject=${encodeURIComponent(
        selectedSubject
      )}&topic=${encodeURIComponent(selectedTopic)}&type=${encodeURIComponent(
        questionType
      )}`
    );
  };

  return (
    <div className="p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col gap-8 items-center text-center max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-gray-800">Testare Cunoștințe</h1>
        <p className="text-xl text-gray-700">
          Configurează testul pentru a evalua cunoștințele la materia și clasa
          selectate.
        </p>

        <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            Configurare Test
          </h2>

          <div className="space-y-6">
            {/* Selectare clasă */}
            <div>
              <label
                htmlFor="class"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Clasa:
              </label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="" className="text-gray-800">
                  Selectează clasa
                </option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id} className="text-gray-800">
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selectare materie */}
            <div>
              <label
                htmlFor="subject-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Materia:
              </label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic(""); // Reset topic when subject changes
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="" className="text-gray-800">
                  Selectează materia
                </option>
                {availableSubjects.map((subj) => (
                  <option
                    key={subj.id}
                    value={subj.id}
                    className="text-gray-800"
                  >
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selectare subiect/capitol */}
            {selectedSubject && (
              <div>
                <label
                  htmlFor="topic-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subiectul/Capitolul:
                </label>
                <select
                  id="topic-select"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="" className="text-gray-800">
                    Selectează subiectul
                  </option>
                  {availableTopics.map((topic, index) => (
                    <option key={index} value={topic} className="text-gray-800">
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selectare număr întrebări */}
            <div>
              <label
                htmlFor="questions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Numărul de întrebări:
              </label>
              <select
                id="questions"
                value={selectedQuestions || ""}
                onChange={(e) => setSelectedQuestions(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="" className="text-gray-800">
                  Selectează numărul de întrebări
                </option>
                <option value={5}>5 întrebări</option>
                <option value={10}>10 întrebări</option>
                <option value={15}>15 întrebări</option>
                <option value={20}>20 întrebări</option>
              </select>
            </div>

            {/* Selectare tip întrebări */}
            <div>
              <label
                htmlFor="questionType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tipul întrebărilor:
              </label>
              <select
                id="questionType"
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
          </div>

          <button
            onClick={handleStartTest}
            disabled={
              !selectedQuestions ||
              !selectedClass ||
              !selectedSubject ||
              !selectedTopic ||
              !questionType
            }
            className={`w-full mt-6 py-3 px-6 rounded-lg font-medium transition-colors ${
              selectedQuestions &&
              selectedClass &&
              selectedSubject &&
              selectedTopic &&
              questionType
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Începe Testul
          </button>

          <div className="mt-4 flex justify-center">
            <a
              href="/saved-quizzes"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📊 Vezi Testele Salvate
            </a>
          </div>
        </div>

        <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            🧠 Test Personalizat Generat de AI
          </h3>
          <p className="text-sm text-blue-700">
            Testul va fi generat automat de inteligența artificială, adaptat
            pentru clasa și materia selectate din curricula românească.
            Întrebările vor fi formulate pentru a evalua înțelegerea conceptelor
            din subiectul ales.
          </p>
        </div>
      </div>
    </div>
  );
}
