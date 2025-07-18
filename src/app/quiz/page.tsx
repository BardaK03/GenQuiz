"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface Question {
  question: string;
  options?: string[];
  correctAnswer: number | string;
  type?: string;
}

export default function QuizPage() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const hasGeneratedRef = useRef(false);

  const numberOfQuestions = searchParams.get("questions");
  const subject = searchParams.get("subject") || "general knowledge";
  const topic = searchParams.get("topic") || "";
  const classLevel = searchParams.get("class") || "";
  const questionType = searchParams.get("type") || "multiple-choice";
  const isSaved = searchParams.get("saved") === "true";
  const savedQuizId = searchParams.get("id");

  useEffect(() => {
    if (hasGeneratedRef.current) return;

    if (isSaved && savedQuizId) {
      hasGeneratedRef.current = true;
      loadSavedQuiz(savedQuizId);
    } else if (numberOfQuestions) {
      hasGeneratedRef.current = true;
      generateQuiz();
    }
  }, [numberOfQuestions, isSaved, savedQuizId]);

  const loadSavedQuiz = async (quizId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/saved-quizzes?id=${quizId}`);
      const data = await response.json();

      if (data.success && data.quiz) {
        setQuestions(data.quiz.questions);
        setQuizTitle(data.quiz.subject);
      } else {
        setError(data.error || "Failed to load saved quiz");
      }
    } catch (error) {
      setError("Failed to connect to the server");
      console.error("Error loading saved quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numberOfQuestions: parseInt(numberOfQuestions!),
          subject: subject,
          topic: topic,
          classLevel: classLevel,
          subjectName: subject,
          type: questionType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
      } else {
        setError(data.error || "Failed to generate quiz");
        setQuestions(data.questions || []); // Use fallback questions
      }
    } catch (error) {
      setError("Failed to connect to the quiz generation service");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isSaved ? "Loading Saved Quiz..." : "Generating Quiz..."}
          </h1>
          <p className="text-gray-600">
            {isSaved
              ? "Loading your saved quiz..."
              : `Creating ${numberOfQuestions} questions about ${subject}`}
          </p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={generateQuiz}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Questions Generated
          </h1>
          <p className="text-gray-600 mb-4">Please go back and try again.</p>
          <button
            onClick={() => (window.location.href = "/test")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Test Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-yellow-800">
            ⚠️ {error} (Using fallback questions)
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isSaved
            ? `Quiz Salvat: ${quizTitle || subject}`
            : `Generated Quiz: ${subject}`}
        </h1>
        <p className="text-gray-600">
          {isSaved
            ? `${questions.length} întrebări din quiz-ul salvat`
            : `${questions.length} questions generated by AI`}
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
          >
            <h2 className="text-xl font-medium mb-4 text-gray-800">
              Question {questionIndex + 1}: {question.question}
            </h2>

            <div className="space-y-3">
              {question.options ? (
                // Multiple choice questions
                question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`p-4 rounded-lg border-2 ${
                      optionIndex === question.correctAnswer
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">
                        <span className="font-medium text-gray-600 mr-3">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {option}
                      </span>
                      {optionIndex === question.correctAnswer && (
                        <span className="text-green-600 font-medium text-sm">
                          ✓ Correct Answer
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Short answer questions - show only the question
                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
                  <div className="text-gray-700">
                    <span className="font-medium text-blue-600">
                      Întrebare cu răspuns scurt
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {isSaved ? (
          <button
            onClick={() => (window.location.href = "/saved-quizzes")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Înapoi la Quiz-uri Salvate
          </button>
        ) : (
          <button
            onClick={() => (window.location.href = "/test")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate New Quiz
          </button>
        )}
      </div>
    </div>
  );
}
