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

// ── Bank details — update when IBAN available ──────────────────────
const BANK = {
  name: "To be confirmed",
  iban: "[IBAN — to be added]",
  bic:  "[BIC — to be added]",
};

// ── Types ──────────────────────────────────────────────────────────

export type InvoiceLineItem = {
  description: string;
  qty:         number;
  unitPrice:   number;
};

export type InvoicePDFProps = {
  invoiceNumber: string;
  issuedAt:      string; // ISO string
  dueAt:         string; // ISO string
  companyName:   string;
  contactEmail:  string;
  tier:          string | null;
  lineItems:     InvoiceLineItem[];
  notes:         string | null;
};

// ── Shield logo (SVG) ──────────────────────────────────────────────

function ShieldLogo({ size = 26 }: { size?: number }) {
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
    </Svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(n);
}

// ── Styles ─────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    fontSize:        10,
    color:           "#1a1a2e",
    backgroundColor: "#f4f0e8",
    padding:         48,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems:    "flex-start",
    marginBottom:  6,
  },
  logoBlock: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
    flex:          1,
  },
  wordmark: {
    fontSize:   20,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a2e",
    letterSpacing: -0.3,
  },
  wordmarkBlue: {
    color: "#2d9cdb",
  },
  invoiceLabel: {
    fontSize:      28,
    fontFamily:    "Helvetica-Bold",
    color:         "#1a1a2e",
    letterSpacing: 1,
    textAlign:     "right",
  },

  // Gold divider
  divider: {
    height:        2,
    backgroundColor: "#c8a84b",
    marginVertical:  16,
  },

  // Two-column from/to
  fromTo: {
    flexDirection: "row",
    marginBottom:  24,
    gap:           24,
  },
  fromToCol: {
    flex: 1,
  },
  colLabel: {
    fontSize:       8,
    fontFamily:     "Helvetica-Bold",
    color:          "#8899aa",
    letterSpacing:  1,
    textTransform:  "uppercase",
    marginBottom:   6,
  },
  colValue: {
    fontSize:   10,
    color:      "#1a1a2e",
    lineHeight: 1.6,
  },
  colValueBold: {
    fontSize:   11,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a2e",
    marginBottom: 2,
  },

  // Meta table (Invoice #, dates)
  metaBox: {
    backgroundColor: "rgba(200,168,75,0.08)",
    borderRadius:    4,
    padding:         12,
    marginBottom:    24,
    flexDirection:   "row",
    gap:             24,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize:   8,
    color:      "#8899aa",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  metaValue: {
    fontSize:   10,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a2e",
  },

  // Line items table
  tableHeader: {
    flexDirection:   "row",
    backgroundColor: "#1a1a2e",
    padding:         "6 10",
    borderRadius:    3,
    marginBottom:    4,
  },
  tableHeaderCell: {
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#e8f4ff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom:  "1 solid rgba(26,26,46,0.1)",
    padding:       "8 10",
  },
  tableRowAlt: {
    backgroundColor: "rgba(200,168,75,0.04)",
  },
  colDesc: {
    flex:     4,
    fontSize: 10,
    color:    "#1a1a2e",
  },
  colQty: {
    flex:      1,
    fontSize:  10,
    color:     "#1a1a2e",
    textAlign: "center",
  },
  colPrice: {
    flex:      2,
    fontSize:  10,
    color:     "#1a1a2e",
    textAlign: "right",
  },
  colTotal: {
    flex:      2,
    fontSize:  10,
    fontFamily: "Helvetica-Bold",
    color:     "#1a1a2e",
    textAlign: "right",
  },

  // Totals
  totalsBlock: {
    alignItems:   "flex-end",
    marginTop:    12,
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: "row",
    width:         200,
    marginBottom:  4,
  },
  totalsLabel: {
    flex:     1,
    fontSize: 10,
    color:    "#8899aa",
  },
  totalsValue: {
    fontSize:  10,
    color:     "#1a1a2e",
    textAlign: "right",
    minWidth:  80,
  },
  totalsFinalLabel: {
    flex:       1,
    fontSize:   12,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a2e",
  },
  totalsFinalValue: {
    fontSize:   12,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a2e",
    textAlign:  "right",
    minWidth:   80,
  },
  totalsDivider: {
    height:          1,
    backgroundColor: "#1a1a2e",
    width:           200,
    marginVertical:  6,
  },

  // Payment box
  paymentBox: {
    backgroundColor: "rgba(45,156,219,0.08)",
    borderRadius:    4,
    padding:         14,
    marginBottom:    24,
    borderLeft:      "3 solid #2d9cdb",
  },
  paymentTitle: {
    fontSize:   9,
    fontFamily: "Helvetica-Bold",
    color:      "#2d9cdb",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom:  4,
  },
  paymentLabel: {
    fontSize:  9,
    color:     "#8899aa",
    width:     90,
  },
  paymentValue: {
    fontSize:   9,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a2e",
    flex:       1,
  },
  paymentNote: {
    fontSize:    9,
    color:       "#5a6a7a",
    marginTop:   8,
    fontStyle:   "italic",
  },

  // Notes
  notesBox: {
    backgroundColor: "rgba(26,26,46,0.04)",
    borderRadius:    4,
    padding:         10,
    marginBottom:    16,
  },
  notesLabel: {
    fontSize:   8,
    fontFamily: "Helvetica-Bold",
    color:      "#8899aa",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  notesText: {
    fontSize:   9,
    color:      "#3d4f60",
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position:    "absolute",
    bottom:      24,
    left:        48,
    right:       48,
    flexDirection: "row",
    alignItems:  "center",
    borderTop:   "1 solid rgba(26,26,46,0.15)",
    paddingTop:  8,
  },
  footerText: {
    fontSize: 8,
    color:    "#8899aa",
    flex:     1,
  },
  footerRight: {
    fontSize: 8,
    color:    "#c8a84b",
  },
});

