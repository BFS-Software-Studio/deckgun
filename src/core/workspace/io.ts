import { getPageNode } from "./tree";
import type { PageContent, PageNode, Workspace } from "./types";

// Portable JSON formats for moving data between workspaces (or machines).
const WORKSPACE_TYPE = "deckgun-workspace";
const PAGE_TYPE = "deckgun-page";

export interface PageBundle {
  node: PageNode;
  content: PageContent;
}

export function exportWorkspaceJSON(ws: Workspace): string {
  return JSON.stringify(
    { type: WORKSPACE_TYPE, version: 1, workspace: ws },
    null,
    2,
  );
}

export function parseWorkspace(text: string): Workspace {
  const data = JSON.parse(text);
  // Accept either the wrapped export or a bare Workspace object.
  const ws = data && data.type === WORKSPACE_TYPE ? data.workspace : data;
  if (
    !ws ||
    !Array.isArray(ws.tree) ||
    ws.pages == null ||
    typeof ws.pages !== "object"
  ) {
    throw new Error("Not a valid DeckGun workspace file.");
  }
  return {
    version: 1,
    tree: ws.tree,
    pages: ws.pages,
    activePageId: typeof ws.activePageId === "string" ? ws.activePageId : null,
    expanded:
      ws.expanded && typeof ws.expanded === "object" ? ws.expanded : {},
  };
}

export function exportPageJSON(ws: Workspace, pageId: string): string | null {
  const node = getPageNode(ws, pageId);
  const content = ws.pages[pageId];
  if (!node || !content) return null;
  return JSON.stringify({ type: PAGE_TYPE, version: 1, node, content }, null, 2);
}

export function parsePage(text: string): PageBundle {
  const data = JSON.parse(text);
  if (
    !data ||
    data.type !== PAGE_TYPE ||
    !data.node ||
    data.node.type !== "page" ||
    !data.content
  ) {
    throw new Error("Not a valid DeckGun page file.");
  }
  return { node: data.node as PageNode, content: data.content as PageContent };
}
