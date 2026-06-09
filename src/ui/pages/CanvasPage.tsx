import { useCallback, useEffect, useRef, useState } from "react";
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
import type { WorkspaceController } from "../Workspace/useWorkspace";
import "./CanvasPage.css";

const nodeTypes: NodeTypes = { markdown: MarkdownNode };

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
  const seededRef = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  // Freeze the page's saved flow + seed at mount; the component is keyed by
  // pageId upstream, so switching pages remounts with the right content.
  const [initial] = useState<CanvasFlow>(() => {
    const content = controller.workspace?.pages[pageId];
    const snap =
      content && content.kind === "canvas" ? content.snapshot : null;
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

  // Persist the whole flow (nodes + edges + viewport) into the workspace, which
  // then auto-saves to disk.
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
        addEdge(
          { ...connection, markerEnd: { type: MarkerType.ArrowClosed } },
          eds,
        ),
      );
      scheduleSave();
    },
    [setEdges, scheduleSave],
  );

  // Drop .md files → markdown cards at the drop point.
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

  // One-time welcome card on a brand-new canvas page, then persist.
  useEffect(() => {
    if (seededRef.current || initial.nodes.length > 0 || !seedMarkdown) return;
    seededRef.current = true;
    const node: Node = {
      ...makeCardNode(seedMarkdown, 0, 0),
      width: 460,
      height: 520,
    };
    setNodes([node]);
    updatePageContent(pageId, {
      kind: "canvas",
      snapshot: { nodes: [node], edges: [], viewport: initial.viewport },
    });
    requestAnimationFrame(() => rf.fitView({ padding: 0.3, maxZoom: 1 }));
  }, [initial, seedMarkdown, setNodes, updatePageContent, pageId, rf]);

  // Flush on app close/hide + on page-switch unmount.
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

  return (
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
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} color="#e9e9ec" />
      <Controls showInteractive={false} />
    </ReactFlow>
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
