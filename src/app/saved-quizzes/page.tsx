"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Quiz {
  id: number;
  subject: string;
  type: "multiple-choice" | "short-answer";
  questions: any[];
  created_at: string;
  updated_at: string;
}

export default function SavedQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editType, setEditType] = useState<"multiple-choice" | "short-answer">(
    "multiple-choice"
  );
  const [editQuestions, setEditQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/saved-quizzes");
      const data = await response.json();

      if (data.success) {
        setQuizzes(data.quizzes);
      } else {
        setError(data.error || "Eroare la încărcarea quiz-urilor");
      }
    } catch (err) {
      setError("Eroare la conectarea la server");
      console.error("Error fetching quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditSubject(quiz.subject);
    setEditType(quiz.type);
    setEditQuestions(quiz.questions);
  };

  const handleSave = async () => {
    if (!editingQuiz) return;

    try {
      setSaving(true);
      const response = await fetch("/api/saved-quizzes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingQuiz.id,
          subject: editSubject,
          type: editType,
          questions: editQuestions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizează quiz-ul în lista locală
        setQuizzes(
          quizzes.map((quiz) =>
            quiz.id === editingQuiz.id
              ? {
                  ...quiz,
                  subject: editSubject,
                  type: editType,
                  questions: editQuestions,
                }
              : quiz
          )
        );
        setEditingQuiz(null);
        setEditSubject("");
        setEditType("multiple-choice");
        setEditQuestions([]);
      } else {
        setError(data.error || "Eroare la salvarea quiz-ului");
      }
    } catch (err) {
      setError("Eroare la salvarea quiz-ului");
      console.error("Error saving quiz:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ești sigur că vrei să ștergi acest quiz?")) return;

    try {
      const response = await fetch(`/api/saved-quizzes?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
      } else {
        setError(data.error || "Eroare la ștergerea quiz-ului");
      }
    } catch (err) {
      setError("Eroare la ștergerea quiz-ului");
      console.error("Error deleting quiz:", err);
    }
  };

  const handleCancel = () => {
    setEditingQuiz(null);
    setEditSubject("");
    setEditType("multiple-choice");
    setEditQuestions([]);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...editQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setEditQuestions(updatedQuestions);
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...editQuestions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setEditQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestion =
      editType === "multiple-choice"
        ? {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
          }
        : {
            question: "",
            answer: "",
          };

    setEditQuestions([...editQuestions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setEditQuestions(editQuestions.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Se încarcă quiz-urile...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quiz-uri Salvate</h1>
        <Link
          href="/test"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Înapoi la Generare Quiz-uri
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

      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            Nu există quiz-uri salvate
          </p>
          <Link
            href="/test"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generează Primul Quiz
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              {editingQuiz?.id === quiz.id ? (
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
                      placeholder="Subiectul quiz-ului"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tip:
                    </label>
                    <select
                      value={editType}
                      onChange={(e) =>
                        setEditType(
                          e.target.value as "multiple-choice" | "short-answer"
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    >
                      <option value="multiple-choice">
                        Grile (Multiple Choice)
                      </option>
                      <option value="short-answer">Răspuns Scurt</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Întrebări:
                      </label>
                      <button
                        onClick={addQuestion}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        + Adaugă Întrebare
                      </button>
                    </div>

                    {editQuestions.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="mb-6 p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-800">
                            Întrebarea {qIndex + 1}
                          </h4>
                          <button
                            onClick={() => removeQuestion(qIndex)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Șterge
                          </button>
                        </div>

                        <div className="mb-3">
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIndex,
                                "question",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                            placeholder="Textul întrebării"
                          />
                        </div>

                        {editType === "multiple-choice" ? (
                          <div className="space-y-2">
                            {question.options?.map(
                              (option: string, oIndex: number) => (
                                <div
                                  key={oIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${qIndex}`}
                                    checked={question.correctAnswer === oIndex}
                                    onChange={() =>
                                      handleQuestionChange(
                                        qIndex,
                                        "correctAnswer",
                                        oIndex
                                      )
                                    }
                                    className="text-blue-600"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) =>
                                      handleOptionChange(
                                        qIndex,
                                        oIndex,
                                        e.target.value
                                      )
                                    }
                                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                                    placeholder={`Opțiunea ${String.fromCharCode(
                                      65 + oIndex
                                    )}`}
                                  />
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={question.answer || ""}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "answer",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                              placeholder="Răspunsul corect"
                            />
                          </div>
                        )}
                      </div>
                    ))}
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
                        {quiz.subject}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Tip:</span>{" "}
                        {quiz.type === "multiple-choice"
                          ? "Grile"
                          : "Răspuns Scurt"}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Întrebări:</span>{" "}
                        {quiz.questions.length}
                      </p>
                      <p className="text-sm text-gray-500">
                        Creat:{" "}
                        {new Date(quiz.created_at).toLocaleDateString("ro-RO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {quiz.updated_at !== quiz.created_at && (
                        <p className="text-sm text-gray-500">
                          Actualizat:{" "}
                          {new Date(quiz.updated_at).toLocaleDateString(
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
                      <Link
                        href={`/quiz?questions=${
                          quiz.questions.length
                        }&subject=${encodeURIComponent(quiz.subject)}&type=${
                          quiz.type
                        }&saved=true&id=${quiz.id}`}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        Vizualizează
                      </Link>
                      <button
                        onClick={() => handleEdit(quiz)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Preview întrebări:
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      {quiz.questions.slice(0, 3).map((question, index) => (
                        <div key={index}>
                          <span className="font-medium">{index + 1}. </span>
                          {question.question}
                        </div>
                      ))}
                      {quiz.questions.length > 3 && (
                        <p className="text-gray-500 italic">
                          ... și încă {quiz.questions.length - 3} întrebări
                        </p>
                      )}
                    </div>
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
