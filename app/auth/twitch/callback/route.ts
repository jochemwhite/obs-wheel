import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";
import checkEventSubscriptions from "@/server/twitch/eventsub/check-event-subscriptions";
import { encryptToken } from "@/server/crypto";
import { isBroadcasterIdAllowed } from "@/server/auth/broadcaster-access";

export async function GET(request: Request) {
  let { origin } = new URL(request.url);
  const { searchParams } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (forwardedHost && !isLocalEnv) {
    origin = `https://${forwardedHost}`;
  }

  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    if (!data.session?.provider_token || !data.session?.provider_refresh_token) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const twitchUserId =
      data.session.user.user_metadata?.sub ??
      data.session.user.user_metadata?.user_id ??
      data.session.user.user_metadata?.id;
    const twitchUsername =
      data.session.user.user_metadata?.preferred_username ??
      data.session.user.user_metadata?.user_name ??
      data.session.user.user_metadata?.login ??
      data.session.user.user_metadata?.name;

    if (!twitchUserId || !twitchUsername) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    if (!isBroadcasterIdAllowed(twitchUserId)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/auth/not-allowed`);
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(data.session.provider_token);
    const encryptedRefreshToken = encryptToken(data.session.provider_refresh_token);


    const { error: err } = await supabase
      .from("integrations_twitch")
      .upsert(
        {
          id: data.session.user.id,
          twitch_user_id: twitchUserId,
          twitch_username: twitchUsername,
          user_id: data.session.user.id,
          access_token_ciphertext: encryptedAccessToken.ciphertext,
          access_token_iv: encryptedAccessToken.iv,
          access_token_tag: encryptedAccessToken.authTag,
          refresh_token_ciphertext: encryptedRefreshToken.ciphertext,
          refresh_token_iv: encryptedRefreshToken.iv,
          refresh_token_tag: encryptedRefreshToken.authTag,
        },
        { onConflict: "user_id" }
      );

    if (err) {
      console.log(err);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    await checkEventSubscriptions(twitchUserId);
    if (!error) {
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
