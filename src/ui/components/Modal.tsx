import type { ReactNode } from "react";
import "./Modal.css";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onPointerDown={onClose}>
      <div
        className="modal-box"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="modal-title">{title}</div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
