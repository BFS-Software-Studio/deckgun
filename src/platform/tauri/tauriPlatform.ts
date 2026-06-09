import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { DroppedItem, FileDrop, Platform } from "../Platform";

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

const IMAGE_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function imageMime(name: string): string | undefined {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_MIME[ext];
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

            // Tauri reports physical pixels; the UI works in CSS pixels.
            const dpr = window.devicePixelRatio || 1;
            const position = {
              x: event.payload.position.x / dpr,
              y: event.payload.position.y / dpr,
            };

            const items: DroppedItem[] = [];
            for (const path of event.payload.paths) {
              const name = basename(path);
              const lower = path.toLowerCase();
              try {
                if (lower.endsWith(".md")) {
                  const text = await invoke<string>("read_text_file", { path });
                  items.push({ kind: "markdown", name, text });
                } else {
                  const mime = imageMime(name);
                  if (mime) {
                    const b64 = await invoke<string>("read_file_base64", { path });
                    items.push({
                      kind: "image",
                      name,
                      dataUrl: `data:${mime};base64,${b64}`,
                    });
                  }
                }
              } catch (err) {
                console.error("Failed to read dropped file:", path, err);
              }
            }

            if (items.length > 0) handler({ items, position });
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
