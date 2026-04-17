import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ControlDeck } from "@/components/control/ControlDeck";
import { isSupabaseUserAllowed } from "@/server/auth/broadcaster-access";

export default async function ControlPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAllowed = await isSupabaseUserAllowed(supabase, user);
  if (!isAllowed) {
    redirect("/auth/not-allowed");
  }

  return <ControlDeck />;
}

