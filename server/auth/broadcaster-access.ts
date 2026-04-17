import { env } from "@/lib/env";

type MinimalSupabaseUser = {
  id: string;
  user_metadata?: Record<string, unknown> | null;
};

function parseAllowedBroadcasterIds(): Set<string> {
  return new Set(
    env.ALLOWED_TWITCH_BROADCASTER_IDS.split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export function getTwitchBroadcasterIdFromUser(user: MinimalSupabaseUser): string | null {
  const metadata = user.user_metadata ?? {};
  const id =
    typeof metadata.sub === "string"
      ? metadata.sub
      : typeof metadata.user_id === "string"
        ? metadata.user_id
        : typeof metadata.id === "string"
          ? metadata.id
          : null;
  return id?.trim() || null;
}

export function isBroadcasterIdAllowed(twitchBroadcasterId: string | null): boolean {
  const allowedIds = parseAllowedBroadcasterIds();
  if (allowedIds.size === 0) {
    // If no allowlist is configured, keep existing behavior (allow all).
    return true;
  }
  if (!twitchBroadcasterId) {
    return false;
  }
  return allowedIds.has(twitchBroadcasterId);
}

export async function isSupabaseUserAllowed(
  supabase: unknown,
  user: MinimalSupabaseUser
): Promise<boolean> {
  const client = supabase as {
    from: (table: "integrations_twitch") => {
      select: (columns: "twitch_user_id") => {
        eq: (column: "user_id", value: string) => {
          maybeSingle: () => PromiseLike<{ data: { twitch_user_id?: string | null } | null; error: unknown }>;
        };
      };
    };
  };

  const metadataId = getTwitchBroadcasterIdFromUser(user);
  if (isBroadcasterIdAllowed(metadataId)) {
    return true;
  }

  const { data, error } = await client
    .from("integrations_twitch")
    .select("twitch_user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return false;
  }

  const integrationId =
    typeof data?.twitch_user_id === "string" && data.twitch_user_id.trim() ? data.twitch_user_id.trim() : null;
  return isBroadcasterIdAllowed(integrationId);
}

