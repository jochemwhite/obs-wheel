"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWheelStore } from "@/store/wheel-store";
import { COLORS, WHEEL_SIZE } from "@/lib/constants";
import { totalWeight } from "@/lib/wheel-utils";
import { truncate, clamp } from "@/lib/utils";

const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;
const R  = CX - 10;

export function WheelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const items        = useWheelStore((s) => s.items);
  const currentAngle = useWheelStore((s) => s.currentAngle);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

    if (items.length === 0) {
      ctx.fillStyle = "#1e1e2e";
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b6b88";
      ctx.font = "600 18px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add items to spin!", CX, CY);
      return;
    }

    const total = totalWeight(items);
    let startAngle = currentAngle;

    items.forEach((item, idx) => {
      const slice    = (item.weight / total) * Math.PI * 2;
      const endAngle = startAngle + slice;
      const mid      = startAngle + slice / 2;
      const color    = COLORS[idx % COLORS.length];

      // Slice fill
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, R, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Slice border
      ctx.strokeStyle = "#0d0d14";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(mid);

      const textDist = R * 0.62;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur  = 4;

      const minArc = 0.22;
      const label =
        slice < minArc
          ? ""
          : slice < 0.5
          ? truncate(item.label, 8)
          : truncate(item.label, 14);

      if (label) {
        ctx.fillStyle = "#fff";
        ctx.font = `600 ${clamp(13, slice * R * 0.38, 17)}px 'DM Sans', sans-serif`;
        ctx.fillText(label, textDist, 0);
      }
      ctx.restore();

      startAngle = endAngle;
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#0d0d14";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner shadow vignette
    const grad = ctx.createRadialGradient(CX, CY, R * 0.6, CX, CY, R);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }, [items, currentAngle]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={WHEEL_SIZE}
      height={WHEEL_SIZE}
      className="relative z-[2] w-full h-full rounded-full block"
    />
  );
}
