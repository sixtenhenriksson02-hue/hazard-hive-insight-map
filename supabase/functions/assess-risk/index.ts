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

    const isImprovement = report_type === "improvement";

    const prompt = isImprovement
      ? `Du är en erfaren arbetsmiljöingenjör. En medarbetare har lämnat ett förbättringsförslag för arbetsplatsen.

FÖRSLAG:
- Beskrivning: ${description}
- Kategori: ${category}
- Byggnad/Projekt: ${building || "Ej angivet"}
- Specifik plats: ${specific_location || "Ej angivet"}

INSTRUKTIONER:
1. Ge en kort, tydlig titel (max 8 ord) som sammanfattar förslaget
2. Förklara varför detta är ett bra förslag och vilka risker det kan förebygga (3-5 meningar)
3. Ge 2-4 konkreta steg för att implementera förslaget, sorterade efter prioritet, utan prefix eller numrering`
      : `Du är en certifierad arbetsmiljöingenjör (SAM/AFS) med 25+ års erfarenhet inom svensk bygg- och anläggningsbransch.

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

RISKNIVÅER (var noggrann och konsekvent):
• critical – Livsfara, fallrisk >2m, ras/kollaps, elolycka >230V, akutsjukvård, risk för permanent skada
• high – Allvarlig skaderisk, bristande skyddsutrustning, upprepade incidenter, frånvaro >3 dagar, risk för frakturer/stickskador
• medium – Lättare skaderisk, brister i ordning/skyltning, 1-3 dagars frånvaro, halkrisker, ergonomiska brister
• low – Minimal skaderisk, enkelt åtgärdat, ingen frånvaro, mindre ordningsbrister

ALLVARLIGHETSGRAD (1-5): 1=Obetydlig, 2=Lindrig, 3=Måttlig, 4=Allvarlig, 5=Livsfara/permanent skada

VIKTIGA BEDÖMNINGSREGLER:
- Skaderapporter med sjukvård = minst "high"
- Skaderapporter med frånvaro >3 dagar = "critical" eller "high"
- Fallrisker från höjd >2m = alltid "critical"
- El-relaterade risker >230V = alltid "critical"
- Bristande fallskydd/skyddsräcken = minst "high"
- Klämrisker vid tunga maskiner = minst "high"

${hasComments ? `KOMMENTARSBEDÖMNING:
- Om kommentarer bekräftar att risken är åtgärdad ("fixat", "reparerat", "bytt ut") → sänk till "low", should_resolve=true
- Om temporär åtgärd → sänk ett steg, should_resolve=false
- "Vi tittar på det" räknas INTE som åtgärdat` : ""}

INSTRUKTIONER:
1. Ge en kort, tydlig titel (max 8 ord) som sammanfattar risken/händelsen
2. Förklara specifikt vad risken är och varför du valt den risknivån (3-5 meningar). Referera till AFS-föreskrifter vid allvarliga risker.
3. Ge 2-4 konkreta åtgärder som en platschef kan genomföra direkt, sorterade efter prioritet, utan prefix eller numrering`;

    const toolProperties: Record<string, unknown> = {
      generated_title: {
        type: "string",
        description: isImprovement
          ? "En kort, tydlig titel på max 8 ord som sammanfattar förbättringsförslaget"
          : "En kort, tydlig titel på max 8 ord som sammanfattar risken eller händelsen. Exempelvis: 'Lös kabel vid byggställning plan 3'",
      },
      risk_level: {
        type: "string",
        enum: isImprovement ? ["low"] : ["low", "medium", "high", "critical"],
        description: isImprovement ? "Alltid 'low' för förbättringsförslag" : "Bedömd risknivå baserad på bedömningsreglerna ovan",
      },
      explanation: {
        type: "string",
        description: isImprovement
          ? "Förklaring på svenska (3-5 meningar) som beskriver varför förslaget är värdefullt och vilka risker det kan förebygga"
          : "Förklaring på svenska (3-5 meningar) som identifierar risken, motiverar nivån med hänvisning till AFS-krav, och beskriver potentiella konsekvenser",
      },
      severity_rating: {
        type: "number",
        description: isImprovement ? "Alltid 1 för förbättringsförslag" : "Allvarlighetsgrad 1-5 baserad på konsekvensanalys",
      },
      suggested_actions: {
        type: "array",
        items: { type: "string" },
        description: isImprovement
          ? "2-4 konkreta steg för att implementera förslaget. Skriv direkt utan prefix eller numrering."
          : "2-4 konkreta åtgärder på svenska som en platschef kan genomföra omedelbart. Skriv bara åtgärden direkt utan prefix, numrering eller prioritetsmarkeringar. Sortera med viktigaste först.",
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
          { role: "system", content: isImprovement ? "Du är en erfaren arbetsmiljöingenjör. Analysera förbättringsförslag och ge konstruktiv feedback. Svara ALLTID med assess_risk-verktyget." : "Du är Sveriges mest erfarne arbetsmiljöingenjör med djup kunskap om AFS-standarder och svensk byggindustri. Gör konsekventa, motiverade riskbedömningar. Var särskilt uppmärksam på allvarliga risker som fall från höjd, el, klämrisker och bristande skyddsutrustning. Referera till specifika detaljer i rapporten. Svara ALLTID med assess_risk-verktyget." },
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
