/**
 * Professional PDF template for formal risk/safety reports
 * Designed to complement enterprise-grade safety documentation
 */

interface PDFSection {
  key: string;
  sv: string;
  en: string;
  number: string;
}

const SECTIONS: PDFSection[] = [
  { key: "summary", sv: "Sammanfattning", en: "Executive Summary", number: "1" },
  { key: "risk_analysis", sv: "Riskanalys och bedömning", en: "Risk Analysis and Assessment", number: "2" },
  { key: "trends", sv: "Trender och mönster", en: "Trends and Patterns", number: "3" },
  { key: "improvements", sv: "Positiva resultat och förbättringar", en: "Positive Results and Improvements", number: "4" },
  { key: "action_plan", sv: "Åtgärdsplan och rekommendationer", en: "Action Plan and Recommendations", number: "5" },
  { key: "conclusion", sv: "Slutsats och framåtblick", en: "Conclusion and Outlook", number: "6" },
];

export function generateFormalPDF(
  content: any,
  title: string,
  lang: string,
  projectName?: string | null,
  periodLabel?: string | null,
  documentType?: string
) {
  const t = (sv: string, en: string) => lang === "en" ? en : sv;
  const isProseFormat = typeof content.risk_analysis === "string";
  const dateStr = new Date().toLocaleDateString(lang === "en" ? "en-US" : "sv-SE", {
    year: "numeric", month: "long", day: "numeric"
  });

  const typeLabels: Record<string, Record<string, string>> = {
    monthly: { sv: "Månadsrapport", en: "Monthly Report" },
    quarterly: { sv: "Kvartalsrapport", en: "Quarterly Report" },
    yearly: { sv: "Årsrapport", en: "Annual Report" },
  };
  const typeLabel = documentType ? (typeLabels[documentType]?.[lang] ?? title) : title;

  // Build table of contents
  let tocHtml = `<div class="toc">
    <h2 class="toc-title">${t("Innehållsförteckning", "Table of Contents")}</h2>`;

  const activeSections = isProseFormat
    ? SECTIONS.filter(s => content[s.key])
    : SECTIONS.filter(s => {
        if (s.key === "summary") return !!content.summary;
        if (s.key === "risk_analysis") return content.key_risks?.length > 0;
        if (s.key === "trends") return content.trends?.length > 0;
        if (s.key === "improvements") return content.improvements?.length > 0;
        if (s.key === "action_plan") return content.action_plan?.length > 0;
        if (s.key === "conclusion") return !!content.conclusion;
        return false;
      });

  activeSections.forEach((s, i) => {
    const num = i + 1;
    tocHtml += `<div class="toc-entry"><span class="toc-num">${num}.</span><span class="toc-text">${t(s.sv, s.en)}</span></div>`;
  });
  tocHtml += `</div>`;

  // Build content sections
  let bodyHtml = "";
  if (isProseFormat) {
    activeSections.forEach((s, i) => {
      const text = content[s.key];
      if (!text) return;
      const num = i + 1;
      bodyHtml += `<h2><span class="section-num">${num}.</span> ${t(s.sv, s.en)}</h2>`;
      bodyHtml += text.split("\n").filter(Boolean).map((p: string) => `<p>${p}</p>`).join("");
    });
  } else {
    // Legacy format rendered as prose
    let sectionNum = 1;
    if (content.summary) {
      bodyHtml += `<h2><span class="section-num">${sectionNum}.</span> ${t("Sammanfattning", "Executive Summary")}</h2><p>${content.summary}</p>`;
      sectionNum++;
    }
    if (content.key_risks?.length) {
      bodyHtml += `<h2><span class="section-num">${sectionNum}.</span> ${t("Riskanalys och bedömning", "Risk Analysis and Assessment")}</h2>`;
      content.key_risks.forEach((r: any) => {
        bodyHtml += `<p><strong>${r.risk}</strong> — ${r.recommendation}</p>`;
      });
      sectionNum++;
    }
    if (content.trends?.length) {
      bodyHtml += `<h2><span class="section-num">${sectionNum}.</span> ${t("Trender och mönster", "Trends and Patterns")}</h2>`;
      content.trends.forEach((tr: string) => { bodyHtml += `<p>${tr}</p>`; });
      sectionNum++;
    }
    if (content.improvements?.length) {
      bodyHtml += `<h2><span class="section-num">${sectionNum}.</span> ${t("Positiva resultat och förbättringar", "Positive Results and Improvements")}</h2>`;
      content.improvements.forEach((imp: string) => { bodyHtml += `<p>${imp}</p>`; });
      sectionNum++;
    }
    if (content.action_plan?.length) {
      bodyHtml += `<h2><span class="section-num">${sectionNum}.</span> ${t("Åtgärdsplan och rekommendationer", "Action Plan and Recommendations")}</h2>`;
      content.action_plan.forEach((a: any) => { bodyHtml += `<p><strong>${a.action}</strong> — ${t("Ansvarig", "Responsible")}: ${a.responsible}</p>`; });
    }
  }

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { 
      margin: 2.8cm 2.5cm 3cm 2.5cm; 
      size: A4;
      @bottom-center {
        content: counter(page);
        font-size: 9pt;
        color: #999;
      }
    }
    @page :first { margin-top: 0; }

    * { box-sizing: border-box; }

    body { 
      font-family: 'Georgia', 'Times New Roman', 'Cambria', serif; 
      font-size: 11pt; 
      line-height: 1.75; 
      color: #1a1a1a; 
      counter-reset: page;
    }

    /* ── COVER PAGE ── */
    .cover { 
      page-break-after: always; 
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 3cm 2cm;
    }
    .cover-type {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 3pt;
      color: #666;
      margin-bottom: 16pt;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
    }
    .cover h1 { 
      font-size: 28pt; 
      font-weight: 700; 
      margin: 0 0 8pt 0;
      color: #111; 
      line-height: 1.2;
    }
    .cover .project-name { 
      font-size: 16pt; 
      color: #333; 
      margin-bottom: 6pt;
      font-style: italic;
    }
    .cover .period { 
      font-size: 13pt; 
      color: #555; 
    }
    .cover-line { 
      width: 80pt; 
      height: 2.5pt; 
      background: #1e3a5f; 
      margin: 28pt auto; 
      border: none;
    }
    .cover-meta {
      margin-top: 40pt;
      font-size: 9.5pt;
      color: #888;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
    }
    .cover-meta div { margin: 3pt 0; }
    .cover-disclaimer {
      margin-top: 48pt;
      font-size: 8pt;
      color: #aaa;
      max-width: 340pt;
      line-height: 1.4;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
    }

    /* ── TABLE OF CONTENTS ── */
    .toc {
      page-break-after: always;
      padding-top: 48pt;
    }
    .toc-title {
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 24pt;
      color: #1a1a1a;
      border-bottom: 2pt solid #1e3a5f;
      padding-bottom: 8pt;
    }
    .toc-entry {
      display: flex;
      align-items: baseline;
      padding: 6pt 0;
      border-bottom: 0.5pt dotted #ccc;
      font-size: 11pt;
    }
    .toc-num {
      width: 24pt;
      font-weight: 700;
      color: #1e3a5f;
      flex-shrink: 0;
    }
    .toc-text { color: #333; }

    /* ── SECTION HEADINGS ── */
    h2 { 
      font-size: 14pt; 
      font-weight: 700; 
      margin-top: 32pt; 
      margin-bottom: 14pt; 
      color: #1a1a1a; 
      border-bottom: 1.5pt solid #1e3a5f; 
      padding-bottom: 6pt; 
      page-break-after: avoid;
    }
    .section-num { 
      color: #1e3a5f; 
      margin-right: 6pt;
    }

    /* ── BODY TEXT ── */
    p { 
      margin: 0 0 11pt 0; 
      text-align: justify; 
      hyphens: auto;
      orphans: 3;
      widows: 3;
    }
    p strong { color: #111; }

    /* ── FOOTER ── */
    .doc-footer { 
      margin-top: 48pt; 
      padding-top: 14pt; 
      border-top: 1pt solid #ccc; 
      font-size: 8.5pt; 
      color: #999; 
      text-align: center;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
    }
    .doc-footer .confidential {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      margin-top: 6pt;
      color: #bbb;
    }
  </style>
</head>
<body>
  <!-- COVER PAGE -->
  <div class="cover">
    <div class="cover-type">${typeLabel}</div>
    <h1>${t("Arbetsmiljörapport", "Occupational Safety Report")}</h1>
    ${projectName ? `<div class="project-name">${projectName}</div>` : ""}
    ${periodLabel ? `<div class="period">${periodLabel}</div>` : ""}
    <hr class="cover-line" />
    <div class="cover-meta">
      <div>${t("Utfärdad", "Issued")}: ${dateStr}</div>
      <div>${t("Dokumenttyp", "Document type")}: ${typeLabel}</div>
      <div>${t("Klassificering", "Classification")}: ${t("Intern", "Internal")}</div>
    </div>
    <div class="cover-disclaimer">
      ${t(
        "Denna rapport är framtagen baserat på inrapporterade riskobservationer och skadeanmälningar under angiven period. Rapporten är avsedd som underlag för systematiskt arbetsmiljöarbete (SAM) enligt AFS 2001:1.",
        "This report is based on reported risk observations and injury reports during the specified period. The report is intended as documentation for systematic work environment management."
      )}
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  ${tocHtml}

  <!-- REPORT CONTENT -->
  ${bodyHtml}

  <!-- FOOTER -->
  <div class="doc-footer">
    ${t("Genererad av RiskRadar", "Generated by RiskRadar")} · ${dateStr}
    <div class="confidential">${t("Konfidentiellt — Endast för internt bruk", "Confidential — Internal use only")}</div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 600);
}
