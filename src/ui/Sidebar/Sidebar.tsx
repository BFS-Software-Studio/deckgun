import { useState } from "react";
import {
  exportPageJSON,
  findNode,
  type PageKind,
  type WorkspaceNode,
} from "@core/workspace";
import { downloadJSON, safeFilename } from "../util/files";
import type { WorkspaceController } from "../Workspace/useWorkspace";
import { NewPageDialog } from "../components/NewPageDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TreeNode } from "./TreeNode";
import { SettingsMenu } from "./SettingsMenu";
import "./Sidebar.css";

export function Sidebar({
  controller,
  title = "DeckGun",
}: {
  controller: WorkspaceController;
  title?: string;
}) {
  const { workspace } = controller;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!workspace) return null;

  function handleNewFolder() {
    const id = controller.newFolder(selectedId, "New folder");
    if (id) {
      setSelectedId(id);
      setEditingId(id);
    }
  }

  function handleChoosePageKind(kind: PageKind) {
    setNewPageOpen(false);
    const id = controller.newPage(selectedId, "New page", kind);
    if (id) {
      setSelectedId(id);
      setEditingId(id);
    }
  }

  function handleSelect(node: WorkspaceNode) {
    setSelectedId(node.id);
    if (node.type === "page") controller.select(node.id);
  }

  function handleCommitRename(id: string, value: string) {
    const name = value.trim();
    if (name) controller.rename(id, name);
    setEditingId(null);
  }

  function handleDelete(node: WorkspaceNode) {
    setPendingDelete({ id: node.id, name: node.name });
  }

  function handleExport(node: WorkspaceNode) {
    if (node.type !== "page" || !workspace) return;
    const json = exportPageJSON(workspace, node.id);
    if (json) downloadJSON(`${safeFilename(node.name)}.json`, json);
  }

  function handleMove(draggedId: string, targetId: string | null) {
    controller.move(draggedId, targetId);
  }

  function confirmDelete() {
    if (!pendingDelete || !workspace) return;

    // Deleting a folder removes its whole subtree, so clear any local
    // selection/edit state pointing at the deleted node OR a descendant of it
    // (otherwise the next "new folder/page" would target a vanished node).
    const removed = findNode(workspace.tree, pendingDelete.id);
    const isAffected = (id: string | null) =>
      id != null && removed != null && findNode([removed], id) != null;

    if (isAffected(selectedId)) setSelectedId(null);
    if (isAffected(editingId)) setEditingId(null);

    controller.remove(pendingDelete.id);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{title}</span>
        <div className="sidebar-tools">
          <button
            className="sidebar-tool"
            title="New folder"
            onClick={handleNewFolder}
          >
            📁+
          </button>
          <button
            className="sidebar-tool"
            title="New page"
            onClick={() => setNewPageOpen(true)}
          >
            📄+
          </button>
        </div>
      </div>

      <div
        className={`sidebar-tree${rootDragOver ? " root-drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!rootDragOver) setRootDragOver(true);
        }}
        onDragLeave={(e) => {
          // Only clear when the pointer actually leaves the container.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setRootDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setRootDragOver(false);
          const draggedId = e.dataTransfer.getData("text/plain");
          if (draggedId) handleMove(draggedId, null);
        }}
      >
        {workspace.tree.length === 0 ? (
          <div className="sidebar-empty">
            No pages yet.
            <br />
            Create a folder or page above.
          </div>
        ) : (
          workspace.tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              workspace={workspace}
              selectedId={selectedId}
              editingId={editingId}
              onSelect={handleSelect}
              onToggle={controller.toggleFolder}
              onStartRename={setEditingId}
              onCommitRename={handleCommitRename}
              onCancelRename={() => setEditingId(null)}
              onDelete={handleDelete}
              onExport={handleExport}
              onMove={handleMove}
            />
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <span className="sidebar-footer-icon">⚙</span>
          Settings
        </button>
        {settingsOpen && (
          <SettingsMenu
            onClose={() => setSettingsOpen(false)}
            controller={controller}
            title={title}
          />
        )}
      </div>

      {newPageOpen && (
        <NewPageDialog
          onChoose={handleChoosePageKind}
          onClose={() => setNewPageOpen(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete"
          message={`Delete "${pendingDelete.name}" and everything inside it? This cannot be undone.`}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </aside>
  );
}
