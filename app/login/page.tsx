import { neededEventSubScopes } from "@/server/twitch/eventsub/needed-event-subscriptions";

const TWITCH_SCOPES = neededEventSubScopes;

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <section className="w-full max-w-md rounded-xl border border-[#2a2a33] bg-[#15151d] p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
        <p className="text-sm text-[#a1a1b3] mb-6">
          Connect your Twitch account to enable chat and shoutout features.
        </p>

        <a
          href="/auth/twitch/login?next=/dashboard"
          className="inline-flex w-full items-center justify-center rounded-md bg-[#9147ff] px-4 py-2.5 font-medium text-white hover:opacity-90 transition-opacity"
        >
          Continue with Twitch
        </a>

        <p className="mt-5 text-xs text-[#8b8b9d] text-left wrap-break-word">
          Scopes: {TWITCH_SCOPES.join(" ")}
        </p>
      </section>
    </main>
  );
}
