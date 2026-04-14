"use client";

import { useRef } from "react";
import { WheelItem } from "@/types";
import { useWheelStore } from "@/store/wheel-store";
import { useToast } from "@/components/Toast";
import { X } from "lucide-react";

interface ItemRowProps {
  item: WheelItem;
  color: string;
  percentage: string;
}

export function ItemRow({ item, color, percentage }: ItemRowProps) {
  const updateLabel  = useWheelStore((s) => s.updateItemLabel);
  const updateWeight = useWheelStore((s) => s.updateItemWeight);
  const removeItem   = useWheelStore((s) => s.removeItem);
  const { toast }    = useToast();

  const labelRef  = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  function onLabelChange() {
    const val = labelRef.current?.value.trim() ?? "";
    if (!val) {
      toast("Label cannot be empty");
      if (labelRef.current) labelRef.current.value = item.label;
      return;
    }
    updateLabel(item.id, val);
  }

  function onWeightChange() {
    const val = parseFloat(weightRef.current?.value ?? "");
    if (isNaN(val) || val <= 0) {
      toast("Weight must be a positive number");
      if (weightRef.current) weightRef.current.value = String(item.weight);
      return;
    }
    updateWeight(item.id, val);
  }

  return (
    <div
      className="flex items-center gap-2 bg-[#1e1e2e] border border-[#2a2a3d] rounded-[10px] px-2.5 py-2 transition-colors hover:border-[#6b6b88]"
      style={{ animation: "fade-in 0.25s ease" }}
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />

      {/* Editable label */}
      <input
        ref={labelRef}
        defaultValue={item.label}
        onBlur={onLabelChange}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        title="Click to edit label"
        className="flex-1 bg-transparent border-none text-[#e8e8f0] text-sm font-[family-name:var(--font-dm)] min-w-0 focus:outline-dashed focus:outline-1 focus:outline-[#f0c040] focus:rounded-[4px]"
      />

      {/* Editable weight */}
      <input
        ref={weightRef}
        type="number"
        defaultValue={item.weight}
        min="0.01"
        step="any"
        onBlur={onWeightChange}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        title="Weight"
        className="w-[52px] bg-[#12121b] border border-[#2a2a3d] rounded-[6px] text-[#f0c040] text-xs font-semibold text-center py-1 px-1 focus:outline-none focus:border-[#f0c040]"
      />

      {/* Percentage */}
      <span className="text-xs text-[#6b6b88] w-[36px] text-right flex-shrink-0">
        {percentage}%
      </span>

      {/* Remove button */}
      <button
        onClick={() => removeItem(item.id)}
        title="Remove"
        className="text-[#6b6b88] hover:text-[#ff5f6d] hover:bg-[rgba(255,95,109,0.15)] rounded-[4px] p-1 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
