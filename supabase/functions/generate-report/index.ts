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

    // Injury statistics
    const injuryReports = reports.filter((r: any) => r.report_type === "injury");
    const totalAbsenceDays = injuryReports.reduce((sum: number, r: any) => sum + (r.absence_days || 0), 0);
    const medicalCareCount = injuryReports.filter((r: any) => r.medical_care_required).length;

    // Resolution time analysis
    const resolvedReports = reports.filter((r: any) => r.status === "resolved" && r.resolved_at);
    const avgResolutionDays = resolvedReports.length > 0
      ? Math.round(resolvedReports.reduce((sum: number, r: any) => {
          const created = new Date(r.created_at).getTime();
          const resolved = new Date(r.resolved_at).getTime();
          return sum + (resolved - created) / (1000 * 60 * 60 * 24);
        }, 0) / resolvedReports.length)
      : null;

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

    // Group reports by risk level for better analysis
    const criticalReports = reports.filter((r: any) => r.risk_level === "critical").map((r: any) => `  • ${r.title} (${r.category}, ${r.specific_location || r.building || '-'})`).join("\n");
    const highReports = reports.filter((r: any) => r.risk_level === "high").map((r: any) => `  • ${r.title} (${r.category}, ${r.specific_location || r.building || '-'})`).join("\n");

    const reportDetails = reports.map((r: any) =>
      `[${r.report_type}] ${r.title} | ${lang === "sv" ? "Kategori" : "Category"}: ${r.category} | Risk: ${r.risk_level} | ${lang === "sv" ? "Plats" : "Location"}: ${r.specific_location || r.building || "-"} | Status: ${r.status}${r.ai_explanation ? ` | AI-bedömning: ${r.ai_explanation.substring(0, 200)}` : ""}${r.suggested_actions?.length ? ` | Åtgärder: ${r.suggested_actions.join("; ")}` : ""}`
    ).join("\n");

    const typeLabels: Record<string, Record<string, string>> = {
      monthly: { sv: "månadsrapport", en: "monthly report" },
      quarterly: { sv: "kvartalsrapport", en: "quarterly report" },
      yearly: { sv: "årsrapport", en: "yearly report" },
    };
    const reportTypeLabel = typeLabels[report_type]?.[lang] ?? typeLabels.monthly[lang];

    const prompt = lang === "sv"
      ? `Du är en senior arbetsmiljöingenjör (SAM-certifierad) som skriver en professionell ${reportTypeLabel} för ledningen. Rapporten ska vara konkret, datadriven och handlingsinriktad.

═══════════════════════════════════════
RAPPORTMETADATA
═══════════════════════════════════════
- Rapporttyp: ${reportTypeLabel.toUpperCase()}
- Projekt: ${project_name || "Alla projekt"}
- Period: ${period_label}

═══════════════════════════════════════
NYCKELTAL
═══════════════════════════════════════
- Totalt antal rapporter: ${totalReports}
- Riskobservationer: ${observations}
- Skadeanmälningar: ${injuries}
- Åtgärdade: ${resolved} (${totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0}%)
- Genomsnittlig åtgärdstid: ${avgResolutionDays !== null ? avgResolutionDays + " dagar" : "Ej tillräckligt data"}
- Risknivåer: Kritisk: ${critical}, Hög: ${high}, Medel: ${medium}, Låg: ${low}

SKADESTATISTIK:
- Skadeanmälningar med sjukvård: ${medicalCareCount}
- Total frånvaro p.g.a. skador: ${totalAbsenceDays} dagar

═══════════════════════════════════════
KATEGORIER (efter frekvens)
═══════════════════════════════════════
${categoryList || "  Inga rapporter"}

═══════════════════════════════════════
PLATSER (topp 10)
═══════════════════════════════════════
${locationList || "  Inga rapporter"}

${criticalReports ? `═══════════════════════════════════════
KRITISKA RISKER (kräver omedelbar uppmärksamhet)
═══════════════════════════════════════
${criticalReports}` : ""}

${highReports ? `═══════════════════════════════════════
HÖGA RISKER
═══════════════════════════════════════
${highReports}` : ""}

═══════════════════════════════════════
SAMTLIGA RAPPORTER
═══════════════════════════════════════
${reportDetails || "Inga rapporter för perioden."}

═══════════════════════════════════════
INSTRUKTIONER
═══════════════════════════════════════
Skapa en professionell rapport med:
1. SAMMANFATTNING: Koncis men informativ. Nämn antal rapporter, åtgärdsgrad, allvarligaste händelserna och övergripande trend.
2. NYCKELRISKER: Identifiera 3-6 konkreta risker baserat på faktiska rapporter. Gruppera liknande risker. Ange korrekt severity baserat på data.
3. TRENDER: 3-5 observerade mönster/trender baserat på data (t.ex. återkommande kategorier, platser med många incidenter, förbättring/försämring).
4. FÖRBÄTTRINGAR: 2-4 positiva resultat (t.ex. hög åtgärdsgrad, minskade incidenter i viss kategori, snabb responstid).
5. ÅTGÄRDSPLAN: 4-8 konkreta, prioriterade åtgärder med ansvarig roll. Varje åtgärd ska vara specifik och genomförbar.

Svara ALLTID med generate_report-verktyget.`
      : `You are a senior occupational health and safety engineer (SAM-certified) writing a professional ${reportTypeLabel} for management. The report should be concrete, data-driven and action-oriented.

═══════════════════════════════════════
REPORT METADATA
═══════════════════════════════════════
- Report type: ${reportTypeLabel.toUpperCase()}
- Project: ${project_name || "All projects"}
- Period: ${period_label}

═══════════════════════════════════════
KEY METRICS
═══════════════════════════════════════
- Total reports: ${totalReports}
- Risk observations: ${observations}
- Injury reports: ${injuries}
- Resolved: ${resolved} (${totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0}%)
- Average resolution time: ${avgResolutionDays !== null ? avgResolutionDays + " days" : "Insufficient data"}
- Risk levels: Critical: ${critical}, High: ${high}, Medium: ${medium}, Low: ${low}

INJURY STATISTICS:
- Injuries requiring medical care: ${medicalCareCount}
- Total absence due to injuries: ${totalAbsenceDays} days

═══════════════════════════════════════
CATEGORIES (by frequency)
═══════════════════════════════════════
${categoryList || "  No reports"}

═══════════════════════════════════════
LOCATIONS (top 10)
═══════════════════════════════════════
${locationList || "  No reports"}

${criticalReports ? `═══════════════════════════════════════
CRITICAL RISKS (immediate attention required)
═══════════════════════════════════════
${criticalReports}` : ""}

${highReports ? `═══════════════════════════════════════
HIGH RISKS
═══════════════════════════════════════
${highReports}` : ""}

═══════════════════════════════════════
ALL REPORTS
═══════════════════════════════════════
${reportDetails || "No reports for this period."}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════
Create a professional report with:
1. SUMMARY: Concise but informative. Mention report count, resolution rate, most serious incidents and overall trend.
2. KEY RISKS: Identify 3-6 concrete risks based on actual reports. Group similar risks. Set correct severity based on data.
3. TRENDS: 3-5 observed patterns based on data (recurring categories, locations with many incidents, improvement/deterioration).
4. IMPROVEMENTS: 2-4 positive results (high resolution rate, reduced incidents in category, fast response time).
5. ACTION PLAN: 4-8 concrete, prioritized actions with responsible role. Each action must be specific and actionable.

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
              ? "You are a senior occupational health and safety engineer writing professional, data-driven reports for construction industry management. Your reports are known for being specific, actionable and well-structured. Never use generic phrases – always reference actual data from the reports. Always respond using the generate_report tool."
              : "Du är en senior arbetsmiljöingenjör som skriver professionella, datadrivna rapporter för ledningen inom bygg- och anläggningsbranschen. Dina rapporter är kända för att vara specifika, handlingsinriktade och välstrukturerade. Använd aldrig generiska formuleringar – referera alltid till faktisk data från rapporterna. Svara alltid med generate_report-verktyget.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: lang === "en"
                ? "Generate a structured, professional occupational health and safety report"
                : "Generera en strukturerad, professionell arbetsmiljörapport",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: lang === "en"
                      ? "Executive summary (4-6 sentences): Total reports, resolution rate, most critical findings, overall risk trend compared to expectations. Include specific numbers."
                      : "Sammanfattning för ledningen (4-6 meningar): Antal rapporter, åtgärdsgrad, mest kritiska fynd, övergripande risktrend. Inkludera specifika siffror.",
                  },
                  key_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        risk: { type: "string", description: lang === "sv" ? "Kort, specifik riskbeskrivning som refererar till faktiska rapporter" : "Short, specific risk description referencing actual reports" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        count: { type: "number", description: lang === "sv" ? "Antal rapporter relaterade till denna risk" : "Number of reports related to this risk" },
                        recommendation: { type: "string", description: lang === "sv" ? "Konkret, genomförbar rekommendation med tidsram" : "Concrete, actionable recommendation with timeframe" },
                      },
                      required: ["risk", "severity", "count", "recommendation"],
                    },
                  },
                  trends: {
                    type: "array",
                    items: { type: "string" },
                    description: lang === "sv" ? "3-5 datadrivna trender/mönster observerade i rapporterna" : "3-5 data-driven trends/patterns observed in the reports",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: lang === "sv" ? "2-4 positiva resultat eller förbättringar baserat på data" : "2-4 positive results or improvements based on data",
                  },
                  action_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: lang === "sv" ? "Specifik, genomförbar åtgärd med tydligt mål" : "Specific, actionable measure with clear goal" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        responsible: { type: "string", description: lang === "sv" ? "Ansvarig roll (t.ex. Platschef, Skyddsombud, Arbetsledare)" : "Responsible role (e.g. Site Manager, Safety Officer, Supervisor)" },
                      },
                      required: ["action", "priority", "responsible"],
                    },
                  },
                },
                required: ["summary", "key_risks", "trends", "improvements", "action_plan"],
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
