'use server';
import axios from "axios";
import type { AxiosError } from "axios";
import { env } from "@/lib/env";

export type CurrentSceneResponse = {
  ok: boolean;
  sceneUuid: string | null;
  sceneName: string | null;
};

export type ListScenesResponse = {
  ok: boolean;
  currentProgramSceneUuid: string | null;
  currentProgramSceneName: string | null;
  scenes: Array<{ sceneUuid: string | null; sceneName: string | null }>;
};

export type StreamStatusResponse = {
  ok: boolean;
  stream?: {
    active: boolean;
    updatedAt: string;
  };
};

export type ControlOkResponse = {
  ok: boolean;
};

function normalizeControlApiBaseUrl(rawBaseUrl: string): string {
  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return baseUrl;
  }
  return `https://${baseUrl}`;
}

const controlApi = axios.create({
  baseURL: normalizeControlApiBaseUrl(env.CONTROL_API_BASE_URL),
  timeout: 10000,
});

controlApi.interceptors.request.use((config) => {
  config.headers.set("x-api-key", env.CONTROL_API_KEY);
  if (config.method && ["post", "put", "patch"].includes(config.method.toLowerCase())) {
    config.headers.set("Content-Type", "application/json");
  }
  return config;
});

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error?: string }>;
  const apiMessage = axiosError.response?.data?.error;
  if (apiMessage) return apiMessage;
  if (axiosError.message) return axiosError.message;
  return "Control API request failed";
}

export async function getCurrentScene(): Promise<CurrentSceneResponse> {
  try {
    const { data } = await controlApi.get<CurrentSceneResponse>("/control/scene/current");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function listScenes(): Promise<ListScenesResponse> {
  try {
    const { data } = await controlApi.get<ListScenesResponse>("/control/scenes");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function switchSceneByUuid(sceneUuid: string): Promise<ControlOkResponse> {
  try {
    const { data } = await controlApi.post<ControlOkResponse>("/control/scene/switch", { sceneUuid });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function switchSceneByName(sceneName: string): Promise<ControlOkResponse> {
  try {
    const { data } = await controlApi.post<ControlOkResponse>("/control/scene/switch", { sceneName });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function startStream(): Promise<ControlOkResponse> {
  try {
    const { data } = await controlApi.post<ControlOkResponse>("/control/start-stream");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function stopStream(): Promise<ControlOkResponse> {
  try {
    const { data } = await controlApi.post<ControlOkResponse>("/control/stop-stream");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStreamStatus(): Promise<StreamStatusResponse> {
  try {
    const { data } = await controlApi.get<StreamStatusResponse>("/control/stream-status");
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function triggerWheel(userId: string, presetId: string): Promise<ControlOkResponse> {
  try {
    const { data } = await controlApi.post<ControlOkResponse>("/control/trigger-wheel", { userId, presetId });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