// ── Main PDF component ─────────────────────────────────────────────

export function InvoicePDF({
  invoiceNumber,
  issuedAt,
  dueAt,
  companyName,
  contactEmail,
  lineItems,
  notes,
}: InvoicePDFProps) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0);

  return (
    <Document
      title={`Invoice ${invoiceNumber} — LexSutra`}
      author="LexSutra"
      subject="EU AI Act Compliance Diagnostic Invoice"
    >
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View style={S.logoBlock}>
            <ShieldLogo size={26} />
            {/* Using Text instead of nested spans — @react-pdf doesn't support nested color spans */}
            <Text style={S.wordmark}>LexSutra</Text>
          </View>
          <Text style={S.invoiceLabel}>INVOICE</Text>
        </View>

        {/* ── Gold divider ── */}
        <View style={S.divider} />

        {/* ── From / To ── */}
        <View style={S.fromTo}>
          <View style={S.fromToCol}>
            <Text style={S.colLabel}>From</Text>
            <Text style={S.colValueBold}>LexSutra</Text>
            <Text style={S.colValue}>
              AI Compliance Diagnostic{"\n"}
              KVK: 42020470{"\n"}
              Netherlands{"\n"}
              hello@lexsutra.com{"\n"}
              lexsutra.com
            </Text>
          </View>
          <View style={S.fromToCol}>
            <Text style={S.colLabel}>Bill To</Text>
            <Text style={S.colValueBold}>{companyName}</Text>
            <Text style={S.colValue}>{contactEmail}</Text>
          </View>
        </View>

        {/* ── Invoice meta ── */}
        <View style={S.metaBox}>
          <View style={S.metaItem}>
            <Text style={S.metaLabel}>Invoice Number</Text>
            <Text style={S.metaValue}>{invoiceNumber}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLabel}>Issue Date</Text>
            <Text style={S.metaValue}>{fmtDate(issuedAt)}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLabel}>Due Date</Text>
            <Text style={S.metaValue}>{fmtDate(dueAt)}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLabel}>Payment Terms</Text>
            <Text style={S.metaValue}>14 days net</Text>
          </View>
        </View>

        {/* ── Line items table ── */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 4 }]}>Description</Text>
          <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Qty</Text>
          <Text style={[S.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Unit Price</Text>
          <Text style={[S.tableHeaderCell, { flex: 2, textAlign: "right" }]}>Total</Text>
        </View>

        {lineItems.map((li, i) => (
          <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
            <Text style={S.colDesc}>{li.description}</Text>
            <Text style={S.colQty}>{li.qty}</Text>
            <Text style={S.colPrice}>{fmtEur(li.unitPrice)}</Text>
            <Text style={S.colTotal}>{fmtEur(li.qty * li.unitPrice)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={S.totalsBlock}>
          <View style={S.totalsRow}>
            <Text style={S.totalsLabel}>Subtotal</Text>
            <Text style={S.totalsValue}>{fmtEur(subtotal)}</Text>
          </View>
          <View style={S.totalsRow}>
            <Text style={S.totalsLabel}>VAT (pending registration)</Text>
            <Text style={S.totalsValue}>€0.00</Text>
          </View>
          <View style={S.totalsDivider} />
          <View style={S.totalsRow}>
            <Text style={S.totalsFinalLabel}>TOTAL DUE</Text>
            <Text style={S.totalsFinalValue}>{fmtEur(subtotal)}</Text>
          </View>
        </View>

        {/* ── Payment instructions ── */}
        <View style={S.paymentBox}>
          <Text style={S.paymentTitle}>Payment Instructions</Text>
          <View style={S.paymentRow}>
            <Text style={S.paymentLabel}>Method</Text>
            <Text style={S.paymentValue}>Bank Transfer</Text>
          </View>
          <View style={S.paymentRow}>
            <Text style={S.paymentLabel}>Bank</Text>
            <Text style={S.paymentValue}>{BANK.name}</Text>
          </View>
          <View style={S.paymentRow}>
            <Text style={S.paymentLabel}>IBAN</Text>
            <Text style={S.paymentValue}>{BANK.iban}</Text>
          </View>
          <View style={S.paymentRow}>
            <Text style={S.paymentLabel}>BIC</Text>
            <Text style={S.paymentValue}>{BANK.bic}</Text>
          </View>
          <View style={S.paymentRow}>
            <Text style={S.paymentLabel}>Reference</Text>
            <Text style={S.paymentValue}>{invoiceNumber}</Text>
          </View>
          <Text style={S.paymentNote}>
            Please use the invoice number as payment reference. Payment due within 14 days of issue date.
          </Text>
        </View>

        {/* ── Notes (if any) ── */}
        {notes ? (
          <View style={S.notesBox}>
            <Text style={S.notesLabel}>Notes</Text>
            <Text style={S.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            LexSutra · lexsutra.com · KVK: 42020470 · Netherlands · VAT number pending registration
          </Text>
          <Text style={S.footerRight}>{invoiceNumber}</Text>
        </View>

      </Page>
    </Document>
  );
}
