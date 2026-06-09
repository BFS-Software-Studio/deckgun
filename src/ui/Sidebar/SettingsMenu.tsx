import { useTheme, type Theme } from "../theme/ThemeProvider";

export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();

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

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-popover" onClick={(e) => e.stopPropagation()}>
        <div className="settings-section-label">Appearance</div>
        <div className="settings-theme">
          {option("light", "Light", "☀️")}
          {option("dark", "Dark", "🌙")}
        </div>
      </div>
    </>
  );
}
