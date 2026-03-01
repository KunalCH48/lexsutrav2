import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";

// ── Types ──────────────────────────────────────────────────────────

export type ObligationItem = {
  number: string;
  name: string;
  article: string;
  status: string;
  finding: string;
  required_action: string;
  effort: string;
  deadline: string;
};

export type StructuredReport = {
  risk_classification: string;
  risk_tier: string;
  annex_section: string;
  grade: string;
  executive_summary: string;
  obligations: ObligationItem[];
};

export type SnapshotPDFProps = {
  report: StructuredReport;
  companyName: string;
  reportRef: string;
  assessmentDate: string;
};

// ── Colour palette ─────────────────────────────────────────────────

const C = {
  blue:       "#1d6fa4",
  blueLight:  "#2d9cdb",
  dark:       "#0d1520",
  navyText:   "#8899aa",
  text:       "#1a2030",
  textMid:    "#4a5568",
  textLight:  "#6b7280",
  textGhost:  "#9ca3af",
  rule:       "#d1d5db",
  rowAlt:     "#f7f8fa",
  rowHeader:  "#e8ecf0",
  red:        "#c0392b",
  amber:      "#b7770a",
  green:      "#15803d",
  gold:       "#8b6914",
};

// ── Status helpers ─────────────────────────────────────────────────

function statusColor(s: string): string {
  if (s === "critical_gap")   return C.red;
  if (s === "partial")        return C.amber;
  if (s === "compliant")      return C.green;
  return C.textLight;
}

function statusLabel(s: string): string {
  if (s === "critical_gap")   return "CRITICAL GAP";
  if (s === "partial")        return "PARTIAL";
  if (s === "compliant")      return "COMPLIANT";
  if (s === "not_started")    return "NOT STARTED";
  if (s === "not_applicable") return "N/A";
  return s.toUpperCase().replace(/_/g, " ");
}

function priorityShort(s: string): string {
  if (s === "critical_gap" || s === "not_started") return "P1";
  if (s === "partial")      return "P2";
  if (s === "compliant")    return "P3";
  return "N/A";
}

function priorityLabel(s: string): string {
  if (s === "critical_gap") return "P1\nCRITICAL";
  if (s === "not_started")  return "P1\nHIGH";
  if (s === "partial")      return "P2\nHIGH";
  if (s === "compliant")    return "P3\nMONITOR";
  return "N/A";
}

function abbreviateArticle(a: string): string {
  return a.split("|")[0].trim().replace("Article", "Art.").trim();
}

// ── Styles ─────────────────────────────────────────────────────────

