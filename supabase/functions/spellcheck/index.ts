import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ corrected: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const numberedTexts = texts.map((t: string, i: number) => `[${i + 1}] ${t}`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "system",
            content: `Du är en svensk stavningskontroll specialiserad på arbetsmiljö och byggbranschen. Din uppgift är att:
1. Rätta stavfel och grammatikfel
2. Behålla branschspecifika termer korrekt (t.ex. "ställning", "fallskydd", "skyddsräcke")
3. Förbättra tydligheten utan att ändra innebörden
4. Behålla samma ton och stil
5. Om texten redan är korrekt, returnera den oförändrad

VIKTIGT: Ändra INTE innebörden. Lägg INTE till information. Rätta bara stavning, grammatik och tydlighet.

Svara ALLTID med correct_spelling-verktyget.`,
          },
          {
            role: "user",
            content: `Rätta stavning och grammatik i följande texter. Returnera exakt samma antal texter i samma ordning:\n\n${numberedTexts}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "correct_spelling",
              description: "Returnera rättade texter",
              parameters: {
                type: "object",
                properties: {
                  corrected: {
                    type: "array",
                    items: { type: "string" },
                    description: "Rättade texter i samma ordning som input. Exakt samma antal element.",
                  },
                  had_errors: {
                    type: "boolean",
                    description: "true om det fanns stavfel/grammatikfel att rätta, false om allt var korrekt",
                  },
                },
                required: ["corrected", "had_errors"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "correct_spelling" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
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

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("spellcheck error:", e);
    return new Response(JSON.stringify({ corrected: [], had_errors: false, error: "Spell check failed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
