import type { PageKind } from "@core/workspace";
import { Modal } from "./Modal";

export function NewPageDialog({
  onChoose,
  onClose,
}: {
  onChoose: (kind: PageKind) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="New page" onClose={onClose}>
      <div className="page-kind-options">
        <button className="page-kind-card" onClick={() => onChoose("canvas")}>
          <span className="page-kind-icon">🎨</span>
          <span className="page-kind-label">Canvas</span>
          <span className="page-kind-desc">tldraw diagram board</span>
        </button>
        <button className="page-kind-card" onClick={() => onChoose("doc")}>
          <span className="page-kind-icon">📝</span>
          <span className="page-kind-label">Document</span>
          <span className="page-kind-desc">Rich text notes</span>
        </button>
      </div>
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
