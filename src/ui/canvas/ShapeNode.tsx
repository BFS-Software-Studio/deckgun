import { memo, useState } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useCanvasTools, withAlpha } from "./CanvasContext";
import { LockBadge } from "./LockBadge";

export type ShapeKind = "rectangle" | "ellipse";
export type ShapeNodeData = {
  shape: ShapeKind;
  color?: string;
  text?: string;
  locked?: boolean;
};
export type ShapeNodeType = Node<ShapeNodeData, "shape">;

const SIDES: Position[] = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

function ShapeNodeComponent({ id, data, selected }: NodeProps<ShapeNodeType>) {
  const { updateNodeData } = useCanvasTools();
  const [editing, setEditing] = useState(false);
  const color = data.color ?? "#2563eb";

  return (
    <div
      className={`cv-shape cv-shape-${data.shape}`}
      style={{ borderColor: color, background: withAlpha(color, 0.1) }}
    >
      <LockBadge id={id} locked={!!data.locked} />
      <NodeResizer
        minWidth={48}
        minHeight={40}
        isVisible={!!selected}
        lineClassName="cv-resize-line"
        handleClassName="cv-resize-handle"
      />

      {SIDES.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className="cv-handle"
        />
      ))}

      {editing ? (
        <textarea
          className="cv-shape-input nodrag nowheel"
          defaultValue={data.text ?? ""}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => {
            updateNodeData(id, { text: e.currentTarget.value });
            setEditing(false);
          }}
          style={{ color }}
        />
      ) : (
        <div
          className="cv-shape-label"
          style={{ color }}
          onDoubleClick={() => setEditing(true)}
        >
          {data.text}
        </div>
      )}
    </div>
  );
}

export const ShapeNode = memo(ShapeNodeComponent);
