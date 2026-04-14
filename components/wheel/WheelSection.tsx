"use client";

import { useWheelStore } from "@/store/wheel-store";
import { useSpin } from "@/hooks/useSpin";
import { WheelCanvas } from "./WheelCanvas";
import Image from "next/image";

export function WheelSection() {
  const items        = useWheelStore((s) => s.items);
  const spinning     = useWheelStore((s) => s.spinning);
  const currentAngle = useWheelStore((s) => s.currentAngle);
  const spinDuration = useWheelStore((s) => s.spinDuration);
  const spin         = useSpin();

  const canSpin = !spinning && items.length > 0;

  return (
    <section className="flex flex-col items-center gap-5 flex-none">
      {/* Wheel with decorative glow ring */}
      <div
        className="relative"
        style={{ width: "min(440px, 90vw)", height: "min(440px, 90vw)" }}
      >
        {/* Spinning glow ring */}
        <div
          className="absolute inset-[-6px] rounded-full z-0"
          style={{
            background: "conic-gradient(#ff5f6d, #f0c040, #ff5f6d)",
            animation: "ring-spin 6s linear infinite",
          }}
        />
        {/* Black mask between ring and canvas */}
        <div className="absolute inset-[-4px] rounded-full bg-[#0d0d14] z-[1]" />

        {/* Canvas */}
        <WheelCanvas />

        {/* Pointer arrow */}
        <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 z-10 drop-shadow-[0_0_6px_rgba(240,192,64,0.9)]">
          <svg width="32" height="40" viewBox="0 0 32 40">
            <polygon
              points="16,38 0,4 32,4"
              fill="#f0c040"
              stroke="#c09000"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Hub — clicking it still works as a manual fallback */}
        <button
          onClick={spin}
          disabled={!canSpin}
          title="Click to spin"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[52px] h-[52px] rounded-full border-[3px] border-[#fff4b0] overflow-hidden transition-[scale] duration-150 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            boxShadow: "0 0 16px rgba(240,192,64,0.7), inset 0 2px 4px rgba(255,255,255,0.4)",
          }}
        >
          {/* Rotates with the wheel — no transition so it tracks rAF exactly */}
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${currentAngle}rad)` }}
          >
            <Image src="/pudu.png" alt="Spin" fill className="object-cover rounded-full" />
          </div>
        </button>
      </div>

      {/* Duration slider */}
      <div className="flex items-center gap-3 text-sm text-[#6b6b88]">
        <span>Spin duration:</span>
        <input
          type="range"
          min={2}
          max={10}
          step={0.5}
          value={spinDuration}
          onChange={(e) =>
            useWheelStore.getState().setSpinDuration(parseFloat(e.target.value))
          }
          className="w-[120px] accent-[#f0c040]"
        />
        <span className="text-[#e8e8f0] font-semibold min-w-[34px]">
          {spinDuration} s
        </span>
      </div>
    </section>
  );
}
