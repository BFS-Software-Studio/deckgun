import { useCallback, useEffect, useRef, useState } from "react";
import { usePlatform } from "@platform/PlatformProvider";
import {
  addFolder,
  addPage,
  deleteNode,
  emptyWorkspace,
  moveNode,
  renameNode,
  seedWorkspace,
  setActivePage,
  setPageContent,
  toggleExpanded,
  type PageBundle,
  type PageContent,
  type PageKind,
  type Workspace,
} from "@core/workspace";

export interface WorkspaceActions {
  newFolder(targetId: string | null, name: string): string | null;
  newPage(targetId: string | null, name: string, kind: PageKind): string | null;
  rename(id: string, name: string): void;
  remove(id: string): void;
  move(nodeId: string, targetId: string | null): void;
  select(id: string | null): void;
  toggleFolder(id: string): void;
  updatePageContent(pageId: string, content: PageContent): void;
  // The active page editor registers a function that commits its latest
  // (possibly still-debounced) content into the workspace. Used to flush on
  // app close/hide so the last edits aren't lost. Returns an unregister fn.
  registerActiveFlush(flush: () => void): () => void;
  // Replace the whole workspace (import).
  replaceWorkspace(ws: Workspace): void;
  // Add an imported page (fresh id) under targetId (or root). Returns its id.
  importPage(bundle: PageBundle, targetId: string | null): string | null;
}

export interface WorkspaceController extends WorkspaceActions {
  workspace: Workspace | null; // null while loading
}

export function useWorkspace(): WorkspaceController {
  const platform = usePlatform();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // Always-fresh handle to the current workspace so actions can compute the
  // next state synchronously (and return new ids) without stale closures.
  const wsRef = useRef<Workspace | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const activeFlushRef = useRef<(() => void) | null>(null);

  const apply = useCallback((next: Workspace) => {
    wsRef.current = next;
    setWorkspace(next);
  }, []);

  const registerActiveFlush = useCallback((flush: () => void) => {
    activeFlushRef.current = flush;
    return () => {
      if (activeFlushRef.current === flush) activeFlushRef.current = null;
    };
  }, []);

  // Force the latest in-memory workspace to disk immediately (best effort),
  // first pulling any still-debounced edit out of the active page editor.
  const flushNow = useCallback(() => {
    activeFlushRef.current?.();
    const ws = wsRef.current;
    if (!ws) return;
    const json = JSON.stringify(ws);
    if (json === lastSavedRef.current) return;
    platform.storage
      .saveWorkspace(json)
      .then(() => {
        lastSavedRef.current = json;
      })
      .catch((err) => console.error("Flush save failed:", err));
  }, [platform]);

  // Persist on window close / hide so edits inside the debounce window survive.
  useEffect(() => {
    const onHide = () => flushNow();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushNow]);

  // Load once on mount.
  useEffect(() => {
    let cancelled = false;
    platform.storage
      .loadWorkspace()
      .then((json) => {
        if (cancelled) return;
        let ws: Workspace;
        let savedJson: string | null = null;
        if (json) {
          try {
            ws = JSON.parse(json) as Workspace;
            savedJson = json;
          } catch {
            ws = emptyWorkspace();
          }
        } else {
          // First launch: seed a friendly "Templates" folder with examples.
          ws = seedWorkspace();
        }
        // null for a fresh seed/recovery → the autosave effect persists it.
        lastSavedRef.current = savedJson;
        apply(ws);
      })
      .catch((err) => {
        console.error("Failed to load workspace:", err);
        const ws = emptyWorkspace();
        lastSavedRef.current = JSON.stringify(ws);
        apply(ws);
      });
    return () => {
      cancelled = true;
    };
  }, [platform, apply]);

  // Debounced autosave; skips when nothing changed since the last save/load.
  useEffect(() => {
    if (!workspace) return;
    const json = JSON.stringify(workspace);
    if (json === lastSavedRef.current) return;
    const timer = window.setTimeout(() => {
      platform.storage
        .saveWorkspace(json)
        .then(() => {
          lastSavedRef.current = json;
        })
        .catch((err) => console.error("Failed to save workspace:", err));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [workspace, platform]);

  const newFolder = useCallback(
    (targetId: string | null, name: string) => {
      const ws = wsRef.current;
      if (!ws) return null;
      const { workspace: next, id } = addFolder(ws, targetId, name);
      apply(next);
      return id;
    },
    [apply],
  );

  const newPage = useCallback(
    (targetId: string | null, name: string, kind: PageKind) => {
      const ws = wsRef.current;
      if (!ws) return null;
      const { workspace: next, id } = addPage(ws, targetId, name, kind);
      apply(next);
      return id;
    },
    [apply],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const ws = wsRef.current;
      if (!ws) return;
      apply(renameNode(ws, id, name));
    },
    [apply],
  );

  const remove = useCallback(
    (id: string) => {
      const ws = wsRef.current;
      if (!ws) return;
      apply(deleteNode(ws, id));
    },
    [apply],
  );

  const move = useCallback(
    (nodeId: string, targetId: string | null) => {
      const ws = wsRef.current;
      if (!ws) return;
      apply(moveNode(ws, nodeId, targetId));
    },
    [apply],
  );

  const select = useCallback(
    (id: string | null) => {
      const ws = wsRef.current;
      if (!ws) return;
      apply(setActivePage(ws, id));
    },
    [apply],
  );

  const toggleFolder = useCallback(
    (id: string) => {
      const ws = wsRef.current;
      if (!ws) return;
      apply(toggleExpanded(ws, id));
    },
    [apply],
  );

  const updatePageContent = useCallback(
    (pageId: string, content: PageContent) => {
      const ws = wsRef.current;
      if (!ws) return;
      apply(setPageContent(ws, pageId, content));
    },
    [apply],
  );

  const replaceWorkspace = useCallback(
    (ws: Workspace) => {
      apply(ws);
    },
    [apply],
  );

  const importPage = useCallback(
    (bundle: PageBundle, targetId: string | null) => {
      const ws = wsRef.current;
      if (!ws) return null;
      const { workspace: next, id } = addPage(
        ws,
        targetId,
        bundle.node.name,
        bundle.node.kind,
      );
      apply(setPageContent(next, id, bundle.content));
      return id;
    },
    [apply],
  );

  return {
    workspace,
    newFolder,
    newPage,
    rename,
    remove,
    move,
    select,
    toggleFolder,
    updatePageContent,
    registerActiveFlush,
    replaceWorkspace,
    importPage,
  };
}
