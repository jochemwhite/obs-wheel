import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { neededEventSubScopes } from "@/server/twitch/eventsub/needed-event-subscriptions";
import { env } from "@/lib/env";

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

function normalizeOrigin(raw: string): string {
  const firstValue = raw.split(",")[0]?.trim() ?? raw;
  if (firstValue.startsWith("http://") || firstValue.startsWith("https://")) {
    return firstValue.replace(/\/+$/, "");
  }
  return `https://${firstValue.replace(/\/+$/, "")}`;
}

function sanitizeNextPath(input: string | null): string {
  if (!input) return "/dashboard";
  if (!input.startsWith("/") || input.startsWith("//")) return "/dashboard";
  return input;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const configuredOrigin = normalizeOrigin(env.NEXT_PUBLIC_BASE_URL);
  const publicOrigin = configuredOrigin || (forwardedHost ? normalizeOrigin(forwardedHost) : url.origin);

  const next = sanitizeNextPath(url.searchParams.get("next"));
  const redirectTo = `${publicOrigin}/auth/twitch/callback`;

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
    return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`);
  }

  return NextResponse.redirect(data.url);
}
