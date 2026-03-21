"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, Trash2, FileText } from "lucide-react";
import { deleteReviewerDocument } from "@/app/admin/(dashboard)/reviewers/[id]/actions";

type ReviewerDoc = {
  id:           string;
  file_name:    string;
  doc_type:     string;
  storage_path: string;
  uploaded_at:  string;
  notes:        string | null;
};

type Props = {
  reviewerId:       string;
  initialDocuments: ReviewerDoc[];
};

const DOC_TYPE_LABELS: Record<string, string> = {
  nda:      "NDA",
  contract: "Contract",
  other:    "Other",
};

const DOC_TYPE_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  nda:      { bg: "rgba(200,168,75,0.1)",   text: "#c8a84b", border: "rgba(200,168,75,0.2)" },
  contract: { bg: "rgba(45,156,219,0.1)",   text: "#2d9cdb", border: "rgba(45,156,219,0.2)" },
  other:    { bg: "rgba(232,244,255,0.06)", text: "rgba(232,244,255,0.5)", border: "rgba(255,255,255,0.1)" },
};

export function ReviewerDocumentPanel({ reviewerId, initialDocuments }: Props) {
  const [documents, setDocuments]     = useState<ReviewerDoc[]>(initialDocuments);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isPending, startTransition]   = useTransition();
  const [error, setError]             = useState("");
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [docType, setDocType]         = useState<"nda" | "contract" | "other">("contract");
  const [notes, setNotes]             = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds the 10 MB limit.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("reviewerId", reviewerId);
      fd.append("docType", docType);
      if (notes) fd.append("notes", notes);

      const res = await fetch("/api/admin/reviewer-documents/upload", {
        method: "POST",
        body:   fd,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }

      setDocuments((prev) => [data.document, ...prev]);
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(doc: ReviewerDoc) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    setError("");
    const prev = documents;
    setDocuments((ds) => ds.filter((d) => d.id !== doc.id));
    startTransition(async () => {
      const result = await deleteReviewerDocument(doc.id, doc.storage_path);
      if ("error" in result) {
        setDocuments(prev);
        setError(result.error);
      }
    });
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}>
          Documents
        </h3>
        <span className="text-xs" style={{ color: "rgba(232,244,255,0.35)" }}>
          {documents.length} file{documents.length !== 1 ? "s" : ""} · PDF only · max 10 MB
        </span>
      </div>

      {/* Upload controls */}
      <div
        className="mb-5 p-4 rounded-lg"
        style={{ background: "rgba(45,156,219,0.04)", border: "1px solid rgba(45,156,219,0.12)" }}
      >
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Document type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as "nda" | "contract" | "other")}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
            >
              <option value="nda">NDA</option>
              <option value="contract">Contract</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Signed copy received 21 March 2026"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
              style={{
                background: uploading ? "rgba(255,255,255,0.03)" : "rgba(45,156,219,0.1)",
                color:       uploading ? "rgba(45,156,219,0.4)" : "#2d9cdb",
                border:      "1px solid rgba(45,156,219,0.2)",
                cursor:      uploading ? "default" : "pointer",
              }}
            >
              <Upload size={13} />
              {uploading ? "Uploading…" : "Upload PDF"}
            </button>
          </div>
        </div>
        {uploadError && <p className="mt-2 text-xs" style={{ color: "#e05252" }}>{uploadError}</p>}
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: "rgba(232,244,255,0.25)" }}>
          No documents uploaded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const colours = DOC_TYPE_COLOURS[doc.doc_type] ?? DOC_TYPE_COLOURS.other;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <FileText size={16} style={{ color: "rgba(232,244,255,0.35)", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate" style={{ color: "#e8f4ff" }}>
                      {doc.file_name}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: colours.bg, color: colours.text, border: `1px solid ${colours.border}` }}
                    >
                      {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: "rgba(232,244,255,0.35)" }}>
                      {new Date(doc.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    {doc.notes && (
                      <span className="text-xs" style={{ color: "rgba(232,244,255,0.35)" }}>
                        {doc.notes}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={isPending}
                  className="p-1.5 rounded flex-shrink-0"
                  style={{ color: "rgba(224,82,82,0.5)" }}
                  title="Delete document"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-2 text-xs" style={{ color: "#e05252" }}>{error}</p>}
    </div>
  );
}
