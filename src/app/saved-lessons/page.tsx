"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Lesson {
  id: number;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function SavedLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/saved-lessons");
      const data = await response.json();

      if (data.success) {
        setLessons(data.lessons);
      } else {
        setError(data.error || "Eroare la încărcarea lecțiilor");
      }
    } catch (err) {
      setError("Eroare la conectarea la server");
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditSubject(lesson.subject);
    setEditContent(lesson.content);
  };

  const handleSave = async () => {
    if (!editingLesson) return;

    try {
      setSaving(true);
      const response = await fetch("/api/saved-lessons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingLesson.id,
          subject: editSubject,
          content: editContent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizează lecția în lista locală
        setLessons(
          lessons.map((lesson) =>
            lesson.id === editingLesson.id
              ? { ...lesson, subject: editSubject, content: editContent }
              : lesson
          )
        );
        setEditingLesson(null);
        setEditSubject("");
        setEditContent("");
      } else {
        setError(data.error || "Eroare la salvarea lecției");
      }
    } catch (err) {
      setError("Eroare la salvarea lecției");
      console.error("Error saving lesson:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ești sigur că vrei să ștergi această lecție?")) return;

    try {
      const response = await fetch(`/api/saved-lessons?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setLessons(lessons.filter((lesson) => lesson.id !== id));
      } else {
        setError(data.error || "Eroare la ștergerea lecției");
      }
    } catch (err) {
      setError("Eroare la ștergerea lecției");
      console.error("Error deleting lesson:", err);
    }
  };

  const handleCancel = () => {
    setEditingLesson(null);
    setEditSubject("");
    setEditContent("");
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Se încarcă lecțiile...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Lecții Salvate</h1>
        <Link
          href="/lectie"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Înapoi la Generare Lecții
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Închide
          </button>
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Nu există lecții salvate</p>
          <Link
            href="/lectie"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generează Prima Lecție
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              {editingLesson?.id === lesson.id ? (
                // Modul de editare
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subiect:
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      placeholder="Subiectul lecției"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conținut:
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                      rows={15}
                      placeholder="Conținutul lecției"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {saving ? "Se salvează..." : "Salvează"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              ) : (
                // Modul de vizualizare
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {lesson.subject}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Creat:{" "}
                        {new Date(lesson.created_at).toLocaleDateString(
                          "ro-RO",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                      {lesson.updated_at !== lesson.created_at && (
                        <p className="text-sm text-gray-500">
                          Actualizat:{" "}
                          {new Date(lesson.updated_at).toLocaleDateString(
                            "ro-RO",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {lesson.content.length > 500
                        ? `${lesson.content.substring(0, 500)}...`
                        : lesson.content}
                    </pre>
                    {lesson.content.length > 500 && (
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Vezi tot conținutul
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
