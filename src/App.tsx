import { useEffect, useRef } from "react";
import {
  Tldraw,
  getSnapshot,
  loadSnapshot,
  createShapeId,
  type Editor,
} from "tldraw";
import "tldraw/tldraw.css";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { MarkdownCardShapeUtil } from "./MarkdownCardShape";
import "./App.css";

const customShapeUtils = [MarkdownCardShapeUtil];

function App() {
  const editorRef = useRef<Editor | null>(null);

  // Ingest .md files dropped onto the window. The browser's HTML5 drag-drop
  // doesn't expose real file paths inside a webview, so we use Tauri's native
  // drag-drop event to get the absolute paths, read each file's contents in
  // Rust, and embed it into a card at the drop location.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;

    getCurrentWebview()
      .onDragDropEvent(async (event) => {
        if (event.payload.type !== "drop") return;
        const editor = editorRef.current;
        if (!editor) return;

        const mdPaths = event.payload.paths.filter((p) =>
          p.toLowerCase().endsWith(".md"),
        );
        if (mdPaths.length === 0) return;

        // Tauri reports the drop position in physical pixels; tldraw's
        // screenToPage expects CSS pixels relative to the viewport.
        const dpr = window.devicePixelRatio || 1;
        const dropPage = editor.screenToPage({
          x: event.payload.position.x / dpr,
          y: event.payload.position.y / dpr,
        });

        const w = 360;
        const h = 320;
        for (let i = 0; i < mdPaths.length; i++) {
          const path = mdPaths[i];
          try {
            const markdown = await invoke<string>("read_text_file", { path });
            // Cascade multiple files so they don't land exactly on top of
            // each other; centre the card on the drop point.
            editor.createShape({
              id: createShapeId(),
              type: "markdown-card",
              x: dropPage.x - w / 2 + i * 32,
              y: dropPage.y - h / 2 + i * 32,
              props: { w, h, markdown },
            });
          } catch (err) {
            console.error("Failed to read dropped file:", path, err);
          }
        }
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  async function handleSave() {
    const editor = editorRef.current;
    if (!editor) return;

    const path = await save({
      title: "Save board",
      filters: [{ name: "DeckGun Board", extensions: ["json"] }],
    });
    if (!path) return; // user cancelled

    const snapshot = getSnapshot(editor.store);
    try {
      await invoke("save_canvas", { path, contents: JSON.stringify(snapshot) });
    } catch (err) {
      console.error("Failed to save board:", err);
      alert(`Failed to save board:\n${err}`);
    }
  }

  async function handleOpen() {
    const editor = editorRef.current;
    if (!editor) return;

    const selected = await open({
      title: "Open board",
      multiple: false,
      filters: [{ name: "DeckGun Board", extensions: ["json"] }],
    });
    if (typeof selected !== "string") return; // cancelled or multiple

    try {
      const contents = await invoke<string>("load_canvas", { path: selected });
      loadSnapshot(editor.store, JSON.parse(contents));
    } catch (err) {
      console.error("Failed to open board:", err);
      alert(`Failed to open board:\n${err}`);
    }
  }

  return (
    <div className="tldraw-container">
      <Tldraw
        shapeUtils={customShapeUtils}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
      />
      <div className="board-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleOpen}>Open</button>
      </div>
    </div>
  );
}

export default App;
