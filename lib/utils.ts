import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function clamp(min: number, val: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