const st = StyleSheet.create({
  // Page
  page:         { fontFamily: "Helvetica", fontSize: 8.5, color: C.text, backgroundColor: "#ffffff" },

  // Header bar
  hBar:         { backgroundColor: C.dark, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingVertical: 7 },
  hLogo:        { fontSize: 10, color: "#ffffff" },
  hLogoBold:    { fontFamily: "Helvetica-Bold", color: C.blueLight },
  hMeta:        { fontSize: 6.5, color: C.navyText, letterSpacing: 0.4 },

  // Footer bar
  fBar:         { backgroundColor: "#f2f4f6", borderTopWidth: 0.5, borderTopColor: C.rule, flexDirection: "row", justifyContent: "center", paddingVertical: 6 },
  fText:        { fontSize: 6.5, color: C.textGhost },

  // Watermark
  wm:           { position: "absolute", top: "40%", left: "10%", right: "10%", textAlign: "center", opacity: 0.04 },
  wmText:       { fontFamily: "Helvetica-Bold", fontSize: 64, color: C.dark, transform: "rotate(-35deg)" },

  // Content padding
  body:         { paddingHorizontal: 36, paddingVertical: 22, flex: 1 },

  // Typography
  h1:           { fontFamily: "Times-Bold",    fontSize: 30, color: C.text,    lineHeight: 1.15, marginBottom: 3 },
  h2:           { fontFamily: "Times-Bold",    fontSize: 14, color: C.text,    borderBottomWidth: 1.5, borderBottomColor: C.blue, paddingBottom: 5, marginBottom: 12 },
  h3:           { fontFamily: "Helvetica-Bold",fontSize: 8.5, color: C.text   },
  subTitle:     { fontSize: 11, color: C.textMid, marginBottom: 18 },
  label:        { fontSize: 6.5, color: C.textGhost, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 },
  body1:        { fontSize: 8.5, color: C.text,     lineHeight: 1.65 },
  body2:        { fontSize: 8,   color: C.textMid,  lineHeight: 1.65 },
  small:        { fontSize: 7.5, color: C.textLight, lineHeight: 1.6  },

  // Grade badge (square)
  gradeBadge:   { width: 64, height: 64, borderRadius: 6, borderWidth: 1.5, borderColor: C.gold, backgroundColor: "#fdf8ee", alignItems: "center", justifyContent: "center" },
  gradeText:    { fontFamily: "Times-Bold", fontSize: 26, color: C.gold, lineHeight: 1 },

  // Metadata grid
  metaGrid:     { borderWidth: 0.5, borderColor: C.rule, borderRadius: 4, overflow: "hidden", marginTop: 18 },
  metaRow:      { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.rule },
  metaRowLast:  { flexDirection: "row" },
  metaLabel:    { width: 130, backgroundColor: C.rowHeader, paddingHorizontal: 10, paddingVertical: 7, fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.textMid },
  metaValue:    { flex: 1,   paddingHorizontal: 10, paddingVertical: 7, fontSize: 7.5, color: C.text },
  metaValueRed: { flex: 1,   paddingHorizontal: 10, paddingVertical: 7, fontSize: 7.5, color: C.red, fontFamily: "Helvetica-Bold" },

  // Risk callout box
  callout:      { borderLeftWidth: 3, borderLeftColor: C.gold, backgroundColor: "#fdf8ee", padding: 12, marginBottom: 10, borderRadius: "0 4 4 0" },
  calloutTitle: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: C.text, marginBottom: 5 },

  // Table (summary + roadmap)
  table:        { borderWidth: 0.5, borderColor: C.rule, borderRadius: 4, overflow: "hidden", marginTop: 12 },
  tHead:        { flexDirection: "row", backgroundColor: C.rowHeader, paddingHorizontal: 8, paddingVertical: 6 },
  tHeadText:    { fontFamily: "Helvetica-Bold", fontSize: 7, color: C.textMid, textTransform: "uppercase", letterSpacing: 0.4 },
  tRow:         { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: C.rule, paddingHorizontal: 8, paddingVertical: 6 },
  tRowAlt:      { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: C.rule, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: C.rowAlt },
  tCell:        { fontSize: 8, color: C.text, lineHeight: 1.5 },
  tCellGray:    { fontSize: 8, color: C.textLight, lineHeight: 1.5 },

  // Obligation card
  obCard:       { borderWidth: 0.5, borderColor: C.rule, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  obHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.rowHeader, paddingHorizontal: 10, paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: C.rule },
  obTitle:      { fontFamily: "Times-Bold", fontSize: 11, color: C.text },
  obRow:        { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: C.rule },
  obRowLabel:   { width: 90, backgroundColor: "#f9fafb", paddingHorizontal: 8, paddingVertical: 7, fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.textLight, borderRightWidth: 0.5, borderRightColor: C.rule },
  obRowValue:   { flex: 1, paddingHorizontal: 10, paddingVertical: 7, fontSize: 8, color: C.text, lineHeight: 1.6 },
  obRowValueBlue: { flex: 1, paddingHorizontal: 10, paddingVertical: 7, fontSize: 8, color: C.blue, lineHeight: 1.6 },

  // Disclaimer
  disclaimer:   { borderWidth: 0.5, borderColor: C.rule, borderRadius: 4, padding: 10, marginTop: 12 },
  disclaimerTitle: { fontFamily: "Helvetica-Bold", fontSize: 7, color: C.textMid, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  disclaimerText: { fontSize: 7, color: C.textLight, lineHeight: 1.65 },

  // Authenticity stamp
  stamp:        { borderWidth: 1, borderColor: C.gold, borderRadius: 4, padding: 12, marginTop: 12, backgroundColor: "#fdf8ee" },
  stampTitle:   { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, color: C.text, marginBottom: 6 },
  stampRow:     { flexDirection: "row", marginBottom: 3 },
  stampLabel:   { fontSize: 7.5, color: C.textMid, width: 160 },
  stampValue:   { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.text, flex: 1 },

  // Roadmap priority
  prioCell:     { width: 58, paddingHorizontal: 8, paddingVertical: 6, alignItems: "center", justifyContent: "center", borderRightWidth: 0.5, borderRightColor: C.rule },
  prioText:     { fontFamily: "Helvetica-Bold", fontSize: 7.5, textAlign: "center", lineHeight: 1.3 },
});

