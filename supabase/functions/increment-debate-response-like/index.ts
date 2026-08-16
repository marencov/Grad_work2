// Supabase Edge Function: increment-debate-response-like

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { responseId } = await req.json();
    if (!responseId) {
      return jsonResponse({ error: "responseId is required" }, 400);
    }

    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } },
    );

    const { data: response, error: readError } = await supabase
      .from("debate_responses")
      .select("id, likes")
      .eq("id", responseId)
      .single();

    if (readError || !response) {
      return jsonResponse(
        { error: "Failed to read response", details: readError?.message },
        500,
      );
    }

    const { data: updatedResponse, error: updateError } = await supabase
      .from("debate_responses")
      .update({ likes: Number(response.likes ?? 0) + 1 })
      .eq("id", response.id)
      .select("*")
      .single();

    if (updateError) {
      return jsonResponse(
        { error: "Failed to update like", details: updateError.message },
        500,
      );
    }

    return jsonResponse({ response: updatedResponse });
  } catch (error) {
    return jsonResponse(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
