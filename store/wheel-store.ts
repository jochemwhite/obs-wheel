"use client";

import { create } from "zustand";
import { WheelItem } from "@/types";
import { uid } from "@/lib/utils";
import { getDefaultItems } from "@/lib/constants";

const STORAGE_KEY = "wof_items";

interface WheelStore {
  // State
  items: WheelItem[];
  spinning: boolean;
  currentAngle: number;
  spinDuration: number;
  winner: WheelItem | null;
  showWinnerModal: boolean;

  // Actions
  addItem: (label: string, weight: number) => void;
  removeItem: (id: string) => void;
  updateItemLabel: (id: string, label: string) => void;
  updateItemWeight: (id: string, weight: number) => void;
  setSpinning: (spinning: boolean) => void;
  setCurrentAngle: (angle: number) => void;
  setSpinDuration: (duration: number) => void;
  setWinner: (winner: WheelItem | null) => void;
  setShowWinnerModal: (show: boolean) => void;
  importItems: (items: WheelItem[]) => void;
  resetToDefaults: () => void;
  loadFromStorage: () => void;
}

function saveItems(items: WheelItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage not available
  }
}

export const useWheelStore = create<WheelStore>((set, get) => ({
  items: [],
  spinning: false,
  currentAngle: 0,
  spinDuration: 4,
  winner: null,
  showWinnerModal: false,

  addItem: (label, weight) => {
    const newItems = [...get().items, { id: uid(), label, weight }];
    saveItems(newItems);
    set({ items: newItems });
  },

  removeItem: (id) => {
    const newItems = get().items.filter((i) => i.id !== id);
    saveItems(newItems);
    set({ items: newItems });
  },

  updateItemLabel: (id, label) => {
    const newItems = get().items.map((i) =>
      i.id === id ? { ...i, label } : i
    );
    saveItems(newItems);
    set({ items: newItems });
  },

  updateItemWeight: (id, weight) => {
    const newItems = get().items.map((i) =>
      i.id === id ? { ...i, weight } : i
    );
    saveItems(newItems);
    set({ items: newItems });
  },

  setSpinning: (spinning) => set({ spinning }),
  setCurrentAngle: (currentAngle) => set({ currentAngle }),
  setSpinDuration: (spinDuration) => set({ spinDuration }),
  setWinner: (winner) => set({ winner }),
  setShowWinnerModal: (showWinnerModal) => set({ showWinnerModal }),

  importItems: (items) => {
    saveItems(items);
    set({ items });
  },

  resetToDefaults: () => {
    const defaults = getDefaultItems();
    saveItems(defaults);
    set({ items: defaults });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ items: parsed });
          return;
        }
      }
    } catch {
      // Fall through to defaults
    }
    const defaults = getDefaultItems();
    saveItems(defaults);
    set({ items: defaults });
  },
}));
