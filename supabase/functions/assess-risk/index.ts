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

    const prompt = `Du är en certifierad arbetsmiljöingenjör (SAM/AFS) med 25+ års erfarenhet inom svensk bygg- och anläggningsbransch. Du har expertkunskap inom:
- AFS 2001:1 Systematiskt arbetsmiljöarbete
- AFS 2020:1 Arbetsplatsens utformning
- AFS 2006:4 Användning av arbetsutrustning
- Arbetsmiljölagen (AML) kapitel 2-4

Analysera följande rapport noggrant och ge en detaljerad, specifik riskbedömning. Undvik generiska formuleringar – referera alltid till konkreta detaljer i rapporten.

═══════════════════════════════════════
RAPPORTINFORMATION:
═══════════════════════════════════════
- Typ: ${report_type === "injury" ? "SKADERAPPORT (inträffad olycka)" : "RISKOBSERVATION (potentiell risk)"}
- Rubrik: ${title}
- Beskrivning: ${description}
- Kategori: ${category}
- Byggnad/Projekt: ${building || "Ej angivet"}
- Specifik plats: ${specific_location || "Ej angivet"}
${report_type === "injury" ? `
SKADEDETALJER:
- Skadad kroppsdel: ${body_part || "Ej angivet"}
- Skadetyp: ${injury_type || "Ej angivet"}
- Sjukvård krävdes: ${medical_care_required ? "Ja" : "Nej"}
- Frånvaro krävdes: ${absence_required ? "Ja" : "Nej"}
- Frånvarodagar: ${absence_days || 0}` : ""}
${commentsText}

═══════════════════════════════════════
BEDÖMNINGSMATRIS (Sannolikhet × Konsekvens):
═══════════════════════════════════════

KRITISK (critical) – Omedelbar åtgärd krävs:
• Omedelbar livsfara eller risk för permanent funktionsnedsättning
• Fallrisk från höjd >2m utan fallskydd
• Ras-/kollapsrisk i schakt eller konstruktion
• Exponering för cancerframkallande/reproduktionstoxiska ämnen utan adekvat skydd
• Elektrisk fara med >230V utan låsning/märkning
• Allvarlig olycka som krävt akutsjukvård/sjukhusvistelse
• Brott mot stoppningsregler enligt AML 6 kap 7§

HÖG (high) – Åtgärd inom 24-48 timmar:
• Risk för allvarlig skada som kräver läkarvård
• Bristande skyddsutrustning vid identifierat riskmoment
• Upprepade incidenter (≥2) på samma plats/aktivitet
• Ergonomisk belastning med hög repetivitet eller tunga lyft (>25kg)
• Skador med frånvaro >3 dagar
• Bristande säkerhetsrutiner vid heta arbeten, lyft eller trånga utrymmen

MEDEL (medium) – Åtgärd inom 1 vecka:
• Risk för lättare skada som kan kräva enklare sjukvård
• Brister i ordning, skyltning eller belysning
• Ergonomiska besvär vid arbetsstation
• Skador med 1-3 dagars frånvaro
• Enstaka avvikelse från säkerhetsrutin

LÅG (low) – Åtgärd vid tillfälle:
• Minimal risk för fysisk skada
• Mindre observationer som är enkla att åtgärda
• Skador utan frånvaro och utan behov av sjukvård
• Risk som redan är delvis åtgärdad eller har temporärt skydd

ALLVARLIGHETSGRAD (1-5):
1 = Obetydlig: Ingen skaderisk, ingen påverkan på drift
2 = Lindrig: Lättare obehag/skada, <1 dags frånvaro
3 = Måttlig: Skada som kan kräva läkarvård, 1-7 dagars frånvaro
4 = Allvarlig: Allvarlig skada, >7 dagars frånvaro eller sjukhusvård
5 = Mycket allvarlig: Livsfara, permanent funktionsnedsättning eller dödsfall

${hasComments ? `═══════════════════════════════════════
KOMMENTARSBEDÖMNING:
═══════════════════════════════════════
Analysera kommentarerna noggrant mot följande kriterier:
- ÅTGÄRDAD: Kommentarer anger tydligt "fixat", "åtgärdat", "reparerat", "bytt ut", "monterat skydd" etc → sänk till "low", markera should_resolve=true
- DELVIS ÅTGÄRDAD: Temporär åtgärd eller pågående arbete → sänk ett steg, should_resolve=false
- OFÖRÄNDRAD/FÖRVÄRRAD: Risk kvarstår eller nya problem identifierade → behåll/höj nivå
- KRITISK bedömning: Kräv specifika bevis på åtgärd. "Vi tittar på det" räknas INTE som åtgärdat.` : ""}

═══════════════════════════════════════
INSTRUKTIONER FÖR SVARET:
═══════════════════════════════════════
1. Förklara specifikt VAD som utgör risken med hänvisning till rapportens detaljer
2. Motivera risknivån med referens till bedömningsmatrisen ovan
3. Ge 2-4 KONKRETA, genomförbara åtgärder sorterade efter prioritet
4. Varje åtgärd ska vara specifik nog att en platschef kan agera direkt på den
5. Om det är en skaderapport: kommentera om skadan tyder på systematiska brister`;

    const toolProperties: Record<string, unknown> = {
      risk_level: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Bedömd risknivå baserat på bedömningsmatrisen",
      },
      explanation: {
        type: "string",
        description: "En detaljerad förklaring (4-6 meningar) på svenska som: 1) Identifierar den specifika risken, 2) Motiverar risknivån med hänvisning till bedömningsmatrisen, 3) Beskriver potentiella konsekvenser, 4) Nämner relevanta AFS-föreskrifter om tillämpligt",
      },
      severity_rating: {
        type: "number",
        description: "Allvarlighetsgrad 1-5 enligt den detaljerade skalan ovan",
      },
      suggested_actions: {
        type: "array",
        items: { type: "string" },
        description: "2-4 konkreta, prioriterade åtgärder på svenska. Varje åtgärd ska vara en specifik instruktion (inte generisk) som en platschef kan genomföra omedelbart. Format: '[PRIO] Åtgärdsbeskrivning'. Sortera med viktigaste först.",
      },
    };

    const required = ["risk_level", "explanation", "severity_rating", "suggested_actions"];

    if (hasComments) {
      toolProperties.should_resolve = {
        type: "boolean",
        description: "true ENDAST om kommentarer tydligt bekräftar att risken är helt eliminerad. false om åtgärden är delvis, pågående eller oklart beskriven.",
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
          { role: "system", content: "Du är Sveriges mest erfarna arbetsmiljöingenjör med specialisering inom bygg och anläggning. Du gör alltid noggrant motiverade riskbedömningar förankrade i AFS-standarder och svensk arbetsmiljölagstiftning. Du undviker generiska bedömningar och refererar alltid till specifika detaljer i rapporten. Svara ALLTID med assess_risk-verktyget." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_risk",
              description: "Ge en strukturerad, detaljerad riskbedömning av arbetsplatsrapporten baserad på AFS-standarder",
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
