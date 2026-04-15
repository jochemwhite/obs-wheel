"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useSpin } from "@/hooks/useSpin";
import { useWheelStore } from "@/store/wheel-store";
import type { WheelItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { WheelCanvas } from "./WheelCanvas";

type Props = {
  userId: string;
  presetId: string;
  items: WheelItem[];
};

export function ObsWheelEmbed({ userId, presetId, items }: Props) {
  const spin = useSpin();
  const importItems = useWheelStore((state) => state.importItems);
  const spinning = useWheelStore((state) => state.spinning);
  const currentAngle = useWheelStore((state) => state.currentAngle);

  useEffect(() => {
    importItems(items);
    useWheelStore.getState().setCurrentAngle(0);
    useWheelStore.getState().setSpinning(false);
    useWheelStore.getState().setWinner(null);
    useWheelStore.getState().setShowWinnerModal(false);
  }, [items, importItems]);

  useEffect(() => {
    async function reloadPresetItems() {
      const res = await fetch(`/api/public-wheel/${encodeURIComponent(userId)}/${encodeURIComponent(presetId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const payload = await res.json();
      if (!Array.isArray(payload?.items)) return;

      importItems(payload.items);
      useWheelStore.getState().setCurrentAngle(0);
      useWheelStore.getState().setSpinning(false);
      useWheelStore.getState().setWinner(null);
      useWheelStore.getState().setShowWinnerModal(false);
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`wheel-spin-events:${userId}:${presetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wheel_spin_events",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { preset_id?: string; source?: string | null };
          if (row.preset_id !== presetId) return;

          if (row.source === "preset_updated") {
            void reloadPresetItems();
            return;
          }

          spin();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [importItems, presetId, spin, userId]);

  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-transparent p-4">
      <div className="relative" style={{ width: "min(440px, 90vw)", height: "min(440px, 90vw)" }}>
        <div
          className="absolute inset-[-6px] rounded-full z-0"
          style={{
            background: "conic-gradient(#ff5f6d, #f0c040, #ff5f6d)",
            animation: "ring-spin 6s linear infinite",
          }}
        />
        <div className="absolute inset-[-4px] rounded-full bg-[#0d0d14] z-1" />

        <WheelCanvas />

        <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 z-10 drop-shadow-[0_0_6px_rgba(240,192,64,0.9)]">
          <svg width="32" height="40" viewBox="0 0 32 40">
            <polygon points="16,38 0,4 32,4" fill="#f0c040" stroke="#c09000" strokeWidth="1.5" />
          </svg>
        </div>

        <button
          onClick={spin}
          disabled={spinning || items.length === 0}
          title="Click to spin"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[52px] h-[52px] rounded-full border-[3px] border-[#fff4b0] overflow-hidden transition-[scale] duration-150 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            boxShadow: "0 0 16px rgba(240,192,64,0.7), inset 0 2px 4px rgba(255,255,255,0.4)",
          }}
        >
          <div className="absolute inset-0" style={{ transform: `rotate(${currentAngle}rad)` }}>
            <Image src="/pudu.png" alt="Spin" fill className="object-cover rounded-full" />
          </div>
        </button>
      </div>
    </section>
  );
}
