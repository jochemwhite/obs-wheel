import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WheelDashboard } from "@/components/dashboard/WheelDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <WheelDashboard />
      </div>
    </main>
  );
}
