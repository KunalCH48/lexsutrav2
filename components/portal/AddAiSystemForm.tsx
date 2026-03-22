"use client";

import { useState, useTransition } from "react";
import { addAiSystem } from "@/app/portal/(dashboard)/profile/actions";

const RISK_META: Record<string, { label: string; color: string; desc: string }> = {
  unacceptable:    { label: "Unacceptable Risk", color: "#e05252", desc: "Prohibited under the EU AI Act." },
  high_risk:       { label: "High Risk",          color: "#e05252", desc: "Full Annex III obligations apply." },
  limited_risk:    { label: "Limited Risk",       color: "#e0a832", desc: "Transparency obligations apply." },
  minimal_risk:    { label: "Minimal Risk",       color: "#2ecc71", desc: "No mandatory obligations." },
  general_purpose: { label: "General Purpose AI", color: "#8899aa", desc: "Broad-use model — context-dependent." },
};

const ROLE_OPTIONS = [
  {
    value: "deployer",
    label: "Deployer",
    plain: "We use this AI system in our work",
    detail: "You purchased, licensed, or integrated an AI system built by someone else and are using it in your own operations.",
    example: "Using Microsoft Copilot, HireVue, or a third-party loan scoring API.",
  },
  {
    value: "provider",
    label: "Provider",
    plain: "We built and sell / distribute this AI system",
    detail: "You developed the AI system and make it available to other organisations or to the public.",
    example: "Your company built a CV screening tool that HR departments pay to use.",
  },
  {
    value: "provider_deployer",
    label: "Both — we built it and use it ourselves",
    plain: "We built it and also use it internally",
    detail: "You developed the AI system and also deploy it within your own organisation.",
    example: "You built a fraud detection model and run it on your own transactions.",
  },
];

const STATUS_OPTIONS = [
  { value: "active",          label: "Active" },
  { value: "piloting",        label: "Piloting" },
  { value: "planned",         label: "Planned" },
  { value: "decommissioned",  label: "Decommissioned" },
];

const inputStyle = {
  background: "#111d2e",
  border: "1px solid rgba(45,156,219,0.15)",
  color: "#e8f4ff",
  outline: "none",
};


type Classification = {
  riskCategory: string;
  reason: string;
  annexIiiDomain: string | null;
};

