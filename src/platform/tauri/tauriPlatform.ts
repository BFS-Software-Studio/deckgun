import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { DroppedFile, FileDrop, Platform } from "../Platform";

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

// The Tauri implementation of the platform port. This is the only module that
// talks to @tauri-apps/* and the Rust commands.
export function createTauriPlatform(): Platform {
  return {
    storage: {
      loadWorkspace() {
        return invoke<string | null>("load_workspace");
      },
      async saveWorkspace(json: string) {
        await invoke("save_workspace", { contents: json });
      },
    },

    files: {
      onFileDrop(handler: (drop: FileDrop) => void) {
        let unlisten: (() => void) | undefined;
        let disposed = false;

        // HTML5 drag-drop doesn't expose real file paths inside a webview, so
        // use Tauri's native drag-drop event and read each file in Rust.
        getCurrentWebview()
          .onDragDropEvent(async (event) => {
            if (event.payload.type !== "drop") return;

            const mdPaths = event.payload.paths.filter((p) =>
              p.toLowerCase().endsWith(".md"),
            );
            if (mdPaths.length === 0) return;

            // Tauri reports physical pixels; the UI works in CSS pixels.
            const dpr = window.devicePixelRatio || 1;
            const position = {
              x: event.payload.position.x / dpr,
              y: event.payload.position.y / dpr,
            };

            const files: DroppedFile[] = [];
            for (const path of mdPaths) {
              try {
                const text = await invoke<string>("read_text_file", { path });
                files.push({ name: basename(path), text });
              } catch (err) {
                console.error("Failed to read dropped file:", path, err);
              }
            }

            if (files.length > 0) handler({ files, position });
          })
          .then((fn) => {
            if (disposed) fn();
            else unlisten = fn;
          });

        return () => {
          disposed = true;
          unlisten?.();
        };
      },
    },
  };
}
