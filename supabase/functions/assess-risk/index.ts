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
      ? `\nKommentarer på rapporten:\n${comments.map((c: string) => `- ${c}`).join("\n")}`
      : "";

    const prompt = `Du är en certifierad arbetsmiljöingenjör (SAM/AFS) med 25+ års erfarenhet inom svensk bygg- och anläggningsbransch.

RAPPORT ATT BEDÖMA:
- Typ: ${report_type === "injury" ? "SKADERAPPORT (inträffad olycka)" : "RISKOBSERVATION (potentiell risk)"}
- Beskrivning: ${description}
- Kategori: ${category}
- Byggnad/Projekt: ${building || "Ej angivet"}
- Specifik plats: ${specific_location || "Ej angivet"}
${report_type === "injury" ? `- Skadad kroppsdel: ${body_part || "Ej angivet"}
- Skadetyp: ${injury_type || "Ej angivet"}
- Sjukvård krävdes: ${medical_care_required ? "Ja" : "Nej"}
- Frånvaro: ${absence_required ? `Ja, ${absence_days || 0} dagar` : "Nej"}` : ""}
${commentsText}

RISKNIVÅER:
• critical – Livsfara, fallrisk >2m, ras/kollaps, elolycka >230V, akutsjukvård
• high – Allvarlig skaderisk, bristande skyddsutrustning, upprepade incidenter, frånvaro >3 dagar
• medium – Lättare skaderisk, brister i ordning/skyltning, 1-3 dagars frånvaro
• low – Minimal skaderisk, enkelt åtgärdat, ingen frånvaro

ALLVARLIGHETSGRAD (1-5): 1=Obetydlig, 2=Lindrig, 3=Måttlig, 4=Allvarlig, 5=Livsfara/permanent skada

${hasComments ? `KOMMENTARSBEDÖMNING:
- Om kommentarer bekräftar att risken är åtgärdad ("fixat", "reparerat", "bytt ut") → sänk till "low", should_resolve=true
- Om temporär åtgärd → sänk ett steg, should_resolve=false
- "Vi tittar på det" räknas INTE som åtgärdat` : ""}

INSTRUKTIONER:
1. Ge en kort, tydlig titel (max 8 ord) som sammanfattar risken/händelsen
2. Förklara specifikt vad risken är och varför du valt den risknivån (3-5 meningar)
3. Ge 2-4 konkreta åtgärder som en platschef kan genomföra direkt, sorterade efter prioritet, utan prefix eller numrering`;

    const toolProperties: Record<string, unknown> = {
      generated_title: {
        type: "string",
        description: "En kort, tydlig titel på max 8 ord som sammanfattar risken eller händelsen. Exempelvis: 'Lös kabel vid byggställning plan 3'",
      },
      risk_level: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Bedömd risknivå",
      },
      explanation: {
        type: "string",
        description: "Förklaring på svenska (3-5 meningar) som identifierar risken, motiverar nivån och beskriver konsekvenser",
      },
      severity_rating: {
        type: "number",
        description: "Allvarlighetsgrad 1-5",
      },
      suggested_actions: {
        type: "array",
        items: { type: "string" },
        description: "2-4 konkreta åtgärder på svenska. Skriv bara åtgärden direkt utan prefix, numrering eller prioritetsmarkeringar. Sortera med viktigaste först.",
      },
    };

    const required = ["generated_title", "risk_level", "explanation", "severity_rating", "suggested_actions"];

    if (hasComments) {
      toolProperties.should_resolve = {
        type: "boolean",
        description: "true ENDAST om kommentarer tydligt bekräftar att risken är helt eliminerad.",
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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du är Sveriges mest erfarna arbetsmiljöingenjör. Gör motiverade riskbedömningar baserade på AFS-standarder. Referera till specifika detaljer i rapporten. Svara ALLTID med assess_risk-verktyget." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_risk",
              description: "Strukturerad riskbedömning av arbetsplatsrapporten",
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
