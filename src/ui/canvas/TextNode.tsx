import { memo, useState } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import { useCanvasTools } from "./CanvasContext";

export type TextNodeData = { text: string; color?: string };
export type TextNodeType = Node<TextNodeData, "text">;

function TextNodeComponent({ id, data, selected }: NodeProps<TextNodeType>) {
  const { updateNodeData } = useCanvasTools();
  const [editing, setEditing] = useState(false);
  const color = data.color ?? "var(--text)";

  return (
    <div className="cv-text" style={{ color }}>
      <NodeResizer
        minWidth={80}
        minHeight={32}
        isVisible={!!selected}
        lineClassName="cv-resize-line"
        handleClassName="cv-resize-handle"
      />
      {editing ? (
        <textarea
          className="cv-text-input nodrag nowheel"
          defaultValue={data.text}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => {
            updateNodeData(id, { text: e.currentTarget.value });
            setEditing(false);
          }}
        />
      ) : (
        <div
          className={`cv-text-display${data.text ? "" : " empty"}`}
          onDoubleClick={() => setEditing(true)}
        >
          {data.text || "Double-click to edit"}
        </div>
      )}
    </div>
  );
}

export const TextNode = memo(TextNodeComponent);
