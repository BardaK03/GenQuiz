"use client";

import { useState } from "react";

export default function LectiePage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [lesson, setLesson] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const generateLesson = async () => {
    if (!selectedSubject) {
      alert("Te rugăm să selectezi un subiect.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: selectedSubject,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLesson(data.lesson);
      } else {
        setError(data.error || "Eroare la generarea lecției");
        setLesson(data.lesson || "Nu s-a putut genera lecția.");
      }
    } catch (err) {
      setError("Eroare la conectarea la server");
      console.error("Error generating lesson:", err);
    } finally {
      setLoading(false);
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
          Selectează un subiect pentru a genera o schiță detaliată de lecție
          pentru biologia clasa a 11-a.
        </p>

        <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-6 text-gray-800">
            Configurare Lecție
          </h2>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Subiectul lecției:
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
          </div>

          <button
            onClick={generateLesson}
            disabled={!selectedSubject || loading}
            className={`w-full mt-6 py-3 px-6 rounded-lg font-medium transition-colors ${
              selectedSubject && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Generez schița..." : "Generează Schița de Lecție cu AI"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {lesson && (
          <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-left">
            <div className="prose prose-lg max-w-none">
              {formatLesson(lesson)}
            </div>
          </div>
        )}

        <div className="w-full p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            📚 Schiță de Lecție Generată de AI
          </h3>
          <p className="text-sm text-green-700">
            Această schiță va fi generată automat de inteligența artificială,
            adaptată pentru programa de biologie clasa a 11-a din România.
            Schița va include obiective, structură detaliată, conținut
            științific și activități.
          </p>
        </div>
      </div>
    </div>
  );
}
