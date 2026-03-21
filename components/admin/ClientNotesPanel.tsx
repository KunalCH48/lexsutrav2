"use client";

import { useState, useTransition, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import { addCompanyNote, deleteCompanyNote } from "@/app/admin/(dashboard)/clients/actions";

type Note = {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  author_name?: string | null;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ClientNotesPanel({
  companyId,
  initialNotes,
}: {
  companyId: string;
  initialNotes: Note[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState("");
  const [adding, setAdding]          = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function handleAdd() {
    const content = textRef.current?.value ?? "";
    if (!content.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        await addCompanyNote(companyId, content);
        if (textRef.current) textRef.current.value = "";
        setAdding(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save note");
      }
    });
  }

  function handleDelete(noteId: string) {
    setError("");
    startTransition(async () => {
      try {
        await deleteCompanyNote(noteId, companyId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete note");
      }
    });
  }

  return (
    <div>
      {/* Existing notes */}
      {initialNotes.length === 0 && !adding ? (
        <p className="text-xs mb-3" style={{ color: "#3d4f60" }}>No notes yet.</p>
      ) : (
        <div className="space-y-3 mb-3">
          {initialNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg p-3 group relative"
              style={{ background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.15)" }}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: "#e8f4ff" }}>{note.content}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs" style={{ color: "#3d4f60" }}>
                  {note.author_name ?? "Admin"} · {fmtDateTime(note.created_at)}
                </p>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete note"
                  style={{ color: "#e05252" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note */}
      {adding ? (
        <div className="space-y-2">
          <textarea
            ref={textRef}
            rows={3}
            placeholder="Write a note…"
            autoFocus
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(45,156,219,0.25)",
              color:      "#e8f4ff",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(200,168,75,0.15)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.25)", opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? "Saving…" : "Save note"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-xs"
              style={{ color: "#3d4f60" }}
            >
              Cancel
            </button>
            <span className="text-xs ml-auto" style={{ color: "#3d4f60" }}>⌘↵ to save</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(200,168,75,0.08)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.2)" }}
        >
          <Plus size={11} />
          Add note
        </button>
      )}

      {error && <p className="text-xs mt-2" style={{ color: "#e05252" }}>{error}</p>}
    </div>
  );
}
