import { env } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);