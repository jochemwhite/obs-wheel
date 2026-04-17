import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseUserAllowed } from "@/server/auth/broadcaster-access";

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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isSupabaseUserAllowed(supabase, user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("wheel_configs")
    .select("items_json, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: sanitizeItems(data?.items_json),
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isSupabaseUserAllowed(supabase, user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const items = sanitizeItems(body?.items);

  const { error } = await supabase.from("wheel_configs").upsert(
    {
      user_id: user.id,
      items_json: items,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, itemsCount: items.length });
}
