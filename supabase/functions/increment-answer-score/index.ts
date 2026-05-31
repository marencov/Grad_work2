// Supabase Edge Function: increment-answer-score
//
// 目的:
// - ユーザーが円をクリックしたら、OpenAIを呼ばずに answers.score を +1 する
// - service role で更新するため、anon に answers の update 権限を広く渡さずに済みます
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
  if (!value) {
    throw new Error(`${name} is not set`);
  }
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
    const { answerId } = await req.json();
    if (!answerId) {
      return jsonResponse({ error: "answerId is required" }, 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: answer, error: readError } = await supabase
      .from("answers")
      .select("id, score")
      .eq("id", answerId)
      .single();

    if (readError || !answer) {
      return jsonResponse(
        { error: "Failed to read answer", details: readError?.message },
        500,
      );
    }

    const nextScore = Number(answer.score || 0) + 1;
    const { data: updatedAnswer, error: updateError } = await supabase
      .from("answers")
      .update({ score: nextScore })
      .eq("id", answer.id)
      .select("id, choice, reason, score, created_at")
      .single();

    if (updateError) {
      return jsonResponse(
        { error: "Failed to update score", details: updateError.message },
        500,
      );
    }

    return jsonResponse({ answer: updatedAnswer });
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
