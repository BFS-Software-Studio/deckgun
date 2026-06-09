import { memo } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";

export type ImageNodeData = { src: string };
export type ImageNodeType = Node<ImageNodeData, "image">;

function ImageNodeComponent({ data, selected }: NodeProps<ImageNodeType>) {
  return (
    <div className="cv-image">
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
