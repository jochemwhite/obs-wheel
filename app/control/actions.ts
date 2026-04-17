"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseUserAllowed } from "@/server/auth/broadcaster-access";
import {
  getCurrentScene,
  getStreamStatus,
  listScenes,
  startStream,
  stopStream,
  switchSceneByName,
  switchSceneByUuid,
  triggerWheel,
} from "@/src/api/controlApi";

export type ControlActionResult =
  | { ok: true; stream?: { active: boolean; updatedAt: string } }
  | { ok: false; error: string };

export type SceneState = {
  sceneUuid: string | null;
  sceneName: string | null;
};

export type ControlScenesActionResult =
  | { ok: true; currentScene: SceneState; scenes: SceneState[] }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const isAllowed = await isSupabaseUserAllowed(supabase, user);
  if (!isAllowed) {
    return null;
  }

  return user;
}

export async function getControlStreamStatusAction(): Promise<ControlActionResult> {
  const user = await requireUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const data = await getStreamStatus();
    return { ok: true, stream: data.stream };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to get stream status" };
  }
}

export async function startStreamAction(): Promise<ControlActionResult> {
  const user = await requireUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await startStream();
    const status = await getStreamStatus();
    return { ok: true, stream: status.stream };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to start stream" };
  }
}

export async function stopStreamAction(): Promise<ControlActionResult> {
  const user = await requireUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await stopStream();
    const status = await getStreamStatus();
    return { ok: true, stream: status.stream };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to stop stream" };
  }
}

export async function getScenesAction(): Promise<ControlScenesActionResult> {
  const user = await requireUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const data = await listScenes();
    return {
      ok: true,
      currentScene: {
        sceneUuid: data.currentProgramSceneUuid,
        sceneName: data.currentProgramSceneName,
      },
      scenes: data.scenes,
    };
  } catch (error) {
    try {
      const fallback = await getCurrentScene();
      return {
        ok: true,
        currentScene: {
          sceneUuid: fallback.sceneUuid,
          sceneName: fallback.sceneName,
        },
        scenes: [],
      };
    } catch (fallbackError) {
      return {
        ok: false,
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : "Failed to get scenes",
      };
    }
  }
}

export async function switchSceneAction(scene: SceneState): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    if (scene.sceneUuid) {
      await switchSceneByUuid(scene.sceneUuid);
      return { ok: true };
    }
    if (scene.sceneName) {
      await switchSceneByName(scene.sceneName);
      return { ok: true };
    }
    return { ok: false, error: "Scene has no id or name" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to switch scene" };
  }
}

export async function triggerWheelAction(presetId?: string): Promise<ControlActionResult> {
  const user = await requireUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  let cleanPresetId = String(presetId ?? "").trim();

  if (!cleanPresetId) {
    const { data: newestPreset, error: newestPresetError } = await supabaseAdmin
      .from("wheel_presets")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (newestPresetError) {
      return { ok: false, error: newestPresetError.message };
    }

    if (!newestPreset) {
      return { ok: false, error: "No presets available for user" };
    }

    cleanPresetId = newestPreset.id;
  }

  try {
    await triggerWheel(user.id, cleanPresetId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to trigger wheel" };
  }

  return { ok: true };
}

