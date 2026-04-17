import { NextResponse } from "next/server";
import { isControlApiAuthorized } from "@/server/control-api/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isControlApiAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  const presetId = String(body?.presetId ?? "").trim();

  if (!userId || !presetId) {
    return NextResponse.json({ error: "userId and presetId are required" }, { status: 400 });
  }

  const { data: preset, error: presetError } = await supabaseAdmin
    .from("wheel_presets")
    .select("id")
    .eq("id", presetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (presetError) {
    return NextResponse.json({ error: presetError.message }, { status: 500 });
  }

  if (!preset) {
    return NextResponse.json({ error: "Preset not found for user" }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from("wheel_spin_events").insert({
    user_id: userId,
    preset_id: presetId,
    source: "control_api",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId, presetId });
}

