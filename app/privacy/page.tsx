import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | LexSutra",
  description: "How LexSutra collects, uses, and protects your data. GDPR-compliant. Data controller: LexSutra, Netherlands.",
};

const LAST_UPDATED = "March 2026";

function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: "rgba(6,10,20,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-semibold select-none" style={{ fontFamily: "var(--font-serif)" }}>
            <span style={{ color: "#c9a84c" }}>Lex</span>
            <span className="text-white">Sutra</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="nav-link text-sm">Terms & Conditions</Link>
          <Link href="/" className="nav-link text-sm hidden sm:block">← Home</Link>
        </div>
      </div>
    </nav>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2
        className="text-xl font-bold mb-4 pb-2"
        style={{
          fontFamily: "var(--font-serif)",
          color: "#e8f4ff",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#8899aa" }}>
        {children}
      </div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg my-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: "#0d1520" }}>
            {["Data", "Purpose", "Lawful Basis"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([data, purpose, basis], i) => (
            <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent" }}>
              <td className="px-4 py-3 font-medium" style={{ color: "#e8f4ff" }}>{data}</td>
              <td className="px-4 py-3" style={{ color: "#8899aa" }}>{purpose}</td>
              <td className="px-4 py-3" style={{ color: "#2d9cdb" }}>{basis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Processor({ name, location, purpose, link }: { name: string; location: string; purpose: string; link: string }) {
  return (
    <div className="rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6"
      style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="shrink-0">
        <p className="font-semibold text-sm" style={{ color: "#e8f4ff" }}>{name}</p>
        <p className="text-xs" style={{ color: "#3d4f60" }}>{location}</p>
      </div>
      <p className="flex-1 text-xs" style={{ color: "#8899aa" }}>{purpose}</p>
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs gold-link shrink-0">{link.replace("https://", "")}</a>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#060a14" }}>
      <Navbar />

      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* Header */}
          <div className="mb-12">
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#c9a84c" }}>Legal</p>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}>
              Privacy Policy
            </h1>
            <p className="text-sm" style={{ color: "#3d4f60" }}>Last updated: {LAST_UPDATED}</p>
            <div
              className="mt-6 rounded-xl px-5 py-4"
              style={{ background: "rgba(45,156,219,0.07)", border: "1px solid rgba(45,156,219,0.18)" }}
            >
              <p className="text-sm" style={{ color: "#8899aa" }}>
                LexSutra is a compliance infrastructure company. We hold ourselves to the same standards
                we help our clients meet. This policy is written in plain language — if something is unclear,
                email us at{" "}
                <a href="mailto:hello@lexsutra.com" style={{ color: "#2d9cdb" }}>hello@lexsutra.com</a>.
              </p>
            </div>
          </div>

          {/* 1. Who we are */}
          <Section id="identity" title="1. Who We Are">
            <p>
              <strong style={{ color: "#e8f4ff" }}>Data Controller:</strong> LexSutra, Netherlands.
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>Contact:</strong>{" "}
              <a href="mailto:hello@lexsutra.com" style={{ color: "#2d9cdb" }}>hello@lexsutra.com</a>
              {" "}· lexsutra.com
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>Supervisory Authority:</strong> Autoriteit Persoonsgegevens (AP), Netherlands —{" "}
              <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: "#2d9cdb" }}>
                autoriteitpersoonsgegevens.nl
              </a>
            </p>
            <p>
              LexSutra provides EU AI Act compliance diagnostic services to businesses. We are not a law firm
              and do not provide legal advice. This privacy policy applies to our website (lexsutra.com),
              our client portal, and our diagnostic platform.
            </p>
          </Section>

          {/* 2. What we collect */}
          <Section id="data-collected" title="2. What Data We Collect">
            <Table rows={[
              ["Name, email, company name", "Demo requests and enquiries from our website", "Legitimate interest — responding to business enquiries"],
              ["Company website URL", "Automated public footprint scan as part of the diagnostic", "Legitimate interest — service delivery"],
              ["Google account details (name, email)", "Authentication via Google SSO for portal access", "Contract performance"],
              ["Questionnaire responses", "Core input to the EU AI Act compliance diagnostic", "Contract performance"],
              ["Uploaded documents", "Evidence base for diagnostic findings (OTP-confirmed)", "Contract performance"],
              ["Activity logs (who did what, when)", "Security, audit trail, and compliance record-keeping", "Legitimate interest — security and legal obligation"],
              ["IP address, browser type", "Security and fraud prevention", "Legitimate interest — security"],
              ["Error logs", "Platform reliability and debugging", "Legitimate interest — service improvement"],
            ]} />
            <p>
              We do not collect or process special category data (health, biometric, political, religious data)
              and we do not collect data about individuals under 18.
            </p>
          </Section>

          {/* 3. How we use it */}
          <Section id="use" title="3. How We Use Your Data">
            <p>We use your data only for the purposes listed above. Specifically:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To deliver the compliance diagnostic service you have contracted with us</li>
              <li>To generate AI-assisted findings drafts (see Section 5 — AI Processing)</li>
              <li>To send you your diagnostic report and related communications</li>
              <li>To respond to demo requests and pre-sales enquiries</li>
              <li>To maintain security, prevent fraud, and keep an audit trail</li>
              <li>To comply with our own legal obligations</li>
            </ul>
            <p>
              We do not sell your data. We do not use your data for advertising. We do not share your data
              with third parties except as described in Section 4.
            </p>
          </Section>

          {/* 4. Processors */}
          <Section id="processors" title="4. Data Processors & Third Parties">
            <p>
              We share data with the following processors, all under written data processing agreements.
              These companies act only on our instructions and cannot use your data for their own purposes.
            </p>
            <div className="space-y-2 mt-4">
              <Processor
                name="Supabase"
                location="EU region (Frankfurt, Germany)"
                purpose="Database, file storage, and authentication. All client data, documents, and questionnaire responses are stored here."
                link="https://supabase.com/privacy"
              />
              <Processor
                name="Anthropic"
                location="United States (EU transfer covered — see Section 5)"
                purpose="AI-assisted findings generation. Questionnaire responses are sent to Claude (Anthropic) to generate initial diagnostic drafts, reviewed by our team before delivery."
                link="https://anthropic.com/legal/data-processing-addendum"
              />
              <Processor
                name="Resend"
                location="United States"
                purpose="Transactional email — OTP codes, portal access links, diagnostic notifications."
                link="https://resend.com/privacy"
              />
              <Processor
                name="Vercel"
                location="EU edge network"
                purpose="Hosting and serving the LexSutra platform."
                link="https://vercel.com/legal/privacy-policy"
              />
            </div>
            <p className="mt-3">
              We will notify you if we add or change processors that handle your personal data.
            </p>
          </Section>

          {/* 5. AI Processing */}
          <Section id="ai" title="5. AI-Assisted Processing">
            <div
              className="rounded-lg px-4 py-3 mb-3"
              style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)" }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: "#c9a84c" }}>Transparency about AI use</p>
              <p style={{ color: "#8899aa" }}>
                LexSutra uses Claude, an AI model developed by Anthropic, to assist in generating
                initial diagnostic findings. This is disclosed here, in our Terms & Conditions, and
                on every report we deliver.
              </p>
            </div>
            <p>
              When you submit your questionnaire, your responses are transmitted to Anthropic&apos;s API
              to generate a first-draft assessment of your EU AI Act compliance position. This draft is
              then reviewed, edited, and approved by a LexSutra human expert before it is included in
              your report. <strong style={{ color: "#e8f4ff" }}>No AI-generated finding is delivered to you without human review.</strong>
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>Legal basis for transfer to Anthropic (US):</strong> The transfer
              is covered under Standard Contractual Clauses (SCCs) incorporated into Anthropic&apos;s Data
              Processing Addendum, effective 24 February 2025. Anthropic processes data only as a
              data processor acting on our instructions.
            </p>
            <p>
              Anthropic&apos;s DPA is available at:{" "}
              <a href="https://anthropic.com/legal/data-processing-addendum" target="_blank" rel="noopener noreferrer" style={{ color: "#2d9cdb" }}>
                anthropic.com/legal/data-processing-addendum
              </a>
            </p>
          </Section>

          {/* 6. International transfers */}
          <Section id="transfers" title="6. International Data Transfers">
            <p>
              Your data is stored in the EU (Supabase, Frankfurt). The only transfer outside the EU is
              to Anthropic (US) for AI-assisted analysis, covered by SCCs as described in Section 5.
              Resend (email) also processes data in the US — covered under their standard DPA and SCCs.
            </p>
            <p>
              We do not transfer data to countries without adequate protection unless SCCs or equivalent
              safeguards are in place.
            </p>
          </Section>

          {/* 7. Retention */}
          <Section id="retention" title="7. Data Retention">
            <Table rows={[
              ["Client documents (uploaded)", "18 months minimum from upload date, then deleted unless actively used in an ongoing engagement", "Legal obligation + contract"],
              ["Diagnostic questionnaire responses", "Duration of client relationship + 5 years for audit purposes", "Legitimate interest — legal compliance"],
              ["Diagnostic reports", "Duration of client relationship + 5 years", "Contract + legitimate interest"],
              ["Demo request data", "2 years from enquiry date if no contract is formed", "Legitimate interest"],
              ["Activity & audit logs", "12 months rolling", "Legitimate interest — security"],
              ["Error logs", "90 days rolling", "Legitimate interest — service reliability"],
              ["Authentication data", "Until account deletion is requested", "Contract performance"],
            ]} />
            <p>
              When retention periods expire, data is permanently deleted from all systems including
              backups. You can request early deletion — see Section 8.
            </p>
          </Section>

          {/* 8. Your rights */}
          <Section id="rights" title="8. Your Rights Under GDPR">
            <p>You have the following rights. To exercise any of them, email{" "}
              <a href="mailto:hello@lexsutra.com" style={{ color: "#2d9cdb" }}>hello@lexsutra.com</a>.
              We will respond within 30 days.
            </p>
            <div className="space-y-2 mt-3">
              {[
                ["Access", "Request a copy of all personal data we hold about you."],
                ["Rectification", "Ask us to correct inaccurate data."],
                ["Erasure", "Ask us to delete your data ('right to be forgotten'). We will comply unless we have a legal obligation to retain it."],
                ["Portability", "Receive your data in a structured, machine-readable format."],
                ["Objection", "Object to processing based on legitimate interest. We will stop unless we have compelling grounds."],
                ["Restriction", "Ask us to pause processing while a dispute is resolved."],
                ["Withdraw consent", "Where processing is based on consent, you can withdraw at any time without affecting prior processing."],
              ].map(([right, desc]) => (
                <div key={right as string} className="flex gap-3">
                  <span className="font-semibold shrink-0 w-28" style={{ color: "#e8f4ff" }}>{right}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-3">
              If you are unsatisfied with our response, you have the right to lodge a complaint with the
              Autoriteit Persoonsgegevens:{" "}
              <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" style={{ color: "#2d9cdb" }}>
                autoriteitpersoonsgegevens.nl
              </a>
            </p>
          </Section>

          {/* 9. Cookies */}
          <Section id="cookies" title="9. Cookies">
            <p>
              We use only technically necessary cookies — session cookies required for authentication
              and security. We do not use advertising cookies, tracking pixels, or third-party analytics
              cookies. No cookie consent banner is required for technically necessary cookies under the
              ePrivacy Directive.
            </p>
            <p>
              If we add analytics in future, we will update this policy and implement a consent mechanism
              before doing so.
            </p>
          </Section>

          {/* 10. Changes */}
          <Section id="changes" title="10. Changes to This Policy">
            <p>
              We will notify active clients by email of any material changes to this policy at least
              14 days before they take effect. The &ldquo;last updated&rdquo; date at the top of this page
              always reflects the current version.
            </p>
          </Section>

          {/* 11. Contact */}
          <Section id="contact" title="11. Contact">
            <p>
              For any privacy-related questions, data requests, or complaints:
            </p>
            <div
              className="rounded-lg px-5 py-4 mt-3"
              style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p style={{ color: "#e8f4ff" }}><strong>LexSutra</strong></p>
              <p>Netherlands</p>
              <p>
                <a href="mailto:hello@lexsutra.com" style={{ color: "#2d9cdb" }}>hello@lexsutra.com</a>
              </p>
              <p>
                <a href="https://lexsutra.com" style={{ color: "#2d9cdb" }}>lexsutra.com</a>
              </p>
            </div>
          </Section>

          {/* Footer links */}
          <div
            className="flex flex-wrap gap-6 pt-8 mt-8 text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Link href="/terms" className="gold-link">Terms & Conditions</Link>
            <Link href="/ai-inventory" className="gold-link">AI Inventory Template</Link>
            <Link href="/" className="gold-link">← Home</Link>
          </div>

        </div>
      </main>
    </div>
  );
}
