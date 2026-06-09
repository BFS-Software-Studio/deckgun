import type { ReactNode } from "react";
import type { ShapeKind } from "./ShapeNode";

export type CanvasTool = "select" | "pen";

const COLORS = [
  "#1d1d1f",
  "#ececed",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
];

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
  select: svg(
    <>
      <path d="M3 3l7.5 18 2.5-7.5L20.5 11z" />
    </>,
  ),
  rectangle: svg(<rect x="4" y="6" width="16" height="12" rx="2" />),
  ellipse: svg(<ellipse cx="12" cy="12" rx="8" ry="6" />),
  pen: svg(
    <>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
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

function Btn({
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
      className={`cv-tool${active ? " active" : ""}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function CanvasToolbar({
  tool,
  onSetTool,
  onAddText,
  onAddShape,
  onAddImage,
  color,
  onColor,
}: {
  tool: CanvasTool;
  onSetTool: (tool: CanvasTool) => void;
  onAddText: () => void;
  onAddShape: (shape: ShapeKind) => void;
  onAddImage: () => void;
  color: string;
  onColor: (color: string) => void;
}) {
  return (
    <div className="cv-toolbar">
      <div className="cv-tool-group">
        <Btn title="Select" active={tool === "select"} onClick={() => onSetTool("select")}>
          {icons.select}
        </Btn>
        <Btn title="Add text" onClick={onAddText}>
          <span className="cv-tool-text">T</span>
        </Btn>
        <Btn title="Rectangle" onClick={() => onAddShape("rectangle")}>
          {icons.rectangle}
        </Btn>
        <Btn title="Ellipse" onClick={() => onAddShape("ellipse")}>
          {icons.ellipse}
        </Btn>
        <Btn title="Image" onClick={onAddImage}>
          {icons.image}
        </Btn>
        <Btn title="Pen" active={tool === "pen"} onClick={() => onSetTool(tool === "pen" ? "select" : "pen")}>
          {icons.pen}
        </Btn>
      </div>

      <span className="cv-tool-sep" />

      <div className="cv-tool-group cv-swatches">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`cv-swatch${c === color ? " active" : ""}`}
            style={{ background: c }}
            title={`Colour ${c}`}
            onClick={() => onColor(c)}
          />
        ))}
      </div>
    </div>
  );
}
