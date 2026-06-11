import { getPageNode } from "@core/workspace";
import { Sidebar } from "../Sidebar/Sidebar";
import { CanvasPage } from "../pages/CanvasPage";
import { DocPage } from "../pages/DocPage";
import { useWorkspace, type WorkspaceController } from "./useWorkspace";
import "./Workspace.css";

function PageView({ controller }: { controller: WorkspaceController }) {
  const ws = controller.workspace;
  if (!ws) return null;

  const page = ws.activePageId ? getPageNode(ws, ws.activePageId) : null;

  if (!page) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-title">No page selected</div>
        <div className="ws-empty-hint">
          Pick a page on the left, or create a folder/page to get started.
        </div>
      </div>
    );
  }

  if (page.kind === "canvas") {
    return <CanvasPage key={page.id} pageId={page.id} controller={controller} />;
  }

  return <DocPage key={page.id} pageId={page.id} controller={controller} />;
}

export function Workspace({ name }: { name?: string }) {
  const controller = useWorkspace();

  if (!controller.workspace) {
    return <div className="ws-loading">Loading…</div>;
  }

  return (
    <div className="ws-root">
      <Sidebar controller={controller} title={name} />
      <main className="ws-main">
        <PageView controller={controller} />
      </main>
    </div>
  );
}
