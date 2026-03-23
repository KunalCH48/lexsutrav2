import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Line,
} from "@react-pdf/renderer";
import React from "react";

function ShieldLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d="M32 6 L56 15 L56 35 Q56 52 32 61 Q8 52 8 35 L8 15 Z"
        stroke="#c8a84b"
        strokeWidth={2.5}
        fill="rgba(200,168,75,0.10)"
        strokeLinejoin="round"
      />
      <Circle cx={32} cy={28} r={4} fill="#c8a84b" />
      <Circle cx={19} cy={21} r={2.5} fill="#2d9cdb" />
      <Circle cx={45} cy={21} r={2.5} fill="#2d9cdb" />
      <Circle cx={19} cy={37} r={2.5} fill="#2d9cdb" />
      <Circle cx={45} cy={37} r={2.5} fill="#2d9cdb" />
      <Circle cx={32} cy={46} r={2}   fill="#2d9cdb" opacity={0.65} />
      <Line x1={19} y1={21} x2={32} y2={28} stroke="#2d9cdb" strokeWidth={1.2} opacity={0.5} />
      <Line x1={45} y1={21} x2={32} y2={28} stroke="#2d9cdb" strokeWidth={1.2} opacity={0.5} />
      <Line x1={19} y1={37} x2={32} y2={28} stroke="#2d9cdb" strokeWidth={1.2} opacity={0.5} />
      <Line x1={45} y1={37} x2={32} y2={28} stroke="#2d9cdb" strokeWidth={1.2} opacity={0.5} />
      <Line x1={32} y1={46} x2={32} y2={32} stroke="#2d9cdb" strokeWidth={1.2} opacity={0.4} />
      <Line x1={19} y1={21} x2={45} y2={21} stroke="#2d9cdb" strokeWidth={0.8} opacity={0.28} />
      <Line x1={19} y1={37} x2={45} y2={37} stroke="#2d9cdb" strokeWidth={0.8} opacity={0.28} />
      <Line x1={19} y1={21} x2={19} y2={37} stroke="#2d9cdb" strokeWidth={0.8} opacity={0.28} />
      <Line x1={45} y1={21} x2={45} y2={37} stroke="#2d9cdb" strokeWidth={0.8} opacity={0.28} />
    </Svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ObligationItem = {
  number: string;
  name: string;
  article: string;
  status: string;
  finding: string;
};

export type RiskBriefProps = {
  companyName: string;
  riskClassification: string;
  riskTier: string;
  annexSection: string;
  obligations: ObligationItem[]; // exactly 2
  reportRef: string;
  assessmentDate: string;
};

// ── Colours ────────────────────────────────────────────────────────────────

const C = {
  bg:          "#ffffff",
  cream:       "#f4f0e8",
  blue:        "#1d6fa4",
  blueLight:   "#2d9cdb",
  dark:        "#080c14",
  darkCard:    "#0d1520",
  text:        "#1a2030",
  textMid:     "#4a5568",
  textLight:   "#6b7280",
  textGhost:   "#9ca3af",
  rule:        "#d1d5db",
  red:         "#c0392b",
  redBg:       "#fef2f2",
  redBorder:   "#f5c6c6",
  amber:       "#b7770a",
  amberBg:     "#fffbeb",
  amberBorder: "#f5dfa0",
  green:       "#15803d",
  greenBg:     "#f0fdf4",
  greenBorder: "#bbf7d0",
  gold:        "#8b6914",
  goldLight:   "#c8a84b",
  rowHeader:   "#e8ecf0",
};

function statusColor(s: string): string {
  if (s === "critical_gap") return C.red;
  if (s === "not_started")  return C.amber;
  if (s === "partial")      return C.amber;
  if (s === "compliant")    return C.green;
  return C.textLight;
}

