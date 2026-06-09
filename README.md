# DeckGun

A local-first, fully offline desktop app for documenting a codebase (or anything
else) on a workspace of infinite canvases and rich-text pages.

Organise your work in a left-hand sidebar of **folders and pages**. Each page is
one of two kinds:

- **🎨 Canvas** — an infinite board where you drop `.md` files (e.g. produced by
  Cursor or Claude Code) as rendered cards (markdown + code + mermaid diagrams),
  connect them with arrows, add text, shapes, freehand drawings and images, and
  arrange everything freely.
- **📝 Document** — a clean rich-text editor for notes, specs, or credentials,
  with a floating formatting toolbar and inline images.

Everything **auto-saves** locally and works completely offline. Dropped-in
content (markdown, images) is embedded, so a card or page keeps working even if
the original file is later moved or deleted. A built-in **light / dark theme**
lives under the sidebar's Settings.

No internet, server, or account required.

## Tech stack

- **Shell / packaging:** Tauri 2 (Rust)
- **Frontend:** React + TypeScript + Vite
- **Canvas:** React Flow (`@xyflow/react`) with custom nodes
- **Rich text:** TipTap
- **Card rendering:** react-markdown + remark-gfm + rehype-highlight + mermaid
- **Freehand drawing:** perfect-freehand
- **Persistence:** workspace auto-saved as JSON in the OS app-data directory

## Architecture

The code is split so a future web build can reuse it wholesale:

- `src/core/` — platform-agnostic domain (workspace tree, types). No React,
  no platform APIs.
- `src/ui/` — portable React components (sidebar, pages, canvas, editors).
- `src/platform/` — the only place that talks to Tauri (a `Platform` port with a
  Tauri adapter). Swapping in a web adapter is all it takes to run on the web.

## Development

```bash
npm install
npm run tauri dev      # launches the desktop window with hot reload
```

## Build

```bash
npm run tauri build    # produces a Windows installer / .exe
```

## Requirements

- Node.js ≥ 18
- Rust (cargo + rustc)
- On Windows: Visual Studio C++ Build Tools and WebView2
