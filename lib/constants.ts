import { WheelItem } from "@/types";
import { uid } from "@/lib/utils";

export const COLORS = [
  "#ff5f6d", "#ff9a3c", "#f0c040", "#6be585",
  "#40d0f0", "#8b7ffe", "#f06292", "#4dd0e1",
  "#aed581", "#ff8a65", "#ba68c8", "#4fc3f7",
];

export const WIN_EMOJIS = ["🏆", "🎉", "🎊", "⭐", "🌟", "💥", "🎁", "✨"];

export const WHEEL_SIZE = 440;

export function getDefaultItems(): WheelItem[] {
  return [
    { id: uid(), label: "Prize 🎁",     weight: 1   },
    { id: uid(), label: "Try Again 🔄", weight: 3   },
    { id: uid(), label: "Jackpot 💰",   weight: 0.5 },
    { id: uid(), label: "Bonus 🌟",     weight: 1.5 },
    { id: uid(), label: "Mystery 🎭",   weight: 1   },
    { id: uid(), label: "Free Spin ♻",  weight: 1   },
  ];
}