// ── Reusable: Page header + footer ─────────────────────────────────

function PageHeader({
  reportRef,
  companyName,
}: {
  reportRef: string;
  companyName: string;
}) {
  return (
    <View style={st.hBar} fixed>
      <Text style={st.hLogo}>
        <Text style={st.hLogoBold}>Lex</Text>Sutra
      </Text>
      <Text style={st.hMeta}>
        CONFIDENTIAL  |  {reportRef}  |  {companyName}
      </Text>
    </View>
  );
}

function PageFooter({ assessmentDate }: { assessmentDate: string }) {
  const month = new Date(assessmentDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <View style={st.fBar} fixed>
      <Text
        style={st.fText}
        render={({ pageNumber }) =>
          `Page ${pageNumber}  |  LexSutra EU AI Act Diagnostic Report  |  ${month}`
        }
      />
    </View>
  );
}

function Watermark() {
  return (
    <View style={st.wm} fixed>
      <Text style={st.wmText}>LEXSUTRA CONFIDENTIAL</Text>
    </View>
  );
}

// ── Cover page ─────────────────────────────────────────────────────

function CoverPage({
  report,
  companyName,
  reportRef,
  assessmentDate,
}: SnapshotPDFProps) {
  const criticalCount  = report.obligations.filter(o => o.status === "critical_gap").length;
  const nsCount        = report.obligations.filter(o => o.status === "not_started").length;
  const partialCount   = report.obligations.filter(o => o.status === "partial").length;
  const compliantCount = report.obligations.filter(o => o.status === "compliant").length;
  const urgentCount    = criticalCount + nsCount;

  const statsParts: string[] = [];
  if (criticalCount > 0)  statsParts.push(`${criticalCount} critical gap${criticalCount !== 1 ? "s" : ""}`);
  if (nsCount > 0)        statsParts.push(`${nsCount} not started`);
  if (partialCount > 0)   statsParts.push(`${partialCount} partial`);
  if (compliantCount > 0) statsParts.push(`${compliantCount} compliant`);

  return (
    <Page size="A4" style={st.page}>
      <PageHeader reportRef={reportRef} companyName={companyName} />
      <Watermark />

      <View style={st.body}>
        {/* Wordmark + rule */}
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 22, color: C.text }}>
            <Text style={{ color: C.blueLight }}>Lex</Text>Sutra
          </Text>
        </View>
        <View style={{ height: 1.5, backgroundColor: C.blue, marginBottom: 8 }} />

        {/* Report type label */}
        <Text style={[st.label, { marginBottom: 6 }]}>EU AI Act Compliance Diagnostic Report</Text>

        {/* Company name */}
        <Text style={st.h1}>{companyName}</Text>

        {/* Risk classification subtitle */}
        <Text style={[st.subTitle, { marginBottom: 22 }]}>
          {report.risk_classification}
        </Text>

        {/* Grade + stats row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 20 }}>
          <View style={st.gradeBadge}>
            <Text style={st.gradeText}>{report.grade}</Text>
          </View>
          <View style={{ marginLeft: 14, justifyContent: "center" }}>
            <Text style={[st.small, { marginBottom: 3 }]}>Overall Compliance Grade</Text>
            <Text style={[st.h3, { fontSize: 10, marginBottom: 4 }]}>
              {urgentCount} obligation{urgentCount !== 1 ? "s" : ""} require immediate action
            </Text>
            <Text style={st.small}>{statsParts.join("  ·  ")}</Text>
          </View>
        </View>

        {/* Metadata grid */}
        <View style={st.metaGrid}>
          {[
            ["Assessment Date",    assessmentDate, false],
            ["Report Reference",   reportRef,      false],
            ["Regulation",         "EU AI Act — Regulation (EU) 2024/1689", false],
            ["Policy Version",     "v1.0 (Active August 2024)", false],
            ["Risk Classification",report.risk_classification, true],
            ["Annex Reference",    report.annex_section || "Annex III", false],
            ["Reviewed By",        "LexSutra Expert Review", false],
            ["Confidentiality",    "Confidential", false],
          ].map(([label, value, isRed], i, arr) => (
            <View key={i} style={i === arr.length - 1 ? st.metaRowLast : st.metaRow}>
              <Text style={st.metaLabel}>{label as string}</Text>
              <Text style={isRed ? st.metaValueRed : st.metaValue}>
                {value as string}
              </Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <Text style={[st.small, { marginTop: 16, color: C.textGhost, lineHeight: 1.6 }]}>
          This report is produced by LexSutra as a compliance infrastructure tool and does not constitute legal advice.
          LexSutra is not a law firm. The client is responsible for their own regulatory compliance.
          This report should be reviewed alongside qualified legal counsel for final compliance decisions.
        </Text>
      </View>

      <PageFooter assessmentDate={assessmentDate} />
    </Page>
  );
}

// ── Executive summary page ─────────────────────────────────────────

function ExecutiveSummaryPage({
  report,
  companyName,
  reportRef,
  assessmentDate,
}: SnapshotPDFProps) {
  const paras = report.executive_summary.split(/\n\n+/);

  return (
    <Page size="A4" style={st.page}>
      <PageHeader reportRef={reportRef} companyName={companyName} />
      <Watermark />

      <View style={st.body}>
        <Text style={st.h2}>Executive Summary</Text>

        {/* Risk classification callout box */}
        <View style={st.callout}>
          <Text style={st.calloutTitle}>
            Risk Classification:{" "}
            {report.risk_tier === "high_risk" ? "HIGH-RISK AI SYSTEM" : report.risk_tier.replace(/_/g, " ").toUpperCase()}
          </Text>
          <Text style={st.body2}>{paras[0] ?? ""}</Text>
        </View>

        {/* Remaining paragraphs */}
        {paras.slice(1).map((p, i) => (
          <Text key={i} style={[st.body2, { marginBottom: 8 }]}>{p}</Text>
        ))}

        {/* Obligation summary table */}
        <View style={st.table}>
          <View style={st.tHead}>
            <Text style={[st.tHeadText, { flex: 3 }]}>Obligation</Text>
            <Text style={[st.tHeadText, { flex: 2 }]}>Status</Text>
            <Text style={[st.tHeadText, { width: 50 }]}>Priority</Text>
            <Text style={[st.tHeadText, { flex: 2 }]}>Article</Text>
          </View>
          {report.obligations.map((ob, i) => (
            <View key={ob.number} style={i % 2 === 0 ? st.tRowAlt : st.tRow}>
              <Text style={[st.tCell, { flex: 3 }]}>
                {ob.number}. {ob.name}
              </Text>
              <Text style={[st.tCell, { flex: 2, fontFamily: "Helvetica-Bold", color: statusColor(ob.status) }]}>
                {statusLabel(ob.status)}
              </Text>
              <Text style={[st.tCell, { width: 50, color: statusColor(ob.status) }]}>
                {priorityShort(ob.status)}
              </Text>
              <Text style={[st.tCellGray, { flex: 2 }]}>
                {abbreviateArticle(ob.article)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PageFooter assessmentDate={assessmentDate} />
    </Page>
  );
}

// ── Obligation assessment pages ────────────────────────────────────

function ObligationAssessmentPage({
  obligations,
  companyName,
  reportRef,
  assessmentDate,
  showHeading,
}: {
  obligations: ObligationItem[];
  companyName: string;
  reportRef: string;
  assessmentDate: string;
  showHeading: boolean;
}) {
  return (
    <Page size="A4" style={st.page}>
      <PageHeader reportRef={reportRef} companyName={companyName} />
      <Watermark />

      <View style={st.body}>
        {showHeading && (
          <Text style={st.h2}>Detailed Obligation Assessment</Text>
        )}

        {obligations.map((ob) => {
          const color = statusColor(ob.status);
          return (
            <View key={ob.number} style={st.obCard}>
              {/* Obligation header row */}
              <View style={st.obHeader}>
                <Text style={st.obTitle}>{ob.number} {ob.name}</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color, letterSpacing: 0.3 }}>
                  {statusLabel(ob.status)}
                </Text>
              </View>

              {/* Legal Basis */}
              <View style={st.obRow}>
                <Text style={st.obRowLabel}>Legal Basis</Text>
                <Text style={st.obRowValueBlue}>{ob.article}</Text>
              </View>

              {/* Finding */}
              <View style={st.obRow}>
                <Text style={st.obRowLabel}>Finding</Text>
                <Text style={st.obRowValue}>{ob.finding}</Text>
              </View>

              {/* Required Action */}
              <View style={st.obRow}>
                <Text style={st.obRowLabel}>Required Action</Text>
                <Text style={st.obRowValue}>{ob.required_action}</Text>
              </View>

              {/* Effort + Target */}
              {(ob.effort || ob.deadline) && (
                <View style={st.obRow}>
                  <Text style={st.obRowLabel}>Effort</Text>
                  <Text style={st.obRowValue}>
                    {ob.effort || "—"}
                    {ob.deadline ? `  |  Target: ${ob.deadline}` : ""}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <PageFooter assessmentDate={assessmentDate} />
    </Page>
  );
}

// ── Remediation roadmap page ───────────────────────────────────────

function RoadmapPage({
  report,
  companyName,
  reportRef,
  assessmentDate,
}: SnapshotPDFProps) {
  const items = [...report.obligations]
    .filter(o => o.status !== "not_applicable")
    .sort((a, b) => {
      const order: Record<string, number> = { critical_gap: 0, not_started: 1, partial: 2, compliant: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });

  return (
    <Page size="A4" style={st.page}>
      <PageHeader reportRef={reportRef} companyName={companyName} />
      <Watermark />

      <View style={st.body}>
        <Text style={st.h2}>Prioritised Remediation Roadmap</Text>
        <Text style={[st.body2, { marginBottom: 10 }]}>
          The following roadmap prioritises remediation actions based on severity of compliance gap,
          implementation effort, and time to the August 2026 deadline. Priority 1 items represent
          critical legal risk and should be actioned immediately.
        </Text>

        {/* Table */}
        <View style={[st.table, { marginTop: 4 }]}>
          {/* Header */}
          <View style={st.tHead}>
            <Text style={[st.tHeadText, { width: 58 }]}>Priority</Text>
            <Text style={[st.tHeadText, { flex: 3, paddingLeft: 6 }]}>Action Required</Text>
            <Text style={[st.tHeadText, { flex: 2, paddingLeft: 6 }]}>Obligation</Text>
            <Text style={[st.tHeadText, { width: 60, paddingLeft: 6 }]}>Effort</Text>
            <Text style={[st.tHeadText, { width: 60, paddingLeft: 6 }]}>Target</Text>
          </View>

          {items.map((ob, i) => {
            const color = statusColor(ob.status);
            const pLabel = priorityLabel(ob.status);
            const rowStyle = i % 2 === 0 ? st.tRowAlt : st.tRow;
            return (
              <View key={ob.number} style={[rowStyle, { paddingHorizontal: 0, paddingVertical: 0 }]}>
                {/* Priority cell */}
                <View style={[st.prioCell, { borderRightWidth: 0.5, borderRightColor: C.rule }]}>
                  {pLabel.split("\n").map((line, j) => (
                    <Text key={j} style={[st.prioText, { color }]}>{line}</Text>
                  ))}
                </View>
                {/* Action */}
                <Text style={[st.tCell, { flex: 3, paddingHorizontal: 8, paddingVertical: 6, lineHeight: 1.5 }]}>
                  {ob.required_action || "—"}
                </Text>
                {/* Obligation */}
                <View style={{ flex: 2, paddingHorizontal: 8, paddingVertical: 6 }}>
                  <Text style={[st.tCell, { fontFamily: "Helvetica-Bold" }]}>{ob.name}</Text>
                  <Text style={st.tCellGray}>{abbreviateArticle(ob.article)}</Text>
                </View>
                {/* Effort */}
                <Text style={[st.tCellGray, { width: 60, paddingHorizontal: 8, paddingVertical: 6 }]}>
                  {ob.effort || "—"}
                </Text>
                {/* Target */}
                <Text style={[st.tCellGray, { width: 60, paddingHorizontal: 8, paddingVertical: 6 }]}>
                  {ob.deadline || "—"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <PageFooter assessmentDate={assessmentDate} />
    </Page>
  );
}

// ── Methodology & Authenticity page ────────────────────────────────

function MethodologyPage({
  report,
  companyName,
  reportRef,
  assessmentDate,
}: SnapshotPDFProps) {
  return (
    <Page size="A4" style={st.page}>
      <PageHeader reportRef={reportRef} companyName={companyName} />
      <Watermark />

      <View style={st.body}>
        <Text style={st.h2}>Methodology &amp; Authenticity</Text>

        <Text style={[st.body1, { marginBottom: 10 }]}>
          This diagnostic snapshot was conducted using LexSutra&apos;s structured assessment methodology,
          which maps each EU AI Act obligation systematically against evidence gathered from public
          information: automated public footprint scan of company website, Terms of Service, privacy
          policy, and public AI-related disclosures. This snapshot precedes the full diagnostic process.
        </Text>

        <Text style={[st.body1, { marginBottom: 14 }]}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Human-in-the-Loop: </Text>
          Every LexSutra diagnostic report is reviewed and approved by a human expert before delivery.
          This is not merely a quality control measure — it reflects LexSutra&apos;s core philosophy that
          compliance assessments affecting businesses and their stakeholders require human judgement.
          We practise the same principles we help our clients implement under the EU AI Act.
        </Text>

        {/* Authenticity stamp */}
        <View style={st.stamp}>
          <Text style={st.stampTitle}>Authenticity &amp; Version Stamp</Text>
          {[
            ["Report Reference:",              reportRef],
            ["Assessment Date:",               assessmentDate],
            ["Policy Version Assessed Against:","EU AI Act v1.0 — Regulation (EU) 2024/1689"],
            ["Policy Active From:",            "August 2024"],
            ["Assessment Basis:",              "Public footprint scan — pre-diagnostic snapshot"],
            ["Reviewed and Approved By:",      "LexSutra Expert Review Team"],
          ].map(([label, value], i) => (
            <View key={i} style={st.stampRow}>
              <Text style={st.stampLabel}>{label}</Text>
              <Text style={st.stampValue}>{value}</Text>
            </View>
          ))}
          <Text style={[st.small, { marginTop: 8, color: C.textLight, lineHeight: 1.6 }]}>
            This report is permanently stamped against the above policy version. Historical validity
            of this report can be verified against the LexSutra Policy Version Archive at any time.
            Report reference {reportRef} corresponds to EU AI Act v1.0 and is immutable.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={[st.disclaimer, { marginTop: 14 }]}>
          <Text style={st.disclaimerTitle}>Disclaimer</Text>
          <Text style={[st.disclaimerText, { marginBottom: 6 }]}>
            This report is produced by LexSutra B.V. as a compliance infrastructure and diagnostic tool.
            It does not constitute legal advice and LexSutra is not a law firm. The findings,
            classifications, and recommendations reflect LexSutra&apos;s methodology and regulatory
            interpretation current at the date of assessment.
          </Text>
          <Text style={[st.disclaimerText, { marginBottom: 6 }]}>
            The client — {companyName} — is solely responsible for their own regulatory compliance under
            the EU Artificial Intelligence Act and all other applicable regulations. This report should be
            reviewed alongside qualified legal counsel before taking compliance decisions.
            LexSutra&apos;s liability is limited to the fee paid for this diagnostic service.
          </Text>
          <Text style={st.disclaimerText}>
            Money-back guarantee: If the methodology applied in this report is demonstrated to not accurately
            reflect the EU AI Act requirements as published at the date of assessment, LexSutra will provide
            a full refund of the diagnostic fee.
          </Text>
        </View>

        {/* Footer branding */}
        <Text style={[st.small, { marginTop: 16, textAlign: "center", color: C.textGhost }]}>
          LexSutra  ·  AI Compliance Diagnostic Infrastructure  ·  lexsutra.nl  ·  Netherlands
        </Text>
      </View>

      <PageFooter assessmentDate={assessmentDate} />
    </Page>
  );
}

// ── Main PDF document ──────────────────────────────────────────────

export function SnapshotPDF(props: SnapshotPDFProps) {
  const { report } = props;

  // Split obligations into groups of 2 per page
  const obligationPages: ObligationItem[][] = [];
  for (let i = 0; i < report.obligations.length; i += 2) {
    obligationPages.push(report.obligations.slice(i, i + 2));
  }

  return (
    <Document
      title={`LexSutra Compliance Snapshot — ${props.companyName}`}
      author="LexSutra"
      subject="EU AI Act Compliance Diagnostic Report"
      creator="LexSutra Diagnostic Platform"
      producer="LexSutra"
    >
      {/* Page 1 — Cover */}
      <CoverPage {...props} />

      {/* Page 2 — Executive Summary */}
      <ExecutiveSummaryPage {...props} />

      {/* Pages 3–6 — Obligation Assessment (2 per page) */}
      {obligationPages.map((group, i) => (
        <ObligationAssessmentPage
          key={i}
          obligations={group}
          companyName={props.companyName}
          reportRef={props.reportRef}
          assessmentDate={props.assessmentDate}
          showHeading={i === 0}
        />
      ))}

      {/* Roadmap page */}
      <RoadmapPage {...props} />

      {/* Methodology & Authenticity */}
      <MethodologyPage {...props} />
    </Document>
  );
}
