"use client";

import { useRef } from "react";
import { useWheelStore } from "@/store/wheel-store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { uid } from "@/lib/utils";

export function DataControls() {
  const items       = useWheelStore((s) => s.items);
  const importItems = useWheelStore((s) => s.importItems);
  const reset       = useWheelStore((s) => s.resetToDefaults);
  const fileRef     = useRef<HTMLInputElement>(null);
  const { toast }   = useToast();

  function handleExport() {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wheel-of-fortune.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Wheel exported!");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error("Not an array");

        const sanitized = data.map((d) => ({
          id:     uid(),
          label:  String(d.label || "Item").slice(0, 40),
          weight: Math.max(0.01, parseFloat(d.weight) || 1),
        }));

        if (sanitized.length === 0) throw new Error("Empty");

        importItems(sanitized);
        toast(`Imported ${sanitized.length} items ✓`);
      } catch {
        toast("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleReset() {
    if (!confirm("Reset to defaults?")) return;
    reset();
    toast("Reset to defaults");
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bungee)] text-sm tracking-[1px] text-[#f0c040] border-b border-[#2a2a3d] pb-2.5 mb-2.5">
        💾 Data
      </h2>
      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" size="md" onClick={handleExport} className="flex-1">
          ⬇ Export
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => fileRef.current?.click()}
          className="flex-1"
        >
          ⬆ Import
        </Button>
        <Button variant="danger" size="md" onClick={handleReset} className="flex-1">
          🗑 Reset
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />
    </div>
  );
}
