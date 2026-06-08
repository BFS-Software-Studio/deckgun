import { getPageNode } from "@core/workspace";
import { Sidebar } from "../Sidebar/Sidebar";
import { PagePlaceholder } from "../pages/PagePlaceholder";
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

  return <PagePlaceholder key={page.id} page={page} />;
}

export function Workspace() {
  const controller = useWorkspace();

  if (!controller.workspace) {
    return <div className="ws-loading">Loading…</div>;
  }

  return (
    <div className="ws-root">
      <Sidebar controller={controller} />
      <main className="ws-main">
        <PageView controller={controller} />
      </main>
    </div>
  );
}
