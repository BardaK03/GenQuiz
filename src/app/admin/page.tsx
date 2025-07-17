"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

interface RagDocument {
  id: number;
  title: string;
  content: string;
  category: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  chunks_count?: number;
}

export default function AdminPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "upload" | "debug">(
    "documents"
  );
  const [editingDoc, setEditingDoc] = useState<RagDocument | null>(null);

  // Debug RAG states
  const [debugQuery, setDebugQuery] = useState("");
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [debugLoading, setDebugLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    fileType: "markdown",
  });

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user, router]);

  // Load documents
  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      loadDocuments();
    }
  }, [isAuthenticated, user]);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const response = await fetch("/api/admin/rag-documents");
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      } else {
        console.error("Error loading documents:", data.error);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      alert("Te rugăm să completezi titlul și conținutul");
      return;
    }

    try {
      const url = editingDoc
        ? "/api/admin/rag-documents"
        : "/api/admin/rag-documents";
      const method = editingDoc ? "PUT" : "POST";

      const payload = editingDoc
        ? {
            id: editingDoc.id,
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
          }
        : {
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            fileType: formData.fileType,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          editingDoc
            ? "Document actualizat cu succes!"
            : "Document salvat cu succes!"
        );
        setFormData({
          title: "",
          content: "",
          category: "",
          fileType: "markdown",
        });
        setEditingDoc(null);
        setActiveTab("documents");
        loadDocuments();
      } else {
        alert("Eroare: " + data.error);
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Eroare la salvarea documentului");
    }
  };

  const handleEdit = (doc: RagDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category || "",
      fileType: doc.file_type || "markdown",
    });
    setActiveTab("upload");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ești sigur că vrei să ștergi acest document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rag-documents?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Document șters cu succes!");
        loadDocuments();
      } else {
        alert("Eroare: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Eroare la ștergerea documentului");
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      const response = await fetch("/api/admin/rag-documents", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "toggle" }),
      });

      const data = await response.json();

      if (data.success) {
        loadDocuments();
      } else {
        alert("Eroare: " + data.error);
      }
    } catch (error) {
      console.error("Error toggling document status:", error);
      alert("Eroare la schimbarea statusului");
    }
  };

  const handleDebugRag = async () => {
    if (!debugQuery.trim()) return;

    setDebugLoading(true);
    try {
      const response = await fetch("/api/debug/rag-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: debugQuery,
          threshold: 0.6,
          maxResults: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDebugResults(data.chunks || []);
        console.log("RAG Debug Results:", data);
      } else {
        console.error("Debug failed:", response.statusText);
        alert("Eroare la debugging RAG");
      }
    } catch (error) {
      console.error("Debug error:", error);
      alert("Eroare la debugging RAG");
    } finally {
      setDebugLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        content,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        fileType: file.type || "text/plain",
      }));
    };
    reader.readAsText(file);
  };

  if (loading || loadingDocs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Acces Interzis
          </h1>
          <p className="text-black">Nu aveți permisiuni de administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center p-6">
              <h1 className="text-2xl font-bold text-black">
                🔧 Admin Panel - Gestionare Documente RAG
              </h1>
              <div className="text-sm text-black">
                Conectat ca:{" "}
                <span className="font-medium text-black">
                  {user.first_name} {user.last_name}
                </span>
              </div>
            </div>

            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("documents")}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === "documents"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-black hover:text-gray-700"
                }`}
              >
                📚 Documente ({documents.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("upload");
                  setEditingDoc(null);
                  setFormData({
                    title: "",
                    content: "",
                    category: "",
                    fileType: "markdown",
                  });
                }}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === "upload"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-black hover:text-gray-700"
                }`}
              >
                ⬆️ {editingDoc ? "Editare Document" : "Încărcare Document"}
              </button>
              <button
                onClick={() => setActiveTab("debug")}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === "debug"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-black hover:text-gray-700"
                }`}
              >
                🔍 Debug RAG
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "documents" && (
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-black">Nu există documente încărcate.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-black">
                            Titlu
                          </th>
                          <th className="px-4 py-2 text-left text-black">
                            Categorie
                          </th>
                          <th className="px-4 py-2 text-left text-black">
                            Chunks
                          </th>
                          <th className="px-4 py-2 text-left text-black">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-black">
                            Încărcat de
                          </th>
                          <th className="px-4 py-2 text-left text-black">
                            Data
                          </th>
                          <th className="px-4 py-2 text-left text-black">
                            Acțiuni
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id} className="border-b">
                            <td className="px-4 py-2">
                              <div className="font-medium text-black">
                                {doc.title}
                              </div>
                              {doc.file_name && (
                                <div className="text-sm text-black">
                                  {doc.file_name}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {doc.category || "Niciuna"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                {doc.chunks_count || 0} chunks
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => toggleStatus(doc.id)}
                                className={`px-2 py-1 rounded-full text-xs ${
                                  doc.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {doc.is_active ? "Activ" : "Inactiv"}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-black">
                              {doc.first_name} {doc.last_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-black">
                              {new Date(doc.created_at).toLocaleDateString(
                                "ro-RO"
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(doc)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Editează
                                </button>
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Șterge
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "upload" && (
              <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Titlu Document
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="Introduceti titlul documentului"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Categorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">Selectează categoria</option>
                      <option value="SmartLab">SmartLab</option>
                      <option value="Biologie">Biologie</option>
                      <option value="Anatomie">Anatomie</option>
                      <option value="Fiziologie">Fiziologie</option>
                      <option value="Alte">Alte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Încărcare Fișier (opțional)
                    </label>
                    <input
                      type="file"
                      accept=".md,.txt,.json"
                      onChange={handleFileUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    <p className="text-sm text-black mt-1">
                      Acceptă fișiere: .md, .txt, .json
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Documentele vor fi procesate automat pentru chunking și
                      vectorizare RAG
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Conținut Document
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-black"
                      placeholder="Introduceti conținutul documentului sau încărcați un fișier..."
                      required
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    >
                      {editingDoc
                        ? "Actualizează Document"
                        : "Salvează Document"}
                    </button>

                    {editingDoc && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDoc(null);
                          setFormData({
                            title: "",
                            content: "",
                            category: "",
                            fileType: "markdown",
                          });
                        }}
                        className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                      >
                        Anulează
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === "debug" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">
                    🔍 Test Căutare RAG
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Întrebare/Query de test:
                      </label>
                      <input
                        type="text"
                        value={debugQuery}
                        onChange={(e) => setDebugQuery(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="Ex: cum functioneaza robotul fable?"
                      />
                    </div>

                    <button
                      onClick={handleDebugRag}
                      disabled={debugLoading || !debugQuery.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {debugLoading ? "Căutare..." : "Caută în RAG"}
                    </button>
                  </div>
                </div>

                {debugResults.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-black mb-4">
                      Rezultate găsite ({debugResults.length}):
                    </h4>
                    <div className="space-y-4">
                      {debugResults.map((chunk, index) => (
                        <div
                          key={chunk.id}
                          className="bg-gray-50 p-4 rounded-lg border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-black">
                              {chunk.document_title}
                            </h5>
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                              {(chunk.similarity * 100).toFixed(1)}% similar
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Categorie: {chunk.document_category}
                          </p>
                          <div className="text-sm text-black">
                            <details>
                              <summary className="cursor-pointer hover:text-blue-600">
                                {chunk.chunk_text.substring(0, 100)}...
                              </summary>
                              <div className="mt-2 p-2 bg-white rounded border">
                                <pre className="whitespace-pre-wrap text-xs">
                                  {chunk.full_text}
                                </pre>
                              </div>
                            </details>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {debugResults.length === 0 && debugQuery && !debugLoading && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      Nu s-au găsit rezultate pentru "{debugQuery}". Încearcă să
                      reduci pragul de similaritate sau să reformulezi
                      întrebarea.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
