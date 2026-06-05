# DeckGun

Local-first, offline desktop app for an infinite canvas of AI-generated markdown.

Drag a `.md` file (e.g. produced by Cursor or Claude Code) onto the window and it
renders as a card on an infinite canvas — markdown, code, and mermaid diagrams
included. Arrange cards freely alongside shapes, arrows, and text, then save the
whole board to disk. Card content is embedded as a snapshot, so a card keeps
working even if the original file is later moved or deleted.

No internet, server, or account required.

## Tech stack

- **Shell / packaging:** Tauri 2 (Rust)
- **Frontend:** React + TypeScript + Vite
- **Canvas:** tldraw
- **Card rendering:** react-markdown + remark-gfm + rehype-highlight + mermaid

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
