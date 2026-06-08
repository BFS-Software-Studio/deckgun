import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type TLBaseShape,
} from "tldraw";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { MermaidDiagram } from "./MermaidDiagram";
import "./MarkdownCardShape.css";

// A custom tldraw shape that embeds a snapshot of markdown content and renders
// it (GFM tables/lists + syntax-highlighted code) inside the canvas.
export type MarkdownCardShape = TLBaseShape<
  "markdown-card",
  {
    w: number;
    h: number;
    markdown: string;
  }
>;

// Register the shape with tldraw's type system so TLShape/createShape know about
// it. (tldraw v5: custom shapes are declared by augmenting TLGlobalShapePropsMap.)
declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    "markdown-card": MarkdownCardShape["props"];
  }
}

export class MarkdownCardShapeUtil extends BaseBoxShapeUtil<MarkdownCardShape> {
  static override type = "markdown-card" as const;

  static override props = {
    w: T.number,
    h: T.number,
    markdown: T.string,
  };

  override getDefaultProps(): MarkdownCardShape["props"] {
    return {
      w: 360,
      h: 280,
      markdown: "# New card\n",
    };
  }

  // BaseBoxShapeUtil provides getGeometry() and onResize() for box shapes.

  override component(shape: MarkdownCardShape) {
    return (
      <HTMLContainer
        className="markdown-card"
        style={{ width: shape.props.w, height: shape.props.h }}
      >
        <div className="markdown-card-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
            components={{
              code({ className, children }) {
                // ```mermaid blocks become rendered diagrams; every other
                // code block keeps its rehype-highlight syntax colouring.
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
            {shape.props.markdown}
          </ReactMarkdown>
        </div>
      </HTMLContainer>
    );
  }

  override getIndicatorPath(shape: MarkdownCardShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 8);
    return path;
  }
}
