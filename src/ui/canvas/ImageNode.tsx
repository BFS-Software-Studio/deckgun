import { memo } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import { LockBadge } from "./LockBadge";

export type ImageNodeData = { src: string; locked?: boolean };
export type ImageNodeType = Node<ImageNodeData, "image">;

function ImageNodeComponent({ id, data, selected }: NodeProps<ImageNodeType>) {
  return (
    <div className="cv-image">
      <LockBadge id={id} locked={!!data.locked} />
      <NodeResizer
        minWidth={40}
        minHeight={40}
        isVisible={!!selected}
        keepAspectRatio
        lineClassName="cv-resize-line"
        handleClassName="cv-resize-handle"
      />
      <img className="cv-image-img" src={data.src} alt="" draggable={false} />
    </div>
  );
}

export const ImageNode = memo(ImageNodeComponent);
