import { useEffect, useRef } from "react";
import type { Workspace, WorkspaceNode } from "@core/workspace";

interface TreeNodeProps {
  node: WorkspaceNode;
  depth: number;
  workspace: Workspace;
  selectedId: string | null;
  editingId: string | null;
  onSelect: (node: WorkspaceNode) => void;
  onToggle: (id: string) => void;
  onStartRename: (id: string) => void;
  onCommitRename: (id: string, value: string) => void;
  onCancelRename: () => void;
  onDelete: (node: WorkspaceNode) => void;
}

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  return (
    <input
      ref={ref}
      className="tree-rename-input"
      defaultValue={initial}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (!cancelledRef.current) onCommit(e.currentTarget.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          cancelledRef.current = true;
          onCancel();
        }
      }}
    />
  );
}

export function TreeNode(props: TreeNodeProps) {
  const {
    node,
    depth,
    workspace,
    selectedId,
    editingId,
    onSelect,
    onToggle,
    onStartRename,
    onCommitRename,
    onCancelRename,
    onDelete,
  } = props;

  const isFolder = node.type === "folder";
  const expanded = isFolder ? workspace.expanded[node.id] !== false : false;
  const selected = node.id === selectedId;
  const editing = node.id === editingId;
  const icon = isFolder
    ? expanded
      ? "📂"
      : "📁"
    : node.kind === "canvas"
      ? "🎨"
      : "📝";

  return (
    <>
      <div
        className={`tree-row${selected ? " selected" : ""}`}
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={() => onSelect(node)}
      >
        {isFolder ? (
          <span
            className="tree-chevron"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {expanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="tree-chevron spacer" />
        )}

        <span className="tree-icon">{icon}</span>

        {editing ? (
          <RenameInput
            initial={node.name}
            onCommit={(value) => onCommitRename(node.id, value)}
            onCancel={onCancelRename}
          />
        ) : (
          <span
            className="tree-name"
            onDoubleClick={() => onStartRename(node.id)}
          >
            {node.name}
          </span>
        )}

        <span className="tree-actions">
          <button
            className="tree-action"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename(node.id);
            }}
          >
            ✎
          </button>
          <button
            className="tree-action"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            ✕
          </button>
        </span>
      </div>

      {isFolder &&
        expanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            workspace={workspace}
            selectedId={selectedId}
            editingId={editingId}
            onSelect={onSelect}
            onToggle={onToggle}
            onStartRename={onStartRename}
            onCommitRename={onCommitRename}
            onCancelRename={onCancelRename}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}
