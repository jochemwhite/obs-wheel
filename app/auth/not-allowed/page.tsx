import Link from "next/link";

export default function NotAllowedPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <section className="w-full max-w-md rounded-xl border border-[#2a2a33] bg-[#15151d] p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Access not allowed</h1>
        <p className="text-sm text-[#a1a1b3] mb-6">
          Your Twitch broadcaster ID is not in the allowlist for this app.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-md border border-[#2a2a3d] px-4 py-2.5 text-sm font-medium text-[#e8e8f0] hover:border-[#f0c040] hover:text-[#f0c040]"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}

