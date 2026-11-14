const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, mode = "tutor", history = [], model } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required 'prompt' field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = `You are TryNThink Tutor, an expert Socratic AI mentor for independent thinkers.
RULES:
1) NEVER give direct full answers before the user attempts reasoning.
2) Ask guided Socratic hints first.
3) Enforce the 5-step loop: Think -> Try -> AI -> Compare -> Reflect.
4) Keep replies under 100 words and end with a guiding question.`;

    if (mode === "flashcards") {
      systemPrompt = `You are a Flashcard Generator. Return ONLY a valid JSON array of 2 flashcards: [{"question": "...", "answer": "..."}]`;
    } else if (mode === "feedback") {
      systemPrompt = `You are a Reasoning Evaluator. Provide 1 Strength, 1 Growth Area, and a Score out of 100 for the user's attempt.`;
    }

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const claudeKey = Deno.env.get("CLAUDE_API_KEY");

    let apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let payload: any = {};

    if (openRouterKey) {
      headers["Authorization"] = `Bearer ${openRouterKey}`;
      headers["HTTP-Referer"] = "https://trynthink.app";

      payload = {
        model: model || "openrouter/auto",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((h: any) => ({
            role: h.role === "ai" || h.role === "assistant" ? "assistant" : "user",
            content: h.text || h.content || "",
          })),
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      };
    } else if (claudeKey) {
      apiUrl = "https://api.anthropic.com/v1/messages";
      headers["x-api-key"] = claudeKey;
      headers["anthropic-version"] = "2023-06-01";

      payload = {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          ...history.map((h: any) => ({
            role: h.role === "ai" || h.role === "assistant" ? "assistant" : "user",
            content: h.text || h.content || "",
          })),
          { role: "user", content: prompt }
        ]
      };
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          text: "[Socratic Demo Hint]\n\nBefore I answer: What is the first logical step or key principle you can identify?"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiRes = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(payload) });
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(
        JSON.stringify({ error: "Upstream API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await apiRes.json();
    const replyText = data?.choices?.[0]?.message?.content || data?.content?.[0]?.text || "What is your thought on this?";

    return new Response(
      JSON.stringify({ success: true, text: replyText, raw: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});