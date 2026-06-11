import { useState } from "react";
import { useTheme, type Theme } from "../theme/ThemeProvider";
import {
  exportWorkspaceJSON,
  parsePage,
  parseWorkspace,
  type Workspace,
} from "@core/workspace";
import { downloadJSON, pickTextFile, safeFilename } from "../util/files";
import type { WorkspaceController } from "../Workspace/useWorkspace";

export function SettingsMenu({
  onClose,
  controller,
  title,
}: {
  onClose: () => void;
  controller: WorkspaceController;
  title: string;
}) {
  const { theme, setTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<Workspace | null>(null);

  const option = (value: Theme, label: string, icon: string) => (
    <button
      type="button"
      className={`settings-theme-btn${theme === value ? " active" : ""}`}
      onClick={() => setTheme(value)}
    >
      <span className="settings-theme-icon">{icon}</span>
      {label}
    </button>
  );

  function exportWorkspace() {
    if (!controller.workspace) return;
    downloadJSON(
      `${safeFilename(title)}.json`,
      exportWorkspaceJSON(controller.workspace),
    );
  }

  async function importWorkspace() {
    setError(null);
    const text = await pickTextFile();
    if (!text) return;
    try {
      setPendingImport(parseWorkspace(text));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function confirmReplace() {
    if (pendingImport) controller.replaceWorkspace(pendingImport);
    setPendingImport(null);
    onClose();
  }

  async function importPage() {
    setError(null);
    const text = await pickTextFile();
    if (!text) return;
    try {
      const id = controller.importPage(parsePage(text), null);
      if (id) controller.select(id);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-popover" onClick={(e) => e.stopPropagation()}>
        <div className="settings-section-label">Appearance</div>
        <div className="settings-theme">
          {option("light", "Light", "○")}
          {option("dark", "Dark", "●")}
        </div>

        <div className="settings-section-label settings-mt">Data</div>
        {pendingImport ? (
          <div className="settings-confirm">
            <div className="settings-confirm-text">
              Replace the current workspace with the imported one?
            </div>
            <div className="settings-row">
              <button
                type="button"
                className="settings-action"
                onClick={() => setPendingImport(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-action danger"
                onClick={confirmReplace}
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-actions">
            <button type="button" className="settings-action" onClick={exportWorkspace}>
              Export workspace
            </button>
            <button type="button" className="settings-action" onClick={importWorkspace}>
              Import workspace…
            </button>
            <button type="button" className="settings-action" onClick={importPage}>
              Import page…
            </button>
          </div>
        )}

        {error && <div className="settings-error">{error}</div>}
      </div>
    </>
  );
}
