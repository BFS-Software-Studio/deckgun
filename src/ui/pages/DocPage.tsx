import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import type { Editor, JSONContent } from "@tiptap/core";
import { getPageNode } from "@core/workspace";
import { prepareImage } from "@ui/canvas/image";
import type { WorkspaceController } from "../Workspace/useWorkspace";
import "./DocPage.css";

// Crisp, stroke-based icons (SF-symbol-ish) so the toolbar reads as designed,
// not a row of plain letters.
const svg = (children: ReactNode) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const icons = {
  bold: svg(
    <>
      <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
    </>,
  ),
  italic: svg(
    <>
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </>,
  ),
  strike: svg(
    <>
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H8" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </>,
  ),
  bullet: svg(
    <>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </>,
  ),
  ordered: svg(
    <>
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <path d="M4 5h1v4" />
      <path d="M4 16.5c0-.8 1.5-.8 1.5 0 0 .6-1.5 1-1.5 2.5h1.6" />
    </>,
  ),
  quote: svg(
    <>
      <path d="M17 6H3" />
      <path d="M21 12H8" />
      <path d="M21 18H8" />
      <path d="M3 12v6" />
    </>,
  ),
  code: svg(
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>,
  ),
  image: svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>,
  ),
};

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tool-btn${active ? " active" : ""}`}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  return (
    <div className="doc-toolbar">
      <div className="tool-group">
        <ToolButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          {icons.bold}
        </ToolButton>
        <ToolButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          {icons.italic}
        </ToolButton>
        <ToolButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          {icons.strike}
        </ToolButton>
      </div>

      <span className="tool-sep" />

      <div className="tool-group">
        <ToolButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <span className="tool-text">H1</span>
        </ToolButton>
        <ToolButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <span className="tool-text">H2</span>
        </ToolButton>
      </div>

      <span className="tool-sep" />

      <div className="tool-group">
        <ToolButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          {icons.bullet}
        </ToolButton>
        <ToolButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          {icons.ordered}
        </ToolButton>
      </div>

      <span className="tool-sep" />

      <div className="tool-group">
        <ToolButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          {icons.quote}
        </ToolButton>
        <ToolButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {icons.code}
        </ToolButton>
      </div>

      <span className="tool-sep" />

      <div className="tool-group">
        <ToolButton title="Insert image" onClick={onImage}>
          {icons.image}
        </ToolButton>
      </div>
    </div>
  );
}

export function DocPage({
  pageId,
  controller,
}: {
  pageId: string;
  controller: WorkspaceController;
}) {
  const { updatePageContent, registerActiveFlush, rename } = controller;

  const node = controller.workspace
    ? getPageNode(controller.workspace, pageId)
    : null;
  const title = node?.name ?? "";

  // Freeze the page's initial document at mount; the component is keyed by
  // pageId upstream so switching pages remounts with the right content.
  const [initialDoc] = useState<JSONContent | null>(() => {
    const content = controller.workspace?.pages[pageId];
    return content && content.kind === "doc"
      ? (content.doc as JSONContent | null)
      : null;
  });

  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const latestDocRef = useRef<JSONContent | null>(initialDoc);
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something, or paste your notes…",
      }),
      Image.configure({ allowBase64: true }),
    ],
    content: initialDoc ?? "",
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      // Paste images straight from the clipboard (embedded as base64).
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        const images = files
          ? Array.from(files).filter((f) => f.type.startsWith("image/"))
          : [];
        if (images.length === 0) return false;
        images.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            prepareImage(reader.result as string).then(({ src }) =>
              editorRef.current?.chain().focus().setImage({ src }).run(),
            );
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      latestDocRef.current = json;
      setSaving(true);
      if (saveTimer.current !== undefined) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = undefined;
        updatePageContent(pageId, { kind: "doc", doc: json });
        setSaving(false);
      }, 600);
    },
  });

  // Register a flush for app close/hide, and flush any pending edit on unmount
  // (page switch) so the last keystrokes are never lost.
  useEffect(() => {
    const commit = () => {
      if (latestDocRef.current !== null) {
        updatePageContent(pageId, { kind: "doc", doc: latestDocRef.current });
      }
    };
    const unregister = registerActiveFlush(commit);
    return () => {
      unregister();
      if (saveTimer.current !== undefined) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
        commit();
      }
    };
  }, [updatePageContent, registerActiveFlush, pageId]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const onImage = () => fileInputRef.current?.click();

  const handleImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      prepareImage(reader.result as string).then(({ src }) =>
        editor.chain().focus().setImage({ src }).run(),
      );
    };
    reader.readAsDataURL(file);
  };

  const words = editor
    ? editor.getText().trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="doc-page">
      {editor && <Toolbar editor={editor} onImage={onImage} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageFile}
      />

      <div className="doc-scroll">
        <div className="doc-column">
          <input
            className="doc-title"
            value={title}
            placeholder="Untitled"
            spellCheck={false}
            onChange={(e) => rename(pageId, e.target.value)}
          />
          <EditorContent editor={editor} className="doc-editor" />
        </div>
      </div>

      <div className="doc-status">
        <span>{words === 1 ? "1 word" : `${words} words`}</span>
        <span className="doc-status-dot" />
        <span className={`doc-status-save${saving ? " saving" : ""}`}>
          {saving ? "Saving…" : "Saved"}
        </span>
      </div>
    </div>
  );
}
