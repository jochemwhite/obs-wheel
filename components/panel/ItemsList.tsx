"use client";

import { useWheelStore } from "@/store/wheel-store";
import { COLORS } from "@/lib/constants";
import { totalWeight } from "@/lib/wheel-utils";
import { ItemRow } from "./ItemRow";

export function ItemsList() {
  const items = useWheelStore((s) => s.items);
  const total = totalWeight(items);

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bungee)] text-sm tracking-[1px] text-[#f0c040] border-b border-[#2a2a3d] pb-2.5 mb-2.5 flex items-center gap-2">
        📋 Items
        <span className="text-[0.8rem] text-[#6b6b88] font-[family-name:var(--font-dm)] tracking-normal">
          ({items.length})
        </span>
      </h2>

      <div className="flex flex-col gap-[7px] max-h-[280px] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[#6b6b88] text-sm text-center py-6">
            No items yet — add some above!
          </p>
        ) : (
          items.map((item, idx) => {
            const pct = total > 0
              ? ((item.weight / total) * 100).toFixed(1)
              : "0.0";
            return (
              <ItemRow
                key={item.id}
                item={item}
                color={COLORS[idx % COLORS.length]}
                percentage={pct}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
