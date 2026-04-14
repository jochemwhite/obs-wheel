import { WheelItem } from "@/types";

export function totalWeight(items: WheelItem[]): number {
  return items.reduce((s, i) => s + i.weight, 0);
}

export function weightedPick(items: WheelItem[]): number {
  const total = totalWeight(items);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= items[i].weight;
    if (r <= 0) return i;
  }
  return items.length - 1;
}

/**
 * Given a winning index, calculates the total angle delta the wheel must
 * rotate so the pointer (at -π/2) lands on the center of the winning slice.
 */
export function calcSpinDelta(
  items: WheelItem[],
  winIdx: number,
  currentAngle: number
): number {
  const total = totalWeight(items);
  let sliceStart = 0;
  for (let i = 0; i < winIdx; i++) {
    sliceStart += (items[i].weight / total) * Math.PI * 2;
  }
  const sliceMid = sliceStart + (items[winIdx].weight / total * Math.PI * 2) / 2;

  const extraSpins = Math.PI * 2 * (5 + Math.floor(Math.random() * 3));
  const targetDelta =
    ((-Math.PI / 2 - sliceMid - currentAngle) % (Math.PI * 2) + Math.PI * 2) %
    (Math.PI * 2);

  return extraSpins + targetDelta;
}
