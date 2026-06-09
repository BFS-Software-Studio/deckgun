// The platform port: everything the portable core/ui needs from the host
// environment. The desktop build implements this with Tauri; a future web build
// implements the same interface against a server. Nothing outside platform/
// should import @tauri-apps/* directly.

export type DroppedItem =
  | { kind: "markdown"; name: string; text: string }
  | { kind: "image"; name: string; dataUrl: string };

export interface FileDrop {
  items: DroppedItem[];
  // Drop point in CSS pixels, relative to the viewport top-left.
  position: { x: number; y: number };
}

export interface Platform {
  storage: {
    // Returns the serialized workspace JSON, or null if none saved yet.
    loadWorkspace(): Promise<string | null>;
    saveWorkspace(json: string): Promise<void>;
  };
  files: {
    // Subscribe to markdown files dropped onto the window. Returns an
    // unsubscribe function.
    onFileDrop(handler: (drop: FileDrop) => void): () => void;
  };
}
