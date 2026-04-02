import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reports, project_name, period_label, report_type, language } = await req.json();
    const lang = language === "en" ? "en" : "sv";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const totalReports = reports.length;
    const observations = reports.filter((r: any) => r.report_type === "observation").length;
    const injuries = reports.filter((r: any) => r.report_type === "injury").length;
    const resolved = reports.filter((r: any) => r.status === "resolved").length;
    const critical = reports.filter((r: any) => r.risk_level === "critical").length;
    const high = reports.filter((r: any) => r.risk_level === "high").length;
    const medium = reports.filter((r: any) => r.risk_level === "medium").length;
    const low = reports.filter((r: any) => r.risk_level === "low").length;

    const injuryReports = reports.filter((r: any) => r.report_type === "injury");
    const totalAbsenceDays = injuryReports.reduce((sum: number, r: any) => sum + (r.absence_days || 0), 0);
    const medicalCareCount = injuryReports.filter((r: any) => r.medical_care_required).length;

    const categories: Record<string, number> = {};
    reports.forEach((r: any) => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });
    const categoryList = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `  - ${cat}: ${count}`)
      .join("\n");

    const locations: Record<string, number> = {};
    reports.forEach((r: any) => {
      const loc = r.specific_location || r.building || (lang === "sv" ? "Okänt" : "Unknown");
      locations[loc] = (locations[loc] || 0) + 1;
    });
    const locationList = Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([loc, count]) => `  - ${loc}: ${count}`)
      .join("\n");

    const reportDetails = reports.map((r: any) =>
      `[${r.report_type}] ${r.title} | ${lang === "sv" ? "Kategori" : "Category"}: ${r.category} | Risk: ${r.risk_level} | ${lang === "sv" ? "Plats" : "Location"}: ${r.specific_location || r.building || "-"} | Status: ${r.status}${r.ai_explanation ? ` | AI: ${r.ai_explanation.substring(0, 200)}` : ""}${r.suggested_actions?.length ? ` | ${lang === "sv" ? "Åtgärder" : "Actions"}: ${r.suggested_actions.join("; ")}` : ""}`
    ).join("\n");

    const typeLabels: Record<string, Record<string, string>> = {
      monthly: { sv: "Månadsrapport", en: "Monthly Report" },
      quarterly: { sv: "Kvartalsrapport", en: "Quarterly Report" },
      yearly: { sv: "Årsrapport", en: "Yearly Report" },
    };
    const reportTypeLabel = typeLabels[report_type]?.[lang] ?? typeLabels.monthly[lang];

    const prompt = lang === "sv"
      ? `Du är en senior arbetsmiljöingenjör (SAM-certifierad) som skriver en formell ${reportTypeLabel.toLowerCase()} som ska kunna användas som en del av ett företags systematiska arbetsmiljöarbete (SAM) enligt AFS 2001:1. Rapporten ska hålla samma standard som professionella konsultrapporter inom arbetsmiljö.

RAPPORTMETADATA:
- Rapporttyp: ${reportTypeLabel}
- Projekt: ${project_name || "Alla projekt"}
- Period: ${period_label}

NYCKELTAL:
- Totalt antal rapporter: ${totalReports}
- Riskobservationer: ${observations}
- Skadeanmälningar: ${injuries}
- Åtgärdade: ${resolved} (${totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0}%)
- Risknivåer: Kritisk: ${critical}, Hög: ${high}, Medel: ${medium}, Låg: ${low}
- Skadeanmälningar med sjukvård: ${medicalCareCount}
- Total frånvaro p.g.a. skador: ${totalAbsenceDays} dagar

KATEGORIER:
${categoryList || "  Inga rapporter"}

PLATSER:
${locationList || "  Inga rapporter"}

SAMTLIGA RAPPORTER:
${reportDetails || "Inga rapporter för perioden."}

INSTRUKTIONER:
Skriv en formell, professionell rapport som håller konsultkvalitet. Rapporten ska:
- Vara skriven helt i LÖPANDE TEXT utan punktlistor
- Använda formellt språk som passar för ledningsgruppsmöten och myndighetsgranskning
- Referera till relevanta föreskrifter (AFS) där det är tillämpligt
- Inkludera nyckeltal och statistik naturligt invävt i texten
- Kunna användas som formell dokumentation i SAM-arbetet
- Ha en professionell och objektiv ton genomgående

Sektionerna ska vara utförliga och substantiella:
1. SAMMANFATTNING: 8-12 meningar. Övergripande bild av periodens arbetsmiljöstatus med nyckeltal, allvarligaste riskerna och åtgärdsgrad.
2. RISKANALYS OCH BEDÖMNING: 3-5 stycken. Djupgående analys av identifierade risker, allvarlighetsgrad, bakomliggande orsaker och rekommenderade åtgärder. Referera till AFS-krav vid behov.
3. TRENDER OCH MÖNSTER: 2-3 stycken. Analys av trender i rapporteringen, återkommande riskområden, geografiska mönster och utveckling jämfört med förväntningar.
4. POSITIVA RESULTAT OCH FÖRBÄTTRINGAR: 1-3 stycken. Dokumentera framsteg, förbättringar och positiv utveckling som stärker säkerhetskulturen.
5. ÅTGÄRDSPLAN OCH REKOMMENDATIONER: 2-4 stycken. Konkreta, prioriterade åtgärder med tidsramar och ansvarsfördelning integrerat i texten. Koppla till identifierade risker.
6. SLUTSATS OCH FRAMÅTBLICK: 1-2 stycken. Sammanfattande bedömning och strategisk framåtblick.

Svara ALLTID med generate_report-verktyget.`
      : `You are a senior occupational health and safety engineer (SAM-certified) writing a formal ${reportTypeLabel.toLowerCase()} that can serve as part of a company's systematic work environment management. The report must meet the standards of professional consulting reports.

REPORT METADATA:
- Report type: ${reportTypeLabel}
- Project: ${project_name || "All projects"}
- Period: ${period_label}

KEY METRICS:
- Total reports: ${totalReports}
- Risk observations: ${observations}
- Injury reports: ${injuries}
- Resolved: ${resolved} (${totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0}%)
- Risk levels: Critical: ${critical}, High: ${high}, Medium: ${medium}, Low: ${low}
- Injuries requiring medical care: ${medicalCareCount}
- Total absence due to injuries: ${totalAbsenceDays} days

CATEGORIES:
${categoryList || "  No reports"}

LOCATIONS:
${locationList || "  No reports"}

ALL REPORTS:
${reportDetails || "No reports for this period."}

INSTRUCTIONS:
Write a formal, professional report of consulting quality. The report must:
- Be written entirely in FLOWING PROSE without bullet points
- Use formal language suitable for board meetings and regulatory review
- Reference relevant safety regulations where applicable
- Include key metrics and statistics naturally woven into the prose
- Serve as formal documentation in systematic safety management
- Maintain a professional and objective tone throughout

Sections should be thorough and substantive:
1. EXECUTIVE SUMMARY: 8-12 sentences. Overall picture of the period's safety status with key metrics, most critical risks and resolution rate.
2. RISK ANALYSIS AND ASSESSMENT: 3-5 paragraphs. In-depth analysis of identified risks, severity, root causes and recommended countermeasures.
3. TRENDS AND PATTERNS: 2-3 paragraphs. Trend analysis, recurring risk areas, geographical patterns and development.
4. POSITIVE RESULTS AND IMPROVEMENTS: 1-3 paragraphs. Document progress and positive developments strengthening the safety culture.
5. ACTION PLAN AND RECOMMENDATIONS: 2-4 paragraphs. Concrete, prioritized actions with timelines and responsibility integrated naturally.
6. CONCLUSION AND OUTLOOK: 1-2 paragraphs. Summary assessment and strategic forward look.

ALWAYS respond with the generate_report tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: lang === "en"
              ? "You are a senior occupational health and safety engineer writing formal, professional reports in flowing prose for construction industry management. Your reports are known for their formal tone, complete sentences and professional language. Never use bullet points. Always respond using the generate_report tool."
              : "Du är en senior arbetsmiljöingenjör som skriver formella, professionella rapporter i löpande text för ledningen inom bygg- och anläggningsbranschen. Dina rapporter är kända för sin formella ton, fullständiga meningar och professionella språk. Använd aldrig punktlistor. Svara alltid med generate_report-verktyget.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: lang === "en"
                ? "Generate a formal, prose-style occupational health and safety report"
                : "Generera en formell arbetsmiljörapport i löpande text",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: lang === "en"
                      ? "Executive summary as a coherent paragraph (6-10 sentences) with key metrics woven into the prose. No bullet points."
                      : "Sammanfattning som ett sammanhängande stycke (6-10 meningar) med nyckeltal invävda i texten. Inga punktlistor.",
                  },
                  risk_analysis: {
                    type: "string",
                    description: lang === "en"
                      ? "2-4 paragraphs of flowing prose analyzing the most important risks, their severity, frequency and recommended countermeasures. No bullet points."
                      : "2-4 stycken löpande text som analyserar de viktigaste riskerna, deras allvarlighetsgrad, frekvens och rekommenderade motåtgärder. Inga punktlistor.",
                  },
                  trends: {
                    type: "string",
                    description: lang === "en"
                      ? "1-3 paragraphs of flowing prose describing observed trends, recurring patterns and development over the period. No bullet points."
                      : "1-3 stycken löpande text som beskriver observerade trender, återkommande mönster och utveckling. Inga punktlistor.",
                  },
                  improvements: {
                    type: "string",
                    description: lang === "en"
                      ? "1-2 paragraphs of flowing prose highlighting improvements, progress and positive developments. No bullet points."
                      : "1-2 stycken löpande text som lyfter fram förbättringar, framsteg och positiva utvecklingar. Inga punktlistor.",
                  },
                  action_plan: {
                    type: "string",
                    description: lang === "en"
                      ? "2-3 paragraphs of flowing prose describing recommended actions with prioritization and responsibility integrated naturally. No bullet points."
                      : "2-3 stycken löpande text som beskriver rekommenderade åtgärder med prioritering och ansvar integrerat naturligt. Inga punktlistor.",
                  },
                  conclusion: {
                    type: "string",
                    description: lang === "en"
                      ? "A closing paragraph summarizing the overall picture and looking ahead. No bullet points."
                      : "Ett avslutande stycke som sammanfattar helhetsbilden och blickar framåt. Inga punktlistor.",
                  },
                },
                required: ["summary", "risk_analysis", "trends", "improvements", "action_plan", "conclusion"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: lang === "sv" ? "Rate limited, försök igen senare." : "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: lang === "sv" ? "Betalning krävs." : "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: "Could not generate report." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
