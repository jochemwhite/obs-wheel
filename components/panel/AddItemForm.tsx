"use client";

import { useRef } from "react";
import { useWheelStore } from "@/store/wheel-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/Toast";

export function AddItemForm() {
  const addItem  = useWheelStore((s) => s.addItem);
  const labelRef  = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function handleAdd() {
    const label  = labelRef.current?.value.trim() ?? "";
    const weight = parseFloat(weightRef.current?.value ?? "");

    if (!label)                  { toast("Please enter a label"); return; }
    if (isNaN(weight) || weight <= 0) { toast("Weight must be a positive number"); return; }

    addItem(label, weight);

    if (labelRef.current)  labelRef.current.value  = "";
    if (weightRef.current) weightRef.current.value = "1";
    labelRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <Input
          ref={labelRef}
          type="text"
          placeholder="Item label…"
          maxLength={40}
          onKeyDown={onKeyDown}
        />
        <Input
          ref={weightRef}
          type="number"
          placeholder="Weight"
          defaultValue="1"
          min="0.01"
          step="any"
          className="w-20 flex-none"
          onKeyDown={onKeyDown}
        />
      </div>
      <Button variant="add" size="md" onClick={handleAdd} className="w-full">
        ＋ Add Item
      </Button>
    </div>
  );
}
