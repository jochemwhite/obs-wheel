import { supabaseAdmin } from "@/lib/supabase/admin";
import type { WheelItem } from "@/types";

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

export type PublicWheelConfig = {
  presetId: string;
  items: WheelItem[];
};

export async function loadPublicWheel(userId: string, preset: string): Promise<PublicWheelConfig | null> {
  const presetKey = decodeURIComponent(preset).trim();

  if (!userId || !presetKey) {
    return null;
  }

  const { data: presetById, error: presetByIdError } = await supabaseAdmin
    .from("wheel_presets")
    .select("id, items_json")
    .eq("user_id", userId)
    .eq("id", presetKey)
    .maybeSingle();

  if (presetByIdError) {
    throw presetByIdError;
  }

  if (presetById?.items_json) {
    return {
      presetId: presetById.id,
      items: sanitizeItems(presetById.items_json),
    };
  }

  const { data: presetByName, error: presetByNameError } = await supabaseAdmin
    .from("wheel_presets")
    .select("id, items_json")
    .eq("user_id", userId)
    .ilike("name", presetKey)
    .maybeSingle();

  if (presetByNameError) {
    throw presetByNameError;
  }

  if (presetByName?.items_json) {
    return {
      presetId: presetByName.id,
      items: sanitizeItems(presetByName.items_json),
    };
  }

  return null;
}
