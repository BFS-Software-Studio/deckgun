import type { PageNode } from "@core/workspace";

// F1 placeholder. The real editors arrive next: tldraw canvas (F2) and the
// rich-text document editor (F3). This just confirms routing + persistence.
export function PagePlaceholder({ page }: { page: PageNode }) {
  return (
    <div className="page-placeholder">
      <div className="page-placeholder-icon">
        {page.kind === "canvas" ? "🎨" : "📝"}
      </div>
      <div className="page-placeholder-name">{page.name}</div>
      <div className="page-placeholder-kind">
        {page.kind === "canvas" ? "Canvas page" : "Document page"}
      </div>
      <div className="page-placeholder-hint">
        Editor coming next ({page.kind === "canvas" ? "F2" : "F3"})
      </div>
    </div>
  );
}
