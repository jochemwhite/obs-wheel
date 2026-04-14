"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSpin } from "./useSpin";

export type WsStatus = "idle" | "connecting" | "connected" | "error" | "closed";

/** Supported incoming message formats:
 *   - plain string:  "spin"
 *   - JSON object:   { "type": "spin" }
 */
function shouldSpin(raw: string): boolean {
  if (raw.trim() === "spin") return true;
  try {
    const data = JSON.parse(raw);
    return data?.type === "spin";
  } catch {
    return false;
  }
}

const RECONNECT_DELAY_MS = 3000;

export function useWheelWebSocket(url: string, enabled: boolean) {
  const [status, setStatus]   = useState<WsStatus>("idle");
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const wsRef                 = useRef<WebSocket | null>(null);
  const reconnectRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef            = useRef(enabled);
  const urlRef                = useRef(url);
  const spin                  = useSpin();

  // Keep refs in sync so the connect closure sees the latest values
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { urlRef.current = url; }, [url]);

  const connect = useCallback(() => {
    if (!enabledRef.current || !urlRef.current) return;

    // Clean up any existing socket
    wsRef.current?.close();
    if (reconnectRef.current) clearTimeout(reconnectRef.current);

    setStatus("connecting");

    const ws = new WebSocket(urlRef.current);
    wsRef.current = ws;

    ws.onopen  = () => setStatus("connected");
    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus("closed");
      // Auto-reconnect while still enabled
      if (enabledRef.current) {
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      const raw = String(event.data);
      setLastMsg(raw);
      if (shouldSpin(raw)) spin();
    };
  }, [spin]);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
  }, []);

  // Connect / disconnect when enabled or url changes
  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]);

  return { status, lastMsg, connect, disconnect };
}
