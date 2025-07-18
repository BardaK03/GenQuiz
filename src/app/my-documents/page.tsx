"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

interface UserDocument {
  id: number;
  title: string;
  content: string;
  category: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  chunks_count?: number;
}

export default function MyDocuments() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "upload">("documents");
  const [editingDoc, setEditingDoc] = useState<UserDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    fileType: "markdown",
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check authentication
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Load user's documents
  const loadDocuments = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingDocs(true);
      const response = await fetch("/api/user/documents");
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

  useEffect(() => {
    if (isAuthenticated && !loading) {
      loadDocuments();
    }
  }, [isAuthenticated, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Vă rugăm să completați toate câmpurile obligatorii");
      return;
    }

    try {
      setUploading(true);
      const url = editingDoc ? `/api/user/documents/${editingDoc.id}` : "/api/user/documents";
      const method = editingDoc ? "PUT" : "POST";

      const payload = editingDoc
        ? {
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            fileType: formData.fileType,
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
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Vă rugăm să selectați un fișier");
      return;
    }

    if (!formData.title.trim()) {
      alert("Vă rugăm să adăugați un titlu pentru document");
      return;
    }

    try {
      setUploading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("file", selectedFile);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("category", formData.category || "");

      const response = await fetch("/api/user/documents/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        alert("Fișier încărcat cu succes!");
        setFormData({
          title: "",
          content: "",
          category: "",
          fileType: "markdown",
        });
        setSelectedFile(null);
        setActiveTab("documents");
        loadDocuments();
      } else {
        alert("Eroare: " + data.error);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Eroare la încărcarea fișierului");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (doc: UserDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category || "",
      fileType: doc.file_type || "markdown",
    });
    setActiveTab("upload");
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Sigur doriți să ștergeți acest document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/user/documents/${docId}`, {
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

  const handleToggleStatus = async (docId: number) => {
    try {
      const response = await fetch(`/api/user/documents/${docId}/toggle`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (data.success) {
        loadDocuments();
      } else {
        alert("Eroare: " + data.error);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Eroare la schimbarea statusului");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentele Mele</h1>
          <p className="mt-2 text-gray-600">
            Încărcați și gestionați documentele pentru generarea personalizată de lecții și quiz-uri
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Documentele Mele ({documents.length})
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upload"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {editingDoc ? "Editează Document" : "Încarcă Document"}
            </button>
          </nav>
        </div>

        {/* Documents List */}
        {activeTab === "documents" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Documentele Tale ({documents.length})
              </h3>

              {loadingDocs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Se încarcă documentele...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nu aveți documente încărcate
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Începeți prin a încărca primul document pentru generarea personalizată de conținut.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Încarcă primul document
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {doc.title}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                doc.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {doc.is_active ? "Activ" : "Inactiv"}
                            </span>
                            {doc.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {doc.category}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Tip: {doc.file_type || "text"}</span>
                            {doc.file_size && (
                              <span>Mărime: {(doc.file_size / 1024).toFixed(1)} KB</span>
                            )}
                            <span>
                              Creat: {new Date(doc.created_at).toLocaleDateString("ro-RO")}
                            </span>
                            {doc.chunks_count !== undefined && (
                              <span>Bucăți: {doc.chunks_count}</span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {doc.content.length > 200
                              ? doc.content.substring(0, 200) + "..."
                              : doc.content}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleToggleStatus(doc.id)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              doc.is_active
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {doc.is_active ? "Dezactivează" : "Activează"}
                          </button>
                          <button
                            onClick={() => handleEdit(doc)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
                          >
                            Editează
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                          >
                            Șterge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload/Edit Form */}
        {activeTab === "upload" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {editingDoc ? "Editează Document" : "Încarcă Document Nou"}
              </h3>

              {/* File Upload Form */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Încarcă fișier (PDF, TXT, DOC, DOCX)
                </h4>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Selectează fișier
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,.md"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Titlu document *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Introdu titlul documentului"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categorie (opțional)
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="Ex: Biologie, Matematică, etc."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {uploading ? "Se încarcă..." : "Încarcă fișier"}
                  </button>
                </form>
              </div>

              {/* Text Input Form */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Sau introdu text manual
                </h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Titlu document *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Introdu titlul documentului"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categorie (opțional)
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="Ex: Biologie, Matematică, etc."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tip document
                    </label>
                    <select
                      value={formData.fileType}
                      onChange={(e) =>
                        setFormData({ ...formData, fileType: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="markdown">Markdown</option>
                      <option value="text">Text simplu</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Conținut document *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Introdu conținutul documentului..."
                      rows={12}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {uploading ? "Se salvează..." : editingDoc ? "Actualizează" : "Salvează"}
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
                          setActiveTab("documents");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Anulează
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
