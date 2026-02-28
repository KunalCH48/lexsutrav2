"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Lock,
  ShieldCheck,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type Doc = {
  id: string;
  created_at: string;
  file_name: string;
  file_size: number;
  file_type: string;
  confirmed_at: string | null;
};

type Props = {
  initialDocs: Doc[];
  userEmail: string;
};

// ── Helpers ──────────────────────────────────────────────────

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function FileIcon({ type }: { type: string }) {
  if (type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return <FileSpreadsheet size={20} style={{ color: "#2ecc71" }} />;
  }
  return <FileText size={20} style={{ color: "#2d9cdb" }} />;
}

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_BYTES = 25 * 1024 * 1024;

// ── Main component ───────────────────────────────────────────

export function DocumentRepository({ initialDocs, userEmail }: Props) {
  const router = useRouter();

  // Upload state
  const [dragging, setDragging]       = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // OTP modal state
  const [pendingDocId, setPendingDocId]   = useState<string | null>(null);
  const [pendingEmail, setPendingEmail]   = useState("");
  const [pendingName, setPendingName]     = useState("");
  const [otpValue, setOtpValue]           = useState("");
  const [otpError, setOtpError]           = useState<string | null>(null);
  const [otpLoading, setOtpLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg]         = useState<string | null>(null);

  // ── Upload logic ─────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError("Only PDF, DOCX, and XLSX files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("File exceeds the 25 MB limit.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res  = await fetch("/api/documents/upload", { method: "POST", body: fd });
      const data = await res.json() as { documentId?: string; email?: string; error?: string };

      if (!res.ok || !data.documentId) {
        setUploadError(data.error ?? "Upload failed. Please try again.");
        return;
      }

      // Open OTP modal
      setPendingDocId(data.documentId);
      setPendingEmail(data.email ?? userEmail);
      setPendingName(file.name);
      setOtpValue("");
      setOtpError(null);
      setResendMsg(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [userEmail]);

  // Drag events
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ── OTP verify ───────────────────────────────────────────────

  const verifyOtp = async () => {
    if (!pendingDocId || otpValue.length !== 6) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res  = await fetch("/api/documents/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: pendingDocId, otp: otpValue, action: "verify" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setOtpError(data.error ?? "Invalid code.");
        return;
      }
      // Success — close modal and refresh server data
      setPendingDocId(null);
      router.refresh();
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async (docId: string) => {
    setResendLoading(true);
    setResendMsg(null);
    try {
      const res  = await fetch("/api/documents/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, action: "resend" }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        setResendMsg(data.message ?? "New code sent.");
      } else {
        setResendMsg(data.error ?? "Failed to resend.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  // ── Re-open OTP modal for a pending document ─────────────────

  const openOtpForExisting = (doc: Doc) => {
    setPendingDocId(doc.id);
    setPendingEmail(userEmail);
    setPendingName(doc.file_name);
    setOtpValue("");
    setOtpError(null);
    setResendMsg(null);
  };

  const totalDocs      = initialDocs.length;
  const confirmedCount = initialDocs.filter((d) => d.confirmed_at).length;

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* ── Upload Zone ───────────────────────────────────── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors select-none"
        style={{
          background:  dragging ? "rgba(45,156,219,0.08)" : "#0d1520",
          border:      `2px dashed ${dragging ? "rgba(45,156,219,0.6)" : "rgba(45,156,219,0.2)"}`,
          minHeight:   "160px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx"
          className="hidden"
          onChange={onInputChange}
          disabled={uploading}
        />

        {uploading ? (
          <>
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(45,156,219,0.4)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "#8899aa" }}>Uploading…</p>
          </>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(45,156,219,0.1)" }}
            >
              <Upload size={22} style={{ color: "#2d9cdb" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                {dragging ? "Drop to upload" : "Drag & drop or click to browse"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
                PDF, DOCX, XLSX · Max 25 MB
              </p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-sm px-1" style={{ color: "#e05252" }}>{uploadError}</p>
      )}

      {/* ── Storage info bar ──────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ background: "rgba(45,156,219,0.04)", border: "1px solid rgba(45,156,219,0.1)" }}
      >
        <ShieldCheck size={16} style={{ color: "#2d9cdb", flexShrink: 0 }} />
        <p className="text-xs" style={{ color: "#8899aa" }}>
          <span style={{ color: "#e8f4ff" }}>{confirmedCount} of {totalDocs} document{totalDocs !== 1 ? "s" : ""} confirmed</span>
          {" · "}All encrypted · EU storage only · 18-month minimum retention
        </p>
        <Lock size={13} style={{ color: "#3d4f60", flexShrink: 0 }} />
      </div>

      {/* ── Document grid ────────────────────────────────── */}
      {initialDocs.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm" style={{ color: "#3d4f60" }}>
            No documents uploaded yet. Upload your first compliance document above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialDocs.map((doc) => {
            const confirmed = !!doc.confirmed_at;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                style={{
                  background: "#0d1520",
                  border: `1px solid ${confirmed ? "rgba(46,204,113,0.15)" : "rgba(224,168,50,0.2)"}`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <FileIcon type={doc.file_type} />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "#e8f4ff" }}
                  >
                    {doc.file_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
                    {fmtSize(doc.file_size)} · {fmtDate(doc.created_at)}
                  </p>
                </div>

                {/* Status + action */}
                {confirmed ? (
                  <span
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: "rgba(46,204,113,0.1)",
                      color: "#2ecc71",
                      border: "1px solid rgba(46,204,113,0.25)",
                    }}
                  >
                    <CheckCircle2 size={12} />
                    Confirmed
                  </span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(224,168,50,0.1)",
                        color: "#e0a832",
                        border: "1px solid rgba(224,168,50,0.25)",
                      }}
                    >
                      <Clock size={12} />
                      Pending
                    </span>
                    <button
                      onClick={() => openOtpForExisting(doc)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                      style={{
                        background: "rgba(45,156,219,0.1)",
                        color: "#2d9cdb",
                        border: "1px solid rgba(45,156,219,0.25)",
                      }}
                    >
                      Enter code
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── OTP Modal ────────────────────────────────────── */}
      {pendingDocId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(6,8,16,0.85)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 relative"
            style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.25)" }}
          >
            {/* Close */}
            <button
              onClick={() => setPendingDocId(null)}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
              style={{ color: "#3d4f60" }}
            >
              <X size={18} />
            </button>

            <h3
              className="text-lg font-semibold mb-1"
              style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
            >
              Confirm Your Upload
            </h3>
            <p className="text-sm mb-6" style={{ color: "#8899aa" }}>
              A 6-digit confirmation code was sent to{" "}
              <span style={{ color: "#2d9cdb" }}>{pendingEmail}</span>
            </p>

            {/* File name */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <FileText size={14} style={{ color: "#2d9cdb", flexShrink: 0 }} />
              <span className="text-xs truncate" style={{ color: "#8899aa" }}>{pendingName}</span>
            </div>

            {/* OTP input */}
            <div className="mb-4">
              <label className="text-xs font-medium mb-2 block" style={{ color: "#8899aa" }}>
                Confirmation Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpValue}
                onChange={(e) => {
                  setOtpValue(e.target.value.replace(/\D/g, ""));
                  setOtpError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-[0.4em] outline-none transition-colors"
                style={{
                  background:   "rgba(255,255,255,0.04)",
                  border:       `1px solid ${otpError ? "rgba(224,82,82,0.5)" : "rgba(45,156,219,0.2)"}`,
                  color:        "#e8f4ff",
                  fontFamily:   "monospace",
                }}
                autoFocus
              />
              {otpError && (
                <p className="text-xs mt-2" style={{ color: "#e05252" }}>{otpError}</p>
              )}
            </div>

            {/* Confirm button */}
            <button
              onClick={verifyOtp}
              disabled={otpValue.length !== 6 || otpLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
              style={{
                background: otpValue.length === 6 && !otpLoading ? "#2d9cdb" : "rgba(45,156,219,0.3)",
                color:      "#fff",
                opacity:    otpLoading ? 0.7 : 1,
                cursor:     otpValue.length !== 6 || otpLoading ? "not-allowed" : "pointer",
              }}
            >
              {otpLoading ? "Verifying…" : "Confirm Upload"}
            </button>

            {/* Resend */}
            <div className="mt-4 text-center">
              {resendMsg ? (
                <p className="text-xs" style={{ color: "#2ecc71" }}>{resendMsg}</p>
              ) : (
                <button
                  onClick={() => {
                    resendOtp(pendingDocId);
                  }}
                  disabled={resendLoading}
                  className="text-xs transition-colors"
                  style={{ color: "#3d4f60" }}
                >
                  {resendLoading ? (
                    <span className="flex items-center justify-center gap-1">
                      <RefreshCw size={10} className="animate-spin" /> Sending…
                    </span>
                  ) : (
                    "Didn't receive the code? Resend"
                  )}
                </button>
              )}
            </div>

            {/* Consent note */}
            <p className="text-xs mt-5 text-center leading-relaxed" style={{ color: "#3d4f60" }}>
              By confirming, you consent to LexSutra securely storing this document for EU AI Act
              compliance purposes under our data retention policy.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