export function AddAiSystemForm({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName?: string;
}) {
  const [step, setStep]                 = useState<"input" | "classified" | "success">("input");
  const [name, setName]                 = useState("");
  const [url, setUrl]                   = useState("");
  const [useCase, setUseCase]           = useState("");
  const [role, setRole]                 = useState("");
  const [dataSubjects, setDataSubjects] = useState("");
  const [deploymentStatus, setDeploymentStatus] = useState("active");
  const [classification, setClassification]     = useState<Classification | null>(null);
  const [classifyError, setClassifyError]       = useState<string | null>(null);
  const [saveError, setSaveError]               = useState<string | null>(null);
  const [successName, setSuccessName]           = useState("");
  const [isClassifying, setIsClassifying]       = useState(false);
  const [isSaving, startTransition]             = useTransition();

  async function handleAnalyse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !useCase.trim() || !role) return;
    setClassifyError(null);
    setIsClassifying(true);

    try {
      const res = await fetch("/api/portal/classify-ai-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          useCase: useCase.trim(),
          role,
          dataSubjects: dataSubjects.trim(),
          companyName,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setClassifyError(data.error ?? "Classification failed. Please try again.");
        return;
      }

      const data = await res.json() as {
        risk_category: string;
        reason: string;
        annex_iii_domain: string | null;
      };

      setClassification({
        riskCategory:   data.risk_category,
        reason:         data.reason,
        annexIiiDomain: data.annex_iii_domain,
      });
      setStep("classified");
    } catch {
      setClassifyError("Network error. Please try again.");
    } finally {
      setIsClassifying(false);
    }
  }

  function handleEdit() {
    setStep("input");
    setClassification(null);
    setSaveError(null);
  }

  function handleRegister() {
    if (!classification) return;
    setSaveError(null);

    startTransition(async () => {
      const result = await addAiSystem({
        companyId,
        name:             name.trim(),
        url:              url.trim() || null,
        riskCategory:     classification.riskCategory,
        riskReason:       classification.reason,
        annexIiiDomain:   classification.annexIiiDomain,
        description:      useCase.trim(),
        role:             role || null,
        dataSubjects:     dataSubjects.trim() || null,
        deploymentStatus: deploymentStatus || null,
      });

      if ("error" in result) {
        setSaveError(result.error);
      } else {
        setSuccessName(name.trim());
        setStep("success");
        setName(""); setUrl(""); setUseCase(""); setRole(""); setDataSubjects(""); setDeploymentStatus("active");
        setClassification(null);
      }
    });
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div
        className="rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-4"
        style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.25)", color: "#2ecc71" }}
      >
        <span>"{successName}" added to inventory.</span>
        <button
          onClick={() => setStep("input")}
          className="text-xs underline opacity-70 hover:opacity-100 shrink-0"
          style={{ color: "#2ecc71" }}
        >
          Add another
        </button>
      </div>
    );
  }

  // ── Classification result ─────────────────────────────────────────────────
  if (step === "classified" && classification) {
    const meta = RISK_META[classification.riskCategory] ?? {
      label: classification.riskCategory, color: "#8899aa", desc: "",
    };

    return (
      <div className="space-y-4">
        <div
          className="rounded-lg p-5 space-y-3"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${meta.color}30` }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3d4f60" }}>
            LexSutra Preliminary Assessment
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}40` }}
            >
              {meta.label}
            </span>
            {classification.annexIiiDomain && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-mono"
                style={{ background: "rgba(200,168,75,0.1)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.25)" }}
              >
                {classification.annexIiiDomain}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "#e8f4ff" }}>
            {classification.reason}
          </p>
          <p className="text-xs" style={{ color: "#8899aa" }}>{meta.desc}</p>

          {/* Summary of entered details */}
          <div
            className="rounded px-3 py-2.5 space-y-1"
            style={{ background: "#111d2e", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs font-medium" style={{ color: "#e8f4ff" }}>{name}</p>
            {url && <p className="text-xs font-mono truncate" style={{ color: "#3d4f60" }}>{url}</p>}
            <p className="text-xs line-clamp-2" style={{ color: "#8899aa" }}>{useCase}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {role && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb" }}>
                  {ROLE_OPTIONS.find(r => r.value === role)?.label ?? role}
                </span>
              )}
              {dataSubjects && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#8899aa" }}>
                  {dataSubjects}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs" style={{ color: "#3d4f60" }}>
            Preliminary assessment only. LexSutra confirms classification during the full diagnostic.
          </p>
        </div>

        {saveError && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}
          >
            {saveError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            disabled={isSaving}
            className="text-sm px-4 py-2.5 rounded-lg disabled:opacity-50"
            style={{ background: "transparent", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            ← Edit details
          </button>
          <button
            onClick={handleRegister}
            disabled={isSaving}
            className="flex-1 text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50"
            style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }}
          >
            {isSaving ? "Saving…" : "Add to Inventory →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Input form ────────────────────────────────────────────────────────────
  const canSubmit = name.trim() && useCase.trim() && role && !isClassifying;

  return (
    <form onSubmit={handleAnalyse} className="space-y-4">
      {classifyError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}
        >
          {classifyError}
        </div>
      )}

      {/* System name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          System Name <span style={{ color: "#e05252" }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CV Screening Tool, Loan Approval Engine, Fraud Detection Model"
          disabled={isClassifying}
          required
          className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
          style={inputStyle}
        />
      </div>

      {/* System URL */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          System URL
          <span className="ml-1.5 font-normal" style={{ color: "#3d4f60" }}>optional</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. https://hirevue.com or https://yourapp.com/screening"
          disabled={isClassifying}
          className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
          style={inputStyle}
        />
        <p className="text-xs" style={{ color: "#3d4f60" }}>
          Helps create an auditable record — especially useful if you use multiple tools with similar names.
        </p>
      </div>

      {/* Use case */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          What do you use it for? <span style={{ color: "#e05252" }}>*</span>
        </label>
        <textarea
          rows={3}
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          placeholder="Describe what it does and who it affects. e.g. Screens and ranks job applicants based on their CV — used by hiring managers to shortlist candidates before interview."
          disabled={isClassifying}
          required
          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none disabled:opacity-50"
          style={inputStyle}
        />
      </div>

      {/* Role — radio cards */}
      <div className="space-y-2">
        <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
          Your Role <span style={{ color: "#e05252" }}>*</span>
        </label>
        <div className="space-y-2">
          {ROLE_OPTIONS.map((o) => {
            const isSelected = role === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => !isClassifying && setRole(o.value)}
                disabled={isClassifying}
                className="w-full text-left rounded-lg px-4 py-3 transition-all disabled:opacity-50"
                style={{
                  background: isSelected ? "rgba(45,156,219,0.08)" : "rgba(255,255,255,0.02)",
                  border: isSelected
                    ? "1px solid rgba(45,156,219,0.35)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <span
                    className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: isSelected ? "#2d9cdb" : "rgba(255,255,255,0.15)",
                      background: isSelected ? "rgba(45,156,219,0.15)" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d9cdb" }} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: isSelected ? "#e8f4ff" : "#8899aa" }}>
                      {o.label}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8899aa" }}>
                      {o.detail}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
                      e.g. {o.example}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data subjects + Deployment status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
            Data Subjects Affected
            <span className="ml-1.5 font-normal" style={{ color: "#3d4f60" }}>optional</span>
          </label>
          <input
            type="text"
            value={dataSubjects}
            onChange={(e) => setDataSubjects(e.target.value)}
            placeholder="e.g. Job applicants, Employees, Customers"
            disabled={isClassifying}
            className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
            style={inputStyle}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "#8899aa" }}>
            Deployment Status
          </label>
          <div className="relative">
            <select
              value={deploymentStatus}
              onChange={(e) => setDeploymentStatus(e.target.value)}
              disabled={isClassifying}
              className="w-full rounded-lg px-3 py-2.5 text-sm disabled:opacity-50 pr-8"
              style={{ ...inputStyle, cursor: "pointer", appearance: "none" as const }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#3d4f60" }}>▾</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }}
      >
        {isClassifying ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Analysing under EU AI Act…
          </>
        ) : (
          "Analyse Risk →"
        )}
      </button>
    </form>
  );
}
