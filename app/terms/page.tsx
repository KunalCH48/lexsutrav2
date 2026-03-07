import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | LexSutra",
  description: "Terms and conditions for LexSutra's EU AI Act compliance diagnostic services. Governed by Dutch law.",
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
          <Link href="/privacy" className="nav-link text-sm">Privacy Policy</Link>
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

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-4 py-3 my-3"
      style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)" }}
    >
      <p className="text-sm" style={{ color: "#c9a84c" }}>{children}</p>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#060a14" }}>
      <Navbar />

      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* Header */}
          <div className="mb-12">
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#c9a84c" }}>Legal</p>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}>
              Terms & Conditions
            </h1>
            <p className="text-sm" style={{ color: "#3d4f60" }}>Last updated: {LAST_UPDATED}</p>
            <div
              className="mt-6 rounded-xl px-5 py-4"
              style={{ background: "rgba(45,156,219,0.07)", border: "1px solid rgba(45,156,219,0.18)" }}
            >
              <p className="text-sm" style={{ color: "#8899aa" }}>
                These terms govern the relationship between LexSutra (&ldquo;LexSutra&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;) and you (&ldquo;Client&rdquo;, &ldquo;you&rdquo;).
                By accessing the LexSutra platform or purchasing a diagnostic, you agree to these terms.
                If you are unsure about anything, email{" "}
                <a href="mailto:hello@lexsutra.eu" style={{ color: "#2d9cdb" }}>hello@lexsutra.eu</a>{" "}
                before proceeding.
              </p>
            </div>
          </div>

          {/* 1. Who we are */}
          <Section id="identity" title="1. Who We Are">
            <p>
              LexSutra is a compliance infrastructure company based in the Netherlands.
              We provide structured diagnostic tools, reports, and guidance to help businesses understand
              their obligations under the EU Artificial Intelligence Act (Regulation (EU) 2024/1689).
            </p>
            <p>
              Contact:{" "}
              <a href="mailto:hello@lexsutra.eu" style={{ color: "#2d9cdb" }}>hello@lexsutra.eu</a>
              {" "}· lexsutra.eu
            </p>
          </Section>

          {/* 2. The services */}
          <Section id="services" title="2. Our Services">
            <p>LexSutra offers the following services:</p>
            <div className="space-y-2 mt-2">
              {[
                ["Starter (€300)", "Public Footprint Pre-Scan — automated review of publicly available information about your AI systems, producing a preliminary risk classification."],
                ["Core (€2,200)", "Full Diagnostic — structured 80-question assessment across all 8 EU AI Act obligation areas, AI-assisted findings generation, human expert review, and a graded PDF compliance report."],
                ["Premium (€3,500)", "Core plus a Strategy Session with a LexSutra expert and an Investor Certificate."],
                ["Full Package (€4,500)", "Everything in Premium plus a Competitor Compliance Snapshot."],
              ].map(([tier, desc]) => (
                <div key={tier as string} className="flex gap-3">
                  <span className="font-semibold shrink-0" style={{ color: "#c9a84c" }}>{tier}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-2">
              Founding client pricing (first 3 clients): 50% discount in exchange for a testimonial and
              anonymised case study. This offer is extended at LexSutra&apos;s sole discretion.
            </p>
          </Section>

          {/* 3. Not legal advice */}
          <Section id="not-legal-advice" title="3. Not Legal Advice — Important">
            <Highlight>
              LexSutra is not a law firm. Our reports and recommendations are compliance infrastructure
              tools, not legal advice. Nothing we produce constitutes legal advice or creates a
              solicitor-client relationship.
            </Highlight>
            <p>
              Our diagnostic reports reflect LexSutra&apos;s structured methodology and interpretation
              of the EU AI Act as of the policy version stamped on your report. Regulatory interpretation
              evolves — particularly as national supervisory authorities issue guidance. We strongly
              recommend that compliance decisions are reviewed alongside qualified legal counsel.
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>You remain solely responsible for your own compliance</strong>{" "}
              under the EU AI Act and all other applicable regulations. LexSutra&apos;s role is to
              provide you with a structured, expert-reviewed starting point — not a legal guarantee
              of compliance.
            </p>
          </Section>

          {/* 4. Policy versioning */}
          <Section id="versioning" title="4. Policy Versioning & Report Validity">
            <p>
              Every LexSutra diagnostic report is permanently stamped with the version of the EU AI Act
              regulatory framework against which it was assessed. This stamp is immutable — your report&apos;s
              historical validity can always be verified against that version, even as the regulation evolves.
            </p>
            <p>
              If the regulatory framework changes materially after your report is issued, we will notify
              you. A re-assessment against the new version is a separate engagement.
            </p>
          </Section>

          {/* 5. AI use */}
          <Section id="ai" title="5. AI-Assisted Analysis">
            <Highlight>
              LexSutra uses AI assistance (Claude by Anthropic) to generate initial diagnostic findings.
              Every AI-generated finding is reviewed and approved by a human expert before delivery.
              No AI output is published in your report without human sign-off.
            </Highlight>
            <p>
              By submitting your questionnaire, you acknowledge and consent to your responses being
              processed by Anthropic&apos;s API for the purpose of generating an initial findings draft.
              This processing is covered under Anthropic&apos;s Data Processing Addendum (effective 24 Feb 2025)
              and Standard Contractual Clauses for EU-US data transfers.
            </p>
            <p>
              Full details of AI processing are in our{" "}
              <Link href="/privacy#ai" style={{ color: "#2d9cdb" }}>Privacy Policy, Section 5</Link>.
            </p>
          </Section>

          {/* 6. Client responsibilities */}
          <Section id="client-obligations" title="6. Your Responsibilities">
            <p>To receive an accurate and useful diagnostic, you agree to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>Provide accurate, complete, and honest answers in the questionnaire</li>
              <li>Upload only documents you have the right to share with us</li>
              <li>Not upload documents containing third-party confidential information without appropriate authorisation</li>
              <li>Inform us promptly if information you have provided changes materially</li>
              <li>Use the report for your own internal compliance purposes only — not to misrepresent your compliance status to regulators, investors, or third parties</li>
            </ul>
            <p className="mt-2">
              <strong style={{ color: "#e8f4ff" }}>Accuracy of inputs:</strong> The quality of your report
              depends entirely on the accuracy of information you provide. LexSutra cannot be held
              responsible for findings that are inaccurate because the underlying information was
              incomplete or incorrect.
            </p>
          </Section>

          {/* 7. Confidentiality */}
          <Section id="confidentiality" title="7. Confidentiality">
            <p>
              LexSutra treats all client information — questionnaire responses, uploaded documents,
              company details, and diagnostic findings — as strictly confidential.
            </p>
            <p>
              We will not disclose your information to third parties except:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
              <li>Our processors (as listed in the Privacy Policy) who are bound by confidentiality</li>
              <li>Where required by law or a regulatory authority</li>
              <li>With your explicit written consent</li>
            </ul>
            <p className="mt-2">
              Founding clients agree to provide a testimonial and anonymised case study. The case study
              will not identify your company or disclose specific findings without your written approval
              of the final text.
            </p>
          </Section>

          {/* 8. IP */}
          <Section id="ip" title="8. Intellectual Property">
            <p>
              <strong style={{ color: "#e8f4ff" }}>Your report:</strong> The diagnostic report we produce
              for you is yours. You own it and can use it for any lawful purpose — sharing with your
              board, investors, regulators, or legal counsel.
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>LexSutra&apos;s methodology:</strong> Our assessment
              framework, question sets, scoring methodology, and report templates remain the intellectual
              property of LexSutra You may not reproduce or commercialise our methodology without
              written permission.
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>Your data:</strong> All information you provide to us
              remains yours. We use it only to deliver the service — see our Privacy Policy for details.
            </p>
          </Section>

          {/* 9. Payment */}
          <Section id="payment" title="9. Pricing & Payment">
            <p>
              Prices are as listed on our website at the time of engagement. All prices are exclusive of
              applicable taxes unless stated otherwise. Tax treatment will be confirmed at the point
              of invoicing in accordance with applicable law.
            </p>
            <p>
              Payment is due before the diagnostic report is delivered. We reserve the right to withhold
              delivery of the report until payment is received in full.
            </p>
            <p>
              <strong style={{ color: "#e8f4ff" }}>Refunds:</strong> If we are unable to complete your
              diagnostic for reasons within our control, we will refund your payment in full. If you
              withdraw from the engagement after submitting your questionnaire and before report delivery,
              a partial fee may be retained to cover work completed.
            </p>
          </Section>

          {/* 10. Liability */}
          <Section id="liability" title="10. Liability">
            <Highlight>
              LexSutra&apos;s total liability to you under these terms is limited to the fee you paid
              for the diagnostic service in question.
            </Highlight>
            <p>
              We are not liable for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
              <li>Any regulatory fines, penalties, or enforcement action you receive</li>
              <li>Business decisions you make based on our report</li>
              <li>Inaccuracies in the report caused by information you provided</li>
              <li>Changes in regulatory interpretation after your report is issued</li>
              <li>Indirect, consequential, or special damages of any kind</li>
            </ul>
            <p className="mt-2">
              Nothing in these terms limits liability for fraud, gross negligence, or death and personal
              injury caused by our negligence.
            </p>
          </Section>

          {/* 11. Term & Termination */}
          <Section id="termination" title="11. Term & Termination">
            <p>
              These terms apply from the moment you engage with our platform (submit a demo request,
              sign up, or purchase a diagnostic) and continue until your engagement with LexSutra ends.
            </p>
            <p>
              Either party may terminate an ongoing engagement with 14 days&apos; written notice.
              Sections 3, 7, 8, and 10 survive termination indefinitely.
            </p>
            <p>
              We reserve the right to suspend or terminate your platform access if you breach these
              terms, misuse the platform, or fail to make payment.
            </p>
          </Section>

          {/* 12. Governing law */}
          <Section id="governing-law" title="12. Governing Law & Disputes">
            <p>
              These terms are governed by Dutch law. Any disputes that cannot be resolved amicably
              will be submitted to the exclusive jurisdiction of the competent court in the Netherlands.
            </p>
            <p>
              Before initiating formal proceedings, both parties agree to attempt to resolve any
              dispute through good-faith negotiation for at least 30 days.
            </p>
          </Section>

          {/* 13. Changes */}
          <Section id="changes" title="13. Changes to These Terms">
            <p>
              We will notify active clients of material changes at least 14 days before they take effect.
              Continued use of our services after that date constitutes acceptance of the revised terms.
            </p>
            <p>
              The version of these terms in force at the time of your engagement applies to that
              engagement — we do not apply new terms retroactively to completed diagnostics.
            </p>
          </Section>

          {/* Footer links */}
          <div
            className="flex flex-wrap gap-6 pt-8 mt-8 text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Link href="/privacy" className="gold-link">Privacy Policy</Link>
            <Link href="/ai-inventory" className="gold-link">AI Inventory Template</Link>
            <Link href="/" className="gold-link">← Home</Link>
          </div>

        </div>
      </main>
    </div>
  );
}
