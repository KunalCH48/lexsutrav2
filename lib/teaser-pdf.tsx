import {
  Document, Page, View, Text, StyleSheet, Svg, Path,
} from "@react-pdf/renderer";
import React from "react";

// ── Types ──────────────────────────────────────────────────────────

export type ObligationItem = {
  number:           string;
  name:             string;
  article:          string;
  status:           string;
  finding:          string;
  required_action:  string;
  effort:           string;
  deadline:         string;
  confidence?:      "low" | "medium" | "high";
  confidence_reason?: string;
  commercial_impact?: string;
};

export type TeaserPDFProps = {
  obligation:     ObligationItem;
  companyName:    string;
  reportRef:      string;
  assessmentDate: string;
  totalCount:     number;
  criticalCount:  number;
};

// ── Colours ────────────────────────────────────────────────────────

const C = {
  cream:     "#f4f0e8",
  paper:     "#ffffff",
  dark:      "#1a1a2e",
  mid:       "#3a3a5e",
  muted:     "#6b6a7a",
  gold:      "#c8a84b",
  goldLight: "#f5efd4",
  blue:      "#1d6fa4",
  rule:      "#ddd8cc",

  red:    "#c0392b", redBg:    "#fef2f2",
  orange: "#c05500", orangeBg: "#fff4ed",
  amber:  "#b7770a", amberBg:  "#fffbeb",
  green:  "#15803d", greenBg:  "#f0fdf4",
};

function sc(s: string)  { return s === "critical_gap" ? C.red : s === "not_started" ? C.orange : s === "partial" ? C.amber : C.green; }
function sbg(s: string) { return s === "critical_gap" ? C.redBg : s === "not_started" ? C.orangeBg : s === "partial" ? C.amberBg : C.greenBg; }
function sl(s: string)  { return s === "critical_gap" ? "CRITICAL GAP" : s === "not_started" ? "NO EVIDENCE FOUND" : s === "partial" ? "PARTIAL COMPLIANCE" : "COMPLIANT"; }

// ── Styles ─────────────────────────────────────────────────────────

