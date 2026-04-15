import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type WheelItem = {
  id: string;
  label: string;
  weight: number;
};

function sanitizeItems(input: unknown): WheelItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const id = String(item?.id ?? "").trim();
      const label = String(item?.label ?? "").trim().slice(0, 40);
      const weight = Number(item?.weight);

      if (!id || !label || !Number.isFinite(weight) || weight <= 0) {
        return null;
      }

      return { id, label, weight };
    })
    .filter((item): item is WheelItem => item !== null);
}

function sanitizeName(input: unknown): string {
  return String(input ?? "")
    .trim()
    .slice(0, 60);
}

export async function PATCH(request: Request, context: RouteContext<"/api/wheel-presets/[presetId]">) {
  const { presetId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body?.name === undefined ? undefined : sanitizeName(body.name);
  const items = body?.items === undefined ? undefined : sanitizeItems(body.items);

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Preset name is required" }, { status: 400 });
  }

  if (items !== undefined && items.length === 0) {
    return NextResponse.json({ error: "Preset must have at least one item" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (name !== undefined) updatePayload.name = name;
  if (items !== undefined) updatePayload.items_json = items;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("wheel_presets")
    .update(updatePayload)
    .eq("id", presetId)
    .eq("user_id", user.id)
    .select("id, name, items_json, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify OBS wheel embeds to reload this preset without page refresh.
  const { error: notifyError } = await supabase.from("wheel_spin_events").insert({
    user_id: user.id,
    preset_id: data.id,
    source: "preset_updated",
  });

  if (notifyError) {
    return NextResponse.json({ error: notifyError.message }, { status: 500 });
  }

  return NextResponse.json({
    preset: {
      id: data.id,
      name: data.name,
      items: sanitizeItems(data.items_json),
      updatedAt: data.updated_at,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext<"/api/wheel-presets/[presetId]">) {
  const { presetId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("wheel_presets")
    .delete()
    .eq("id", presetId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
