import { createContext, useContext } from "react";

export interface CanvasTools {
  // Patch a node's data (used by editable nodes) and persist.
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  // Toggle a node's locked state. Locked nodes can't be moved/selected and
  // clicks pass through them so the canvas pans (Figma-style).
  toggleNodeLock: (id: string) => void;
}

export const CanvasContext = createContext<CanvasTools | null>(null);

export function useCanvasTools(): CanvasTools {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("useCanvasTools must be used within a CanvasContext");
  }
  return ctx;
}

// Translucent fill from a hex colour, for shape backgrounds.
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
