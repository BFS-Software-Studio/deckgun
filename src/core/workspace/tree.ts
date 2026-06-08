import { newId } from "./ids";
import type {
  FolderNode,
  PageContent,
  PageKind,
  PageNode,
  Workspace,
  WorkspaceNode,
} from "./types";

// ---------------------------------------------------------------------------
// Lookups (pure, recursive)
// ---------------------------------------------------------------------------

export function findNode(
  tree: WorkspaceNode[],
  id: string,
): WorkspaceNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.type === "folder") {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentId(
  tree: WorkspaceNode[],
  id: string,
  parentId: string | null = null,
): string | null {
  for (const node of tree) {
    if (node.id === id) return parentId;
    if (node.type === "folder") {
      const found = findParentId(node.children, id, node.id);
      if (found !== null) return found;
    }
  }
  return null;
}

export function getPageNode(ws: Workspace, id: string): PageNode | null {
  const node = findNode(ws.tree, id);
  return node && node.type === "page" ? node : null;
}

function collectPageIds(node: WorkspaceNode): string[] {
  if (node.type === "page") return [node.id];
  return node.children.flatMap(collectPageIds);
}

function collectFolderIds(node: WorkspaceNode): string[] {
  if (node.type !== "folder") return [];
  return [node.id, ...node.children.flatMap(collectFolderIds)];
}

// ---------------------------------------------------------------------------
// Immutable tree edits
// ---------------------------------------------------------------------------

// Resolve where a new node should land: inside a folder target, beside a page
// target (its parent folder), or at the root when there's no target.
function resolveContainerId(ws: Workspace, targetId: string | null): string | null {
  if (!targetId) return null;
  const node = findNode(ws.tree, targetId);
  if (!node) return null;
  if (node.type === "folder") return node.id;
  return findParentId(ws.tree, targetId);
}

function insertNode(
  tree: WorkspaceNode[],
  containerId: string | null,
  node: WorkspaceNode,
): WorkspaceNode[] {
  if (containerId === null) return [...tree, node];
  return tree.map((n) => {
    if (n.type !== "folder") return n;
    if (n.id === containerId) return { ...n, children: [...n.children, node] };
    return { ...n, children: insertNode(n.children, containerId, node) };
  });
}

function removeNode(
  tree: WorkspaceNode[],
  id: string,
): { tree: WorkspaceNode[]; removed: WorkspaceNode | null } {
  let removed: WorkspaceNode | null = null;
  const next: WorkspaceNode[] = [];
  for (const node of tree) {
    if (node.id === id) {
      removed = node;
      continue;
    }
    if (node.type === "folder") {
      const result = removeNode(node.children, id);
      if (result.removed) removed = result.removed;
      next.push({ ...node, children: result.tree });
    } else {
      next.push(node);
    }
  }
  return { tree: next, removed };
}

function renameInTree(
  tree: WorkspaceNode[],
  id: string,
  name: string,
): WorkspaceNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, name };
    if (node.type === "folder") {
      return { ...node, children: renameInTree(node.children, id, name) };
    }
    return node;
  });
}

// ---------------------------------------------------------------------------
// Public workspace operations (Workspace -> Workspace)
// ---------------------------------------------------------------------------

export function emptyWorkspace(): Workspace {
  return { version: 1, tree: [], pages: {}, activePageId: null, expanded: {} };
}

export function defaultPageContent(kind: PageKind): PageContent {
  return kind === "canvas"
    ? { kind: "canvas", snapshot: null }
    : { kind: "doc", doc: null };
}

export function addFolder(
  ws: Workspace,
  targetId: string | null,
  name: string,
): { workspace: Workspace; id: string } {
  const id = newId();
  const node: FolderNode = { id, type: "folder", name, children: [] };
  const containerId = resolveContainerId(ws, targetId);
  const tree = insertNode(ws.tree, containerId, node);
  const expanded = containerId
    ? { ...ws.expanded, [containerId]: true }
    : ws.expanded;
  return { workspace: { ...ws, tree, expanded }, id };
}

export function addPage(
  ws: Workspace,
  targetId: string | null,
  name: string,
  kind: PageKind,
): { workspace: Workspace; id: string } {
  const id = newId();
  const node: PageNode = { id, type: "page", name, kind };
  const containerId = resolveContainerId(ws, targetId);
  const tree = insertNode(ws.tree, containerId, node);
  const pages = { ...ws.pages, [id]: defaultPageContent(kind) };
  const expanded = containerId
    ? { ...ws.expanded, [containerId]: true }
    : ws.expanded;
  return { workspace: { ...ws, tree, pages, expanded, activePageId: id }, id };
}

export function renameNode(ws: Workspace, id: string, name: string): Workspace {
  return { ...ws, tree: renameInTree(ws.tree, id, name) };
}

export function deleteNode(ws: Workspace, id: string): Workspace {
  const { tree, removed } = removeNode(ws.tree, id);
  if (!removed) return ws;

  const removedPageIds = collectPageIds(removed);

  const pages = { ...ws.pages };
  for (const pid of removedPageIds) delete pages[pid];

  const expanded = { ...ws.expanded };
  for (const fid of collectFolderIds(removed)) delete expanded[fid];

  const activePageId =
    ws.activePageId && removedPageIds.includes(ws.activePageId)
      ? null
      : ws.activePageId;

  return { ...ws, tree, pages, expanded, activePageId };
}

export function setActivePage(ws: Workspace, id: string | null): Workspace {
  // Keep the invariant "activePageId is null or points at a real page".
  if (id !== null && !getPageNode(ws, id)) return ws;
  return { ...ws, activePageId: id };
}

export function toggleExpanded(ws: Workspace, folderId: string): Workspace {
  const current = ws.expanded[folderId] ?? false;
  return { ...ws, expanded: { ...ws.expanded, [folderId]: !current } };
}

export function setPageContent(
  ws: Workspace,
  pageId: string,
  content: PageContent,
): Workspace {
  // Keep the page node's kind and its content's kind in lockstep.
  const node = getPageNode(ws, pageId);
  if (!node || node.kind !== content.kind) return ws;
  return { ...ws, pages: { ...ws.pages, [pageId]: content } };
}
