"use client";

import { useState, useEffect } from "react";
import { useWheelWebSocket, WsStatus } from "@/hooks/useWheelWebSocket";
import { useSpin } from "@/hooks/useSpin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const WS_URL_KEY = "wof_ws_url";

const STATUS_META: Record<WsStatus, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: "Not connected",  color: "bg-[#6b6b88]",  pulse: false },
  connecting: { label: "Connecting…",   color: "bg-[#f0c040]",  pulse: true  },
  connected:  { label: "Connected",     color: "bg-[#6be585]",  pulse: true  },
  error:      { label: "Error",         color: "bg-[#ff5f6d]",  pulse: false },
  closed:     { label: "Reconnecting…", color: "bg-[#ff9a3c]",  pulse: true  },
};

export function WebSocketPanel() {
  const [url, setUrl]         = useState("");
  const [enabled, setEnabled] = useState(false);
  const spin                  = useSpin();

  const { status, lastMsg } = useWheelWebSocket(enabled ? url : "", enabled);
  const meta = STATUS_META[status];

  // Persist URL
  useEffect(() => {
    const saved = localStorage.getItem(WS_URL_KEY);
    if (saved) setUrl(saved);
  }, []);

  function saveUrl(val: string) {
    setUrl(val);
    localStorage.setItem(WS_URL_KEY, val);
  }

  function toggle() {
    if (!url.trim()) return;
    setEnabled((e) => !e);
  }

  return (
    <aside className="bg-[#16161f] border border-[#2a2a3d] rounded-[14px] p-[22px] flex flex-col gap-5 w-full max-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a3d] pb-2.5">
        <h2 className="font-[family-name:var(--font-bungee)] text-sm tracking-[1px] text-[#f0c040]">
          🔌 WebSocket Trigger
        </h2>
        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              meta.color,
              meta.pulse && "animate-pulse"
            )}
          />
          <span className="text-xs text-[#6b6b88]">{meta.label}</span>
        </div>
      </div>

      {/* URL input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#6b6b88]">WebSocket URL</label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="ws://localhost:8080"
            value={url}
            onChange={(e) => saveUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && toggle()}
            disabled={enabled}
          />
          <Button
            variant={enabled ? "danger" : "add"}
            size="md"
            onClick={toggle}
            disabled={!url.trim()}
            className="flex-none"
          >
            {enabled ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </div>

      {/* Expected message format */}
      <div className="bg-[#12121b] border border-[#2a2a3d] rounded-lg p-3 text-xs text-[#6b6b88] leading-relaxed">
        <p className="text-[#e8e8f0] font-semibold mb-1">Expected message format</p>
        <p>Send either of the following to spin the wheel:</p>
        <pre className="mt-1.5 text-[#f0c040]">{`"spin"\n{ "type": "spin" }`}</pre>
      </div>

      {/* Last received message */}
      {lastMsg && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#6b6b88]">Last message received</span>
          <code className="text-xs text-[#e8e8f0] bg-[#12121b] border border-[#2a2a3d] rounded-lg px-3 py-2 break-all">
            {lastMsg}
          </code>
        </div>
      )}

      {/* Manual trigger */}
      <Button
        variant="ghost"
        size="md"
        onClick={spin}
        className="w-full"
      >
        ▶ Manual Spin
      </Button>
    </aside>
  );
}
