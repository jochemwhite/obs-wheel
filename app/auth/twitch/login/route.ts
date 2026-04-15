import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { neededEventSubScopes } from "@/server/twitch/eventsub/needed-event-subscriptions";

const TWITCH_SCOPES = neededEventSubScopes.join(" ");

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const redirectTo = `${origin}/auth/twitch/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "twitch",
    options: {
      redirectTo,
      scopes: TWITCH_SCOPES,
      queryParams: {
        force_verify: "true",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  return NextResponse.redirect(data.url);
}