function statusBg(s: string): string {
  if (s === "critical_gap") return C.redBg;
  if (s === "not_started")  return C.amberBg;
  if (s === "partial")      return C.amberBg;
  if (s === "compliant")    return C.greenBg;
  return "#f9fafb";
}

function statusBorderColor(s: string): string {
  if (s === "critical_gap") return C.redBorder;
  if (s === "not_started")  return C.amberBorder;
  if (s === "partial")      return C.amberBorder;
  if (s === "compliant")    return C.greenBorder;
  return C.rule;
}

function statusLabel(s: string): string {
  if (s === "critical_gap") return "CRITICAL GAP";
  if (s === "not_started")  return "NOT STARTED / NO EVIDENCE FOUND";
  if (s === "partial")      return "PARTIAL COMPLIANCE";
  if (s === "compliant")    return "COMPLIANT";
  return s.toUpperCase().replace(/_/g, " ");
}

// ── Styles ─────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 8.5, color: C.text, backgroundColor: C.bg },

  // Header band (dark)
  hBar:         { backgroundColor: C.dark, paddingHorizontal: 28, paddingVertical: 16 },
  hLabel:       { fontSize: 7, color: C.blueLight, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  hTitle:       { fontFamily: "Times-Bold", fontSize: 26, color: C.goldLight, letterSpacing: 0.5, marginBottom: 4 },
  hSub:         { fontSize: 8.5, color: "#8899aa" },

  // Content area
  body:         { paddingHorizontal: 28, paddingVertical: 20, flex: 1 },

  // Meta strip (cream bg)
  metaStrip:    { backgroundColor: C.cream, paddingHorizontal: 28, paddingVertical: 12, flexDirection: "row", gap: 32, borderBottomWidth: 1, borderBottomColor: "#e2ddd4" },
  metaItem:     { flexDirection: "column", gap: 2 },
  metaLabel:    { fontSize: 6.5, color: C.textGhost, letterSpacing: 0.8, textTransform: "uppercase" },
  metaValue:    { fontSize: 8.5, color: C.text },

  // Section heading
  sectionTitle: { fontFamily: "Times-Bold", fontSize: 13, color: C.text, borderBottomWidth: 1.5, borderBottomColor: C.blue, paddingBottom: 5, marginBottom: 12 },
  sectionNote:  { fontSize: 7.5, color: C.textLight, fontStyle: "italic", marginTop: -8, marginBottom: 14 },

  // Context card
  contextCard:  { borderWidth: 0.5, borderColor: C.rule, borderRadius: 4, padding: 14, marginBottom: 14 },
  contextTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text, marginBottom: 8 },
  contextPara:  { fontSize: 8.5, color: C.textMid, lineHeight: 1.7, marginBottom: 7 },

  // Risk classification callout
  riskCallout:  { borderLeftWidth: 3, borderLeftColor: C.gold, backgroundColor: "#fdf8ee", padding: 12, marginBottom: 14 },
  riskTitle:    { fontFamily: "Helvetica-Bold", fontSize: 8, color: C.gold, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  riskText:     { fontSize: 8.5, color: C.text, lineHeight: 1.65 },

  // Deadline callout
  deadlineBox:  { backgroundColor: "#fff8f8", borderWidth: 0.5, borderColor: "#f5c6c6", borderRadius: 4, padding: 12, flexDirection: "row", gap: 10 },
  deadlinePill: { backgroundColor: C.red, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  deadlinePillText: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#ffffff", letterSpacing: 0.3 },
  deadlineText: { flex: 1, fontSize: 8.5, color: C.text, lineHeight: 1.65 },

  // Obligation card
  obCard:       { borderWidth: 0.5, borderRadius: 4, overflow: "hidden", marginBottom: 14 },
  obHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 0.5 },
  obNumber:     { fontSize: 7, color: C.textGhost, letterSpacing: 0.5, marginBottom: 2 },
  obTitle:      { fontFamily: "Times-Bold", fontSize: 12, lineHeight: 1.2 },
  obArticle:    { fontSize: 7, color: C.textLight, letterSpacing: 0.3 },
  obBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 0.5 },
  obBadgeText:  { fontFamily: "Helvetica-Bold", fontSize: 6.5, letterSpacing: 0.4 },
  obBody:       { paddingHorizontal: 12, paddingVertical: 10 },
  obFindingLabel: { fontSize: 6.5, color: C.textGhost, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 },
  obFinding:    { fontSize: 8.5, color: C.textMid, lineHeight: 1.7 },
  obRedacted:   { borderWidth: 0.5, borderColor: C.rule, borderRadius: 3, backgroundColor: "#f7f8fa", paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 },
  obRedactedText: { fontSize: 8, color: C.textGhost, fontStyle: "italic", lineHeight: 1.6 },

  // Disclaimer
  disclaimer:   { borderWidth: 0.5, borderColor: "#e5e7eb", borderRadius: 4, backgroundColor: "#fafafa", padding: 12, marginTop: 6 },
  disclaimerTitle: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.textMid, marginBottom: 5, letterSpacing: 0.3 },
  disclaimerText:  { fontSize: 7.5, color: C.textLight, lineHeight: 1.65 },

  // CTA box
  ctaBox:       { backgroundColor: C.dark, borderRadius: 4, padding: 16, marginTop: 12 },
  ctaTag:       { fontSize: 7, color: C.blueLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  ctaTitle:     { fontFamily: "Times-Bold", fontSize: 13, color: "#e8f4ff", marginBottom: 6 },
  ctaBody:      { fontSize: 8.5, color: "#8899aa", lineHeight: 1.65, marginBottom: 10 },
  ctaHighlight: { flexDirection: "row", gap: 16 },
  ctaItem:      { flex: 1, backgroundColor: "rgba(45,156,219,0.08)", borderWidth: 0.5, borderColor: "rgba(45,156,219,0.2)", borderRadius: 3, padding: 8 },
  ctaItemLabel: { fontSize: 6.5, color: C.blueLight, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 },
  ctaItemValue: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#e8f4ff" },

  // Footer
  footer:       { backgroundColor: "#f2f4f6", borderTopWidth: 0.5, borderTopColor: C.rule, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 28, paddingVertical: 7 },
  footerText:   { fontSize: 6.5, color: C.textGhost },
});

