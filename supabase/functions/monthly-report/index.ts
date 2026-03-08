import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reports, project_name, month_label } = await req.json();

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

    // Build category breakdown
    const categories: Record<string, number> = {};
    reports.forEach((r: any) => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });
    const categoryList = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `  - ${cat}: ${count} st`)
      .join("\n");

    // Build location breakdown
    const locations: Record<string, number> = {};
    reports.forEach((r: any) => {
      const loc = r.specific_location || r.building || "Okänt";
      locations[loc] = (locations[loc] || 0) + 1;
    });
    const locationList = Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([loc, count]) => `  - ${loc}: ${count} st`)
      .join("\n");

    // Report details for AI
    const reportDetails = reports.map((r: any) =>
      `[${r.report_type}] ${r.title} | Kategori: ${r.category} | Risk: ${r.risk_level} | Plats: ${r.specific_location || r.building || "-"} | Status: ${r.status}${r.ai_explanation ? ` | AI: ${r.ai_explanation}` : ""}`
    ).join("\n");

    const prompt = `Du är en senior arbetsmiljöexpert. Skapa en professionell månadsrapport för arbetsmiljörisker.

PROJEKT: ${project_name || "Alla projekt"}
PERIOD: ${month_label}

STATISTIK:
- Totalt antal rapporter: ${totalReports}
- Riskobservationer: ${observations}
- Skadeanmälningar: ${injuries}
- Åtgärdade: ${resolved} (${totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0}%)
- Risknivåer: Kritisk: ${critical}, Hög: ${high}, Medel: ${medium}, Låg: ${low}

KATEGORIER:
${categoryList || "  Inga rapporter"}

PLATSER (topp 10):
${locationList || "  Inga rapporter"}

ALLA RAPPORTER:
${reportDetails || "Inga rapporter för perioden."}

Skapa en strukturerad månadsrapport med följande sektioner. Svara ALLTID med tool-anropet.`;

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
            content: "Du är en senior arbetsmiljöingenjör som skriver professionella månadsrapporter. Svara alltid på svenska med generate_monthly_report-verktyget.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_monthly_report",
              description: "Generera en strukturerad månadsrapport för arbetsmiljörisker",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "En kort sammanfattning (3-5 meningar) av månadens viktigaste händelser och övergripande riskbild.",
                  },
                  key_risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        risk: { type: "string", description: "Kort beskrivning av risken" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        count: { type: "number", description: "Antal relaterade incidenter" },
                        recommendation: { type: "string", description: "Konkret rekommenderad åtgärd" },
                      },
                      required: ["risk", "severity", "count", "recommendation"],
                    },
                    description: "De 3-6 viktigaste identifierade riskerna med åtgärdsförslag",
                  },
                  trends: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 identifierade trender baserat på rapporterna (t.ex. ökande risker i visst område, återkommande kategorier)",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 positiva förbättringar eller framsteg som noterats (t.ex. hög åtgärdsgrad, snabb respons)",
                  },
                  action_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: "Konkret åtgärd att genomföra" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        responsible: { type: "string", description: "Föreslaget ansvar (t.ex. Platschef, Skyddsombud, Arbetsledare)" },
                      },
                      required: ["action", "priority", "responsible"],
                    },
                    description: "4-8 konkreta åtgärder för kommande månad",
                  },
                },
                required: ["summary", "key_risks", "trends", "improvements", "action_plan"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_monthly_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, försök igen senare." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Betalning krävs." }), {
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
    console.error("monthly-report error:", e);
    return new Response(JSON.stringify({ error: "Kunde inte generera månadsrapport." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
