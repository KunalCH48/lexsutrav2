"use client";

// TODO: Replace checkbox consent with OTP verification (send 6-digit code
// to the client's verified email address) before recording consent_given_at.
// This ensures non-repudiation and satisfies GDPR consent requirements.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "../actions";

type Answers = {
  ai_system_description: string;
  decision_making_role: string;
  who_is_affected: string[];
  scale_of_impact: string;
  existing_compliance_docs: string;
  human_override_capability: string;
  deployment_status: string;
  additional_context: string;
};

const AFFECTED_OPTIONS = [
  "Applicants",
  "Employees",
  "Customers",
  "Third parties",
  "Other",
];

export default function QuestionnairePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [serverError, setServerError] = useState("");

  const [answers, setAnswers] = useState<Answers>({
    ai_system_description:    "",
    decision_making_role:     "",
    who_is_affected:          [],
    scale_of_impact:          "",
    existing_compliance_docs: "",
    human_override_capability: "",
    deployment_status:         "",
    additional_context:        "",
  });

  function setText(field: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function setRadio(field: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCheckbox(option: string) {
    setAnswers((prev) => {
      const current = prev.who_is_affected as string[];
      return {
        ...prev,
        who_is_affected: current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option],
      };
    });
  }

  function handleSubmit() {
    if (!consent) {
      setConsentError("Please confirm your consent before continuing.");
      return;
    }
    setConsentError("");
    setServerError("");

    startTransition(async () => {
      const result = await completeOnboarding("questionnaire", {
        ai_system_description:    answers.ai_system_description.trim() || undefined,
        decision_making_role:     answers.decision_making_role || undefined,
        who_is_affected:          answers.who_is_affected.length > 0 ? answers.who_is_affected : undefined,
        scale_of_impact:          answers.scale_of_impact || undefined,
        existing_compliance_docs: answers.existing_compliance_docs || undefined,
        human_override_capability: answers.human_override_capability || undefined,
        deployment_status:        answers.deployment_status || undefined,
        additional_context:       answers.additional_context.trim() || undefined,
      });

      if ("error" in result) {
        setServerError(result.error);
      } else {
        router.push("/portal");
        router.refresh();
      }
    });
  }

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: "#080c14" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#2d9cdb" }}>
            Step 1 of 1 · Context questionnaire
          </p>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Tell us about your AI system
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8899aa" }}>
            Your answers help us tailor the EU AI Act compliance snapshot to your specific context.
            All responses are treated as self-reported and confidential.
          </p>
        </div>

        <div className="space-y-8">

          {/* Q1 */}
          <QuestionBlock number="1" label="Describe your AI system">
            <textarea
              value={answers.ai_system_description}
              onChange={(e) => setText("ai_system_description", e.target.value)}
              rows={4}
              placeholder="e.g. We use an AI system to screen and rank job applicants based on CV data and psychometric test results..."
              className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
              style={{
                background:  "rgba(255,255,255,0.04)",
                border:      "1px solid rgba(255,255,255,0.08)",
                color:       "#e8f4ff",
                caretColor:  "#2d9cdb",
              }}
            />
          </QuestionBlock>

          {/* Q2 */}
          <QuestionBlock number="2" label="What role does the AI play in decision-making?">
            <RadioGroup
              name="decision_making_role"
              options={[
                { value: "autonomous",         label: "Autonomous — makes final decisions without human review" },
                { value: "recommends",          label: "Recommends — outputs a recommendation, human decides" },
                { value: "supports_analysis",   label: "Supports analysis — provides data/insights to aid human judgement" },
                { value: "unsure",              label: "Unsure" },
              ]}
              selected={answers.decision_making_role}
              onChange={(v) => setRadio("decision_making_role", v)}
            />
          </QuestionBlock>

          {/* Q3 */}
          <QuestionBlock number="3" label="Who is affected by the AI's outputs?">
            <div className="space-y-2.5">
              {AFFECTED_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={answers.who_is_affected.includes(option)}
                    onChange={() => toggleCheckbox(option)}
                    style={{ accentColor: "#2d9cdb" }}
                    className="shrink-0"
                  />
                  <span className="text-sm" style={{ color: "#c8d8e8" }}>{option}</span>
                </label>
              ))}
            </div>
          </QuestionBlock>

          {/* Q4 */}
          <QuestionBlock number="4" label="Approximately how many people does the AI affect per month?">
            <RadioGroup
              name="scale_of_impact"
              options={[
                { value: "under_100",    label: "Fewer than 100" },
                { value: "100_to_1k",   label: "100 – 1,000" },
                { value: "1k_to_10k",   label: "1,000 – 10,000" },
                { value: "over_10k",    label: "More than 10,000" },
                { value: "unsure",       label: "Unsure" },
              ]}
              selected={answers.scale_of_impact}
              onChange={(v) => setRadio("scale_of_impact", v)}
            />
          </QuestionBlock>

          {/* Q5 */}
          <QuestionBlock number="5" label="Do you have existing AI compliance or risk documentation?">
            <RadioGroup
              name="existing_compliance_docs"
              options={[
                { value: "none",        label: "None" },
                { value: "informal",    label: "Informal notes or internal guidelines" },
                { value: "formal",      label: "Formal documentation (policies, risk assessments)" },
                { value: "in_progress", label: "In progress / being drafted" },
                { value: "unsure",      label: "Unsure" },
              ]}
              selected={answers.existing_compliance_docs}
              onChange={(v) => setRadio("existing_compliance_docs", v)}
            />
          </QuestionBlock>

          {/* Q6 */}
          <QuestionBlock number="6" label="Can a human override or override the AI's output?">
            <RadioGroup
              name="human_override_capability"
              options={[
                { value: "yes_formal",   label: "Yes — there is a formal override process" },
                { value: "informally",   label: "Informally — in practice humans can intervene" },
                { value: "no",           label: "No — the AI output is applied automatically" },
                { value: "not_applicable", label: "Not applicable" },
              ]}
              selected={answers.human_override_capability}
              onChange={(v) => setRadio("human_override_capability", v)}
            />
          </QuestionBlock>

          {/* Q7 */}
          <QuestionBlock number="7" label="What is the current deployment status of the AI system?">
            <RadioGroup
              name="deployment_status"
              options={[
                { value: "live",          label: "Live — currently in production use" },
                { value: "in_development", label: "In development" },
                { value: "planning",      label: "Planning / evaluating options" },
                { value: "other",         label: "Other" },
              ]}
              selected={answers.deployment_status}
              onChange={(v) => setRadio("deployment_status", v)}
            />
          </QuestionBlock>

          {/* Q8 */}
          <QuestionBlock number="8" label="Any additional context? (optional)">
            <textarea
              value={answers.additional_context}
              onChange={(e) => setText("additional_context", e.target.value)}
              rows={3}
              placeholder="Anything else that would help us assess your compliance position..."
              className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
              style={{
                background:  "rgba(255,255,255,0.04)",
                border:      "1px solid rgba(255,255,255,0.08)",
                color:       "#e8f4ff",
                caretColor:  "#2d9cdb",
              }}
            />
          </QuestionBlock>

          {/* Consent */}
          <div
            className="rounded-xl p-5"
            style={{
              background: "rgba(200,168,75,0.04)",
              border:     "1px solid rgba(200,168,75,0.18)",
            }}
          >
            <p className="text-xs mb-3 leading-relaxed" style={{ color: "#a89060" }}>
              The information you provide above is self-reported context to improve the accuracy of your
              compliance snapshot. By continuing, you confirm that you are authorised to share this
              information on behalf of your organisation and consent to LexSutra using it solely
              for the purpose of producing your EU AI Act compliance assessment.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setConsentError("");
                }}
                className="mt-0.5 shrink-0"
                style={{ accentColor: "#c8a84b" }}
              />
              <span className="text-xs" style={{ color: "#c8a84b" }}>
                I confirm I am authorised to share this information and I consent to LexSutra
                processing it for compliance assessment purposes.
              </span>
            </label>
            {consentError && (
              <p className="text-xs mt-2" style={{ color: "#e05252" }}>{consentError}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm px-1" style={{ color: "#e05252" }}>{serverError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-10">
            <a
              href="/portal/onboarding"
              className="text-sm"
              style={{ color: "#3d4f60", textDecoration: "underline", cursor: "pointer" }}
            >
              ← Back to options
            </a>

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 rounded-xl text-sm font-semibold transition-opacity"
              style={{
                background: isPending ? "rgba(45,156,219,0.5)" : "#2d9cdb",
                color:      "#fff",
                cursor:     isPending ? "not-allowed" : "pointer",
                opacity:    isPending ? 0.7 : 1,
              }}
            >
              {isPending ? "Saving…" : "Complete & Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function QuestionBlock({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2d9cdb" }}>
        Question {number}
      </p>
      <p className="text-sm font-medium mb-4" style={{ color: "#e8f4ff" }}>{label}</p>
      {children}
    </div>
  );
}

function RadioGroup({
  name,
  options,
  selected,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={selected === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ accentColor: "#2d9cdb" }}
            className="shrink-0"
          />
          <span className="text-sm" style={{ color: selected === opt.value ? "#e8f4ff" : "#8899aa" }}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}
