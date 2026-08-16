import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { responseId, actorResponseId, reaction, questionVersion } = await req.json();
    const normalizedReaction = reaction === "like" ? "naruhodo" : reaction;
    if (!responseId || !actorResponseId || !["naruhodo", "hmm"].includes(normalizedReaction)) {
      return jsonResponse({ error: "responseId, actorResponseId and a valid reaction are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const column = normalizedReaction === "naruhodo" ? "likes" : "hmms";
    const { data: responses, error: readError } = await supabase
      .from("debate_responses")
      .select(`id, question_id, choice_side, attributes, ${column}`)
      .in("id", [actorResponseId, responseId]);
    if (readError || !responses || responses.length !== 2) {
      return jsonResponse({ error: "Failed to read actor and target responses", details: readError?.message }, 400);
    }

    const actor = responses.find((item) => item.id === actorResponseId);
    const target = responses.find((item) => item.id === responseId);
    if (!actor || !target || actor.question_id !== target.question_id || actor.id === target.id) {
      return jsonResponse({ error: "Actor and target must be different responses to the same question" }, 400);
    }

    const { error: eventError } = await supabase
      .from("debate_response_reactions")
      .insert({
        question_id: target.question_id,
        actor_response_id: actor.id,
        target_response_id: target.id,
        actor_side: actor.choice_side,
        target_side: target.choice_side,
        reaction: normalizedReaction,
        question_version: questionVersion || actor.attributes?.questionVersion || "unknown",
      });
    if (eventError) {
      const duplicate = eventError.code === "23505";
      return jsonResponse(
        { error: duplicate ? "Already reacted to this response" : "Failed to save reaction event", details: eventError.message },
        duplicate ? 409 : 500,
      );
    }

    const { data: updatedResponse, error: updateError } = await supabase
      .from("debate_responses")
      .update({ [column]: Number(target[column] ?? 0) + 1 })
      .eq("id", responseId)
      .select("*")
      .single();
    if (updateError) {
      return jsonResponse({ error: "Failed to update reaction", details: updateError.message }, 500);
    }
    return jsonResponse({
      response: updatedResponse,
      event: {
        actorSide: actor.choice_side,
        targetSide: target.choice_side,
        relation: actor.choice_side === target.choice_side ? "same" : "opposite",
        reaction: normalizedReaction,
      },
    });
  } catch (error) {
    return jsonResponse({ error: "Unexpected error", details: String(error) }, 500);
  }
});
