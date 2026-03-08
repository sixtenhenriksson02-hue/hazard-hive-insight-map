import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, report_type, body_part, injury_type, medical_care_required, absence_required, absence_days, building, specific_location, comments } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const hasComments = comments && comments.length > 0;
    const commentsText = hasComments
      ? `\n\nSenaste kommentarer på denna rapport:\n${comments.map((c: string) => `- ${c}`).join("\n")}`
      : "";

    const prompt = `Du är en erfaren arbetsmiljöexpert och riskbedömare inom bygg- och anläggningsbranschen i Sverige. Du följer AFS (Arbetsmiljöverkets föreskrifter) och har djup kunskap om vanliga arbetsplatsrisker.

Analysera följande rapport och ge en detaljerad riskbedömning.

RAPPORTINFORMATION:
- Typ: ${report_type === "injury" ? "Skaderapport (inträffad olycka)" : "Riskobservation (potentiell risk)"}
- Rubrik: ${title}
- Beskrivning: ${description}
- Kategori: ${category}
- Byggnad/Projekt: ${building || "Ej angivet"}
- Plats: ${specific_location || "Ej angivet"}
${report_type === "injury" ? `- Skadad kroppsdel: ${body_part || "Ej angivet"}
- Skadetyp: ${injury_type || "Ej angivet"}
- Sjukvård krävdes: ${medical_care_required ? "Ja" : "Nej"}
- Frånvaro krävdes: ${absence_required ? "Ja" : "Nej"}
- Frånvarodagar: ${absence_days || 0}` : ""}
${commentsText}

BEDÖMNINGSKRITERIER:
Använd följande riktlinjer för risknivå:

KRITISK (critical):
- Omedelbar livsfara eller risk för allvarlig permanent skada
- Bristande fallskydd vid höjdarbete (>2m)
- Ras- eller kollapseringsrisk
- Exponering för farliga ämnen utan skyddsutrustning
- Elektriska risker med hög spänning
- Allvarliga skador som krävt sjukhusvård

HÖG (high):
- Risk för allvarlig skada som kräver sjukvård
- Bristande säkerhetsutrustning vid riskfyllda moment
- Upprepade incidenter i samma område
- Ergonomiska risker med hög belastning
- Skador med frånvaro > 3 dagar

MEDEL (medium):
- Risk för lättare skada
- Mindre brister i ordning/säkerhet
- Ergonomiska besvär
- Skador med kortare frånvaro (1-3 dagar)

LÅG (low):
- Minimal risk för skada
- Mindre observationer som är enkla att åtgärda
- Skador utan frånvaro och utan sjukvårdsbehov
- Redan delvis åtgärdade risker

ALLVARLIGHETSGRAD (1-5):
1 = Obetydlig påverkan, ingen skaderisk
2 = Mindre påverkan, lättare skada möjlig
3 = Måttlig påverkan, skada som kräver vård möjlig
4 = Allvarlig påverkan, allvarlig skada möjlig
5 = Mycket allvarlig, livsfara eller permanent skada möjlig

${hasComments ? `KOMMENTARSBEDÖMNING:
Analysera kommentarerna noggrant:
- Om kommentarer tydligt anger att risken är ÅTGÄRDAD (t.ex. "fixat", "åtgärdat", "reparerat", "bytt ut") → sänk risknivån till "low" och markera som bör lösas
- Om kommentarer anger DELVIS åtgärdad → sänk risknivån ett steg
- Om kommentarer anger att risken KVARSTÅR eller FÖRVÄRRATS → behåll eller höj risknivån
- Var kritisk och kräv tydliga bevis på åtgärd innan du sänker nivån` : ""}

Svara ALLTID på svenska. Ge en konkret och specifik förklaring som refererar till de faktiska detaljerna i rapporten. Undvik generiska svar.`;

    const toolProperties: Record<string, unknown> = {
      risk_level: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Bedömd risknivå baserat på kriterierna ovan",
      },
      explanation: {
        type: "string",
        description: "En konkret förklaring (3-4 meningar) på svenska som refererar till specifika detaljer i rapporten och motiverar risknivån. Inkludera rekommenderade åtgärder.",
      },
      severity_rating: {
        type: "number",
        description: "Allvarlighetsgrad 1-5 enligt kriterierna ovan",
      },
    };

    const required = ["risk_level", "explanation", "severity_rating"];

    if (hasComments) {
      toolProperties.should_resolve = {
        type: "boolean",
        description: "Om rapporten bör markeras som åtgärdad baserat på kommentarer som tydligt anger att problemet är löst.",
      };
      required.push("should_resolve");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Du är en senior arbetsmiljöingenjör med 20+ års erfarenhet inom svensk bygg- och anläggningsbransch. Du gör noggranna och välmotiverade riskbedömningar enligt AFS-standarder. Svara alltid med assess_risk-verktyget." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_risk",
              description: "Ge en strukturerad riskbedömning av arbetsplatsrapporten",
              parameters: {
                type: "object",
                properties: toolProperties,
                required,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assess_risk" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
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

    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const assessment = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess-risk error:", e);
    return new Response(JSON.stringify({
      risk_level: "medium",
      explanation: "Automatisk bedömning kunde inte genomföras. Standardnivå tilldelad – granska manuellt.",
      severity_rating: 3,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
