import { PlatformProvider } from "@platform/PlatformProvider";
import { createTauriPlatform } from "@platform/tauri/tauriPlatform";
import { Workspace } from "@ui/Workspace/Workspace";
import { ErrorBoundary } from "@ui/ErrorBoundary";
import { ThemeProvider } from "@ui/theme/ThemeProvider";
import "./App.css";

// Composition root: pick the platform adapter (Tauri on desktop; a web adapter
// later) and hand the portable UI a platform via context. Everything below this
// line is platform-agnostic.
const platform = createTauriPlatform();

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PlatformProvider platform={platform}>
          <Workspace />
        </PlatformProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
