import { useRef } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const editorRef = useRef<Editor | null>(null);

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
        onMount={(editor) => {
          editorRef.current = editor;
        }}
      />
      <div className="board-actions">
        <button onClick={handleSave}>Kaydet</button>
        <button onClick={handleOpen}>Aç</button>
      </div>
    </div>
  );
}

export default App;
