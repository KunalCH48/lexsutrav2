"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
  error?: string;
}

function getErrorMessage(error: string): string {
  if (error === "not_admin") {
    return "This Google account does not have admin access.";
  }
  if (error === "auth_failed") {
    return "Authentication failed. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function LoginForm({ error }: LoginFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState(error ? getErrorMessage(error) : "");

  async function handleGoogleSignIn() {
    setStatus("loading");
    setErrorMsg("");
    // Server-side OAuth initiation — avoids PKCE state loss on browser client
    window.location.href = "/auth/login";
  }

  const showError = (status === "error" || !!error) && !!errorMsg;

  return (
    <div className="space-y-5">
      {showError && (
        <div
          className="flex items-start gap-2.5 p-3.5 rounded-lg"
          style={{
            background: "rgba(231,76,76,0.08)",
            border: "1px solid rgba(231,76,76,0.2)",
          }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#e74c4c" }} />
          <p className="text-sm" style={{ color: "#e74c4c" }}>
            {errorMsg}
          </p>
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: status === "loading" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#e2e8f0",
        }}
        onMouseEnter={(e) => {
          if (status !== "loading") {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
        }}
      >
        {status === "loading" ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Redirecting to Google…
          </span>
        ) : (
          <>
            {/* Google "G" logo */}
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </button>

      <p className="text-xs text-center" style={{ color: "#3d4f60" }}>
        Admin access only. Unauthorised accounts will be rejected.
      </p>
    </div>
  );
}
