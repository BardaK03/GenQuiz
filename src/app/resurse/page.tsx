"use client";

import { useState } from "react";
import Link from "next/link";

interface Technology {
  id: string;
  name: string;
}

const availableTechnologies: Technology[] = [
  { id: "robot-fable", name: "Robot Fable" },
  { id: "ochelari-vr", name: "Ochelari VR" },
  { id: "creion-3d", name: "Creion 3D" },
  { id: "imprimanta-3d", name: "Imprimantă 3D" },
  { id: "aplicatie-modelare-3d", name: "Aplicație Modelare 3D" },
  { id: "scanner-3d", name: "Scanner 3D" },
  { id: "robot-dobot", name: "Robot Dobot Magician" },
  { id: "arduino-starter", name: "Kit Arduino Starter" },
  { id: "arduino-ctc-go", name: "Kit Arduino CTC GO!" },
  { id: "arduino-student-iot", name: "Kit Arduino Student IoT" },
];

export default function ResursePage() {
  const [subject, setSubject] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    []
  );
  const [lesson, setLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTechnologyChange = (techId: string) => {
    setSelectedTechnologies((prev) =>
      prev.includes(techId)
        ? prev.filter((id) => id !== techId)
        : [...prev, techId]
    );
  };

  const generateLesson = async () => {
    if (!subject.trim()) {
      setError("Te rog introdu un subiect pentru lecție");
      return;
    }

    if (selectedTechnologies.length === 0) {
      setError(
        "Te rog selectează cel puțin o tehnologie pentru activitatea practică"
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLesson(null);

      const selectedTechNames = selectedTechnologies
        .map(
          (techId) =>
            availableTechnologies.find((tech) => tech.id === techId)?.name
        )
        .filter(Boolean);

      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject.trim(),
          technologies: selectedTechNames,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLesson(data.lesson);
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
          subject: subject.trim(),
          content: lesson,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Lecția a fost salvată cu succes!");
      } else {
        alert("Eroare la salvarea lecției: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("Eroare la salvarea lecției");
      console.error("Error saving lesson:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Se generează lecția SmartLab...
          </h1>
          <p className="text-gray-600">
            Creez o lecție despre "{subject}" cu activități practice folosind
            tehnologiile selectate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Resurse SmartLab</h1>
        <Link
          href="/saved-lessons"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Vezi Lecții Salvate
        </Link>
      </div>

      {!lesson ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Generează Lecție cu Activități Practice
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subiectul lecției:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black bg-white"
                placeholder="Ex: Programarea robotului, Imprimarea 3D, IoT și senzorii..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selectează tehnologiile disponibile pentru activitatea practică:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableTechnologies.map((tech) => (
                  <div key={tech.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={tech.id}
                      checked={selectedTechnologies.includes(tech.id)}
                      onChange={() => handleTechnologyChange(tech.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={tech.id}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {tech.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={generateLesson}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? "Se generează..." : "Generează Lecția SmartLab"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Lecție SmartLab: {subject}
                </h2>
                <p className="text-gray-600">
                  Tehnologii utilizate:{" "}
                  {selectedTechnologies
                    .map(
                      (techId) =>
                        availableTechnologies.find((tech) => tech.id === techId)
                          ?.name
                    )
                    .join(", ")}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={saveLesson}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvează Lecția
                </button>
                <button
                  onClick={() => {
                    setLesson(null);
                    setSubject("");
                    setSelectedTechnologies([]);
                    setError(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Lecție Nouă
                </button>
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {lesson}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
