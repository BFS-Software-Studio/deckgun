import { useEffect, useRef, useState } from "react";
import {
  Tldraw,
  createShapeId,
  getSnapshot,
  type Editor,
  type TLEditorSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import { usePlatform } from "@platform/PlatformProvider";
import { MarkdownCardShapeUtil } from "@ui/MarkdownCard/MarkdownCardShape";
import type { WorkspaceController } from "../Workspace/useWorkspace";
import "./CanvasPage.css";

const shapeUtils = [MarkdownCardShapeUtil];

export function CanvasPage({
  pageId,
  controller,
}: {
  pageId: string;
  controller: WorkspaceController;
}) {
  const platform = usePlatform();
  const editorRef = useRef<Editor | null>(null);

  // Freeze the page's initial snapshot at mount. This component is keyed by
  // pageId upstream, so switching pages remounts it and re-reads the right
  // snapshot; we never feed later workspace updates back into tldraw (which
  // would otherwise cause a save→reload loop).
  const [initialSnapshot] = useState<TLEditorSnapshot | undefined>(() => {
    const content = controller.workspace?.pages[pageId];
    if (content && content.kind === "canvas" && content.snapshot) {
      return content.snapshot as TLEditorSnapshot;
    }
    return undefined;
  });

  // Drop .md files onto the active canvas board → markdown cards at the drop
  // point. The platform delivers already-read file text + a CSS-pixel position.
  useEffect(() => {
    return platform.files.onFileDrop(({ files, position }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const dropPage = editor.screenToPage(position);
      const w = 360;
      const h = 320;
      files.forEach((file, i) => {
        editor.createShape({
          id: createShapeId(),
          type: "markdown-card",
          x: dropPage.x - w / 2 + i * 32,
          y: dropPage.y - h / 2 + i * 32,
          props: { w, h, markdown: file.text },
        });
      });
    });
  }, [platform]);

  function handleMount(editor: Editor) {
    editorRef.current = editor;

    // Debounced save of this page's snapshot back into the workspace, which in
    // turn auto-persists. Only user-driven document edits trigger a save.
    let timer: number | undefined;
    const scheduleSave = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const snapshot = getSnapshot(editor.store);
        controller.updatePageContent(pageId, { kind: "canvas", snapshot });
      }, 800);
    };

    const unlisten = editor.store.listen(scheduleSave, {
      scope: "document",
      source: "user",
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      unlisten();
    };
  }

  return (
    <div className="canvas-page">
      <Tldraw
        snapshot={initialSnapshot}
        shapeUtils={shapeUtils}
        onMount={handleMount}
      />
    </div>
  );
}