const st = StyleSheet.create({
  page:          { fontFamily: "Helvetica", backgroundColor: C.cream, fontSize: 9, color: C.dark, paddingBottom: 44 },

  // Header
  headerBar:     { backgroundColor: C.dark, paddingHorizontal: 32, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLogo:    { flexDirection: "row", alignItems: "center", gap: 7 },
  headerLogoTxt: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 0.5 },
  headerAccent:  { color: C.gold },
  headerDate:    { fontSize: 7.5, color: "#8899aa" },

  // Content
  content:       { paddingHorizontal: 36, paddingTop: 22 },

  // Title section
  titleSection:  { marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.rule },
  eyebrow:       { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.1, color: C.muted, marginBottom: 5 },
  titleMain:     { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 4 },
  titleSub:      { fontSize: 8.5, color: C.muted, lineHeight: 1.55 },

  // Obligation card
  obCard:        { borderWidth: 1.5, borderRadius: 4, overflow: "hidden", marginBottom: 18 },
  obHeader:      { paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  obHeaderLeft:  { flex: 1, paddingRight: 8 },
  obTitle:       { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 3 },
  obArticle:     { fontSize: 8, color: C.blue },
  obBadge:       { paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 3 },
  obBadgeTxt:    { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: 0.4 },
  obBody:        { paddingHorizontal: 14, paddingBottom: 14, backgroundColor: C.paper },
  obRow:         { marginTop: 11 },
  obRowLabel:    { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 1, color: C.muted, marginBottom: 3 },
  obRowValue:    { fontSize: 8.5, color: C.dark, lineHeight: 1.65 },
  obMeta:        { flexDirection: "row", marginTop: 11, gap: 20 },
  obMetaItem:    { flexDirection: "row", gap: 5 },
  obMetaLbl:     { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted },
  obMetaVal:     { fontSize: 7.5, color: C.dark },

  // CTA
  ctaBox:        { backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.gold, borderRadius: 4, padding: 14 },
  ctaTitle:      { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 5 },
  ctaBody:       { fontSize: 8.5, color: C.mid, lineHeight: 1.65 },
  ctaRef:        { fontSize: 7, color: C.muted, marginTop: 8 },

  // Footer
  footer:        { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 36, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.rule, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.cream },
  footerTxt:     { fontSize: 7, color: C.muted },
});

// ── Shield logo ────────────────────────────────────────────────────

function Shield({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M32 6 L56 15 L56 35 Q56 52 32 61 Q8 52 8 35 L8 15 Z" stroke={C.gold} strokeWidth="4" fill="none" />
      <Path d="M24 32 L30 38 L40 26" stroke={C.gold} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ── Component ──────────────────────────────────────────────────────

export function TeaserPDF({
  obligation, companyName, reportRef, assessmentDate, totalCount, criticalCount,
}: TeaserPDFProps) {
  const color = sc(obligation.status);
  const bg    = sbg(obligation.status);
  const label = sl(obligation.status);

  return (
    <Document title={`${companyName} — LexSutra Compliance Teaser`} author="LexSutra">
      <Page size="A4" style={st.page}>

        {/* Header */}
        <View style={st.headerBar} fixed>
          <View style={st.headerLogo}>
            <Shield size={18} />
            <Text style={st.headerLogoTxt}>
              <Text style={st.headerAccent}>Lex</Text>Sutra
            </Text>
          </View>
          <Text style={st.headerDate}>COMPLIANCE TEASER BRIEF · {assessmentDate.toUpperCase()}</Text>
        </View>

        <View style={st.content}>

          {/* Title */}
          <View style={st.titleSection}>
            <Text style={st.eyebrow}>PRELIMINARY EU AI ACT ASSESSMENT — PUBLIC FOOTPRINT ONLY</Text>
            <Text style={st.titleMain}>{companyName}</Text>
            <Text style={st.titleSub}>
              This teaser highlights one compliance finding from a preliminary assessment across {totalCount} EU AI Act obligations.
              {criticalCount > 0
                ? ` ${criticalCount} critical gap${criticalCount > 1 ? "s were" : " was"} identified.`
                : ""}
            </Text>
          </View>

          {/* Obligation card */}
          <View style={[st.obCard, { borderColor: color }]}>

            <View style={[st.obHeader, { backgroundColor: bg }]}>
              <View style={st.obHeaderLeft}>
                <Text style={st.obTitle}>{obligation.number}. {obligation.name}</Text>
                <Text style={st.obArticle}>{obligation.article}</Text>
              </View>
              <View style={[st.obBadge, { backgroundColor: color }]}>
                <Text style={st.obBadgeTxt}>{label}</Text>
              </View>
            </View>

            <View style={st.obBody}>
              <View style={st.obRow}>
                <Text style={st.obRowLabel}>FINDING</Text>
                <Text style={st.obRowValue}>{obligation.finding}</Text>
              </View>
              <View style={st.obRow}>
                <Text style={st.obRowLabel}>REQUIRED ACTION</Text>
                <Text style={st.obRowValue}>{obligation.required_action}</Text>
              </View>
              {(obligation.effort || obligation.deadline) && (
                <View style={st.obMeta}>
                  {obligation.effort && (
                    <View style={st.obMetaItem}>
                      <Text style={st.obMetaLbl}>Effort:</Text>
                      <Text style={st.obMetaVal}>{obligation.effort}</Text>
                    </View>
                  )}
                  {obligation.deadline && (
                    <View style={st.obMetaItem}>
                      <Text style={st.obMetaLbl}>Target:</Text>
                      <Text style={st.obMetaVal}>{obligation.deadline}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* CTA */}
          <View style={st.ctaBox}>
            <Text style={st.ctaTitle}>
              This is one of {totalCount} obligations assessed under EU AI Act Regulation (EU) 2024/1689
            </Text>
            <Text style={st.ctaBody}>
              The full LexSutra diagnostic covers all {totalCount} mandatory obligations (Articles 9–15 and Article 43),
              producing a graded PDF report with legal citations and a prioritised remediation roadmap —
              reviewed by a human expert. The high-risk AI compliance deadline is 2 August 2026.
            </Text>
            <Text style={st.ctaRef}>
              Ref: {reportRef} · Based on publicly available information only. This brief does not constitute legal advice.
              LexSutra is a compliance infrastructure tool, not a law firm.
            </Text>
          </View>

        </View>

        {/* Footer */}
        <View style={st.footer} fixed>
          <Text style={st.footerTxt}>LexSutra · AI Compliance Diagnostic Infrastructure · lexsutra.com · Netherlands</Text>
          <Text style={st.footerTxt}>{reportRef}</Text>
        </View>

      </Page>
    </Document>
  );
}
