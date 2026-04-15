import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const presetId = String(body?.presetId ?? "").trim();

  if (!presetId) {
    return NextResponse.json({ error: "presetId is required" }, { status: 400 });
  }

  const { data: preset, error: presetError } = await supabase
    .from("wheel_presets")
    .select("id")
    .eq("id", presetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (presetError) {
    return NextResponse.json({ error: presetError.message }, { status: 500 });
  }

  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  const { error } = await supabase.from("wheel_spin_events").insert({
    user_id: user.id,
    preset_id: presetId,
    source: "dashboard",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
