"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Next.js では、ブラウザで使う環境変数だけ `NEXT_PUBLIC_` を付けます。
// ここに置くのは「公開してよい anon key」だけです。
// OpenAI APIキーのような秘密情報は Edge Function 側の環境変数に置きます。
const hasSupabaseConfig =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl?.includes("your-project") &&
  !supabaseAnonKey?.includes("your-anon-key");

export const supabaseClient = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseReady = Boolean(supabaseClient);
