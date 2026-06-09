import { memo } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";

export type DrawNodeData = {
  path: string;
  color?: string;
  w: number;
  h: number;
};
export type DrawNodeType = Node<DrawNodeData, "draw">;

function DrawNodeComponent({ data, selected }: NodeProps<DrawNodeType>) {
  const color = data.color ?? "#1d1d1f";
  return (
    <div className="cv-draw">
      <NodeResizer
        minWidth={16}
        minHeight={16}
        isVisible={!!selected}
        keepAspectRatio
        lineClassName="cv-resize-line"
        handleClassName="cv-resize-handle"
      />
      <svg
        className="cv-draw-svg"
        viewBox={`0 0 ${data.w} ${data.h}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        <path d={data.path} fill={color} />
      </svg>
    </div>
  );
}

export const DrawNode = memo(DrawNodeComponent);
