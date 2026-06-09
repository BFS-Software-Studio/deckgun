import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { newId } from "@core/workspace";
import { usePlatform } from "@platform/PlatformProvider";
import { MarkdownNode } from "@ui/MarkdownCard/MarkdownNode";
import { CanvasContext, type CanvasTools } from "@ui/canvas/CanvasContext";
import { TextNode } from "@ui/canvas/TextNode";
import { ShapeNode, type ShapeKind } from "@ui/canvas/ShapeNode";
import { DrawNode } from "@ui/canvas/DrawNode";
import { CanvasToolbar, type CanvasTool } from "@ui/canvas/CanvasToolbar";
import { strokePath } from "@ui/canvas/freehand";
import type { WorkspaceController } from "../Workspace/useWorkspace";
import "@ui/canvas/canvas.css";
import "./CanvasPage.css";

const nodeTypes: NodeTypes = {
  markdown: MarkdownNode,
  text: TextNode,
  shape: ShapeNode,
  draw: DrawNode,
};

const STROKE_PX = 3.5;

interface CanvasFlow {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

function makeCardNode(markdown: string, x: number, y: number): Node {
  return {
    id: newId(),
    type: "markdown",
    position: { x, y },
    data: { markdown },
    width: 360,
    height: 320,
  };
}

function CanvasInner({
  pageId,
  controller,
}: {
  pageId: string;
  controller: WorkspaceController;
}) {
  const platform = usePlatform();
  const { updatePageContent, registerActiveFlush } = controller;
  const rf = useReactFlow();

  const wrapRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  const [tool, setTool] = useState<CanvasTool>("select");
  const [color, setColor] = useState("#1d1d1f");

  const [initial] = useState<CanvasFlow>(() => {
    const content = controller.workspace?.pages[pageId];
    const snap = content && content.kind === "canvas" ? content.snapshot : null;
    if (snap && typeof snap === "object" && Array.isArray((snap as CanvasFlow).nodes)) {
      return snap as CanvasFlow;
    }
    return { nodes: [], edges: [] };
  });
  const [seedMarkdown] = useState<string | null>(() => {
    const content = controller.workspace?.pages[pageId];
    return content && content.kind === "canvas"
      ? (content.seedMarkdown ?? null)
      : null;
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const commit = useCallback(() => {
    updatePageContent(pageId, { kind: "canvas", snapshot: rf.toObject() });
  }, [rf, updatePageContent, pageId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current !== undefined) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = undefined;
      commit();
    }, 700);
  }, [commit]);

