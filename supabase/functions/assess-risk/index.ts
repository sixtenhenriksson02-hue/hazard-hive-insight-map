import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Deterministisk riskmatris (sannolikhet 1-5 × konsekvens 1-5)
function matrixToLevel(prob: number, cons: number): { level: string; severity: number } {
  const p = Math.max(1, Math.min(5, Math.round(prob)));
  const c = Math.max(1, Math.min(5, Math.round(cons)));
  const score = p * c;
  let level = "low";
  if (c >= 5) level = "critical";              // Livsfara/permanent skada → alltid minst critical
  else if (score >= 15 || c === 4) level = "high";
  else if (score >= 8) level = "medium";
  else if (score >= 4) level = "medium";
  else level = "low";
  // Override: hög konsekvens väger tyngre
  if (c === 4 && p >= 3) level = "critical";
  return { level, severity: c };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, report_type, body_part, injury_type, medical_care_required, absence_required, absence_days, building, specific_location, comments } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const hasComments = comments && comments.length > 0;
    const commentsText = hasComments
      ? `\nKOMMENTARSHISTORIK (kronologiskt):\n${comments.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}`
      : "";

    const isImprovement = report_type === "improvement";

    const prompt = isImprovement
      ? `Du är en erfaren arbetsmiljöingenjör. En medarbetare har lämnat ett förbättringsförslag.

FÖRSLAG:
- Beskrivning: ${description}
- Kategori: ${category}
- Plats: ${building || "Ej angivet"} / ${specific_location || "Ej angivet"}

INSTRUKTIONER:
1. Kort, tydlig titel (max 8 ord).
2. 3-5 meningar: varför förslaget är värdefullt och vilka risker det förebygger.
3. 2-4 konkreta implementeringssteg, viktigaste först, utan numrering eller prefix.`
      : `Du är Sveriges mest erfarne arbetsmiljöingenjör (SAM/AFS, 25+ års byggerfarenhet). Du gör KONSEKVENTA, MOTIVERADE bedömningar enligt en formell riskmatris. Du hittar inte på fakta — om information saknas, skriv det.

RAPPORT:
- Typ: ${report_type === "injury" ? "SKADERAPPORT (inträffad olycka)" : "RISKOBSERVATION (potentiell risk)"}
- Beskrivning: ${description}
- Kategori: ${category}
- Plats: ${building || "Ej angivet"} / ${specific_location || "Ej angivet"}
${report_type === "injury" ? `- Skadad kroppsdel: ${body_part || "Ej angivet"}
- Skadetyp: ${injury_type || "Ej angivet"}
- Sjukvård krävdes: ${medical_care_required ? "Ja" : "Nej"}
- Frånvaro: ${absence_required ? `Ja, ${absence_days || 0} dagar` : "Nej"}` : ""}
${commentsText}

═══════════════════════════════════════════
RISKMATRIS — använd denna systematiskt:

SANNOLIKHET (1-5) — hur troligt att händelsen inträffar/upprepas:
1 = Mycket osannolik (enstaka teoretisk risk, kräver flera samtidiga fel)
2 = Osannolik (kan ske men sällsynt, < 1 gång/år på arbetsplatsen)
3 = Möjlig (kan ske enstaka gång under projektet)
4 = Sannolik (sker regelbundet om inget åtgärdas, månadsvis)
5 = Mycket sannolik (sker ofta/dagligen, eller har redan inträffat upprepade gånger)

KONSEKVENS (1-5) — värsta rimliga utfall om händelsen sker:
1 = Obetydlig (ingen skada eller försumbar)
2 = Lindrig (första hjälpen, ingen frånvaro)
3 = Måttlig (sjukvård, 1-3 dagars frånvaro, läker fullt)
4 = Allvarlig (fraktur, > 3 dagars frånvaro, risk för bestående men)
5 = Katastrofal (livshotande, permanent invaliditet, dödsfall)

ABSOLUTA REGLER (override matrisen):
• Fall från höjd > 2 m utan fullgott fallskydd → konsekvens ≥ 4
• Spänning > 230 V utan brytare/jordfelsbrytare → konsekvens ≥ 4
• Ras-/kollapsrisk i schakt, ställning eller bjälklag → konsekvens = 5
• Klämrisk vid lyftkran/maskin med kroppsdel i riskzon → konsekvens ≥ 4
• Skaderapport där sjukvård krävts → konsekvens ≥ 3
• Skaderapport med frånvaro > 3 dagar → konsekvens ≥ 4
• Dödsfall eller livshotande skada → konsekvens = 5, sannolikhet = 5

KATEGORIVÄGLEDNING:
• Fallskydd, ställning, takarbete → titta särskilt på höjd och fallskyddsåtgärder
• El → spänning, jordning, kabelskick, IP-klass
• Brand → brännbart material, heta arbeten, utrymning, släckutrustning
• Kemikalier → SDB, ventilation, PPE, exponeringstid
• Maskiner/lyft → CE, certifierad förare, last, klämzoner
• Ergonomi → upprepning, tunga lyft (> 25 kg), arbetsställning

${hasComments ? `KOMMENTARSBEDÖMNING (viktigt):
• Endast kommentarer som tydligt anger ÅTGÄRDAD ("fixat", "bytt ut", "monterat skydd", "avspärrat") sänker nivån.
• Vaga utsagor ("vi tittar på det", "ska kollas") räknas EJ som åtgärd.
• Om sista kommentaren bekräftar permanent åtgärd → should_resolve=true och sänk till "low".
• Tillfälliga åtgärder ("avspärrat tills i morgon") → sänk ETT steg men should_resolve=false.
` : ""}
ARBETSFLÖDE (gör i denna ordning):
1. Identifiera vad risken/händelsen konkret är (en mening, internt).
2. Sätt sannolikhet 1-5 enligt definitionerna ovan.
3. Sätt konsekvens 1-5 enligt definitionerna + absoluta regler.
4. Skriv en titel på max 8 ord som är specifik (inkludera plats om angiven).
5. Skriv förklaringen: vad risken är, varför du satte just dessa siffror, AFS-referens vid allvarliga risker (t.ex. AFS 1981:14 Skydd mot skada genom fall, AFS 2014:26 Berg- och gruvarbete, AFS 2020:1 Arbetsplatsens utformning).
6. Föreslå 2-4 åtgärder en platschef kan göra DIRECT idag. Sortera viktigast först. Inga prefix, ingen numrering.`;

    const toolProperties: Record<string, unknown> = {
      generated_title: {
        type: "string",
        description: "Kort, specifik titel (max 8 ord). Inkludera plats om angiven. Exempel: 'Lös kabel vid byggställning plan 3'.",
      },
      probability: {
        type: "number",
        description: isImprovement ? "Alltid 1 för förbättringsförslag." : "Sannolikhet 1-5 enligt definitionerna i prompten. Var konsekvent.",
      },
      consequence: {
        type: "number",
        description: isImprovement ? "Alltid 1 för förbättringsförslag." : "Konsekvens 1-5 enligt definitionerna + absoluta regler.",
      },
      explanation: {
        type: "string",
        description: isImprovement
          ? "3-5 meningar: varför förslaget är värdefullt och vilka risker det förebygger."
          : "3-5 meningar: vad risken är, motivering av sannolikhet/konsekvens, AFS-referens vid allvarlig risk, potentiella konsekvenser. Var konkret och referera till detaljer i rapporten.",
      },
      suggested_actions: {
        type: "array",
        items: { type: "string" },
        description: "2-4 konkreta åtgärder, viktigast först. Inga prefix, ingen numrering, inga prioritetsmarkeringar. Varje åtgärd ska vara genomförbar av platschef idag.",
      },
    };

    const required = ["generated_title", "probability", "consequence", "explanation", "suggested_actions"];

    if (hasComments) {
      toolProperties.should_resolve = {
        type: "boolean",
        description: "true ENDAST om senaste kommentar tydligt bekräftar permanent åtgärd. Vaga utsagor → false.",
      };
      required.push("should_resolve");
    }

    const systemMsg = isImprovement
      ? "Du är en erfaren arbetsmiljöingenjör. Analysera förbättringsförslag konstruktivt. Svara ALLTID via assess_risk-verktyget."
      : "Du är Sveriges mest erfarne arbetsmiljöingenjör (SAM/AFS). Gör formella, konsekventa riskmatrisbedömningar. Hitta inte på fakta. Svara ALLTID via assess_risk-verktyget.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_risk",
              description: "Strukturerad riskbedömning enligt riskmatris",
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
        reasoning: { effort: "medium" },
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

    const raw = JSON.parse(toolCall.function.arguments);

    // Härled risk_level + severity deterministiskt från matrisen
    let risk_level: string;
    let severity_rating: number;
    if (isImprovement) {
      risk_level = "low";
      severity_rating = 1;
    } else {
      const { level, severity } = matrixToLevel(
        Number(raw.probability) || 3,
        Number(raw.consequence) || 3,
      );
      risk_level = level;
      severity_rating = severity;
    }

    const assessment = {
      generated_title: raw.generated_title,
      risk_level,
      severity_rating,
      probability: Number(raw.probability) || null,
      consequence: Number(raw.consequence) || null,
      explanation: raw.explanation,
      suggested_actions: raw.suggested_actions ?? [],
      ...(hasComments ? { should_resolve: !!raw.should_resolve } : {}),
    };

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
