import { memo } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { MermaidDiagram } from "./MermaidDiagram";
import "./MarkdownNode.css";

export type MarkdownNodeData = { markdown: string };
export type MarkdownNodeType = Node<MarkdownNodeData, "markdown">;

// One handle per side; ConnectionMode.Loose lets any handle link to any other,
// so the user can draw arrows between cards in any direction.
const SIDES: Position[] = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

function MarkdownNodeComponent({ data, selected }: NodeProps<MarkdownNodeType>) {
  return (
    <div className="md-node">
      <NodeResizer
        minWidth={220}
        minHeight={120}
        isVisible={!!selected}
        lineClassName="md-node-resize-line"
        handleClassName="md-node-resize-handle"
      />

      {SIDES.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className="md-node-handle"
        />
      ))}

      <div className="md-node-body nowheel">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
          components={{
            code({ className, children }) {
              if (/\blanguage-mermaid\b/.test(className ?? "")) {
                const code = Array.isArray(children)
                  ? children.join("")
                  : String(children);
                return <MermaidDiagram code={code.replace(/\n$/, "")} />;
              }
              return <code className={className}>{children}</code>;
            },
          }}
        >
          {data.markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export const MarkdownNode = memo(MarkdownNodeComponent);
