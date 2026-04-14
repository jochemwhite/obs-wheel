"use client";

import { useCallback } from "react";
import { useWheelStore } from "@/store/wheel-store";
import { weightedPick, calcSpinDelta } from "@/lib/wheel-utils";
import { playWinSound } from "@/lib/audio";

/**
 * Shared spin logic. Can be called from the hub button, a keyboard shortcut,
 * a WebSocket message, or anything else — reads fresh state from the store
 * each time so stale closures are never an issue.
 */
export function useSpin() {
  const spin = useCallback(() => {
    const s = useWheelStore.getState();
    if (s.spinning || s.items.length === 0) return;

    s.setSpinning(true);

    const winIdx     = weightedPick(s.items);
    const totalDelta = calcSpinDelta(s.items, winIdx, s.currentAngle);
    const startAngle = s.currentAngle;
    const dur        = s.spinDuration * 1000;
    let startTime: number | null = null;

    function step(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed  = ts - startTime;
      const progress = Math.min(elapsed / dur, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);

      useWheelStore.getState().setCurrentAngle(startAngle + totalDelta * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        const st = useWheelStore.getState();
        st.setCurrentAngle((startAngle + totalDelta) % (Math.PI * 2));
        st.setSpinning(false);
        st.setWinner(s.items[winIdx]);
        st.setShowWinnerModal(true);
        playWinSound();
      }
    }

    requestAnimationFrame(step);
  }, []); // reads store directly — no deps needed

  return spin;
}
