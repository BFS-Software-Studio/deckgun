import { newId } from "./ids";
import type { Workspace } from "./types";

// ── TipTap JSON builders (plain data; no editor dependency) ──────────────
type Node = Record<string, unknown>;

const text = (value: string, marks?: Node[]): Node =>
  marks ? { type: "text", text: value, marks } : { type: "text", text: value };
const bold = (value: string): Node => text(value, [{ type: "bold" }]);
const code = (value: string): Node => text(value, [{ type: "code" }]);
const para = (...content: Node[]): Node =>
  content.length ? { type: "paragraph", content } : { type: "paragraph" };
const heading = (level: number, ...content: Node[]): Node => ({
  type: "heading",
  attrs: { level },
  content,
});
const item = (...content: Node[]): Node => ({ type: "listItem", content });
const bulletList = (...items: Node[]): Node => ({
  type: "bulletList",
  content: items,
});

const welcomeDoc: Node = {
  type: "doc",
  content: [
    heading(1, text("Welcome to DeckGun 👋")),
    para(
      text("This is a "),
      bold("Document"),
      text(
        " page — great for notes, specs, or even passwords. It saves itself as you type, fully offline.",
      ),
    ),
    heading(2, text("What you can do")),
    bulletList(
      item(
        para(
          text("Create "),
          bold("folders"),
          text(" and "),
          bold("pages"),
          text(" from the left sidebar"),
        ),
      ),
      item(
        para(
          text("Choose "),
          bold("Canvas"),
          text(" for diagrams or "),
          bold("Document"),
          text(" for rich text"),
        ),
      ),
      item(
        para(text("Format with the floating toolbar at the top of this page")),
      ),
      item(
        para(
          text("Drop "),
          code(".md"),
          text(" files onto a Canvas page to turn them into cards"),
        ),
      ),
    ),
    para(
      text(
        "Rename this page from the title above, or delete the Templates folder once you're set up.",
      ),
    ),
  ],
};

const welcomeCanvasMarkdown = `# Welcome to the Canvas

This is an **infinite canvas**. You can:

- Draw shapes, arrows, and text with the tools below
- **Drag & drop \`.md\` files** anywhere to drop them as cards
- Everything **autosaves** to this page

\`\`\`mermaid
flowchart LR
  A[".md file"] -->|drag & drop| B[Card on canvas]
  B --> C[Arrange freely]
\`\`\`
`;

// The workspace a brand-new user sees on first launch.
export function seedWorkspace(): Workspace {
  const folderId = newId();
  const docId = newId();
  const canvasId = newId();

  return {
    version: 1,
    tree: [
      {
        id: folderId,
        type: "folder",
        name: "Templates",
        children: [
          { id: docId, type: "page", name: "Welcome (Document)", kind: "doc" },
          {
            id: canvasId,
            type: "page",
            name: "Welcome (Canvas)",
            kind: "canvas",
          },
        ],
      },
    ],
    pages: {
      [docId]: { kind: "doc", doc: welcomeDoc },
      [canvasId]: {
        kind: "canvas",
        snapshot: null,
        seedMarkdown: welcomeCanvasMarkdown,
      },
    },
    activePageId: docId,
    expanded: { [folderId]: true },
  };
}
