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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("wheel_presets")
    .select("id, name, items_json, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    presets: (data ?? []).map((preset) => ({
      id: preset.id,
      name: preset.name,
      items: sanitizeItems(preset.items_json),
      updatedAt: preset.updated_at,
    })),
  });
}

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
  const name = sanitizeName(body?.name);
  const items = sanitizeItems(body?.items);

  if (!name) {
    return NextResponse.json({ error: "Preset name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("wheel_presets")
    .insert({
      user_id: user.id,
      name,
      items_json: items,
    })
    .select("id, name, items_json, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
