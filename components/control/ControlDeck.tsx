"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getScenesAction,
  getControlStreamStatusAction,
  startStreamAction,
  stopStreamAction,
  switchSceneAction,
  triggerWheelAction,
  type SceneState,
} from "@/app/control/actions";

type StreamState = {
  active: boolean;
  updatedAt: string;
};

export function ControlDeck() {
  const [streamState, setStreamState] = useState<StreamState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("Ready.");
  const [currentScene, setCurrentScene] = useState<SceneState>({ sceneUuid: null, sceneName: null });
  const [scenes, setScenes] = useState<SceneState[]>([]);
  const [lastSceneRefreshAt, setLastSceneRefreshAt] = useState<Date | null>(null);
  const deckButtonClass =
    "h-24 rounded-2xl border border-[#2a2a3d] bg-[#0f0f19] text-base font-semibold text-[#e8e8f0] hover:enabled:border-[#f0c040] hover:enabled:text-[#f0c040]";

  async function run(action: string, task: () => Promise<void>) {
    setBusy(action);
    try {
      await task();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  function isCurrentScene(scene: SceneState): boolean {
    if (currentScene.sceneUuid && scene.sceneUuid) {
      return currentScene.sceneUuid === scene.sceneUuid;
    }
    if (currentScene.sceneName && scene.sceneName) {
      return currentScene.sceneName === scene.sceneName;
    }
    return false;
  }

  async function refreshScenes(updateMessage = true) {
    const data = await getScenesAction();
    if (!data.ok) {
      throw new Error(data.error);
    }
    setCurrentScene(data.currentScene);
    setScenes(data.scenes);
    setLastSceneRefreshAt(new Date());
    if (updateMessage) {
      setMessage(data.currentScene.sceneName ? `Current scene: ${data.currentScene.sceneName}` : "No active scene.");
    }
  }

  async function switchScene(scene: SceneState) {
    const result = await switchSceneAction(scene);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }

  useEffect(() => {
    void run("scene-init", () => refreshScenes(true));
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshScenes(false).catch(() => {
        // Keep background polling silent; surfaced errors happen on explicit actions.
      });
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d14] px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        <h1 className="text-center text-xl font-semibold text-white">Stream Deck</h1>

        <section className="grid grid-cols-2 gap-3">
          <Button
            variant="ghost"
            className={deckButtonClass}
            disabled={busy !== null}
            onClick={() =>
              run("start", async () => {
                const data = await startStreamAction();
                if (!data.ok) {
                  throw new Error(data.error);
                }
                if (data.stream) {
                  setStreamState(data.stream);
                }
                setMessage("Stream marked as started.");
              })
            }
          >
            {busy === "start" ? "..." : "Start"}
          </Button>

          <Button
            variant="ghost"
            className={deckButtonClass}
            disabled={busy !== null}
            onClick={() =>
              run("stop", async () => {
                const data = await stopStreamAction();
                if (!data.ok) {
                  throw new Error(data.error);
                }
                if (data.stream) {
                  setStreamState(data.stream);
                }
                setMessage("Stream marked as stopped.");
              })
            }
          >
            {busy === "stop" ? "..." : "Stop"}
          </Button>

          <Button
            variant="ghost"
            className={deckButtonClass}
            disabled={busy !== null}
            onClick={() =>
              run("status", async () => {
                const data = await getControlStreamStatusAction();
                if (!data.ok || !data.stream) {
                  throw new Error(data.ok ? "Could not get stream status" : data.error);
                }
                setStreamState(data.stream);
                setMessage(`Stream is ${data.stream.active ? "active" : "inactive"}.`);
              })
            }
          >
            {busy === "status" ? "Checking..." : "Status"}
          </Button>

          <Button
            variant="ghost"
            className={deckButtonClass}
            disabled={busy !== null}
            onClick={() =>
              run("wheel", async () => {
                const data = await triggerWheelAction();
                if (!data.ok) {
                  throw new Error(data.error);
                }
                setMessage("Wheel trigger event sent.");
              })
            }
          >
            {busy === "wheel" ? "Triggering..." : "Trigger Wheel"}
          </Button>
        </section>

        <section className="rounded-xl border border-[#2a2a3d] bg-[#16161f] p-3">
          <div className="mb-3 rounded-xl border border-[#2f2f49] bg-[#111120] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[#6b6b88]">Current Scene</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-[#f0c040]">{currentScene.sceneName ?? "Unknown"}</p>
              <span className="h-2.5 w-2.5 rounded-full bg-[#6de390]" />
            </div>
            <p className="mt-1 text-[11px] text-[#8b8b9d]">
              {lastSceneRefreshAt ? `Updated ${lastSceneRefreshAt.toLocaleTimeString()}` : "Waiting for first update..."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              className={deckButtonClass}
              disabled={busy !== null}
              onClick={() => run("scene-refresh", () => refreshScenes(true))}
            >
              {busy === "scene-refresh" || busy === "scene-init" ? "Refreshing..." : "Refresh Scenes"}
            </Button>

            {scenes.slice(0, 5).map((scene, index) => (
              <Button
                key={scene.sceneUuid ?? scene.sceneName ?? `scene-${index}`}
                variant="ghost"
                className={`${deckButtonClass} ${
                  isCurrentScene(scene) ? "border-[#f0c040] bg-[#19192a] text-[#f0c040]" : ""
                }`}
                disabled={busy !== null || (!scene.sceneUuid && !scene.sceneName)}
                onClick={() =>
                  run(`scene-switch:${scene.sceneUuid ?? scene.sceneName ?? "unknown"}`, async () => {
                    await switchScene(scene);
                    setCurrentScene(scene);
                    setMessage(`Switched to ${scene.sceneName ?? "scene"}.`);
                    await refreshScenes(false);
                  })
                }
              >
                {scene.sceneName ?? "Unnamed Scene"}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#2a2a3d] bg-[#16161f] p-4 text-sm text-[#a1a1b3]">
          <p>
            Stream:{" "}
            <span className={streamState?.active ? "text-[#6de390]" : "text-[#ff8c42]"}>
              {streamState ? (streamState.active ? "Live" : "Offline") : "Unknown"}
            </span>
          </p>
          <p className="mt-1">Message: {message}</p>
        </section>
      </div>
    </main>
  );
}

