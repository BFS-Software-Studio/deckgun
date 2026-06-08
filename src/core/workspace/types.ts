// Platform-agnostic workspace model. This module is pure data + types with no
// dependency on tldraw, the DOM, or the platform layer, so it can be reused
// verbatim by a future web build.

export type PageKind = "canvas" | "doc";

export interface FolderNode {
  id: string;
  type: "folder";
  name: string;
  children: WorkspaceNode[];
}

export interface PageNode {
  id: string;
  type: "page";
  name: string;
  kind: PageKind;
}

export type WorkspaceNode = FolderNode | PageNode;

// Page contents are stored separately from the tree, keyed by page id, so the
// tree stays small and content can be loaded/diffed independently.
export interface CanvasPageContent {
  kind: "canvas";
  // tldraw snapshot ({ document, session }). Opaque to core.
  snapshot: unknown | null;
}

export interface DocPageContent {
  kind: "doc";
  // rich-text editor document (e.g. TipTap JSON). Opaque to core.
  doc: unknown | null;
}

export type PageContent = CanvasPageContent | DocPageContent;

export interface Workspace {
  version: 1;
  tree: WorkspaceNode[];
  pages: Record<string, PageContent>;
  activePageId: string | null;
  // Folder expand/collapse state, keyed by folder id.
  expanded: Record<string, boolean>;
}