  const updateNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
        ),
      );
      scheduleSave();
    },
    [setNodes, scheduleSave],
  );
  const tools = useMemo<CanvasTools>(() => ({ updateNodeData }), [updateNodeData]);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      scheduleSave();
    },
    [onNodesChange, scheduleSave],
  );
  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      scheduleSave();
    },
    [onEdgesChange, scheduleSave],
  );
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds),
      );
      scheduleSave();
    },
    [setEdges, scheduleSave],
  );

  // Add a node at the centre of the visible area, selected (others deselected).
  const addNodeAtCenter = useCallback(
    (build: (x: number, y: number) => Node) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      const center = rect
        ? rf.screenToFlowPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          })
        : { x: 0, y: 0 };
      const node = build(center.x, center.y);
      setNodes((nds) =>
        nds.map((n) => ({ ...n, selected: false })).concat({ ...node, selected: true }),
      );
      setTool("select");
      scheduleSave();
    },
    [rf, setNodes, scheduleSave],
  );

  const onAddText = useCallback(() => {
    addNodeAtCenter((x, y) => ({
      id: newId(),
      type: "text",
      position: { x: x - 90, y: y - 26 },
      width: 180,
      height: 52,
      data: { text: "", color },
    }));
  }, [addNodeAtCenter, color]);

  const onAddShape = useCallback(
    (shape: ShapeKind) => {
      addNodeAtCenter((x, y) => ({
        id: newId(),
        type: "shape",
        position: { x: x - 80, y: y - 55 },
        width: 160,
        height: 110,
        data: { shape, color },
      }));
    },
    [addNodeAtCenter, color],
  );

  // Set the active colour and recolour any selected nodes.
  const onColor = useCallback(
    (c: string) => {
      setColor(c);
      setNodes((nds) =>
        nds.map((n) => (n.selected ? { ...n, data: { ...n.data, color: c } } : n)),
      );
      scheduleSave();
    },
    [setNodes, scheduleSave],
  );

  // ── Pen tool ──────────────────────────────────────────────────────────
  const strokeRef = useRef<number[][] | null>(null);
  const [preview, setPreview] = useState("");

  const penDown = useCallback((e: ReactPointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    strokeRef.current = [[e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5]];
    setPreview("");
  }, []);

  const penMove = useCallback((e: ReactPointerEvent) => {
    const pts = strokeRef.current;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!pts || !rect) return;
    pts.push([e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5]);
    setPreview(strokePath(pts, STROKE_PX));
  }, []);

  const penUp = useCallback(() => {
    const pts = strokeRef.current;
    strokeRef.current = null;
    setPreview("");
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!pts || pts.length < 2 || !rect) return;

    const zoom = rf.getViewport().zoom || 1;
    const flow = pts.map(([x, y]) => {
      const p = rf.screenToFlowPosition({ x: x + rect.left, y: y + rect.top });
      return [p.x, p.y];
    });
    const xs = flow.map((p) => p[0]);
    const ys = flow.map((p) => p[1]);
    const pad = (STROKE_PX / zoom) * 2;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) + pad - minX;
    const h = Math.max(...ys) + pad - minY;
    const rel = flow.map(([x, y]) => [x - minX, y - minY, 0.5]);
    const path = strokePath(rel, STROKE_PX / zoom);

    setNodes((nds) =>
      nds.concat({
        id: newId(),
        type: "draw",
        position: { x: minX, y: minY },
        width: w,
        height: h,
        data: { path, color, w, h },
      }),
    );
    scheduleSave();
  }, [rf, setNodes, scheduleSave, color]);

  // ── Drop .md files → markdown cards ───────────────────────────────────
  useEffect(() => {
    return platform.files.onFileDrop(({ files, position }) => {
      const point = rf.screenToFlowPosition(position);
      const newNodes = files.map((file, i) =>
        makeCardNode(file.text, point.x - 180 + i * 28, point.y - 140 + i * 28),
      );
      setNodes((nds) => nds.concat(newNodes));
      scheduleSave();
    });
  }, [platform, rf, setNodes, scheduleSave]);

  // ── One-time welcome card seed ────────────────────────────────────────
  useEffect(() => {
    if (seededRef.current || initial.nodes.length > 0 || !seedMarkdown) return;
    seededRef.current = true;
    const node: Node = { ...makeCardNode(seedMarkdown, 0, 0), width: 460, height: 520 };
    setNodes([node]);
    updatePageContent(pageId, {
      kind: "canvas",
      snapshot: { nodes: [node], edges: [], viewport: initial.viewport },
    });
    requestAnimationFrame(() => rf.fitView({ padding: 0.3, maxZoom: 1 }));
  }, [initial, seedMarkdown, setNodes, updatePageContent, pageId, rf]);

  // ── Flush on close/hide + page-switch unmount ─────────────────────────
  useEffect(() => {
    const unregister = registerActiveFlush(commit);
    return () => {
      unregister();
      if (saveTimer.current !== undefined) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
        commit();
      }
    };
  }, [registerActiveFlush, commit]);

  const penMode = tool === "pen";

  return (
    <CanvasContext.Provider value={tools}>
      <div className="cv-flow-wrap" ref={wrapRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onMoveEnd={scheduleSave}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultViewport={initial.viewport}
          fitView={!initial.viewport}
          minZoom={0.1}
          maxZoom={4}
          panOnDrag={!penMode}
          nodesDraggable={!penMode}
          elementsSelectable={!penMode}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e9e9ec" />
          <Controls showInteractive={false} />
        </ReactFlow>

        {penMode && (
          <div
            className="cv-draw-overlay"
            onPointerDown={penDown}
            onPointerMove={penMove}
            onPointerUp={penUp}
            onPointerLeave={penUp}
          >
            {preview && (
              <svg className="cv-draw-overlay-svg">
                <path d={preview} fill={color} />
              </svg>
            )}
          </div>
        )}
      </div>

      <CanvasToolbar
        tool={tool}
        onSetTool={setTool}
        onAddText={onAddText}
        onAddShape={onAddShape}
        color={color}
        onColor={onColor}
      />
    </CanvasContext.Provider>
  );
}

export function CanvasPage(props: {
  pageId: string;
  controller: WorkspaceController;
}) {
  return (
    <div className="canvas-page">
      <ReactFlowProvider>
        <CanvasInner {...props} />
      </ReactFlowProvider>
      <div className="canvas-hint">
        <span className="canvas-hint-icon">⤓</span>
        Drag &amp; drop your <code>.md</code> files anywhere
      </div>
    </div>
  );
}
