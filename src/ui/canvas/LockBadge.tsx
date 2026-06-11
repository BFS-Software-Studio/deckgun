import { memo } from "react";
import { useCanvasTools } from "./CanvasContext";

// Small lock toggle pinned to a node's corner. It stays clickable even when the
// node itself is locked (the locked node gets `pointer-events: none` so clicks
// pan the canvas, but this badge re-enables pointer events for itself).
function LockBadgeComponent({ id, locked }: { id: string; locked: boolean }) {
  const { toggleNodeLock } = useCanvasTools();
  return (
    <button
      type="button"
      className={`cv-lock-badge nodrag ${locked ? "locked" : "unlocked"}`}
      title={locked ? "Unlock" : "Lock"}
      // Stop the press from starting a node drag/selection on unlocked nodes.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        toggleNodeLock(id);
      }}
    >
      {locked ? "🔒" : "🔓"}
    </button>
  );
}

export const LockBadge = memo(LockBadgeComponent);
