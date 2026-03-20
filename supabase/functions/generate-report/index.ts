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
      ? `Du är en senior arbetsmiljöingenjör (SAM-certifierad) som skriver en formell ${reportTypeLabel.toLowerCase()} för ledningen. Rapporten ska vara formell, professionell och skriven i löpande text — INTE i punktform.

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
Skriv en formell, professionell rapport i LÖPANDE TEXT. Undvik punktlistor helt. Varje sektion ska vara sammanhängande prosa med fullständiga meningar och stycken. Rapporten ska kunna presenteras direkt till ledningen som ett formellt dokument.

Sektionerna:
1. SAMMANFATTNING: Ett sammanhängande stycke (6-10 meningar) som ger en övergripande bild av periodens arbetsmiljöstatus. Inkludera nyckeltal naturligt i texten.
2. RISKANALYS: 2-4 stycken som analyserar de viktigaste riskerna, deras allvarlighetsgrad och rekommenderade åtgärder. Skriv i löpande text, inte punktform.
3. TRENDER OCH MÖNSTER: 1-3 stycken som beskriver observerade trender, återkommande mönster och utveckling över perioden.
4. POSITIVA RESULTAT: 1-2 stycken som lyfter fram förbättringar, framsteg och positiva utvecklingar.
5. ÅTGÄRDSPLAN: 2-3 stycken som beskriver rekommenderade åtgärder framåt, med prioritering och ansvarsfördelning integrerat i texten.
6. SLUTSATS: Ett avslutande stycke som sammanfattar helhetsbilden och blickar framåt.

Svara ALLTID med generate_report-verktyget.`
      : `You are a senior occupational health and safety engineer (SAM-certified) writing a formal ${reportTypeLabel.toLowerCase()} for management. The report must be formal, professional and written in flowing prose — NOT bullet points.

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
Write a formal, professional report in FLOWING PROSE. Avoid bullet points entirely. Each section should be coherent prose with complete sentences and paragraphs. The report should be presentable directly to management as a formal document.

Sections:
1. EXECUTIVE SUMMARY: A coherent paragraph (6-10 sentences) providing an overall picture of the period's safety status. Include key metrics naturally in the text.
2. RISK ANALYSIS: 2-4 paragraphs analyzing the most important risks, their severity and recommended measures. Write in flowing prose, not bullet points.
3. TRENDS AND PATTERNS: 1-3 paragraphs describing observed trends, recurring patterns and development over the period.
4. POSITIVE RESULTS: 1-2 paragraphs highlighting improvements, progress and positive developments.
5. ACTION PLAN: 2-3 paragraphs describing recommended actions going forward, with prioritization and responsibility integrated in the text.
6. CONCLUSION: A closing paragraph summarizing the overall picture and looking ahead.

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
