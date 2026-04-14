"use client";

import { useEffect } from "react";
import { useWheelStore } from "@/store/wheel-store";

/**
 * Loads persisted items from localStorage on first render.
 * Kept as a tiny separate component so page.tsx stays a server component.
 */
export function AppInit() {
  const loadFromStorage = useWheelStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return null;
}
