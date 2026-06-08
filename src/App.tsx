import { PlatformProvider } from "@platform/PlatformProvider";
import { createTauriPlatform } from "@platform/tauri/tauriPlatform";
import { Workspace } from "@ui/Workspace/Workspace";
import "./App.css";

// Composition root: pick the platform adapter (Tauri on desktop; a web adapter
// later) and hand the portable UI a platform via context. Everything below this
// line is platform-agnostic.
const platform = createTauriPlatform();

function App() {
  return (
    <PlatformProvider platform={platform}>
      <Workspace />
    </PlatformProvider>
  );
}

export default App;
