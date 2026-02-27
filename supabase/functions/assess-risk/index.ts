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
      ? `\n\nRecent comments on this report:\n${comments.map((c: string) => `- ${c}`).join("\n")}`
      : "";

    const prompt = `You are a workplace safety risk assessor. Analyze the following incident/observation report and provide a risk assessment.

Report details:
- Type: ${report_type === "injury" ? "Injury report" : "Risk observation"}
- Title: ${title}
- Description: ${description}
- Category: ${category}
- Building/Project: ${building || "N/A"}
- Location: ${specific_location || "N/A"}
${report_type === "injury" ? `- Body part injured: ${body_part || "N/A"}
- Injury type: ${injury_type || "N/A"}
- Medical care required: ${medical_care_required ? "Yes" : "No"}
- Absence required: ${absence_required ? "Yes" : "No"}
- Absence days: ${absence_days || 0}` : ""}
${commentsText}

${hasComments ? `IMPORTANT: If the comments indicate that the risk has been fixed, resolved, or addressed, you should assess the risk level as "low" and update the explanation accordingly. If comments suggest partial fixes, adjust the risk level down appropriately.` : ""}

Assess the risk level and provide a brief explanation in the same language as the report (Swedish if the text is in Swedish, English if in English).
${hasComments ? `Also indicate whether the report should be marked as "resolved" based on the comments.` : ""}`;

    const toolProperties: Record<string, unknown> = {
      risk_level: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "The assessed risk level",
      },
      explanation: {
        type: "string",
        description: "A brief explanation (2-3 sentences) of why this risk level was assigned. Write in the same language as the report.",
      },
      severity_rating: {
        type: "number",
        description: "Severity rating from 1-5 (1=minor, 5=very serious)",
      },
    };

    const required = ["risk_level", "explanation", "severity_rating"];

    if (hasComments) {
      toolProperties.should_resolve = {
        type: "boolean",
        description: "Whether the report should be marked as resolved based on the comments indicating the issue has been fixed.",
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
          { role: "system", content: "You are a workplace safety expert. Always respond using the assess_risk tool." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_risk",
              description: "Provide a structured risk assessment",
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
      explanation: "Automatisk bedömning kunde inte genomföras. Standardnivå tilldelad.",
      severity_rating: 3,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
