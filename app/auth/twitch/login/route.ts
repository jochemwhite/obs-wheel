import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { neededEventSubScopes } from "@/server/twitch/eventsub/needed-event-subscriptions";

// Add extra OAuth scopes here that are not tied to EventSub subscriptions.
// Example: "moderator:manage:announcements"
const ADDITIONAL_TWITCH_OAUTH_SCOPES: readonly string[] = [
  "clips:edit",
  "channel:bot",
  "channel:read:ads",
  "channel:manage:broadcast",
  "channel:manage:clips",
  "channel:read:redemptions",
  "channel:read:subscriptions",
  "editor:manage:clips",
  "moderator:manage:announcements",
  "moderator:manage:shoutouts",
  "user:bot",
  "user:edit",
  "user:read:chat",
  "user:read:follows",
  "user:write:chat",
];

const TWITCH_SCOPES = Array.from(
  new Set([...neededEventSubScopes, ...ADDITIONAL_TWITCH_OAUTH_SCOPES]),
)
  .sort()
  .join(" ");

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
