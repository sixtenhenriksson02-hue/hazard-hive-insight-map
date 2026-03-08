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
      `[${r.report_type}] ${r.title} | ${lang === "sv" ? "Kategori" : "Category"}: ${r.category} | Risk: ${r.risk_level} | ${lang === "sv" ? "Plats" : "Location"}: ${r.specific_location || r.building || "-"} | Status: ${r.status}${r.ai_explanation ? ` | AI: ${r.ai_explanation}` : ""}`
    ).join("\n");

    const typeLabels: Record<string, Record<string, string>> = {
      monthly: { sv: "månadsrapport", en: "monthly report" },
      quarterly: { sv: "kvartalsrapport", en: "quarterly report" },
      yearly: { sv: "årsrapport", en: "yearly report" },
    };
    const reportTypeLabel = typeLabels[report_type]?.[lang] ?? typeLabels.monthly[lang];

    const langInstructions = lang === "en"
      ? "You are a senior occupational health and safety expert. Create a professional report in ENGLISH."
      : "Du är en senior arbetsmiljöexpert. Skapa en professionell rapport på SVENSKA.";

    const prompt = `${langInstructions}

${lang === "sv" ? "RAPPORTTYP" : "REPORT TYPE"}: ${reportTypeLabel}
${lang === "sv" ? "PROJEKT" : "PROJECT"}: ${project_name || (lang === "sv" ? "Alla projekt" : "All projects")}
${lang === "sv" ? "PERIOD" : "PERIOD"}: ${period_label}

${lang === "sv" ? "STATISTIK" : "STATISTICS"}:
- ${lang === "sv" ? "Totalt antal rapporter" : "Total reports"}: ${totalReports}
- ${lang === "sv" ? "Riskobservationer" : "Risk observations"}: ${observations}
- ${lang === "sv" ? "Skadeanmälningar" : "Injury reports"}: ${injuries}
- ${lang === "sv" ? "Åtgärdade" : "Resolved"}: ${resolved} (${totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0}%)
- ${lang === "sv" ? "Risknivåer" : "Risk levels"}: ${lang === "sv" ? "Kritisk" : "Critical"}: ${critical}, ${lang === "sv" ? "Hög" : "High"}: ${high}, ${lang === "sv" ? "Medel" : "Medium"}: ${medium}, ${lang === "sv" ? "Låg" : "Low"}: ${low}

${lang === "sv" ? "KATEGORIER" : "CATEGORIES"}:
${categoryList || (lang === "sv" ? "  Inga rapporter" : "  No reports")}

${lang === "sv" ? "PLATSER (topp 10)" : "LOCATIONS (top 10)"}:
${locationList || (lang === "sv" ? "  Inga rapporter" : "  No reports")}

${lang === "sv" ? "ALLA RAPPORTER" : "ALL REPORTS"}:
${reportDetails || (lang === "sv" ? "Inga rapporter för perioden." : "No reports for this period.")}

${lang === "sv" ? "Skapa en strukturerad rapport med följande sektioner. Svara ALLTID med tool-anropet." : "Create a structured report with the following sections. ALWAYS respond with the tool call."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: lang === "en"
              ? "You are a senior occupational health and safety engineer writing professional reports. Always respond in English using the generate_report tool."
              : "Du är en senior arbetsmiljöingenjör som skriver professionella rapporter. Svara alltid på svenska med generate_report-verktyget.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_report",
              description: lang === "en"
                ? "Generate a structured occupational health and safety report"
                : "Generera en strukturerad arbetsmiljörapport",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: lang === "en"
                      ? "A brief summary (3-5 sentences) of the most important events and overall risk picture."
                      : "En kort sammanfattning (3-5 meningar) av periodens viktigaste händelser och övergripande riskbild.",
                  },
                  key_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        risk: { type: "string" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        count: { type: "number" },
                        recommendation: { type: "string" },
                      },
                      required: ["risk", "severity", "count", "recommendation"],
                    },
                  },
                  trends: {
                    type: "array",
                    items: { type: "string" },
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                  },
                  action_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        responsible: { type: "string" },
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
