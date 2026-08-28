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

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { responseId, editToken, operation, attributes, reason } = await req.json();
    if (
      typeof responseId !== "string" ||
      typeof editToken !== "string" ||
      !/^[0-9a-f]{64}$/.test(editToken) ||
      !["attributes", "reason"].includes(operation)
    ) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: current, error: readError } = await supabase
      .from("debate_responses")
      .select("id, edit_token_hash, attributes")
      .eq("id", responseId)
      .single();

    if (readError || !current?.edit_token_hash) {
      return jsonResponse({ error: "Response not found or not editable" }, 404);
    }

    const suppliedHash = await sha256Hex(editToken);
    if (suppliedHash !== current.edit_token_hash) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (!isPlainObject(attributes)) {
      return jsonResponse({ error: "Attributes must be an object" }, 400);
    }

    const patch: Record<string, unknown> = {
      attributes: { ...(current.attributes ?? {}), ...attributes },
    };

    if (operation === "reason") {
      if (typeof reason !== "string" || reason.length > 500) {
        return jsonResponse({ error: "Reason must be 500 characters or fewer" }, 400);
      }
      patch.reason = reason.trim();
    }

    const { data: updated, error: updateError } = await supabase
      .from("debate_responses")
      .update(patch)
      .eq("id", responseId)
      .select("id")
      .single();

    if (updateError) {
      return jsonResponse({ error: "Update failed", details: updateError.message }, 500);
    }

    return jsonResponse({ responseId: updated.id });
  } catch (error) {
    return jsonResponse(
      { error: "Unexpected error", details: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