// ── Page 1: Cover + EU AI Act Context ─────────────────────────────────────

function CoverContextPage({ props }: { props: RiskBriefProps }) {
  const { companyName, riskClassification, riskTier, annexSection, reportRef, assessmentDate } = props;

  return (
    <Page size="A4" style={st.page}>
      {/* Dark header */}
      <View style={st.hBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <ShieldLogo size={36} />
          <View>
            <Text style={st.hLabel}>EU AI Act Compliance</Text>
            <Text style={st.hTitle}>Compliance Risk Brief</Text>
          </View>
        </View>
        <Text style={st.hSub}>Indicative Assessment — Confidential · lexsutra.com</Text>
      </View>

      {/* Meta strip */}
      <View style={st.metaStrip}>
        <View style={st.metaItem}>
          <Text style={st.metaLabel}>Prepared For</Text>
          <Text style={[st.metaValue, { fontFamily: "Helvetica-Bold" }]}>{companyName}</Text>
        </View>
        <View style={st.metaItem}>
          <Text style={st.metaLabel}>Assessment Date</Text>
          <Text style={st.metaValue}>{assessmentDate}</Text>
        </View>
        <View style={st.metaItem}>
          <Text style={st.metaLabel}>Reference</Text>
          <Text style={st.metaValue}>{reportRef}</Text>
        </View>
        <View style={st.metaItem}>
          <Text style={st.metaLabel}>Basis</Text>
          <Text style={st.metaValue}>Public information only</Text>
        </View>
      </View>

      <View style={st.body}>
        {/* Section title */}
        <Text style={st.sectionTitle}>EU AI Act — What This Means for {companyName}</Text>

        {/* Risk classification */}
        <View style={st.riskCallout}>
          <Text style={st.riskTitle}>Risk Classification</Text>
          <Text style={st.riskText}>
            Based on publicly available information, {companyName} appears to operate AI systems that fall under the{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              {riskTier === "high_risk" ? "High-Risk" : riskTier === "prohibited" ? "Prohibited" : riskTier === "limited_risk" ? "Limited-Risk" : "High-Risk"}
            </Text>{" "}
            category of the EU AI Act.
            {annexSection ? ` The relevant Annex III category is: ${annexSection}.` : ""}
            {"\n\n"}
            {riskClassification}
          </Text>
        </View>

        {/* EU AI Act context */}
        <View style={st.contextCard}>
          <Text style={st.contextTitle}>EU AI Act — Regulatory Background</Text>
          <Text style={st.contextPara}>
            Regulation (EU) 2024/1689 — the EU AI Act — is the world&apos;s first comprehensive legal framework for artificial intelligence. It applies to any AI system placed on the market or put into service in the EU, regardless of where the developer is incorporated. AI startups building or deploying AI products affecting EU residents are directly in scope.
          </Text>
          <Text style={st.contextPara}>
            The Act establishes a four-tier risk classification. High-risk AI systems — which include AI used in recruitment, credit scoring, HR management, and other areas directly impacting individuals — are subject to the most stringent obligations: documented risk management, data governance controls, technical documentation, human oversight mechanisms, and pre-market conformity assessment.
          </Text>
          <Text style={st.contextPara}>
            Enforcement powers are already active. Finland became the first EU member state with operational enforcement authority in December 2025, with other EU national market surveillance authorities expected to follow by mid-2026. The regulatory window for voluntary preparation is closing.
          </Text>
          <Text style={[st.contextPara, { marginBottom: 0 }]}>
            Non-compliant organisations face fines of up to <Text style={{ fontFamily: "Helvetica-Bold" }}>€35 million or 7% of global annual turnover</Text> for violations of prohibited AI practices, and up to <Text style={{ fontFamily: "Helvetica-Bold" }}>€15 million or 3%</Text> for other obligation failures — whichever is higher.
          </Text>
        </View>

        {/* Deadline */}
        <View style={st.deadlineBox}>
          <View>
            <View style={st.deadlinePill}>
              <Text style={st.deadlinePillText}>DEADLINE</Text>
            </View>
          </View>
          <Text style={st.deadlineText}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>2 August 2026</Text> is the compliance deadline for high-risk AI systems under EU AI Act Chapter III. This leaves organisations less than 12 months to assess obligations, close gaps, and complete conformity assessment. For many companies, this timeline is already tight.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={st.footer}>
        <Text style={st.footerText}>LexSutra · Compliance Risk Brief · {reportRef}</Text>
        <Text style={st.footerText}>Page 1 of 2</Text>
        <Text style={st.footerText}>EU AI Act Compliance Diagnostics</Text>
      </View>
    </Page>
  );
}

// ── Page 2: Obligation Findings + Disclaimer + CTA ─────────────────────────

function FindingsPage({ props }: { props: RiskBriefProps }) {
  const { companyName, obligations, reportRef } = props;

  return (
    <Page size="A4" style={st.page}>
      {/* Compact header */}
      <View style={[st.hBar, { paddingVertical: 10 }]}>
        <Text style={[st.hSub, { fontSize: 7.5, color: C.goldLight }]}>LexSutra · Compliance Risk Brief · {companyName}</Text>
      </View>

      <View style={st.body}>
        <Text style={st.sectionTitle}>Selected Obligation Findings</Text>
        <Text style={st.sectionNote}>
          2 of 8 obligation areas shown below. A full LexSutra diagnostic covers all eight EU AI Act obligations with graded findings, legal citations, and a prioritised remediation roadmap.
        </Text>

        {obligations.map((ob) => {
          const color  = statusColor(ob.status);
          const bg     = statusBg(ob.status);
          const border = statusBorderColor(ob.status);
          return (
            <View key={ob.number} wrap={false} style={[st.obCard, { borderColor: border }]}>
              {/* Card header */}
              <View style={[st.obHeader, { backgroundColor: bg, borderBottomColor: border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={st.obNumber}>OBLIGATION {ob.number}</Text>
                  <Text style={[st.obTitle, { color }]}>{ob.name}</Text>
                  <Text style={st.obArticle}>{ob.article}</Text>
                </View>
                <View style={[st.obBadge, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[st.obBadgeText, { color }]}>{statusLabel(ob.status)}</Text>
                </View>
              </View>

              {/* Finding */}
              <View style={st.obBody}>
                <Text style={st.obFindingLabel}>Finding</Text>
                <Text style={st.obFinding}>{ob.finding}</Text>

                {/* Redacted remediation — teaser */}
                <View style={st.obRedacted}>
                  <Text style={st.obRedactedText}>
                    ▬▬▬ Required actions, remediation steps, and effort estimate are included in the full LexSutra Diagnostic Report. Contact us to commission the full assessment. ▬▬▬
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* CTA */}
        <View style={st.ctaBox}>
          <Text style={st.ctaTag}>Next Step</Text>
          <Text style={st.ctaTitle}>Commission the Full Diagnostic Report</Text>
          <Text style={st.ctaBody}>
            The full LexSutra diagnostic covers all 8 obligation areas — each with a compliance grade, specific findings, legal article citations, and a prioritised remediation roadmap. Every report includes human expert review and is version-stamped against the current EU AI Act text.
          </Text>
          <View style={st.ctaHighlight}>
            <View style={st.ctaItem}>
              <Text style={st.ctaItemLabel}>Coverage</Text>
              <Text style={st.ctaItemValue}>All 8 EU AI Act Obligations</Text>
            </View>
            <View style={st.ctaItem}>
              <Text style={st.ctaItemLabel}>Delivery</Text>
              <Text style={st.ctaItemValue}>Graded PDF + Remediation Roadmap</Text>
            </View>
            <View style={st.ctaItem}>
              <Text style={st.ctaItemLabel}>Contact</Text>
              <Text style={st.ctaItemValue}>hello@lexsutra.com</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={st.disclaimer}>
          <Text style={st.disclaimerTitle}>Important Notice — Indicative Assessment Only</Text>
          <Text style={st.disclaimerText}>
            This Compliance Risk Brief is produced by LexSutra and is based solely on publicly available information at the time of assessment. It is provided for indicative purposes only and does not constitute legal advice, a legal opinion, or a formal compliance certification. LexSutra is a compliance infrastructure tool provider, not a law firm.
            {"\n\n"}
            LexSutra accepts no liability for decisions made on the basis of this document. The findings presented reflect the state of publicly available information and may not represent the full compliance posture of the organisation. Internal documentation, processes, and controls that are not publicly disclosed are outside the scope of this assessment.
            {"\n\n"}
            For a complete, evidence-based assessment, contact LexSutra to commission a full diagnostic engagement.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={st.footer}>
        <Text style={st.footerText}>LexSutra · Compliance Risk Brief · {reportRef}</Text>
        <Text style={st.footerText}>Page 2 of 2</Text>
        <Text style={st.footerText}>lexsutra.com · hello@lexsutra.com</Text>
      </View>
    </Page>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function RiskBriefPDF(props: RiskBriefProps) {
  return (
    <Document
      title={`LexSutra Compliance Risk Brief — ${props.companyName}`}
      author="LexSutra"
      subject="EU AI Act Compliance Risk Brief"
      keywords="EU AI Act, compliance, risk brief"
    >
      <CoverContextPage props={props} />
      <FindingsPage props={props} />
    </Document>
  );
}
