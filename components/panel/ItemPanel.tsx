import { AddItemForm } from "./AddItemForm";
import { ItemsList } from "./ItemsList";
import { DataControls } from "./DataControls";

export function ItemPanel() {
  return (
    <aside className="bg-[#16161f] border border-[#2a2a3d] rounded-[14px] p-[22px] flex flex-col gap-5">
      <h2 className="font-[family-name:var(--font-bungee)] text-sm tracking-[1px] text-[#f0c040] border-b border-[#2a2a3d] pb-2.5">
        ⚙ Wheel Items
      </h2>
      <AddItemForm />
      <ItemsList />
      <DataControls />
    </aside>
  );
}
