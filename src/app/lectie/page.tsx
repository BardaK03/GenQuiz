"use client";

import { useState } from "react";
import {
  availableClasses,
  availableSubjects,
  getTopicsForSubject,
  getSubjectName,
  getClassName,
} from "@/lib/subjects";

export default function LectiePage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [lesson, setLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragInfo, setRagInfo] = useState<any>(null);

  // Obține subiectele pentru materia selectată
  const availableTopics = selectedSubject
    ? getTopicsForSubject(selectedSubject)
    : [];

  const generateLesson = async () => {
    if (!selectedClass) {
      setError("Te rog selectează clasa");
      return;
    }

    if (!selectedSubject) {
      setError("Te rog selectează materia");
      return;
    }

    if (!selectedTopic) {
      setError("Te rog selectează subiectul/capitolul");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLesson(null);
      setRagInfo(null);

      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: selectedTopic, // Folosim topic-ul selectat ca subiect
          classLevel: selectedClass,
          subjectName: selectedSubject,
          topic: selectedTopic,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLesson(data.lesson);
        if (data.rag_info) {
          setRagInfo(data.rag_info);
        }
      } else {
        setError(data.error || "Eroare la generarea lecției");
      }
    } catch (error) {
      setError("Nu s-a putut conecta la serviciul de generare lecții");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveLesson = async () => {
    if (!lesson) return;
    try {
      const response = await fetch("/api/saved-lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: `${getSubjectName(selectedSubject)} - ${selectedTopic}`,
          content: lesson,
        }),
      });

      if (response.ok) {
        alert("Lecția a fost salvată cu succes!");
      } else {
        alert("Eroare la salvarea lecției");
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert("Eroare la salvarea lecției");
    }
  };

  const formatLesson = (lessonText: string) => {
    // Split by lines and format headers and content
    const lines = lessonText.split("\n");
    const formattedLines = lines.map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h1
            key={index}
            className="text-3xl font-bold text-gray-800 mb-4 mt-6"
          >
            {line.replace("# ", "")}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="text-2xl font-semibold text-gray-800 mb-3 mt-5"
          >
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        return (
          <h3
            key={index}
            className="text-xl font-medium text-gray-800 mb-2 mt-4"
          >
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={index} className="font-semibold text-gray-800 mb-2">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      } else if (line.startsWith("- ")) {
        return (
          <li key={index} className="text-gray-700 mb-1 ml-4">
            {line.replace("- ", "")}
          </li>
        );
      } else if (line.trim() === "") {
        return <br key={index} />;
      } else {
        return (
          <p key={index} className="text-gray-700 mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });
    return formattedLines;
  };

  return (
    <div className="p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col gap-[32px] items-center text-center max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-gray-800">
          Generare Schiță de Lecție
        </h1>
        <p className="text-xl text-gray-700">
          Selectează clasa, materia și subiectul pentru a genera o schiță
          detaliată de lecție personalizată.
        </p>

        <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            Configurare Lecție
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
          </div>

          <button
            onClick={generateLesson}
            disabled={
              !selectedClass || !selectedSubject || !selectedTopic || loading
            }
            className={`w-full mt-6 py-3 px-6 rounded-lg font-medium transition-colors ${
              selectedClass && selectedSubject && selectedTopic && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Generez lecția..." : "Generează Lecția cu AI"}
          </button>

          <div className="mt-4 flex justify-center">
            <a
              href="/saved-lessons"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📚 Vezi Lecțiile Salvate
            </a>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {lesson && (
          <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-800">
                Lecția Generată
              </h3>
              <button
                onClick={saveLesson}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                💾 Salvează Lecția
              </button>
            </div>
            <div className="prose prose-lg max-w-none">
              {formatLesson(lesson)}
            </div>

            {ragInfo && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-medium text-blue-800 mb-2">
                  📊 Informații despre generare
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>
                    <strong>Documentele utilizate:</strong>{" "}
                    {ragInfo.documents_used} documente
                  </p>
                  <p>
                    <strong>Scorul de relevanță:</strong>{" "}
                    {ragInfo.relevance_score?.toFixed(3) || "N/A"}
                  </p>
                  <p>
                    <strong>Timpul de procesare:</strong>{" "}
                    {ragInfo.processing_time?.toFixed(2) || "N/A"}s
                  </p>
                  {ragInfo.document_titles && (
                    <div>
                      <strong>Titlurile documentelor:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {ragInfo.document_titles.map(
                          (title: string, idx: number) => (
                            <li key={idx}>{title}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="w-full p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            📚 Lecție Personalizată Generată de AI
          </h3>
          <p className="text-sm text-green-700">
            Lecția va fi generată automat de inteligența artificială, adaptată
            pentru clasa și materia selectate din curricula românească. Lecția
            va include obiective, structură detaliată, conținut științific și
            activități adaptate pentru nivelul selectat.
          </p>
        </div>
      </div>
    </div>
  );
}
